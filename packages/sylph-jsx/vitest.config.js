"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("vitest/config");
var vite_plugin_solid_1 = require("vite-plugin-solid");
var node_url_1 = require("node:url");
exports.default = (0, config_1.defineConfig)({
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
            toFake: __spreadArray(__spreadArray([], (config_1.configDefaults.fakeTimers.toFake || []), true), ["performance"], false),
        },
        environment: "jsdom",
        setupFiles: ["vitest-webgl-canvas-mock"],
        // deps: { optimizer: { web: { include: ['vitest-webgl-canvas-mock'] } } },
    },
    plugins: [
        (0, vite_plugin_solid_1.default)({
            solid: {
                moduleName: (0, node_url_1.fileURLToPath)(new URL("./src/pixi-jsx/solidjs-universal-renderer/index.ts", import.meta.url)),
                generate: "universal",
            },
        }),
    ],
});
