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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationNode = void 0;
var Node_js_1 = require("./Node.js");
var pixi_js_1 = require("pixi.js");
var utility_types_js_1 = require("../../../utility-types.js");
var TextNode_js_1 = require("./TextNode.js");
var utility_node_js_1 = require("./utility-node.js");
var ApplicationNode = /** @class */ (function (_super) {
    __extends(ApplicationNode, _super);
    function ApplicationNode() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.initializationProps = {};
        return _this;
    }
    ApplicationNode.create = function () {
        return new ApplicationNode("application", new pixi_js_1.Application());
    };
    ApplicationNode.prototype.addChildProxy = function (node) {
        (0, utility_types_js_1.assert)(node.tag !== "application" && node.tag !== "html", "unexpected node as child to application: ".concat(node.tag));
        if (node.tag === "raw") {
            var child = TextNode_js_1.TextNode.createFromRaw(node.container);
            this.container.stage.addChild(child.container);
            return child;
        }
        if (node.tag === "render-layer") {
            var renderLayer = node.getRenderLayer();
            (0, utility_types_js_1.invariant)(renderLayer, "Encountered RenderLayerNode with no RenderLayer");
            this.container.stage.addChild(renderLayer);
            return;
        }
        this.container.stage.addChild(node.container);
        return node;
    };
    ApplicationNode.prototype.removeChildProxy = function (proxied) {
        (0, utility_node_js_1.expectNodeNot)(proxied, "unexpected node as child to application", "raw", "html", "application");
        if (proxied.tag === "render-layer") {
            var renderLayer = proxied.getRenderLayer();
            (0, utility_types_js_1.invariant)(renderLayer, "Encountered RenderLayerNode with no RenderLayer");
            this.container.stage.removeChild(renderLayer);
            return;
        }
        this.container.stage.removeChild(proxied.container);
    };
    ApplicationNode.prototype.setProp = function (name, value) {
        this.initializationProps[name] = value;
    };
    ApplicationNode.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var root;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        root = this.getParent();
                        (0, utility_types_js_1.invariant)(root, "Cannot initialize application before root has been appended");
                        (0, utility_node_js_1.expectNode)(root, "html", "unexpected parent for application");
                        return [4 /*yield*/, this.container.init(this.initializationProps)];
                    case 1:
                        _a.sent();
                        this.container.render();
                        root.container.appendChild(this.container.canvas);
                        return [2 /*return*/];
                }
            });
        });
    };
    ApplicationNode.prototype.addChildProxyUntracked = function (_untracked) {
        throw new Error("cannot add untracked child to application");
    };
    ApplicationNode.prototype.removeChildProxyUntracked = function (_untracked) {
        throw new Error("cannot remove an untracked child from application");
    };
    return ApplicationNode;
}(Node_js_1.ProxyNode));
exports.ApplicationNode = ApplicationNode;
