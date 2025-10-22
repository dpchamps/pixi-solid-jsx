"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlexBox = void 0;
var solid_js_1 = require("solid-js");
var patched_types_js_1 = require("../../../../pixi-jsx/solidjs-universal-renderer/patched-types.js");
var utility_types_js_1 = require("../../../../utility-types.js");
var Node_js_1 = require("../../../../pixi-jsx/proxy-dom/nodes/Node.js");
var horizontal_spacing_js_1 = require("./horizontal-spacing.js");
var vertical_spacing_js_1 = require("./vertical-spacing.js");
var DEFAULT_PROPS = {
    x: 0,
    y: 0,
    margin: 0,
    padding: 0,
    width: 0,
    orientation: "horizontal",
};
var childWithSpacing = function (orientation, i, parentBoxModel, el, acc) {
    switch (orientation) {
        case "horizontal":
            return (0, horizontal_spacing_js_1.childWithHorizontalSpacing)(el, i, parentBoxModel, acc);
        case "vertical":
            return (0, vertical_spacing_js_1.childWithVerticalSpacing)(el, i, parentBoxModel, acc);
        default:
            return (0, utility_types_js_1.unreachable)(orientation);
    }
};
var FlexBox = function (props) {
    var propsWithDefaults = (0, solid_js_1.mergeProps)(DEFAULT_PROPS, props);
    var childrenSignal = (0, patched_types_js_1.children)(function () { return props.children; });
    (0, patched_types_js_1.createEffect)(function () {
        childrenSignal.toArray().reduce(function (acc, el, i) {
            if (!(el instanceof Node_js_1.ProxyNode))
                return acc;
            var _a = childWithSpacing(propsWithDefaults.orientation, i, {
                margin: propsWithDefaults.margin,
                padding: propsWithDefaults.padding,
                width: propsWithDefaults.width,
            }, el, acc), node = _a.node, next = __rest(_a, ["node"]);
            return __assign({ elements: __spreadArray(__spreadArray([], acc.elements, true), [node], false) }, next);
        }, {
            elements: [],
            maxX: 0,
            maxY: 0,
            row: 0,
            col: 0,
            width: 0,
            height: 0,
        });
    });
    return (<container x={propsWithDefaults.x} y={propsWithDefaults.y}>
      {childrenSignal()}
    </container>);
};
exports.FlexBox = FlexBox;
