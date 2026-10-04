import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: [
      "src/pages/api/garden.test.ts",
      "src/pages/api/garden-crops.test.ts",
      "src/pages/api/garden-plan.test.ts",
    ],
  },
});
