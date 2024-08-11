import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        include: ["src/__tests__/**/*"],
        coverage: {
            provider: "v8",
            enabled: true,
            exclude: ["src/__tests__/**/*", "vitest.config.ts"]
        }
    },
})