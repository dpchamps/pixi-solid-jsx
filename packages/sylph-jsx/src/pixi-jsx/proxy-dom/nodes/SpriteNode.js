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
exports.SpriteNode = void 0;
var Node_js_1 = require("./Node.js");
var pixi_js_1 = require("pixi.js");
var SpriteNode = /** @class */ (function (_super) {
    __extends(SpriteNode, _super);
    function SpriteNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SpriteNode.create = function () {
        return new SpriteNode("sprite", new pixi_js_1.Sprite());
    };
    SpriteNode.prototype.addChildProxy = function (node) {
        throw new Error("cannot add child to sprite node (id: ".concat(this.id, "), got: ").concat(node.tag));
    };
    SpriteNode.prototype.addChildProxyUntracked = function (_untracked) {
        throw new Error("cannot add untracked child to sprite");
    };
    SpriteNode.prototype.removeChildProxyUntracked = function (_untracked) {
        throw new Error("cannot remove an untracked child from Sprite");
    };
    SpriteNode.prototype.removeChildProxy = function (node) {
        throw new Error("invariant state: cannot remove child from sprite node (id: ".concat(this.id, "), got: ").concat(node.tag));
    };
    return SpriteNode;
}(Node_js_1.ProxyNode));
exports.SpriteNode = SpriteNode;
