"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderRoot = void 0;
__exportStar(require("./solidjs-universal-renderer/index.js"), exports);
__exportStar(require("./jsx/jsx-runtime.js"), exports);
var solid_js_1 = require("solid-js");
var index_js_1 = require("./proxy-dom/index.js");
var index_js_2 = require("./solidjs-universal-renderer/index.js");
var renderRoot = function (root, attachTo) {
    (0, solid_js_1.createRoot)(function (_dispose) {
        (0, index_js_2.render)(root, index_js_1.HtmlElementNode.create(attachTo));
    });
};
exports.renderRoot = renderRoot;
