"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTimer = exports.createTicker = void 0;
var patched_types_js_1 = require("../../pixi-jsx/solidjs-universal-renderer/patched-types.js");
var pixi_js_1 = require("pixi.js");
var createTicker = function () {
    var ticker = new pixi_js_1.Ticker();
    ticker.minFPS = 30;
    ticker.autoStart = false;
    return ticker;
};
exports.createTicker = createTicker;
// TODO: this should be computed based off of timer on the fly, rather than assuming 60fps.
var FRAME_BUDGET = 16.6;
var createTimer = function (args) {
    var _a = (0, patched_types_js_1.createSignal)(0), frameCount = _a[0], setFrameCount = _a[1];
    function frameTick(ticker) {
        // TODO: performance.now is making tests flaky in CI.
        //  Either bind this to the ticker, or use fake timers in tests
        var frameStart = performance.now();
        setFrameCount(function (last) { return last + 1; });
        var _loop_1 = function () {
            var next = Array.from(args.nextFrameFns.values());
            args.nextFrameFns.clear();
            (0, patched_types_js_1.batch)(function () {
                next.forEach(function (x) { return x(ticker); });
            });
        };
        /**
         * Reactive Effect Cascade Processing
         *
         * Effects can trigger signal updates that schedule additional effects.
         * Without this loop, each dependency layer would execute on separate frames,
         * creating multi-frame input latency (e.g. input → state → render = 3 frames).
         *
         * By repeatedly flushing scheduled effects within a frame budget, all reactive
         * layers collapse into a single frame:
         *
         * Frame N:
         *   1. setFrameCount triggers all subscribed effects
         *   2. Effects run → set signals → schedule new effects
         *   3. Loop continues, executing newly scheduled effects
         *   4. Repeat until no effects remain or budget exhausted
         *
         * Effects exceeding budget defer to next frame.
         */
        while (args.nextFrameFns.size &&
            performance.now() - frameStart < FRAME_BUDGET) {
            _loop_1();
        }
    }
    var ticker = args.createTicker ? args.createTicker() : (0, exports.createTicker)();
    ticker.add(frameTick);
    (0, patched_types_js_1.onCleanup)(function () { return ticker.remove(frameTick); });
    return {
        frameCount: frameCount,
        ticker: ticker,
    };
};
exports.createTimer = createTimer;
