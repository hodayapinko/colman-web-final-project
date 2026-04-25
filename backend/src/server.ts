import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";
import swaggerUi from "swagger-ui-express";
import http from "http";
import https from "https";
import fs from "fs";
import path from "path";

import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import connectDB from "./config/database";
import swaggerSpec from "./config/swagger";
import { reindexAllPostEmbeddings } from "./services/embedding";

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = Number(process.env.PORT) || 3001;

// Connect to MongoDB
connectDB()
  .then(async () => {
    if (process.env.GEMINI_API_KEY) {
      try {
        const result = await reindexAllPostEmbeddings();

        if (result.indexed > 0) {
          console.log(
            `[Startup] Indexed ${result.indexed} post(s) missing embeddings`
          );
        }
      } catch (error) {
        console.error("[Startup] Auto-reindex failed:", error);
      }
    }
  })
  .catch((error) => {
    console.error("[Startup] Database connection failed:", error);
  });

// Middlewares
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Public uploaded files
app.use("/public", express.static("public"));

// Swagger docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use("/api", routes);

// Health check
app.get("/health", (_req, res) => {
  const dbStatus =
    mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";

  res.status(200).json({
    status: "OK",
    server: "Running",
    mongo: dbStatus,
  });
});

// React build path
const clientPath = path.join(__dirname, "../../frontend/dist");

// Serve React static files
app.use(express.static(clientPath));

// React Router fallback
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = () => {
  if (process.env.NODE_ENV === "production") {
    const sslOptions = {
      key: fs.readFileSync("./client-key.pem"),
      cert: fs.readFileSync("./client-cert.pem"),
    };

    https.createServer(sslOptions, app).listen(PORT, () => {
      console.log(`🚀 HTTPS server running on port ${PORT}`);
    });
  } else {
    http.createServer(app).listen(PORT, () => {
      console.log(`🚀 HTTP server running on port ${PORT}`);
    });
  }
};

if (process.env.NODE_ENV !== "test") {
  startServer();
}

export default app;