import db from "../db/db.config.js";
import ai from "../config/gemini.js";

// GET all conversations
// Fetches every message row from the database and sends it back wrapped
// in a consistent { success, data } envelope, so the frontend always
// knows what shape to expect, regardless of which endpoint it calls.
export const getConversations = async (req, res) => {
  try {
    const [conversations] = await db.query(
      "SELECT * FROM conversations ORDER BY created_at ASC",
    );

    // success: true tells the frontend the request worked.
    // The actual array is nested one level deeper, under data.conversations —
    // this leaves room to add more fields later
    // without breaking the frontend's existing code.
    res.status(200).json({
      success: true,
      data: { conversations },
    });
  } catch (error) {
    console.error("Error fetching conversations:", error.message);

    // Errors also follow the same envelope pattern: success: false + a
    // human-readable message, so the frontend can check `success`
    // the SAME way on every single response, success or failure.
    res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
    });
  }
};

// POST a new conversation
// Takes a question, gets an AI answer, saves both as rows, and sends
// the two new rows back — again wrapped in { success, data }.
export const createConversation = async (req, res) => {
  try {
    const { question } = req.body;

    // Reject empty/blank input before doing any real work.
    // Note success: false here too, for the same reason as above.
    if (!question || question.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    // Call Gemini BEFORE saving anything.
    // If this fails, we return early — nothing gets written to the DB,
    // so we never end up with a "question but no answer" row.
    let answer;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: question,
        config: {
          systemInstruction: `
You are a helpful programming and IT assistant.
Only answer questions related to programming, software engineering,
computer science, and information technology.
If unrelated, politely explain you can only help with those topics.
          `,
        },
      });
      answer = response.text;
    } catch (error) {
      console.error("AI provider error:", error.message);
      // 502 = the problem is with the upstream AI service, not our server
      return res.status(502).json({
        success: false,
        message: "Failed to generate a response from the AI provider.",
      });
    }

    // Only save to DB once we have a real answer.
    // Two separate INSERTs — one row per message, matching the
    // one-row-per-message table design.
    const [userResult] = await db.query(
      "INSERT INTO conversations (role, content, token_count) VALUES (?, ?, ?)",
      ["user", question, 0],
    );

    const [assistantResult] = await db.query(
      "INSERT INTO conversations (role, content, token_count) VALUES (?, ?, ?)",
      ["assistant", answer, 0],
    );

    // Send both new rows back to the frontend, wrapped the same way as
    // every other response: success: true, actual payload under `data`.
    // Note the key names here — userConversation / assistantConversation —
    // the frontend MUST use these exact names when destructuring, or
    // it'll get `undefined`.
    //A new resource was successfully created(201)
    res.status(201).json({
      success: true,
      message: "Conversation created successfully",
      data: {
        userConversation: {
          id: userResult.insertId,
          role: "user",
          content: question,
          token_count: 0,
        },
        assistantConversation: {
          id: assistantResult.insertId,
          role: "assistant",
          content: answer,
          token_count: 0,
        },
      },
    });
  } catch (error) {
    console.error("Error creating conversation:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to create conversation",
    });
  }
};
