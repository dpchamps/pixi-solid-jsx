"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shallowAssignAndDiff = void 0;
/**
 * This combines two operations:
 *
 * 1. Shallow assign props from `from` into `target`
 * 2. Returns whether mutation occured
 */
var shallowAssignAndDiff = function (target, from) {
    var fromKeys = Object.keys(from);
    var length = fromKeys.length;
    var mutation = false;
    for (var i = 0; i < length; i++) {
        var key = fromKeys[i];
        if (key && target[key] !== from[key]) {
            target[key] = from[key];
            mutation = true;
        }
    }
    return mutation;
};
exports.shallowAssignAndDiff = shallowAssignAndDiff;
