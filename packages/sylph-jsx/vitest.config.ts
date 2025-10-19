import { defineConfig, configDefaults } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import solidPlugin from "vite-plugin-solid";
import dts from "vite-plugin-dts";

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
    tsconfigPaths(),
    solidPlugin({
      solid: {
        moduleName: "solid-custom-renderer/index.ts",
        generate: "universal",
      },
    }),
    dts({ tsconfigPath: "tsconfig.build.json" }),
  ],
});
