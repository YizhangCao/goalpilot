import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const serverOnlyStub = fileURLToPath(new URL("./test/server-only-stub.ts", import.meta.url));

const shared = {
  resolve: {
    tsconfigPaths: true,
    alias: { "server-only": serverOnlyStub },
  },
};

export default defineConfig({
  test: {
    projects: [
      {
        ...shared,
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/*.int.test.ts"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/generated/**", "src/**/*.test.{ts,tsx}", "src/app/layout.tsx"],
      thresholds: { lines: 70, branches: 70 },
    },
  },
});
