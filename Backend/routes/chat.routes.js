
import express from "express";
import {
  getConversations,
  createConversation,
  getChatSessions,
  searchChats,
  deleteChatSession,
} from "../controllers/chat.controller.js";
import { generateImage } from "../controllers/image.controller.js";

const router = express.Router();

// Get the list of saved chat sessions for the sidebar.
router.get("/sessions", getChatSessions);

router.get("/search", searchChats);

// Get messages for a chat session.
router.get("/conversations", getConversations);

// Create a new conversation.
router.post("/conversations", createConversation);

router.delete("/sessions/:sessionId", deleteChatSession);
router.post("/images", generateImage);
export default router;
