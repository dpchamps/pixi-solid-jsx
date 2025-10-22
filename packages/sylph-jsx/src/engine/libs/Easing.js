"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.elasticIn = exports.circularIn = exports.easeInOut = exports.easeOut = exports.flip = exports.easeIn = exports.linear = void 0;
var Math_js_1 = require("./Math.js");
var linear = function (t) { return t; };
exports.linear = linear;
var easeIn = function (t) { return t * t; };
exports.easeIn = easeIn;
var flip = function (t) { return 1 - t; };
exports.flip = flip;
var easeOut = function (t) { return (0, exports.flip)((0, exports.easeIn)((0, exports.flip)(t))); };
exports.easeOut = easeOut;
var easeInOut = function (t) { return (0, Math_js_1.lerp)((0, exports.easeIn)(t), (0, exports.easeOut)(t), t); };
exports.easeInOut = easeInOut;
var circularIn = function (t) { return 1 - Math.sqrt(1 - (0, exports.easeIn)(t)); };
exports.circularIn = circularIn;
var elasticIn = function (t, magnitude) {
    if (magnitude === void 0) { magnitude = 5; }
    if (t === 0)
        return 0;
    if (t === 1)
        return 1;
    return (-Math.pow(2, magnitude * (t -= 1)) *
        Math.sin(((t - 0.1) * (2 * Math.PI)) / 0.4));
};
exports.elasticIn = elasticIn;
