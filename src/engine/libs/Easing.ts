import {lerp} from "./Math.ts";

export const easeIn = (t: number) => t * t;

export const flip = (t: number) => 1 - t;

export const easeOut = (t: number) => flip(easeIn(flip(t)))

export const easeInOut = (t: number) =>
    lerp(easeIn(t), easeOut(t), t)

export const circularIn = (t: number) =>
    1-Math.sqrt(1-easeIn(t));

export const elasticIn = (magnitude: number) => (t: number) => {
    if(t === 0) return 0;
    if(t === 1) return 1;
    return (
        -Math.pow(2, magnitude*(t-=1)) *Math.sin((t-0.1)*(2*Math.PI)/0.4)
    )
}