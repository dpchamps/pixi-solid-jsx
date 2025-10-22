"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRect = exports.createGraphics = void 0;
var pixi_js_1 = require("pixi.js");
var createGraphics = function (props) {
    var graphics = new pixi_js_1.Graphics(props.graphicsOptions);
    props.build(graphics);
    return graphics;
};
exports.createGraphics = createGraphics;
var createRect = function (props) {
    return (0, exports.createGraphics)({
        graphicsOptions: props.graphicsOptions,
        build: function (graphics) {
            graphics
                .rect(props.x, props.y, props.width, props.height)
                .fill(props.fill);
        },
    });
};
exports.createRect = createRect;
