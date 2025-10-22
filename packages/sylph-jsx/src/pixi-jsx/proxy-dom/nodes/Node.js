"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyNode = void 0;
var utility_types_js_1 = require("../../../utility-types.js");
var utility_node_js_1 = require("./utility-node.js");
// Bad foo for now
var _id = 0;
var getId = function () { return ++_id; };
var ProxyNode = /** @class */ (function () {
    function ProxyNode(tag, container) {
        this.parent = null;
        this.children = [];
        this.proxiedChildren = [];
        this.untrackedChildren = [];
        this.renderLayer = null;
        this.tag = tag;
        this.container = container;
        this.id = getId();
    }
    ProxyNode.attachRenderLayer = function (node, renderLayer) {
        if ((0, utility_node_js_1.isNodeWithPixiContainer)(node)) {
            renderLayer.attach(node.container);
        }
    };
    ProxyNode.attachRenderLayerRecursive = function (node, renderLayer) {
        ProxyNode.attachRenderLayer(node, renderLayer);
        for (var _i = 0, _a = node.getChildren(); _i < _a.length; _i++) {
            var child = _a[_i];
            if (!child.getRenderLayer()) {
                child.setRenderLayer(renderLayer);
            }
        }
    };
    ProxyNode.prototype.addChildWithProxy = function (child, proxiedChild, anchor) {
        var idx = this.children.findIndex(function (n) { return (anchor === null || anchor === void 0 ? void 0 : anchor.id) === n.id; });
        var spliceAt = idx === -1 ? this.children.length : idx;
        this.children.splice(spliceAt, 0, child);
        this.proxiedChildren.splice(spliceAt, 0, proxiedChild);
        child.setParent(this);
    };
    ProxyNode.prototype.addChild = function (node, anchor) {
        var proxied = this.addChildProxy(node, anchor);
        this.addChildWithProxy(node, proxied || node, anchor);
        this.recomputeProxy();
    };
    ProxyNode.prototype.replaceChild = function (oldNode, newNode) {
        this.addChild(newNode, oldNode);
        this.removeChild(oldNode);
        this.recomputeProxy();
    };
    ProxyNode.prototype.getChildren = function () {
        return this.children;
    };
    ProxyNode.prototype.getParent = function () {
        return this.parent;
    };
    ProxyNode.prototype.getRenderLayer = function () {
        return this.renderLayer;
    };
    ProxyNode.prototype.removeChildBase = function (node) {
        var index = this.children.findIndex(function (child) { return child.id === node.id; });
        (0, utility_types_js_1.assert)(index > -1, "Attempted to remove a child that did not exist. This is a runtime error that cannot be recovered from");
        var childElement = this.children[index];
        var proxiedChild = this.proxiedChildren[index];
        (0, utility_types_js_1.invariant)(childElement);
        (0, utility_types_js_1.invariant)(proxiedChild);
        this.children.splice(index, 1);
        this.proxiedChildren.splice(index, 1);
        return proxiedChild;
    };
    ProxyNode.prototype.syncUntracked = function () { };
    ProxyNode.prototype.removeChild = function (node) {
        var proxiedChild = this.removeChildBase(node);
        this.removeChildProxy(proxiedChild);
        this.recomputeProxy();
    };
    ProxyNode.prototype.setParent = function (parent) {
        this.parent = parent;
        if (!this.renderLayer) {
            this.setRenderLayer(parent.getRenderLayer());
        }
    };
    ProxyNode.prototype.setRenderLayer = function (layer) {
        this.renderLayer = layer !== null && layer !== void 0 ? layer : null;
        if (layer) {
            ProxyNode.attachRenderLayerRecursive(
            // this is never _not_ a proxydomnode.
            // could think of a better pattern,
            // but it works
            this, layer);
        }
    };
    ProxyNode.prototype.setProp = function (name, value, _prev) {
        if (typeof this.container === "object" && this.container !== null) {
            Reflect.set(this.container, name, value);
        }
        else if (this.tag === "render-layer" && (0, utility_types_js_1.isDefined)(this.renderLayer)) {
            Reflect.set(this.renderLayer, name, value);
        }
    };
    ProxyNode.prototype.recomputeProxy = function () {
        // noop
    };
    return ProxyNode;
}());
exports.ProxyNode = ProxyNode;
