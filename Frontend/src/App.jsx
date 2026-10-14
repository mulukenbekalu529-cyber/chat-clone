import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Routes, Route, Navigate } from "react-router-dom";

import Sidebar from "./components/Sidebar/Sidebar";
import ChatHeader from "./components/ChatHeader/ChatHeader";
import MessageList from "./components/MessageList/MessageList";
import ChatInput from "./components/ChatInput/ChatInput";

import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/Profile";

import "./App.css";

const API_BASE_URL = "http://localhost:3008/api";

function App() {
  const [conversations, setConversations] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(() =>
    localStorage.getItem("activeSessionId"),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [imageMode, setImageMode] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  // Load saved chat sessions.
  const fetchChatSessions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/chat/sessions`);

      console.log("SAVED SESSIONS RESPONSE:", response.data);

      if (response.data.success) {
        setSessions(response.data.data.sessions || []);
      }
    } catch (error) {
      console.error(
        "Error fetching chat sessions:",
        error.response?.data || error.message,
      );
    }
  };

  useEffect(() => {
    fetchChatSessions();
  }, []);

  // Remember the active conversation across browser refreshes.
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem("activeSessionId", sessionId);
    } else {
      localStorage.removeItem("activeSessionId");
    }
  }, [sessionId]);

  // Restore the active conversation when the app loads.
  useEffect(() => {
    const restoreConversation = async () => {
      if (!sessionId) return;

      setIsLoading(true);

      try {
        const response = await axios.get(`${API_BASE_URL}/chat/conversations`, {
          params: { sessionId },
        });

        if (response.data.success) {
          setConversations(response.data.data.conversations || []);
        }
      } catch (error) {
        console.error("Error restoring conversation:", error);
      } finally {
        setIsLoading(false);
      }
    };

    restoreConversation();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversations, isLoading]);

  // Enable image-prompt mode when the Images shortcut is selected.
  useEffect(() => {
    const enableImageMode = () => setImageMode(true);

    window.addEventListener("chat-image-mode", enableImageMode);

    return () => {
      window.removeEventListener("chat-image-mode", enableImageMode);
    };
  }, []);

  // Open a saved conversation.
  const handleSelectSession = async (selectedSessionId) => {
    setIsLoading(true);
    setImageMode(false);

    try {
      const response = await axios.get(`${API_BASE_URL}/chat/conversations`, {
        params: { sessionId: selectedSessionId },
      });

      if (response.data.success) {
        setConversations(response.data.data.conversations || []);
        setSessionId(selectedSessionId);
      }
    } catch (error) {
      console.error("Error loading saved chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Start a new chat.
  const handleNewChat = () => {
    setConversations([]);
    setSessionId(null);
    setImageMode(false);
  };

  // Delete a saved conversation.
  const handleDeleteSession = async (targetSessionId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this chat?",
    );

    if (!confirmed) return;

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/chat/sessions/${targetSessionId}`,
      );

      if (response.data.success) {
        setSessions((previous) =>
          previous.filter((session) => session.session_id !== targetSessionId),
        );

        if (sessionId === targetSessionId) {
          setConversations([]);
          setSessionId(null);
          setImageMode(false);
        }

        await fetchChatSessions();
      }
    } catch (error) {
      console.error("Error deleting chat:", error);

      window.alert(error.response?.data?.message || "Failed to delete chat.");
    }
  };

  // Send either an image-prompt request or a normal chat message.
  const handleSendMessage = async (question) => {
    const currentSessionId = sessionId || crypto.randomUUID();

    if (!sessionId) {
      setSessionId(currentSessionId);
    }

    const tempUserMessage = {
      id: Date.now(),
      session_id: currentSessionId,
      role: "user",
      content: question,
    };

    setConversations((previous) => [...previous, tempUserMessage]);
    setIsLoading(true);

    try {
      // Images mode uses the image-prompt endpoint.
      if (imageMode) {
        const response = await axios.post(`${API_BASE_URL}/chat/images`, {
          prompt: question,
        });

        if (!response.data.success) {
          throw new Error(
            response.data.message || "Could not prepare the image prompt.",
          );
        }

        const preparedPrompt = response.data.data.prompt;
        const note = response.data.data.note || "";

        setConversations((previous) => [
          ...previous,
          {
            id: Date.now() + 1,
            session_id: currentSessionId,
            role: "assistant",
            content: `${preparedPrompt}\n\n${note}`,
          },
        ]);

        return;
      }

      // Normal chat uses the existing conversation endpoint.
      const response = await axios.post(`${API_BASE_URL}/chat/conversations`, {
        question,
        sessionId: currentSessionId,
      });

      if (response.data.success) {
        const { userConversation, assistantConversation } = response.data.data;

        setConversations((previous) => {
          const filtered = previous.filter(
            (message) => message.id !== tempUserMessage.id,
          );

          return [
            ...filtered,
            {
              ...userConversation,
              session_id: currentSessionId,
            },
            {
              ...assistantConversation,
              session_id: currentSessionId,
            },
          ];
        });

        await fetchChatSessions();
      }
    } catch (error) {
      console.error("Error sending message:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "There was an error generating a response.";

      setConversations((previous) => [
        ...previous,
        {
          id: Date.now() + 2,
          session_id: currentSessionId,
          role: "assistant",
          content: errorMessage,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Routes>
      {/* Registration page */}
      <Route path="/register" element={<Register />} />

      {/* Login page */}
      <Route path="/login" element={<Login />} />

      {/* User profile page */}
      <Route path="/profile" element={<Profile />} />

      {/* Main chat page */}
      <Route
        path="/"
        element={
          <div className="app">
            <Sidebar
              onNewChat={handleNewChat}
              sessions={sessions}
              activeSessionId={sessionId}
              onSelectSession={handleSelectSession}
              onDeleteSession={handleDeleteSession}
            />

            <main className="chat">
              <ChatHeader />

              <MessageList
                conversations={conversations}
                isLoading={isLoading}
                messagesEndRef={messagesEndRef}
              />

              <ChatInput
                handleSendMessage={handleSendMessage}
                isLoading={isLoading}
              />
            </main>
          </div>
        }
      />

      {/* Redirect unknown URLs to the main chat page. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
