"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lerp = void 0;
var lerp = function (start, end, percentage) {
    return start * (1 - percentage) + end * percentage;
};
exports.lerp = lerp;
