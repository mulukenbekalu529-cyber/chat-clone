import { useState } from "react";
import {
  MessageSquare,
  Search,
  Image as ImageIcon,
  LayoutGrid,
  Microscope,
  Code2,
  FileText,
  Code,
  FolderKanban,
  Trash2,
  X,
} from "lucide-react";
import axios from "axios";
import styles from "./Sidebar.module.css";

const API_BASE_URL = "https://chat-clone-mlrm.onrender.com/api";

export default function Sidebar({
  onNewChat,
  sessions = [],
  activeSessionId,
  onSelectSession,
  onDeleteSession,
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);

  // Start a new chat with a suggested prompt.
  const openFeature = (prompt, mode = "chat") => {
    onNewChat();

    window.dispatchEvent(
      new CustomEvent("chat-prefill", {
        detail: prompt,
      }),
    );

    if (mode === "image") {
      window.dispatchEvent(new Event("chat-image-mode"));
    }
  };

  // Open or close the search panel.
  const toggleSearch = () => {
    setSearchOpen((previous) => !previous);
    setSearchQuery("");
    setSearchResults([]);
    setSearchError("");
    setHasSearched(false);
  };

  // Search saved conversations.
  const handleSearch = async (event) => {
    event.preventDefault();

    const query = searchQuery.trim();

    if (!query) {
      setSearchResults([]);
      setSearchError("");
      setHasSearched(false);
      return;
    }

    try {
      setSearchLoading(true);
      setSearchError("");
      setHasSearched(true);
      setSearchResults([]);

      const response = await axios.get(`${API_BASE_URL}/chat/search`, {
        params: { q: query },
      });

      if (response.data.success) {
        setSearchResults(response.data.data?.sessions || []);
      } else {
        setSearchError(
          response.data.message || "Search failed. Please try again.",
        );
      }
    } catch (error) {
      console.error(
        "Error searching chats:",
        error.response?.data || error.message,
      );

      setSearchError(
        error.response?.data?.message ||
          "Unable to search chats. Check that the backend is running.",
      );
    } finally {
      setSearchLoading(false);
    }
  };

  // Open a conversation selected from search results.
  const handleSelectSearchResult = (result) => {
    const selectedSessionId = result.session_id || result.sessionId;

    if (!selectedSessionId) {
      console.error("Search result is missing its session ID:", result);
      return;
    }

    onSelectSession(selectedSessionId);
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setSearchError("");
    setHasSearched(false);
  };

  // Start the Writing Assistant.
  const openWritingAssistant = () => {
    setAppsOpen(false);

    openFeature(
      "Act as a writing assistant. Help me write, rewrite, proofread, and improve my text. Ask me what I want to write if I have not provided any text yet.",
    );
  };

  // Start the Code Helper.
  const openCodeHelper = () => {
    setAppsOpen(false);

    openFeature(
      "Act as a programming assistant. Help me write code, explain programming concepts, find bugs, and debug errors. Explain solutions clearly and provide corrected code when appropriate.",
    );
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.top}>
        {/* New chat */}
        <button type="button" className={styles.item} onClick={onNewChat}>
          <MessageSquare size={18} />
          <span>New chat</span>
        </button>

        {/* Search chats */}
        <button type="button" className={styles.item} onClick={toggleSearch}>
          <Search size={18} />
          <span>Search chats</span>
        </button>

        {/* Search panel */}
        {searchOpen && (
          <div className={styles.searchPanel}>
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <Search size={17} />

              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search chats..."
                className={styles.searchInput}
                autoFocus
              />

              <button
                type="button"
                className={styles.closeSearchButton}
                onClick={toggleSearch}
                aria-label="Close search"
              >
                <X size={16} />
              </button>
            </form>

            {searchLoading && (
              <p className={styles.searchMessage}>Searching...</p>
            )}

            {!searchLoading && searchError && (
              <p className={styles.searchError}>{searchError}</p>
            )}

            {!searchLoading &&
              !searchError &&
              hasSearched &&
              searchResults.length === 0 && (
                <p className={styles.searchMessage}>No matching chats found.</p>
              )}

            <div className={styles.searchResults}>
              {searchResults.map((result, index) => {
                const label =
                  result.title || result.content || "Open conversation";

                return (
                  <button
                    type="button"
                    key={result.session_id || result.sessionId || index}
                    className={styles.searchResultItem}
                    onClick={() => handleSelectSearchResult(result)}
                    title={label}
                  >
                    <MessageSquare size={16} />

                    <span>
                      {label.length > 45 ? `${label.slice(0, 45)}...` : label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Images */}
        <button
          type="button"
          className={styles.item}
          onClick={() =>
            openFeature("Describe the image you want to create.", "image")
          }
        >
          <ImageIcon size={18} />
          <span>Images</span>
        </button>

        {/* Apps */}
        <button
          type="button"
          className={styles.item}
          onClick={() => setAppsOpen((previous) => !previous)}
          aria-expanded={appsOpen}
        >
          <LayoutGrid size={18} />
          <span>Apps</span>
        </button>

        {/* Apps menu */}
        {appsOpen && (
          <div className={styles.searchResults}>
            <button
              type="button"
              className={styles.searchResultItem}
              onClick={openWritingAssistant}
            >
              <FileText size={16} />
              <span>Writing Assistant</span>
            </button>

            <button
              type="button"
              className={styles.searchResultItem}
              onClick={openCodeHelper}
            >
              <Code size={16} />
              <span>Code Helper</span>
            </button>
          </div>
        )}

        {/* Deep research */}
        <button
          type="button"
          className={styles.item}
          onClick={() =>
            openFeature(
              "Act as a research assistant. Help me investigate a topic thoroughly. Organize your response into an overview, key findings, supporting explanations, limitations, and a conclusion. Clearly distinguish established facts from uncertainty. Ask me for the research topic if I have not provided one.",
            )
          }
        >
          <Microscope size={18} />
          <span>Deep research</span>
        </button>

        {/* Codex */}
        <button
          type="button"
          className={styles.item}
          onClick={() =>
            openFeature(
              "Act as a coding assistant. Help me write, understand, and debug code. Explain errors step by step, provide corrected code when needed, and follow good programming practices. Ask me what programming task I need help with if I have not provided one.",
            )
          }
        >
          <Code2 size={18} />
          <span>Codex</span>
        </button>

        {/* Projects */}
        <button
          type="button"
          className={styles.item}
          onClick={() =>
            openFeature(
              "Act as my project planning assistant. Help me plan and organize a project. Ask me for the project name, its goal, and what I want to accomplish. Then help me break the work into clear steps, tasks, and milestones.",
            )
          }
        >
          <FolderKanban size={18} />
          <span>Projects</span>
        </button>
      </div>

      {/* Saved conversations */}
      <div className={styles.history}>
        <p className={styles.historyTitle}>Your chats</p>

        {sessions.length === 0 ? (
          <p className={styles.emptyHistory}>No saved chats yet.</p>
        ) : (
          sessions.map((session) => (
            <div className={styles.historyRow} key={session.session_id}>
              <button
                type="button"
                className={`${styles.historyItem} ${
                  activeSessionId === session.session_id
                    ? styles.activeHistoryItem
                    : ""
                }`}
                onClick={() => onSelectSession(session.session_id)}
                title={session.title || "New chat"}
              >
                <MessageSquare size={16} />
                <span>{session.title || "New chat"}</span>
              </button>

              <button
                type="button"
                className={styles.deleteChatButton}
                onClick={() => onDeleteSession?.(session.session_id)}
                title="Delete chat"
                aria-label={`Delete ${session.title || "chat"}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
