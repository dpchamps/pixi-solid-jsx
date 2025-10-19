import {
  batch,
  createSignal,
  onCleanup,
} from "solid-custom-renderer/patched-types.ts";
import { Ticker } from "pixi.js";
import { Maybe } from "../../utility-types.ts";

type CreateTimerArgs = {
  nextFrameFns: {
    forEach: (cb: (value: (ticker: Ticker) => void) => void) => void;
    clear: () => void;
    size: number;
    values: () => IterableIterator<(ticker: Ticker) => void>;
  };
  createTicker?: Maybe<() => Ticker>;
};

export const createTicker = () => {
  const ticker = new Ticker();
  ticker.minFPS = 30;
  ticker.autoStart = false;

  return ticker;
};

// TODO: this should be computed based off of timer on the fly, rather than assuming 60fps
const FRAME_BUDGET = 16.6;

export const createTimer = (args: CreateTimerArgs) => {
  const [frameCount, setFrameCount] = createSignal(0);

  function frameTick(ticker: Ticker) {
    // TODO: performance.now is making tests flaky in CI.
    //  Either bind this to the ticker, or use fake timers in tests
    const frameStart = performance.now();
    setFrameCount((last) => last + 1);

    /**
     * Reactive Effect Cascade Processing
     *
     * Effects can trigger signal updates that schedule additional effects.
     * Without this loop, each dependency layer would execute on separate frames,
     * creating multi-frame input latency (e.g. input → state → render = 3 frames).
     *
     * By repeatedly flushing scheduled effects within a frame budget, all reactive
     * layers collapse into a single frame:
     *
     * Frame N:
     *   1. setFrameCount triggers all subscribed effects
     *   2. Effects run → set signals → schedule new effects
     *   3. Loop continues, executing newly scheduled effects
     *   4. Repeat until no effects remain or budget exhausted
     *
     * Effects exceeding budget defer to next frame.
     */
    while (
      args.nextFrameFns.size &&
      performance.now() - frameStart < FRAME_BUDGET
    ) {
      const next = Array.from(args.nextFrameFns.values());
      args.nextFrameFns.clear();

      batch(() => {
        next.forEach((x) => x(ticker));
      });
    }
  }

  const ticker = args.createTicker ? args.createTicker() : createTicker();

  ticker.add(frameTick);
  onCleanup(() => ticker.remove(frameTick));

  return {
    frameCount,
    ticker,
  };
};
