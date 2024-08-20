import {batch, createStore, onCleanup} from "solid-custom-renderer/patched-types.ts";
import {Ticker} from "pixi.js";

export type Timer = ReturnType<typeof createTimer>;

type CreateTimerArgs = {
    nextFrameFns: {
        forEach: (cb: (value: () => void ) => void) => void
    }
}

export const createTicker = () => {
    const ticker = new Ticker();
    ticker.maxFPS = 60;
    ticker.minFPS = 30;

    return ticker;
}

export const createTimer = (args: CreateTimerArgs) => {
    const [timerData, setTimerData] = createStore({
        deltaTime: 1,
        currentFps: 0,
        elapsedMsSinceLastFrame: 0
    });

    function frameTick(ticker: Ticker){
        batch(() => {
            setTimerData({
                deltaTime: ticker.deltaTime,
                currentFps: ticker.FPS,
                elapsedMsSinceLastFrame: ticker.elapsedMS
            });
            args.nextFrameFns.forEach((x) => x());
        })
    }

    const ticker = createTicker();

    ticker.add(frameTick);
    onCleanup(() => ticker.remove(frameTick))
    ticker.start();

    return {
        time: {
            deltaTime: () => timerData.deltaTime,
            fps: () => timerData.currentFps,
            elapsedMsSinceLastFrame: () => timerData.elapsedMsSinceLastFrame
        }
    }
}