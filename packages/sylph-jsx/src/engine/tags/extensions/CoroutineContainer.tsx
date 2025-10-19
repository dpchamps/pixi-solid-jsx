import { Accessor, createSignal, onCleanup } from "solid-js";
import { JSX } from "../../../pixi-jsx/jsx/jsx-runtime.ts";
import {
  chainCoroutine,
  createEasingCoroutine,
  createRepeatableCoroutine,
  startCoroutine,
  waitMsCoroutine,
} from "../../effects/coroutines.ts";
import { createSynchronizedEffect } from "../../core/query-fns.ts";

type CoroutineContainerProps<T extends JSX.Element> = {
  duration: number;
  easingFn: (n: number) => number;
  from: number;
  to: number;
  delay?: number;
  shouldStart?: boolean;
  replay?: boolean;
  children: (value: Accessor<number>, done: Accessor<boolean>) => T;
};

export const CoroutineContainer = <T extends JSX.Element>(
  props: CoroutineContainerProps<T>,
) => {
  const [getNext, setNext] = createSignal(props.from);
  const shouldStart = () =>
    typeof props.shouldStart === "undefined" ? true : props.shouldStart;
  const baseCoroutineConstructor = () =>
    chainCoroutine(
      waitMsCoroutine(props.delay || 0),
      createEasingCoroutine(
        (fn) => setNext(fn(props.from, props.to)),
        props.easingFn,
        props.duration,
      ),
    );
  const baseCoroutine = props.replay
    ? createRepeatableCoroutine(baseCoroutineConstructor)
    : baseCoroutineConstructor();
  const scheduledCoroutine = startCoroutine(baseCoroutine, false);

  createSynchronizedEffect(shouldStart, (shouldStart) => {
    return shouldStart
      ? scheduledCoroutine.resume()
      : scheduledCoroutine.pause();
  });

  onCleanup(() => {
    scheduledCoroutine.dispose();
  });

  return () =>
    props.children(getNext, scheduledCoroutine.stopped || (() => false));
};
