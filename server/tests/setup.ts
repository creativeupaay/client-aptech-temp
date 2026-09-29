import { beforeAll, afterAll, afterEach } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Start isolated, in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Connect Mongoose to the in-memory instance
  await mongoose.connect(uri);
});

afterEach(async () => {
  // Clean collections between tests to guarantee test isolation
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key of Object.keys(collections)) {
      const collection = collections[key];
      if (collection) {
        await collection.deleteMany({});
      }
    }
  }
});

afterAll(async () => {
  // Disconnect and terminate in-memory database
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});
