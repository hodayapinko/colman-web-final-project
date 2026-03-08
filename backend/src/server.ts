import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import swaggerUi from "swagger-ui-express";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import connectDB from "./config/database";
import swaggerSpec from "./config/swagger";

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/api", routes);

// Root endpoint - shows server and MongoDB status
app.get("/", (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
  res.send(`
    <html>
      <head>
        <title>Server Status</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            height: 100vh; 
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
          }
          h1 { color: #333; margin-bottom: 20px; }
          .status { 
            font-size: 20px; 
            margin: 15px 0; 
            padding: 10px;
            border-radius: 5px;
          }
          .running { background: #d4edda; color: #155724; }
          .connected { background: #d1ecf1; color: #0c5460; }
          .disconnected { background: #f8d7da; color: #721c24; }
          .link {
            margin-top: 20px;
            padding: 12px 24px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
            font-weight: bold;
          }
          .link:hover {
            background: #764ba2;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 Server Status</h1>
          <div class="status running">
            ✅ Server is running on port ${PORT}
          </div>
          <div class="status ${dbStatus === 'Connected' ? 'connected' : 'disconnected'}">
            ${dbStatus === 'Connected' ? '✅' : '❌'} MongoDB: ${dbStatus}
          </div>
          <a href="/api-docs" class="link">📚 View API Documentation</a>
        </div>
      </body>
    </html>
  `);
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

export default app;
