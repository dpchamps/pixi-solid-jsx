"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clamp = void 0;
var clamp = function (min, max, value) {
    return Math.max(min, Math.min(max, value));
};
exports.clamp = clamp;
