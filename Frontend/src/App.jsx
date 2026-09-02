import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Sidebar from "./components/Sidebar/Sidebar";
import ChatHeader from "./components/ChatHeader/ChatHeader";
import MessageList from "./components/MessageList/MessageList";
import ChatInput from "./components/ChatInput/ChatInput";
import "./App.css";

// Must match the port the backend is actually running on
const API_BASE_URL = "http://localhost:3008/api";

function App() {
  // All chat messages (user + assistant), in display order
  const [conversations, setConversations] = useState([]);
  // True while waiting for the backend/AI to respond
  const [isLoading, setIsLoading] = useState(false);
  // Points to an empty element at the bottom of the chat, used to
  // auto-scroll the view down as new messages arrive
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  // Load conversations when page loads (runs once, on mount)
  useEffect(() => {
    fetchConversations();
  }, []);

  // Scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [conversations, isLoading]);

  // GET conversations
  // Reads the backend's wrapped response shape:
  // { success: true, data: { conversations: [...] } }
  // We check `success` first, then dig into data.conversations to get
  // the actual array — this matches exactly how the backend now
  // formats its response.
  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/chat/conversations`);

      if (response.data.success) {
        setConversations(response.data.data.conversations);
      }
      // If success is false, we silently do nothing here — you could
      // add an else branch to show an error state if we want.
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  // POST conversation
  const handleSendMessage = async (question) => {
    // Show user message immediately — Date.now() is
    // just a temporary, throwaway id since this message isn't saved
    // to the database yet and has no real id.
    const tempUserMessage = {
      id: Date.now(),
      role: "user",
      content: question,
    };

    setConversations((prev) => [...prev, tempUserMessage]);

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/chat/conversations`, {
        question,
      });

      // Backend's wrapped response shape for POST:
      // { success: true, data: { userConversation, assistantConversation } }
      // Note the key names match the backend exactly — userConversation,
      // not userMessage — because that's what the backend now sends.
      if (response.data.success) {
        const { userConversation, assistantConversation } = response.data.data;

        // Remove the fake temporary message, replace it with the two
        // REAL messages returned by the backend (these have real DB ids)
        setConversations((prev) => {
          const filtered = prev.filter((msg) => msg.id !== tempUserMessage.id);

          return [...filtered, userConversation, assistantConversation];
        });
      }
    } catch (error) {
      console.error("Error posting conversation:", error);

      // Even on error, the backend sends { success: false, message: "..." },
      // so we can still read error.response.data.message the same way
      // regardless of which endpoint failed.
      const errorMessage =
        error.response?.data?.message ||
        "There was an error generating a response.";

      // Show the error as a fake "assistant" message so the user sees
      // clear feedback in the chat, instead of the request just failing
      // silently in the background.
      const errorConversation = {
        id: Date.now() + 1,
        role: "assistant",
        content: errorMessage,
      };

      setConversations((prev) => [...prev, errorConversation]);
    } finally {
      // Always runs, whether the request succeeded or failed
      setIsLoading(false);
    }
  };
// the return statement renders the main app structure, including the sidebar, chat header, message list, and chat input components. It passes necessary props to these components, such as conversations, loading state, and the function to handle sending messages.
  return (
    <div className="app">
      <Sidebar />

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
  );
}

export default App;
