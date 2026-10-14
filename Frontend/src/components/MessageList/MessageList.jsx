import { useState } from "react";
import { Bot, Copy, Check } from "lucide-react";
import ChatMessage from "../ChatMessage/ChatMessage";
import styles from "./MessageList.module.css";

export default function MessageList({
  conversations,
  isLoading,
  messagesEndRef,
}) {
  const [copiedMessageId, setCopiedMessageId] = useState(null);

  const handleCopyPrompt = async (content, messageId) => {
    try {
      // Copy the prepared prompt to the clipboard
      await navigator.clipboard.writeText(content);

      setCopiedMessageId(messageId);

      // Reset the button after a short delay
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy prompt:", error);
      window.alert("Unable to copy the prompt. Please try again.");
    }
  };

  return (
    <div className={styles.messages}>
      {conversations.length === 0 ? (
        <div className={styles.empty}>What are you working on?</div>
      ) : (
        conversations.map((msg) => {
          const isPreparedImagePrompt =
            msg.role === "assistant" &&
            msg.content?.includes("Visual style:") &&
            msg.content?.includes("Create an image based on");

          return (
            <div key={msg.id} className={styles.messageWrapper}>
              <ChatMessage role={msg.role} content={msg.content} />

              {isPreparedImagePrompt && (
                <div className={styles.copyPromptContainer}>
                  <button
                    type="button"
                    className={styles.copyPromptButton}
                    onClick={() => handleCopyPrompt(msg.content, msg.id)}
                    aria-label="Copy prepared image prompt"
                  >
                    {copiedMessageId === msg.id ? (
                      <>
                        <Check size={16} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span>Copy prompt</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}

      {isLoading && (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingAvatar}>
            <Bot size={18} color="white" />
          </div>

          <div className={styles.loading}>
            <div className={styles.loadingDot}></div>
            <div className={styles.loadingDot}></div>
            <div className={styles.loadingDot}></div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
