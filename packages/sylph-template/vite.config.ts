import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  plugins: [
    solidPlugin({
      solid: {
        moduleName: "sylph-jsx",
        generate: "universal",
      },
    }),
  ],
  optimizeDeps: {
    // Keep sylph-jsx out of Vite's dependency pre-bundler so Solid's transform runs.
    exclude: ["sylph-jsx"],
  },
  ssr: {
    noExternal: ["sylph-jsx"],
  },
});
