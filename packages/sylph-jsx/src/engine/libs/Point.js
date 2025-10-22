"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.euclideanDistance = exports.equal = void 0;
var equal = function (a, b) {
    return (a === null || a === void 0 ? void 0 : a.x) === (b === null || b === void 0 ? void 0 : b.x) && (a === null || a === void 0 ? void 0 : a.y) === (b === null || b === void 0 ? void 0 : b.y);
};
exports.equal = equal;
var euclideanDistance = function (a, b) {
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
};
exports.euclideanDistance = euclideanDistance;
