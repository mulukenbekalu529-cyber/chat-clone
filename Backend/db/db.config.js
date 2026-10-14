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

export default db;
