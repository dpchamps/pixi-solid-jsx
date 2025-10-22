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
exports.ContainerNode = void 0;
var Node_js_1 = require("./Node.js");
var pixi_js_1 = require("pixi.js");
var utility_types_js_1 = require("../../../utility-types.js");
var utility_node_js_1 = require("./utility-node.js");
var ContainerNode = /** @class */ (function (_super) {
    __extends(ContainerNode, _super);
    function ContainerNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ContainerNode.create = function () {
        return new ContainerNode("container", new pixi_js_1.Container());
    };
    ContainerNode.prototype.addChildProxy = function (node, anchor) {
        var _a;
        (0, utility_node_js_1.expectNodeNot)(node, "unexpected child to container", "application", "html");
        if (node.tag === "raw")
            return;
        if (node.tag === "render-layer")
            return this.addRenderLayer(node);
        var insertIndex = anchor
            ? this.resolveInsertIndex(anchor)
            : this.container.children.length;
        this.container.addChildAt(node.container, insertIndex);
        // RenderLayerNodes are ephemeral, it's possible this child is being attached
        // _from_ a RenderLayerNode, in which case, we don't want to move it.
        if (!node.getRenderLayer()) {
            (_a = this.getRenderLayer()) === null || _a === void 0 ? void 0 : _a.attach(node.container);
        }
    };
    ContainerNode.prototype.removeChildProxy = function (proxied) {
        (0, utility_node_js_1.expectNodeNot)(proxied, "unexpected child to container on removal (this is an invariant state)", "application", "html");
        // Raw Nodes are transparent, there's nothing to remove from the pixi node
        if (proxied.tag === "raw")
            return;
        // RenderLayer nodes are also transparent, but their children propagate upwards
        if (proxied.tag === "render-layer")
            return this.removeRenderLayer(proxied);
        // Otherwise, this container is a candidate for removal
        this.container.removeChild(proxied.container);
    };
    ContainerNode.prototype.addChildProxyUntracked = function (untracked) {
        this.container.addChild(untracked);
        this.untrackedChildren.push(untracked);
    };
    ContainerNode.prototype.removeChildProxyUntracked = function (untracked) {
        this.container.removeChild(untracked);
        this.untrackedChildren = this.untrackedChildren.filter(function (x) { return x.uid !== untracked.uid; });
    };
    ContainerNode.prototype.syncUntracked = function () {
        for (var _i = 0, _a = this.untrackedChildren; _i < _a.length; _i++) {
            var untracked = _a[_i];
            if (!this.container.children.includes(untracked)) {
                this.container.children.push(untracked);
            }
        }
    };
    /**
     * Resolves the insertion index in the container for a new child, given an anchor node.
     *
     * Finds the first non-raw sibling at or after the anchor in this.children and returns
     * the appropriate insertion index:
     * - If the anchor itself is non-raw, returns its index
     * - If a non-raw sibling exists after the anchor, returns (that sibling's index - 1)
     * - If no non-raw sibling exists, returns the end of the container
     *
     * @param anchor - The reference node to insert relative to
     * @returns The index to use with container.addChildAt()
     */
    ContainerNode.prototype.resolveInsertIndex = function (anchor) {
        var canSelectPosition = false;
        for (var index = 0; index <= this.children.length - 1; index += 1) {
            var child = this.children[index];
            (0, utility_types_js_1.invariant)(child);
            var isAnchor = child.id === anchor.id;
            canSelectPosition = canSelectPosition || isAnchor;
            // Anchor itself is non-raw: insert at its position
            if (child.tag !== "raw" && canSelectPosition && isAnchor)
                return index;
            // Found non-raw node after anchor: insert before it
            if (child.tag !== "raw" && canSelectPosition)
                return index - 1;
        }
        return this.container.children.length;
    };
    ContainerNode.prototype.addRenderLayer = function (node) {
        var renderLayer = node.getRenderLayer();
        (0, utility_types_js_1.invariant)(renderLayer, "Encountered RenderLayerNode with no RenderLayer");
        this.container.addChild(renderLayer);
        return;
    };
    ContainerNode.prototype.removeRenderLayer = function (node) {
        // ...So we need to remove all of their children from the parent container
        for (var _i = 0, _a = node.getChildren(); _i < _a.length; _i++) {
            var child = _a[_i];
            if ((0, utility_node_js_1.isNodeWithPixiContainer)(child)) {
                this.container.removeChild(child.container);
            }
        }
        // We also need to be sure to remove the actual render layer
        var renderLayer = node.getRenderLayer();
        (0, utility_types_js_1.invariant)(renderLayer);
        this.container.removeChild(renderLayer);
    };
    return ContainerNode;
}(Node_js_1.ProxyNode));
exports.ContainerNode = ContainerNode;
