import { type Server } from "http";
import app from "./app.js";
import { env } from "./env.config.js";
import { connectDB, disconnectDB } from "./config/db.config.js";

let server: Server | null = null;

const handleShutdown = async (signal: string): Promise<void> => {
  console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);

  const forceExitTimeout = setTimeout(() => {
    console.error("[Server] Forceful shutdown initiated after timeout.");
    process.exit(1);
  }, 10000).unref();

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close((err) => {
          if (err) return reject(err);
          console.log("[Server] HTTP server closed.");
          resolve();
        });
      });
    }

    await disconnectDB();
    clearTimeout(forceExitTimeout);
    console.log("[Server] Graceful shutdown completed.");
    process.exit(0);
  } catch (error) {
    console.error("[Server] Error during graceful shutdown:", error);
    process.exit(1);
  }
};

const startServer = async (): Promise<void> => {
  try {
    // 1. Establish database connection before accepting traffic
    await connectDB();

    // 2. Start HTTP server
    server = app.listen(env.PORT, () => {
      console.log(
        `🚀 [Server] Running in ${env.NODE_ENV} mode on http://localhost:${env.PORT}`
      );
    });

    // 3. Process signal hooks
    process.on("SIGTERM", () => void handleShutdown("SIGTERM"));
    process.on("SIGINT", () => void handleShutdown("SIGINT"));
  } catch (error) {
    console.error("❌ [Server] Failed to initialize server:", error);
    process.exit(1);
  }
};

process.on("unhandledRejection", (reason: unknown) => {
  console.error("💥 [Process] Unhandled Rejection detected:", reason);
  void handleShutdown("UNHANDLED_REJECTION");
});

process.on("uncaughtException", (error: Error) => {
  console.error("💥 [Process] Uncaught Exception detected:", error);
  void handleShutdown("UNCAUGHT_EXCEPTION");
});

void startServer();