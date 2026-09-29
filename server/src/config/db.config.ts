import mongoose from "mongoose";
import { env } from "../env.config.js";

export const connectDB = async (): Promise<void> => {
  try {
    mongoose.connection.on("connected", () => {
      console.log(`[Database] MongoDB connected successfully to ${mongoose.connection.host}/${mongoose.connection.name}`);
    });

    mongoose.connection.on("error", (err) => {
      console.error("[Database] MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("[Database] MongoDB connection lost. Disconnected.");
    });

    await mongoose.connect(env.MONGO_URI);
  } catch (error) {
    console.error("[Database] Initial MongoDB connection failure:", error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log("[Database] MongoDB disconnected cleanly.");
  } catch (error) {
    console.error("[Database] Error while disconnecting MongoDB:", error);
  }
};
