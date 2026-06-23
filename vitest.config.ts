import { defineConfig } from "vitest/config";

// I test del motore dei conti girano in node (pura logica, niente DOM/Dexie).
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
