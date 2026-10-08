import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    env: {
      NODE_ENV: "test",
      TRANSBNK_PROVIDER: "mock",
    },
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
