import express from "express";

// Import the two controller functions that contain the actual logic
import {
  getConversations,
  createConversation,
} from "../controllers/chat.controller.js";

// Create a mini "sub-app" for chat-related routes.
// This gets mounted onto the main app under some prefix (e.g. /api/chat)
// in your main server file (e.g. app.use("/api/chat", chatRouter)).
const router = express.Router();

// GET /api/chat/conversations
// When a GET request hits this path, hand it off to getConversations,
// which fetches all rows from the conversations table.
router.get("/conversations", getConversations);

// POST /api/chat/conversations
// When a POST request hits this path, hand it off to createConversation,
// which validates the question, calls Gemini, and saves both messages.
router.post("/conversations", createConversation);

export default router;
