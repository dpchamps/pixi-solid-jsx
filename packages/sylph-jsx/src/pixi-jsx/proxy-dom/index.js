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
exports.createProxiedPixieContainerNode = exports.HtmlElementNode = exports.RawNode = void 0;
var TextNode_js_1 = require("./nodes/TextNode.js");
var ContainerNode_js_1 = require("./nodes/ContainerNode.js");
var ApplicationNode_js_1 = require("./nodes/ApplicationNode.js");
var SpriteNode_js_1 = require("./nodes/SpriteNode.js");
var Graphics_js_1 = require("./nodes/Graphics.js");
var RenderLayerNode_js_1 = require("./nodes/RenderLayerNode.js");
var RawNode_js_1 = require("./nodes/RawNode.js");
Object.defineProperty(exports, "RawNode", { enumerable: true, get: function () { return RawNode_js_1.RawNode; } });
var HtmlElementNode_js_1 = require("./nodes/HtmlElementNode.js");
Object.defineProperty(exports, "HtmlElementNode", { enumerable: true, get: function () { return HtmlElementNode_js_1.HtmlElementNode; } });
__exportStar(require("./nodes/TextNode.js"), exports);
__exportStar(require("./nodes/ContainerNode.js"), exports);
__exportStar(require("./nodes/ApplicationNode.js"), exports);
__exportStar(require("./nodes/SpriteNode.js"), exports);
__exportStar(require("./nodes/RenderLayerNode.js"), exports);
var createProxiedPixieContainerNode = function (tag) {
    switch (tag) {
        case "text":
            return TextNode_js_1.TextNode.create();
        case "container":
            return ContainerNode_js_1.ContainerNode.create();
        case "application":
            return ApplicationNode_js_1.ApplicationNode.create();
        case "sprite":
            return SpriteNode_js_1.SpriteNode.create();
        case "graphics":
            return Graphics_js_1.GraphicsNode.create();
        case "render-layer":
            return RenderLayerNode_js_1.RenderLayerNode.create();
        default: {
            throw new Error("Received Invalid Tag ".concat(tag));
        }
    }
};
exports.createProxiedPixieContainerNode = createProxiedPixieContainerNode;
