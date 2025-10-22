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
exports.TextNode = void 0;
var Node_js_1 = require("./Node.js");
var pixi_js_1 = require("pixi.js");
var RawNode_js_1 = require("./RawNode.js");
var utility_node_js_1 = require("./utility-node.js");
var TextNode = /** @class */ (function (_super) {
    __extends(TextNode, _super);
    function TextNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TextNode.create = function () {
        return new TextNode("text", new pixi_js_1.Text());
    };
    TextNode.createFromRaw = function () {
        var nodes = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            nodes[_i] = arguments[_i];
        }
        var node = TextNode.create();
        nodes.forEach(function (child) { return node.addChild(RawNode_js_1.RawNode.create(child)); });
        return node;
    };
    TextNode.prototype.addChildProxy = function (node, _anchor) {
        (0, utility_node_js_1.expectNode)(node, "raw", "unexpect tag for text");
    };
    TextNode.prototype.recomputeProxy = function () {
        this.container.text = this.children.reduce(function (acc, child) { return "".concat(acc).concat(child.container); }, "");
    };
    TextNode.prototype.addChildProxyUntracked = function (_untracked) {
        throw new Error("cannot add untracked child to text");
    };
    TextNode.prototype.removeChildProxyUntracked = function (_untracked) {
        throw new Error("cannot remove an untracked child from Text");
    };
    TextNode.prototype.removeChildProxy = function (proxied) {
        var nextText = this.children.reduce(function (acc, el) {
            if (proxied.id === el.id)
                return acc;
            return "".concat(acc).concat(el.container);
        }, "");
        this.container.text = nextText;
    };
    return TextNode;
}(Node_js_1.ProxyNode));
exports.TextNode = TextNode;
