import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
    plugins: [
        tsconfigPaths(),
        solidPlugin({
            solid: {
                moduleName: "solid-custom-renderer/index.ts",
                generate: "universal"
            }
        })
    ],
})