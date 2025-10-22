"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTimeout = exports.createInterval = void 0;
var query_fns_js_1 = require("../core/query-fns.js");
var createInterval = function (fn, ms) {
    var current = ms;
    return (0, query_fns_js_1.onEveryFrame)(function (ticker) {
        current -= ticker.elapsedMS;
        if (current <= 0) {
            fn();
            current = ms;
        }
    });
};
exports.createInterval = createInterval;
var createTimeout = function (fn, ms) {
    var dispose = (0, exports.createInterval)(function () {
        fn();
        dispose();
    }, ms);
    return dispose;
};
exports.createTimeout = createTimeout;
