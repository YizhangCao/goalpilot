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
      {
        ...shared,
        test: {
          name: "int",
          environment: "node",
          include: ["src/**/*.int.test.ts"],
          globalSetup: ["test/int-global-setup.ts"],
          setupFiles: ["test/int-setup.ts"],
          // Tests share one database; run files one at a time.
          fileParallelism: false,
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/generated/**", "src/**/*.test.ts", "src/app/layout.tsx"],
      thresholds: { lines: 70, branches: 70 },
    },
  },
});
