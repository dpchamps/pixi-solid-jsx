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
exports.RawNode = void 0;
var Node_js_1 = require("./Node.js");
var RawNode = /** @class */ (function (_super) {
    __extends(RawNode, _super);
    function RawNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    RawNode.create = function (value) {
        return new RawNode("raw", value);
    };
    RawNode.prototype.replaceChild = function (_value) {
        throw new Error("cannot replace child on raw node.");
    };
    RawNode.prototype.addChildProxy = function (node) {
        throw new Error("cannot add child to raw node (value: ".concat(this.container, "), got: ").concat(node.tag));
    };
    RawNode.prototype.removeChildProxy = function (node) {
        throw new Error("invariant state: cannot remove child from raw node (value: ".concat(this.container, "), got: ").concat(node.tag));
    };
    RawNode.prototype.addChildProxyUntracked = function (_untracked) {
        throw new Error("invariant state: cannot add untracked child to raw");
    };
    RawNode.prototype.removeChildProxyUntracked = function (_untracked) {
        throw new Error("cannot remove an untracked child from RawNode");
    };
    return RawNode;
}(Node_js_1.ProxyNode));
exports.RawNode = RawNode;
