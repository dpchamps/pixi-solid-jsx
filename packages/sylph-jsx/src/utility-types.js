"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.intoArray = exports.isDefined = exports.isSome = exports.is = exports.unreachable = exports.unimplemented = void 0;
exports.invariant = invariant;
exports.invariantUseContext = invariantUseContext;
exports.assert = assert;
function invariant(x, message) {
    if (!(0, exports.isDefined)(x)) {
        throw new Error(message || "invariant");
    }
}
function invariantUseContext(x, contextType) {
    invariant(x, "Expected ".concat(contextType, ", but was undefined. Did you remember to use the provider?"));
}
var unimplemented = function () {
    var _ = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        _[_i] = arguments[_i];
    }
    throw new Error("unimplemented");
};
exports.unimplemented = unimplemented;
function assert(condition, message) {
    if (message === void 0) { message = "truthy condition"; }
    if (!condition) {
        throw new Error("Expected: ".concat(message));
    }
}
var unreachable = function (_) {
    throw new Error("unreachable");
};
exports.unreachable = unreachable;
var is = function (input, type) {
    return typeof input === type;
};
exports.is = is;
var isSome = function (input) {
    var types = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        types[_i - 1] = arguments[_i];
    }
    return types.some(function (type) { return typeof input === type; });
};
exports.isSome = isSome;
var isDefined = function (input) {
    return !((0, exports.is)(input, "undefined") || input === null);
};
exports.isDefined = isDefined;
var intoArray = function (maybeEls) {
    return Array.isArray(maybeEls) ? maybeEls : (0, exports.isDefined)(maybeEls) ? [maybeEls] : [];
};
exports.intoArray = intoArray;
