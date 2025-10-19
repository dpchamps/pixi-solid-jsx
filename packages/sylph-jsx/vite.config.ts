import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import solidPlugin from "vite-plugin-solid";
import { fileURLToPath } from "node:url";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
      name: "pixijsx",
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: ["pixi.js", "solid-js"],
    },
    copyPublicDir: false,
  },
  plugins: [
    tsconfigPaths(),
    solidPlugin({
      solid: {
        moduleName: "solid-custom-renderer/index.ts",
        generate: "universal",
      },
    }),
    dts({
      rollupTypes: true,
      tsconfigPath:
        process.env["VITE_STAGE"] === "DEV"
          ? "tsconfig.json"
          : "tsconfig.build.json",
    }),
  ],
});
