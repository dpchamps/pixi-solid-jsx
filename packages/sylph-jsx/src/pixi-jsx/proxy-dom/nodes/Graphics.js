"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphicsNode = void 0;
var Node_js_1 = require("./Node.js");
var pixi_js_1 = require("pixi.js");
var GraphicsNode = /** @class */ (function (_super) {
    __extends(GraphicsNode, _super);
    function GraphicsNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    GraphicsNode.create = function () {
        return new GraphicsNode("graphics", new pixi_js_1.Graphics());
    };
    GraphicsNode.prototype.addChildProxy = function (node) {
        throw new Error("cannot add child to graphics node (id: ".concat(this.id, "), got: ").concat(node.tag));
    };
    GraphicsNode.prototype.removeChildProxy = function (node) {
        throw new Error("invariant state: cannot remove child from graphics node (id: ".concat(this.id, "), got: ").concat(node.tag));
    };
    GraphicsNode.prototype.addChildProxyUntracked = function (_untracked) {
        throw new Error("cannot add untracked child to graphics");
    };
    GraphicsNode.prototype.removeChildProxyUntracked = function (_untracked) {
        throw new Error("cannot remove an untracked child from graphics");
    };
    return GraphicsNode;
}(Node_js_1.ProxyNode));
exports.GraphicsNode = GraphicsNode;
