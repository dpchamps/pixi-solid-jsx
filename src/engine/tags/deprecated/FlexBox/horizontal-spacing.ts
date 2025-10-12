import { SpacingFn } from "./types.ts";

const nextRow: SpacingFn = (el, _index, parentBoxModel, acc) => {
  const offsetX = parentBoxModel.padding + parentBoxModel.margin;

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

const currentRow: SpacingFn = (el, _index, parentBoxModel, acc) => {
  const offsetX = parentBoxModel.padding + parentBoxModel.margin;

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

export const childWithHorizontalSpacing: SpacingFn = (
  el,
  index,
  parentBoxModel,
  acc,
) => {
  if (acc.width + el.container.width > parentBoxModel.width) {
    return nextRow(el, index, parentBoxModel, acc);
  }

  return currentRow(el, index, parentBoxModel, acc);
};
