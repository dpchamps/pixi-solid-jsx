import { onEveryFrame } from "../core/query-fns.js";

export const createInterval = (fn: () => void, ms: number) => {
  let current = ms;
  return onEveryFrame((ticker) => {
    current -= ticker.elapsedMS;
    if (current <= 0) {
      fn();
      current = ms;
    }
  });
};

export const createTimeout = (fn: () => void, ms: number) => {
  const dispose = createInterval(() => {
    fn();
    dispose();
  }, ms);

  return dispose;
};
