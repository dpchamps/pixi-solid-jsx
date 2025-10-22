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
exports.RenderLayerNode = void 0;
var Node_js_1 = require("./Node.js");
var pixi_js_1 = require("pixi.js");
var utility_types_js_1 = require("../../../utility-types.js");
var RenderLayerNode = /** @class */ (function (_super) {
    __extends(RenderLayerNode, _super);
    function RenderLayerNode(renderLayer) {
        var _this = _super.call(this, "render-layer", null) || this;
        _this.pendingChildren = [];
        _this.renderLayer = renderLayer;
        return _this;
    }
    RenderLayerNode.create = function () {
        return new RenderLayerNode(new pixi_js_1.RenderLayer());
    };
    RenderLayerNode.prototype.setParent = function (parent) {
        _super.prototype.setParent.call(this, parent);
        (0, utility_types_js_1.invariant)(this.parent, "parent cannot be undefined");
        for (var _i = 0, _a = this.pendingChildren; _i < _a.length; _i++) {
            var _b = _a[_i], child = _b.child, anchor = _b.anchor;
            this.parent.addChild(child, anchor);
        }
        this.pendingChildren = [];
    };
    RenderLayerNode.prototype.addChildProxy = function (child, anchor) {
        child.setRenderLayer(this.renderLayer);
        // This is not strictly necessary,
        // Because `attachRenderLayerRecursive` is called on setParent
        // However, it's a performance optimization
        // For non-detached component trees, we can propagate the render layer downward once
        // without having to do a recursive computation
        Node_js_1.ProxyNode.attachRenderLayer(child, this.renderLayer);
        if (!this.parent) {
            this.pendingChildren.push({ child: child, anchor: anchor });
            return;
        }
        return this.parent.addChild(child, anchor);
    };
    RenderLayerNode.prototype.addChild = function (node, anchor) {
        _super.prototype.addChild.call(this, node, anchor);
    };
    RenderLayerNode.prototype.addChildProxyUntracked = function (_node) {
        throw new Error("RenderLayerNode Does not Support untracked children.");
    };
    RenderLayerNode.prototype.removeChildProxy = function (child) {
        var _a;
        child.setRenderLayer(undefined);
        return (_a = this.parent) === null || _a === void 0 ? void 0 : _a.removeChild(child);
    };
    RenderLayerNode.prototype.removeChild = function (node) {
        node.setRenderLayer(undefined);
        _super.prototype.removeChild.call(this, node);
    };
    RenderLayerNode.prototype.removeChildProxyUntracked = function (_node) {
        throw new Error("RenderLayerNode Does not Support untracked children. Hint: use the parent container.");
    };
    return RenderLayerNode;
}(Node_js_1.ProxyNode));
exports.RenderLayerNode = RenderLayerNode;
