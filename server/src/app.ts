import express, { type Application, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./env.config.js";
import v1Router from "./routes/v1/index.js";
import { notFoundHandler } from "./middlewares/notFound.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app: Application = express();

// Security HTTP headers
app.use(helmet());

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body and Cookie parsers
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));


// System health check
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount versioned API routes
app.use("/api/v1", v1Router);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Centralized error handling
app.use(errorHandler);

export default app;
