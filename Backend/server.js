// Loads variables from a .env file into process.env before anything else runs
import "dotenv/config";
import express from "express";
import cors from "cors";
import db from "./db/db.config.js";
import chatRoutes from "./routes/chat.routes.js";

// Create the main Express application
const app = express();

// --- Middleware (runs on every incoming request) ---

// Allow requests from other origins (e.g. our React frontend running on
// a different port/domain) — without this, the browser would block it
app.use(cors());

// Parse incoming requests with a JSON body into req.body
app.use(express.json());

// Parse incoming requests with URL-encoded bodies into req.body
app.use(express.urlencoded({ extended: true }));

//  "is the server alive?" check — visit this in a browser to confirm
// the backend started successfully.
app.get("/", (req, res) => {
  res.send("ChatGPT Clone backend is running");
});

// Mount the chat router under /api/chat, so its routes become
// /api/chat/conversations, 
app.use("/api/chat", chatRoutes);

// Fire a trivial query on startup just to confirm the DB is reachable.
// This doesn't block the server from starting — it just logs success/failure.
db.query("SELECT 1")
  .then(() => console.log("Database connected"))
  .catch((err) => console.error("Database connection failed:", err.message));

// Use the PORT from the environment if set, otherwise default to 3008
const PORT = process.env.PORT || 3008;

// Start listening for incoming HTTP requests
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
