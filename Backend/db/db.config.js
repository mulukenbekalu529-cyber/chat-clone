import "dotenv/config";
import mysql from "mysql2/promise";
import { readFileSync } from "node:fs";

const useSSL = process.env.DB_SSL === "true";

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  ...(useSSL && {
    ssl: {
      ca: readFileSync(new URL("../certs/ca.pem", import.meta.url), "utf8"),
      rejectUnauthorized: true,
    },
  }),

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Create the tables automatically if they don't exist yet
await db.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

await db.query(`
  CREATE TABLE IF NOT EXISTS conversations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id CHAR(36) NOT NULL,
    role ENUM('user', 'assistant') NOT NULL,
    content TEXT NOT NULL,
    token_count INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session_id (session_id)
  )
`);

console.log("Tables ready");

export default db;
