import { Maybe } from "../../utility-types.js";

export type Point = {
  x: number;
  y: number;
};

export const equal = (a: Maybe<Point>, b: Maybe<Point>) =>
  a?.x === b?.x && a?.y === b?.y;

export const euclideanDistance = (a: Point, b: Point) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
};
