import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import solidPlugin from "vite-plugin-solid";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "sylph-jsx": fileURLToPath(new URL("../sylph-jsx", import.meta.url)),
    },
  },
  plugins: [
    tsconfigPaths(),
    solidPlugin({
      solid: {
        moduleName: fileURLToPath(
          new URL(
            "../sylph-jsx/src/pixi-jsx/solidjs-universal-renderer/index.ts",
            import.meta.url,
          ),
        ),
        generate: "universal",
      },
    }),
  ],
});
