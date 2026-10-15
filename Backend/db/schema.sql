
CREATE TABLE IF NOT EXISTS conversations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id CHAR(36) NOT NULL,
    role ENUM('user', 'assistant') NOT NULL,
    content TEXT NOT NULL,
    token_count INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session_id (session_id)
);
