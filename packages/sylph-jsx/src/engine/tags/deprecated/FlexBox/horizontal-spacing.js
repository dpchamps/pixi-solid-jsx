"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.childWithHorizontalSpacing = void 0;
var nextRow = function (el, _index, parentBoxModel, acc) {
    var offsetX = parentBoxModel.padding + parentBoxModel.margin;
    el.container.x = 0;
    el.container.y = acc.maxY + acc.height;
    return {
        node: el,
        row: acc.row + 1,
        col: 0,
        width: el.container.width + offsetX,
        height: acc.height + acc.maxY,
        maxX: acc.maxX,
        maxY: el.container.height,
    };
};
var currentRow = function (el, _index, parentBoxModel, acc) {
    var offsetX = parentBoxModel.padding + parentBoxModel.margin;
    el.container.x = acc.width;
    el.container.y = acc.height;
    return {
        node: el,
        width: acc.width + el.container.width + offsetX,
        height: acc.height,
        row: acc.row,
        col: acc.col + 1,
        maxX: Math.max(acc.maxX, el.container.width),
        maxY: Math.max(acc.maxY, el.container.height),
    };
};
var childWithHorizontalSpacing = function (el, index, parentBoxModel, acc) {
    if (acc.width + el.container.width > parentBoxModel.width) {
        return nextRow(el, index, parentBoxModel, acc);
    }
    return currentRow(el, index, parentBoxModel, acc);
};
exports.childWithHorizontalSpacing = childWithHorizontalSpacing;
