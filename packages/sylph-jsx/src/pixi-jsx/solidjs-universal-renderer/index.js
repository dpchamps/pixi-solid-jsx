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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.use = exports.mergeProps = exports.setProp = exports.spread = exports.insert = exports.insertNode = exports.createTextNode = exports.createElement = exports.createComponent = exports.memo = exports.effect = exports.render = void 0;
var universal_1 = require("solid-js/universal");
var utility_types_js_1 = require("../../utility-types.js");
var index_js_1 = require("../proxy-dom/index.js");
exports.render = (_a = (0, universal_1.createRenderer)({
    createElement: function (tag) {
        var node = (0, index_js_1.createProxiedPixieContainerNode)(tag);
        return node;
    },
    createTextNode: function (value) {
        return index_js_1.RawNode.create(value);
    },
    getFirstChild: function (node) {
        return node.getChildren()[0];
    },
    getNextSibling: function (node) {
        var parent = node.getParent();
        (0, utility_types_js_1.invariant)(parent);
        var children = parent.getChildren();
        var index = children.findIndex(function (el) { return el.id === node.id; });
        if (index === -1 || index === children.length - 1)
            return undefined;
        return children[index + 1];
    },
    getParentNode: function (node) {
        var parent = node.getParent();
        return parent === null ? undefined : parent;
    },
    insertNode: function (parent, node, anchor) {
        parent.addChild(node, anchor);
    },
    isTextNode: function (node) {
        return node.tag === "text";
    },
    removeNode: function (parent, node) {
        parent.removeChild(node);
    },
    replaceText: function (rawNode, value) {
        var parent = rawNode.getParent();
        (0, utility_types_js_1.invariant)(parent);
        parent.replaceChild(rawNode, index_js_1.RawNode.create(value));
    },
    setProperty: function (node, name, value, prev) {
        node.setProp(name, value, prev);
    },
}), _a.render), exports.effect = _a.effect, exports.memo = _a.memo, exports.createComponent = _a.createComponent, exports.createElement = _a.createElement, exports.createTextNode = _a.createTextNode, exports.insertNode = _a.insertNode, exports.insert = _a.insert, exports.spread = _a.spread, exports.setProp = _a.setProp, exports.mergeProps = _a.mergeProps, exports.use = _a.use;
__exportStar(require("./patched-types.js"), exports);
