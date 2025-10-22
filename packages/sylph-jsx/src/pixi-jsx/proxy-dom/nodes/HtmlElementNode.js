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
exports.HtmlElementNode = void 0;
var Node_js_1 = require("./Node.js");
var utility_node_js_1 = require("./utility-node.js");
var HtmlElementNode = /** @class */ (function (_super) {
    __extends(HtmlElementNode, _super);
    function HtmlElementNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    HtmlElementNode.create = function (element) {
        return new HtmlElementNode("html", element);
    };
    HtmlElementNode.prototype.addChildProxy = function (node) {
        (0, utility_node_js_1.expectNode)(node, "application", "application must be inserted into HTMLElement");
    };
    HtmlElementNode.prototype.removeChildProxy = function (proxied) {
        (0, utility_node_js_1.expectNode)(proxied, "application", "bad state. expected application as child to root HTMLElement");
        if (proxied.container.canvas) {
            this.container.removeChild(proxied.container.canvas);
        }
    };
    HtmlElementNode.prototype.addChildProxyUntracked = function (_untracked) {
        throw new Error("cannot add untracked child to html node");
    };
    HtmlElementNode.prototype.removeChildProxyUntracked = function (_untracked) {
        throw new Error("cannot remove an untracked child from HTMLElement");
    };
    return HtmlElementNode;
}(Node_js_1.ProxyNode));
exports.HtmlElementNode = HtmlElementNode;
