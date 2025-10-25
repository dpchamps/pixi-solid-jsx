import { Accessor, createSignal, onCleanup, Setter } from "solid-js";
import { JSX, JSXNode } from "../../../pixi-jsx/jsx/jsx-runtime.js";
import {
  chainCoroutine,
  createEasingCoroutine,
  createRepeatableCoroutine,
  startCoroutine,
  waitMsCoroutine,
} from "../../effects/coroutines.js";
import { createSynchronizedEffect } from "../../core/query-fns.js";
import { flip } from "../../libs/Easing.js";

/**
 * Props for the EasingCoroutine component.
 *
 * @template T - The JSX element type returned by the children render function
 */
type EasingCoroutineProps<T extends JSX.Element> = {
  /** Animation duration in milliseconds */
  duration: number;
  /** Easing function that maps linear progress (0-1) to eased progress (0-1) */
  easingFn: (n: number) => number;
  /** Starting numeric value */
  from: number;
  /** Ending numeric value */
  to: number;
  /** Optional delay before animation starts (milliseconds). Default: 0 */
  delay?: number;
  /** Controls if animation should be running. Default: true */
  shouldStart?: boolean;
  /** If true, animation loops indefinitely. Default: false */
  replay?: boolean;
  /** If true, plays forward then backward using flipped easing. Default: false */
  reverse?: boolean;
  /** Render function receiving (currentValue, isDone) accessors */
  children: (value: Accessor<number>, done: Accessor<boolean>) => T;
};

/**
 * Creates a coroutine constructor function for the easing animation.
 * Handles both forward-only and forward-reverse animation patterns.
 *
 * @param props - Component props containing animation parameters
 * @param setCurrentValue - Setter function to update the animated value
 * @returns A function that creates and returns a coroutine
 */
const createBaseCoroutineConstructor = (
  props: EasingCoroutineProps<JSXNode>,
  setCurrentValue: Setter<number>,
) => {
  const delay = props.delay ?? 0;

  const forwardEasing = createEasingCoroutine(
    (fn) => setCurrentValue(fn(props.from, props.to)),
    props.easingFn,
    props.duration,
  );

  if (!props.reverse) {
    return () => chainCoroutine(waitMsCoroutine(delay), forwardEasing);
  }

  const reverseEasing = createEasingCoroutine(
    (fn) => setCurrentValue(fn(props.from, props.to)),
    (x) => flip(props.easingFn(x)),
    props.duration,
  );

  return () =>
    chainCoroutine(waitMsCoroutine(delay), forwardEasing, reverseEasing);
};

/**
 * A render-prop component that provides eased animation values over time using coroutines.
 *
 * This component manages a coroutine-based animation that interpolates between two numeric values
 * using a specified easing function. It provides reactive accessors for the current value and
 * completion status through a children render function.
 *
 * **Key Features:**
 * - Frame-synchronized animations using the coroutine system
 * - Support for any easing function (from Easing.ts or custom)
 * - Optional delay before animation starts
 * - Pause/resume control via `shouldStart` prop
 * - Looping animations with `replay` prop
 * - Bidirectional animations with `reverse` prop
 * - Automatic cleanup on unmount
 *
 * **Reverse Animation Behavior:**
 * When `reverse: true`, the animation plays forward (from → to) then backward.
 * The backward animation uses the same `from` and `to` values but applies a flipped
 * easing function to create the reverse motion effect.
 *
 * @template T - The JSX element type returned by the children render function
 * @param props - Component configuration
 * @returns A render function that calls props.children with current animation state
 *
 * @example
 * // Simple position animation
 * <EasingCoroutine
 *   from={0}
 *   to={100}
 *   duration={1000}
 *   easingFn={easeInOut}
 * >
 *   {(value, done) => (
 *     <Sprite x={value()} alpha={done() ? 0.5 : 1} />
 *   )}
 * </EasingCoroutine>
 *
 * @example
 * // Looping pulse animation with delay
 * <EasingCoroutine
 *   from={1}
 *   to={1.5}
 *   duration={800}
 *   delay={200}
 *   easingFn={easeInOut}
 *   replay={true}
 *   reverse={true}
 * >
 *   {(scale) => <Sprite scale={scale()} />}
 * </EasingCoroutine>
 *
 * @example
 * // Controlled animation with pause/resume
 * const [isPaused, setIsPaused] = createSignal(false);
 *
 * <EasingCoroutine
 *   from={0}
 *   to={360}
 *   duration={2000}
 *   easingFn={linear}
 *   shouldStart={!isPaused()}
 * >
 *   {(rotation) => <Sprite rotation={rotation() * (Math.PI / 180)} />}
 * </EasingCoroutine>
 */
export const EasingCoroutine = <T extends JSX.Element>(
  props: EasingCoroutineProps<T>,
) => {
  const [currentValue, setCurrentValue] = createSignal(props.from);
  const shouldStart = () => props.shouldStart ?? true;
  const baseCoroutineConstructor = createBaseCoroutineConstructor(
    props,
    setCurrentValue,
  );
  const baseCoroutine = props.replay
    ? createRepeatableCoroutine(baseCoroutineConstructor)
    : baseCoroutineConstructor();

  const scheduledCoroutine = startCoroutine(baseCoroutine, !shouldStart());

  createSynchronizedEffect(shouldStart, (shouldStart) => {
    return shouldStart
      ? scheduledCoroutine.resume()
      : scheduledCoroutine.pause();
  });

  onCleanup(() => {
    scheduledCoroutine.dispose();
  });

  return () => props.children(currentValue, scheduledCoroutine.stopped);
};
