import db from "../db/db.config.js";
import ai from "../config/gemini.js";

// GET conversations for one chat session.
export const getConversations = async (req, res) => {
  try {
    const { sessionId } = req.query;

    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Session ID is required",
      });
    }

    const [conversations] = await db.query(
      `SELECT *
       FROM conversations
       WHERE session_id = ?
       ORDER BY created_at ASC, id ASC`,
      [sessionId],
    );

    return res.status(200).json({
      success: true,
      data: { conversations },
    });
  } catch (error) {
    console.error("Error fetching conversations:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
    });
  }
};

// POST a new conversation.
export const createConversation = async (req, res) => {
  try {
    const { question, sessionId } = req.body;

    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Session ID is required",
      });
    }

    if (typeof question !== "string" || question.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    const cleanQuestion = question.trim();
    let answer;

    // Try supported Gemini models if one is temporarily unavailable.
    const modelsToTry = [
      "gemini-3.8-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash",
    ];

    let lastError;

    for (const model of modelsToTry) {
      let response;

      // Retry temporary provider errors up to three times per model.
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          response = await ai.models.generateContent({
            model,
            contents: cleanQuestion,
            config: {
              systemInstruction: `
You are a helpful, friendly, general-purpose AI assistant similar to ChatGPT.

You can help with:
- Programming and software engineering
- General questions and explanations
- Writing, brainstorming, and learning
- Research planning and summarization
- Image ideas, visual concepts, and image-generation prompts
- Project planning and organization

When a user asks to create an image, help describe the subject,
style, colors, composition, and other relevant details.

Be honest about your capabilities. If actual image generation
is not available through your current tools, explain that you
can help prepare a prompt but cannot directly produce an image.

Give clear, useful answers and adapt to the user's request.
`,
            },
          });

          answer = response.text;

          if (!answer || !answer.trim()) {
            throw new Error("Gemini returned an empty response.");
          }

          console.log(`AI response generated using ${model}`);
          break;
        } catch (error) {
          lastError = error;

          const errorMessage = String(error.message || "");
          const status = Number(
            error.status || error.code || error.response?.status,
          );

          const isTemporary =
            [429, 500, 502, 503, 504].includes(status) ||
            /UNAVAILABLE|high demand|overloaded|RESOURCE_EXHAUSTED/i.test(
              errorMessage,
            );

          console.error(
            `AI provider error (${model}, attempt ${attempt}/3):`,
            errorMessage,
          );

          // Do not retry authentication, configuration, or other
          // errors that are unlikely to resolve by waiting.
          if (!isTemporary) {
            throw error;
          }

          // Stop retrying this model if it keeps failing.
          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
          }
        }
      }

      if (answer) {
        break;
      }

      console.warn(`Trying the next Gemini model after ${model} failed.`);
    }

    if (!answer) {
      console.error(
        "All Gemini models failed:",
        lastError?.message || "Unknown provider error",
      );

      return res.status(502).json({
        success: false,
        message:
          "The AI service is temporarily unavailable. Please try again shortly.",
      });
    }

    // Save the user's question after the AI generates an answer.
    const [userResult] = await db.query(
      `INSERT INTO conversations
       (session_id, role, content, token_count)
       VALUES (?, ?, ?, ?)`,
      [sessionId, "user", cleanQuestion, 0],
    );

    // Save the AI response in the same session.
    const [assistantResult] = await db.query(
      `INSERT INTO conversations
       (session_id, role, content, token_count)
       VALUES (?, ?, ?, ?)`,
      [sessionId, "assistant", answer, 0],
    );

    return res.status(201).json({
      success: true,
      message: "Conversation created successfully",
      data: {
        sessionId,
        userConversation: {
          id: userResult.insertId,
          role: "user",
          content: cleanQuestion,
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

    return res.status(500).json({
      success: false,
      message: "Failed to create conversation",
    });
  }
};

// GET saved chat sessions for the sidebar.
export const getChatSessions = async (req, res) => {
  try {
    const [sessions] = await db.query(`
      SELECT
        c.session_id,
        COALESCE(
          (
            SELECT m.content
            FROM conversations m
            WHERE m.session_id = c.session_id
              AND m.role = 'user'
            ORDER BY m.created_at ASC, m.id ASC
            LIMIT 1
          ),
          'New chat'
        ) AS title,
        MIN(c.created_at) AS created_at,
        MAX(c.created_at) AS updated_at
      FROM conversations c
      WHERE c.session_id IS NOT NULL
      GROUP BY c.session_id
      ORDER BY updated_at DESC
    `);

    return res.status(200).json({
      success: true,
      data: { sessions },
    });
  } catch (error) {
    console.error("Error fetching chat sessions:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch chat history",
    });
  }
};

// SEARCH saved chats by title or message content.
export const searchChats = async (req, res) => {
  try {
    const { q } = req.query;

    if (typeof q !== "string" || q.trim() === "") {
      return res.status(200).json({
        success: true,
        data: { sessions: [] },
      });
    }

    const searchTerm = `%${q.trim()}%`;

    const [sessions] = await db.query(
      `
      SELECT
        c.session_id,
        COALESCE(
          (
            SELECT m.content
            FROM conversations m
            WHERE m.session_id = c.session_id
              AND m.role = 'user'
            ORDER BY m.created_at ASC, m.id ASC
            LIMIT 1
          ),
          'New chat'
        ) AS title,
        MIN(c.created_at) AS created_at,
        MAX(c.created_at) AS updated_at
      FROM conversations c
      WHERE c.session_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM conversations m
          WHERE m.session_id = c.session_id
            AND m.content LIKE ?
        )
      GROUP BY c.session_id
      ORDER BY updated_at DESC
      `,
      [searchTerm],
    );

    return res.status(200).json({
      success: true,
      data: { sessions },
    });
  } catch (error) {
    console.error("Error searching chats:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to search chats",
    });
  }
};

// DELETE a saved chat session and all its messages.
export const deleteChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Session ID is required",
      });
    }

    const [result] = await db.query(
      "DELETE FROM conversations WHERE session_id = ?",
      [sessionId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Chat session not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Chat deleted successfully",
      data: { sessionId },
    });
  } catch (error) {
    console.error("Error deleting chat:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to delete chat",
    });
  }
};
