import {onNextFrame} from "../tags/Application.tsx";

export const createInterval = (fn: () => void, ms: number) => {
    let current = ms;
    return onNextFrame({
        query: (applicationState) => {
            return applicationState.time.elapsedMsSinceLastFrame();
        },
        tick: (elapsed) => {
            current -= elapsed;
            if(current <=0 ){
                fn()
                current = ms;
            }
        }
    });
}

export const createTimeout = (fn: () => void, ms: number) => {
    const dispose = createInterval(() => {
        fn();
        dispose();
    }, ms)

    return dispose;
}
