"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNodeWithPixiContainer = void 0;
exports.expectNodeNot = expectNodeNot;
exports.expectNode = expectNode;
var utility_types_js_1 = require("../../../utility-types.js");
function expectNodeNot(node, context) {
    var tags = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        tags[_i - 2] = arguments[_i];
    }
    if (tags.some(function (tag) { return node.tag === tag; })) {
        throw new Error("".concat(context, ". unexpected node ").concat(node.tag, ". cannot be: ").concat(tags.join(",")));
    }
}
function expectNode(node, tag, context) {
    (0, utility_types_js_1.assert)(node.tag === tag, "".concat(context, ". unexpected node: expected ").concat(tag, ", got ").concat(node.tag));
}
var isNodeWithPixiContainer = function (node) {
    switch (node.tag) {
        case "container":
        case "text":
        case "graphics":
        case "sprite":
            return true;
        case "raw":
        case "html":
        case "render-layer":
        case "application":
            return false;
        default:
            return (0, utility_types_js_1.unreachable)(node);
    }
};
exports.isNodeWithPixiContainer = isNodeWithPixiContainer;
