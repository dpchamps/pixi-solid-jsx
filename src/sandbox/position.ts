import {EntityProps} from "./Entity.tsx";

export const overlaps = (a: EntityProps, b: EntityProps) => {
    return a.x+a.width >= b.x && a.x <= b.x+b.width && a.y+a.height >= b.y && a.y <= b.y+b.height
}