import { defineConfig, configDefaults } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import solidPlugin from "vite-plugin-solid";
import dts from "vite-plugin-dts";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    include: ["src/**/*/__tests__/**/*"],
    exclude: ["src/__tests__/test-utils/**/*"],
    coverage: {
      provider: "v8",
      enabled: true,
      exclude: [
        "src/__tests__/**/*",
        "vite*.config.ts",
        "dist",
        "vitest.config.ts",
        "src/**/deprecated/**",
      ],
    },
    fakeTimers: {
      toFake: [...(configDefaults.fakeTimers.toFake || []), "performance"],
    },
    environment: "jsdom",
    setupFiles: ["vitest-webgl-canvas-mock"],
    // deps: { optimizer: { web: { include: ['vitest-webgl-canvas-mock'] } } },
  },
  plugins: [
    solidPlugin({
      solid: {
        moduleName: fileURLToPath(
          new URL(
            "./src/pixi-jsx/solidjs-universal-renderer/index.ts",
            import.meta.url,
          ),
        ),
        generate: "universal",
      },
    }),
  ],
});
