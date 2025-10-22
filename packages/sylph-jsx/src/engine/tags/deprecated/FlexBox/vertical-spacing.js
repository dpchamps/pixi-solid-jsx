"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.childWithVerticalSpacing = void 0;
var childWithVerticalSpacing = function (el, index, parentBoxModel, acc) {
    var offset = parentBoxModel.padding + parentBoxModel.margin;
    el.container.y = index * offset;
    return {
        node: el,
        width: acc.width,
        height: acc.height + el.container.y,
        row: acc.row,
        col: acc.col + 1,
        maxX: Math.max(acc.maxX, el.container.width),
        maxY: Math.max(acc.maxY, el.container.height),
    };
};
exports.childWithVerticalSpacing = childWithVerticalSpacing;
