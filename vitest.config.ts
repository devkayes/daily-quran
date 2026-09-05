import { defineConfig } from "vitest/config";
import { WxtVitest } from "wxt/testing/vitest-plugin";

export default defineConfig({
  // Resolves `#imports`, the `@/` alias and WXT's build-time env, and swaps the
  // extension APIs for `fakeBrowser` so lib code is testable outside a browser.
  plugins: [WxtVitest()],
  test: {
    globals: true,
    environment: "happy-dom",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    restoreMocks: true,
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts"],
      exclude: ["lib/surahs.ts"],
      reporter: ["text", "html"],
    },
  },
});
