"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWindowDimensions = void 0;
var patched_types_js_1 = require("../../pixi-jsx/solidjs-universal-renderer/patched-types.js");
var intoCurrentDimensions = function (window) { return ({
    innerWidth: window.innerWidth,
    outerWidth: window.outerWidth,
    innerHeight: window.innerHeight,
    outerHeight: window.outerHeight,
}); };
var createWindowDimensions = function (element) {
    var _a = (0, patched_types_js_1.createSignal)(intoCurrentDimensions(element.window)), windowDimensions = _a[0], setWindowDimensions = _a[1];
    var setCurrentDimensions = function () {
        return setWindowDimensions(intoCurrentDimensions(element.window));
    };
    (0, patched_types_js_1.createComputed)(function () {
        element.window.addEventListener("resize", setCurrentDimensions);
        setCurrentDimensions();
        return function () {
            element.window.removeEventListener("resize", setCurrentDimensions);
        };
    });
    return windowDimensions;
};
exports.createWindowDimensions = createWindowDimensions;
