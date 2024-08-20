import {onNextFrame} from "../tags/Application.tsx";

export type GeneratorYieldResult =
    | GeneratorStop
    | GeneratorWaitForMs
    | GeneratorWaitForFrames

type GeneratorStop = {type: "GeneratorStop"};
type GeneratorWaitForMs = {type: "GeneratorWaitMs", ms: number};
type GeneratorWaitForFrames = {type: "GeneratorWaitFrames", frames: number};

type CoroutineFn = () => Generator<GeneratorYieldResult|undefined, void, never>;

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

export const createCoroutine = (fn: CoroutineFn) => {
    const iterator = fn();
    let timeStampState: TimestampState|null = null;
    let counter: number|null = null;

    const dispose = onNextFrame({
        query: (applicationState) => {
            return applicationState.time.deltaTime()
        },
        tick: () => {
            timeStampState = getNextTimeStampState(timeStampState);
            counter = getNextCounterState(counter);
            if(isInWaitingState(timeStampState, counter)) return;

            const result = iterator.next();

            if(result.done || !result.value){
                result.done && dispose();
                return
            }

            switch(result.value.type){
                case "GeneratorStop": {
                    dispose();
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

    return dispose;
}


export const easingFunctionCoroutine = (fn: () => Generator, steps: number, easingFunction: (x: number) => number) => {
    const iterator = fn();
    let ease = 1;
    let counter = 0;

    const dispose = onNextFrame({
        query: (applicationState) => {
            return applicationState.time.deltaTime()
        },
        tick: () => {
            if(counter === steps){
                dispose();
                return;
            }

            if((counter++)%ease === 0){
                const result = iterator.next();
                ease = easingFunction(ease)
                console.log("ease", ease)
                if(result.done){
                    dispose();
                }
            }
        }
    })

    return dispose;
}
