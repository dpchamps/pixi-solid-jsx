import {Maybe} from "../../utility-types.ts";

export type Point = {
    x: number,
    y: number
}

export const equal = (a: Maybe<Point>, b: Maybe<Point>) => a?.x === b?.x && a?.y === b?.y;