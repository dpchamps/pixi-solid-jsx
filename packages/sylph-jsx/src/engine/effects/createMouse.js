"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMouse = void 0;
var patched_types_js_1 = require("../../pixi-jsx/solidjs-universal-renderer/patched-types.js");
var getButtonType = function (button) {
    switch (button) {
        case 0:
            return "Main";
        case 1:
            return "Auxiliary";
        case 2:
            return "Secondary";
        case 3:
            return "Forth";
        case 4:
            return "Fifth";
        default:
            return "Unknown";
    }
};
var createMouse = function (element) {
    var _a = (0, patched_types_js_1.createSignal)(false), click = _a[0], setClick = _a[1];
    var _b = (0, patched_types_js_1.createSignal)(), lastClickPosition = _b[0], setLastClickPosition = _b[1];
    var _c = (0, patched_types_js_1.createSignal)(), currentMousePosition = _c[0], setCurrentMousePosition = _c[1];
    var _d = (0, patched_types_js_1.createSignal)(), wheel = _d[0], setWheel = _d[1];
    var onClickEvt = function (evt) {
        setClick(getButtonType(evt.button));
        setLastClickPosition({
            x: evt.x,
            y: evt.y,
        });
    };
    var onMouseUpEvt = function (_) { return setClick(false); };
    var onWheelEvt = function (evt) {
        return setWheel({
            deltaX: evt.deltaX,
            deltaY: evt.deltaY,
            deltaZ: evt.deltaZ,
        });
    };
    var onMousemove = function (evt) {
        return setCurrentMousePosition({
            x: evt.x,
            y: evt.y,
        });
    };
    (0, patched_types_js_1.createComputed)(function () {
        element.addEventListener("mousedown", onClickEvt);
        element.addEventListener("mouseup", onMouseUpEvt);
        element.addEventListener("wheel", onWheelEvt);
        element.addEventListener("mousemove", onMousemove);
        (0, patched_types_js_1.onCleanup)(function () {
            element.removeEventListener("mousedown", onClickEvt);
            element.removeEventListener("mouseup", onMouseUpEvt);
            element.removeEventListener("mousemove", onMousemove);
            element.removeEventListener("wheel", onWheelEvt);
        });
    });
    return { click: click, lastClickPosition: lastClickPosition, currentMousePosition: currentMousePosition, wheel: wheel };
};
exports.createMouse = createMouse;
