import { SpacingFn } from "./types.ts";

export const childWithVerticalSpacing: SpacingFn = (
  el,
  index,
  parentBoxModel,
  acc,
) => {
  const offset = parentBoxModel.padding + parentBoxModel.margin;

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
