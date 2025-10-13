import {
  batch,
  createSignal,
  createStore,
  onCleanup,
} from "solid-custom-renderer/patched-types.ts";
import { Ticker } from "pixi.js";
import { Maybe } from "../../utility-types.ts";

export type Timer = ReturnType<typeof createTimer>;

type CreateTimerArgs = {
  nextFrameFns: {
    forEach: (cb: (value: () => void) => void) => void;
    clear: () => void;
  };
  createTicker?: Maybe<() => Ticker>;
};

export const createTicker = () => {
  const ticker = new Ticker();
  ticker.maxFPS = 60;
  ticker.minFPS = 30;
  ticker.autoStart = false;

  return ticker;
};

export const createTimer = (args: CreateTimerArgs) => {
  // we want to ensure that each are updated regardless of value.
  // this needs to accurately represent a single tick
  const [deltaTime, setDeltaTime] = createSignal(1, { equals: false });
  const [currentFps, setCurrentFps] = createSignal(0, { equals: false });
  const [elapsedMsSinceLastFrame, setElapsedMsSinceLastFrame] = createSignal(
    0,
    { equals: false },
  );

  function frameTick(ticker: Ticker) {
    batch(() => {
      setDeltaTime(ticker.deltaTime);
      setCurrentFps(ticker.FPS);
      setElapsedMsSinceLastFrame(ticker.elapsedMS);

      args.nextFrameFns.forEach((x) => x());
    });
  }

  const ticker = args.createTicker ? args.createTicker() : createTicker();

  ticker.add(frameTick);
  onCleanup(() => ticker.remove(frameTick));

  return {
    time: {
      deltaTime: () => deltaTime(),
      fps: () => currentFps(),
      elapsedMsSinceLastFrame: () => elapsedMsSinceLastFrame(),
    },
    start: () => {
      ticker.start();
      ticker.lastTime = performance.now();
    },
    ticker,
  };
};
