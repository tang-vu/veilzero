import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({ test: { environment: "jsdom", globals: true, exclude: ["e2e/**", "node_modules/**", ".node_modules-stalled*/**"] }, resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } } });
