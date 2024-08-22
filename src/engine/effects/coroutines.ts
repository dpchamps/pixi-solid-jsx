import {onNextFrame} from "../tags/Application.tsx";
import {lerp} from "../libs/Math.ts";
import {createSignal} from "solid-custom-renderer/patched-types.ts";

export type GeneratorYieldResult =
    | GeneratorStop
    | GeneratorWaitForMs
    | GeneratorWaitForFrames

type GeneratorStop = {type: "GeneratorStop"};
type GeneratorWaitForMs = {type: "GeneratorWaitMs", ms: number};
type GeneratorWaitForFrames = {type: "GeneratorWaitFrames", frames: number};

export type CoroutineFn = () => Generator<GeneratorYieldResult|undefined, void, number>;

type TimestampState = { timeStamp: number, duration: number };

export const stop = (): GeneratorStop => ({
    type: "GeneratorStop"
});

export const waitMs = (ms: number): GeneratorWaitForMs => ({
    type: "GeneratorWaitMs",
    ms
});

export const waitFrames = (frames: number): GeneratorWaitForFrames => ({
    type: "GeneratorWaitFrames",
    frames
});

const getNextTimeStampState = (state: TimestampState | null): TimestampState|null => {
    if(state === null) return state;
    const elapsedTime = performance.now() - state.timeStamp;
    if(elapsedTime >= state.duration) return null;
    return state;
}

const initializeTimeStampState = (duration: number): TimestampState => ({
    duration,
    timeStamp: performance.now()
});

const getNextCounterState = (frames: number|null) =>
    frames === null || frames === 0
        ? null
        : frames-1;

const initializeCounterState = (frames: number) => frames;

const isInWaitingState = (timeStampState: TimestampState|null, counterState: number|null) =>
    timeStampState !== null || counterState !== null;

export const startCoroutine = (fn: CoroutineFn) => {
    const iterator = fn();
    let timeStampState: TimestampState|null = null;
    let counter: number|null = null;
    let [stopped, setStopped] = createSignal(false);
    const onCoroutineDone = () => {
        setStopped(true);
        dispose();
    }

    const dispose = onNextFrame({
        query: (applicationState) => {
            return applicationState.time.elapsedMsSinceLastFrame()
        },
        tick: (elapsedMs) => {
            timeStampState = getNextTimeStampState(timeStampState);
            counter = getNextCounterState(counter);
            if(isInWaitingState(timeStampState, counter)) return;

            const result = iterator.next(elapsedMs);

            if(result.done || !result.value){
                result.done && onCoroutineDone();
                return
            }

            switch(result.value.type){
                case "GeneratorStop": {
                    onCoroutineDone();
                    break;
                }
                case "GeneratorWaitMs":{
                    timeStampState = initializeTimeStampState(result.value.ms);
                    break;
                }
                case "GeneratorWaitFrames": {
                    counter = initializeCounterState(result.value.frames);
                    break;
                }
            }
        }
    })

    return {dispose, stopped};
}

/**
 * Creates a coroutine that is specialized for easing functions
 *
 * @param cb
 * @param easingFn
 * @param duration
 */
export const createEasingCoroutine = (
    cb: (fn: (a: number, b: number) => number) => void,
    easingFn: (x: number) => number,
    duration: number
): CoroutineFn => {

    return function* (){
        let elapsed = 0;
        while(elapsed <= duration){
            cb((a: number, b: number) => lerp(a, b, easingFn(elapsed/duration)));
            const elapsedSinceLastFrame = yield;
            elapsed += elapsedSinceLastFrame;
            yield waitFrames(1);
        }
    }
}