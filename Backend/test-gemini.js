import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function testGemini() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: "Explain what a JavaScript closure is in simple terms.",
    });

    console.log("Gemini response:");
    console.log(response.text);
  } catch (error) {
    console.error("Gemini API error:", error.message);
  }
}

testGemini();
