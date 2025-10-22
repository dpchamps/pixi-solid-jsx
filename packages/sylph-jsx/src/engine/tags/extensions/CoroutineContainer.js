"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoroutineContainer = void 0;
var solid_js_1 = require("solid-js");
var coroutines_js_1 = require("../../effects/coroutines.js");
var query_fns_js_1 = require("../../core/query-fns.js");
var CoroutineContainer = function (props) {
    var _a = (0, solid_js_1.createSignal)(props.from), getNext = _a[0], setNext = _a[1];
    var shouldStart = function () {
        return typeof props.shouldStart === "undefined" ? true : props.shouldStart;
    };
    var baseCoroutineConstructor = function () {
        return (0, coroutines_js_1.chainCoroutine)((0, coroutines_js_1.waitMsCoroutine)(props.delay || 0), (0, coroutines_js_1.createEasingCoroutine)(function (fn) { return setNext(fn(props.from, props.to)); }, props.easingFn, props.duration));
    };
    var baseCoroutine = props.replay
        ? (0, coroutines_js_1.createRepeatableCoroutine)(baseCoroutineConstructor)
        : baseCoroutineConstructor();
    var scheduledCoroutine = (0, coroutines_js_1.startCoroutine)(baseCoroutine, false);
    (0, query_fns_js_1.createSynchronizedEffect)(shouldStart, function (shouldStart) {
        return shouldStart
            ? scheduledCoroutine.resume()
            : scheduledCoroutine.pause();
    });
    (0, solid_js_1.onCleanup)(function () {
        scheduledCoroutine.dispose();
    });
    return function () {
        return props.children(getNext, scheduledCoroutine.stopped || (function () { return false; }));
    };
};
exports.CoroutineContainer = CoroutineContainer;
