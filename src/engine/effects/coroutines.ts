import { onNextFrame } from "../tags/Application.tsx";
import { lerp } from "../libs/Math.ts";
import { createSignal } from "solid-custom-renderer/patched-types.ts";
import {isDefined, unreachable} from "../../utility-types.ts";
import { createSynchronizedEffect, onEveryFrame } from "../core/query-fns.ts";

export type GeneratorYieldResult =
  | GeneratorStop
  | GeneratorWaitForMs
  | GeneratorWaitForFrames
  | GeneratorContinue;

type GeneratorStop = { type: "GeneratorStop" };
type GeneratorContinue = { type: "GeneratorContinue" };
type GeneratorWaitForMs = { type: "GeneratorWaitMs"; ms: number };
type GeneratorWaitForFrames = { type: "GeneratorWaitFrames"; frames: number };

export type CoroutineFn = () => Generator<GeneratorYieldResult, void|GeneratorYieldResult, number>;

export type AsyncCoroutineFn = () => AsyncGenerator<unknown, void, number>;

type TimestampState = { timeStamp: number; duration: number };

/**
 * Signals the coroutine executor to terminate the coroutine immediately.
 * Use this to cleanly exit from infinite loops or cancel animations on user interaction.
 *
 * @returns {GeneratorStop} Control instruction to stop the coroutine
 * @example
 * function* followMouse() {
 *     while(true) {
 *         sprite.x = mouse.x;
 *         if(userClickedStop()) {
 *             yield stop(); // Terminate coroutine
 *         }
 *         yield CoroutineControl.continue(); // Wait one frame
 *     }
 * }
 */
export const stop = (): GeneratorStop => ({
  type: "GeneratorStop",
});

/**
 * Pauses coroutine execution for a specified duration in milliseconds.
 * The coroutine will resume after the time has elapsed, synchronized with the next frame.
 * Note: Actual pause time is frame-aligned, so may be slightly longer than specified.
 *
 * @param {number} ms - Duration to wait in milliseconds
 * @returns {GeneratorWaitForMs} Control instruction to wait for specified milliseconds
 * @example
 * function* showNotification() {
 *     notification.visible = true;
 *     yield waitMs(3000); // Show for 3 seconds
 *     notification.visible = false;
 * }
 */
export const waitMs = (ms: number): GeneratorWaitForMs => ({
  type: "GeneratorWaitMs",
  ms,
});

/**
 * Pauses coroutine execution for an exact number of frames.
 * Use for frame-perfect timing requirements like fighting game combos or particle effects.
 * Duration depends on framerate: at 60fps, 60 frames = 1 second.
 *
 * @param {number} frames - Number of frames to wait
 * @returns {GeneratorWaitForFrames} Control instruction to wait for specified frames
 * @example
 * function* comboAttack() {
 *     performPunch();
 *     yield waitFrames(5); // Exact 5-frame window
 *     performKick();
 * }
 */
export const waitFrames = (frames: number): GeneratorWaitForFrames => ({
  type: "GeneratorWaitFrames",
  frames,
});

/**
 * Signals the coroutine to continue execution and proceed to the next frame.
 * Returns the elapsed time in milliseconds since the last frame when yielded.
 * You must explicitly yield this (or another control instruction) to continue -
 * bare yields are no longer supported.
 *
 * @returns {GeneratorContinue} Control instruction to continue to next frame
 * @example
 * function* smoothAnimation() {
 *     let elapsed = 0;
 *     while(elapsed < 1000) {
 *         // Must explicitly continue to get elapsed time
 *         const deltaMs = yield generatorContinue();
 *         elapsed += deltaMs;
 *         sprite.x += (deltaMs / 1000) * 100; // Move 100px per second
 *     }
 * }
 */
export const generatorContinue = (): GeneratorContinue => ({
  type: "GeneratorContinue",
});

/**
 * Namespace object containing all coroutine control functions.
 * Provides a convenient way to access control instructions with dotted syntax.
 *
 * @example
 * function* animation() {
 *     sprite.x += 10;
 *     yield CoroutineControl.continue();
 *
 *     yield CoroutineControl.waitMs(500);
 *
 *     sprite.x += 10;
 *     yield CoroutineControl.waitFrames(30);
 *
 *     yield CoroutineControl.stop();
 * }
 */
export const CoroutineControl = {
  waitMs,
  waitFrames,
  stop,
  continue: generatorContinue,
};

/**
 * Checks if a time-based wait state has completed by comparing elapsed time against duration.
 * Called every frame to determine if a `waitMs()` pause has finished.
 *
 * @param {TimestampState | null} state - Current timestamp state or null if not waiting
 * @param elapsedMsSinceLastFrame {number}
 * @returns {TimestampState | null} Returns null when wait is complete, otherwise returns the state
 * @private
 */
const getNextTimeStampState = (
  state: TimestampState | null,
  elapsedMsSinceLastFrame: number,
): TimestampState | null => {
  if (state === null) return state;
  state.timeStamp += elapsedMsSinceLastFrame;
  if (state.timeStamp >= state.duration) return null;
  return state;
};

/**
 * Creates initial state for a millisecond-based wait operation.
 * Captures the current timestamp to track elapsed time.
 *
 * @param {number} duration - Duration to wait in milliseconds
 * @returns {TimestampState} State object with start timestamp and duration
 * @private
 */
const initializeTimeStampState = (duration: number): TimestampState => ({
  duration,
  timeStamp: 0,
});

/**
 * Decrements the frame counter for frame-based waits.
 * Called every frame to count down `waitFrames()` operations.
 *
 * @param {number | null} frames - Current frame count or null if not waiting
 * @returns {number | null} Returns null when counter reaches 0, otherwise returns decremented count
 * @private
 */
const getNextCounterState = (frames: number | null) =>
  frames === null || frames === 0 ? null : frames - 1;

/**
 * Creates initial state for a frame-based wait operation.
 * Returns frames-1 to account for the decrement that happens before the waiting check.
 *
 * @param {number} frames - Number of frames to wait
 * @returns {number} The frame count minus 1
 * @private
 */
const initializeCounterState = (frames: number) => frames - 1;

/**
 * Determines if the coroutine is currently in any waiting state.
 * Used to skip generator execution while waiting for time or frames.
 *
 * @param {TimestampState | null} timeStampState - Current time-based wait state
 * @param {number | null} counterState - Current frame-based wait state
 * @returns {boolean} True if any wait is active, false if ready to execute
 * @private
 */
const isInWaitingState = (
  timeStampState: TimestampState | null,
  counterState: number | null,
) => timeStampState !== null || counterState !== null;

/**
 * Factory function that creates a stateful coroutine wait manager.
 * Encapsulates both time-based and frame-based wait state tracking.
 * Used internally by startCoroutine to manage wait operations.
 *
 * @returns {Object} State manager with methods for wait control:
 *   - waitMs: Initializes a millisecond-based wait
 *   - waitFrames: Initializes a frame-based wait
 *   - isWaitingOnNextTick: Updates and checks if any wait is active
 * @private
 */
const createCoroutineState = () => {
  let timeStampState: TimestampState | null = null;
  let frameCounter: number | null = null;
  return {
    waitMs: (ms: number) => {
      timeStampState = initializeTimeStampState(ms);
    },
    waitFrames: (frames: number) => {
      frameCounter = initializeCounterState(frames);
    },
    isWaitingOnNextTick: (elapsedMsSinceLastFrame: number) => {
      timeStampState = getNextTimeStampState(
        timeStampState,
        elapsedMsSinceLastFrame,
      );
      frameCounter = getNextCounterState(frameCounter);
      return isInWaitingState(timeStampState, frameCounter);
    },
  };
};

/**
 * Starts a frame-synchronized coroutine that executes a generator function over multiple frames.
 * The coroutine automatically handles timing, frame synchronization, and wait states.
 *
 * **When to use:**
 * - Complex sequential animations that span multiple frames
 * - Game entity behaviors and AI state machines
 * - Any logic requiring local state preservation across frames
 * - Movement patterns, attack sequences, cutscenes
 *
 * **How it works:**
 * 1. Executes generator function one yield at a time
 * 2. Each frame, passes elapsed milliseconds since last frame to generator
 * 3. Handles wait instructions (waitMs, waitFrames, stop)
 * 4. Continues until generator completes or explicitly stopped
 *
 *
 * @param {CoroutineFn} fn - Generator function to execute. Receives elapsed ms as input on each yield.
 * @returns {{dispose: () => void, stopped: Accessor<boolean>}} Object with disposal function and stopped signal
 *
 * @example
 * // Simple movement coroutine
 * const moveRight = function* () {
 *     for(let i = 0; i < 100; i++) {
 *         sprite.x += 2;
 *         yield CoroutineControl.continue(); // Wait one frame
 *     }
 * };
 * const {dispose} = startCoroutine(moveRight);
 *
 * @example
 * // Complex animation sequence with timing
 * function* attackSequence() {
 *     // Wind up
 *     yield* chargeAnimation();
 *     yield waitMs(500);
 *
 *     // Attack
 *     performAttack();
 *     yield waitFrames(5); // Frame-perfect timing
 *
 *     // Recovery
 *     yield waitMs(1000);
 * }
 *
 * @example
 * // Using elapsed time for smooth movement
 * function* smoothMove() {
 *     let totalTime = 0;
 *     while(totalTime < 2000) {
 *         const elapsed = yield CoroutineControl.continue(); // Get elapsed ms
 *         sprite.x += (100 * elapsed) / 1000; // Move 100px per second
 *         totalTime += elapsed;
 *     }
 * }
 *
 * @example
 * // Cleanup on component unmount
 * const Component = () => {
 *     const {dispose, stopped} = startCoroutine(myCoroutine);
 *
 *     onCleanup(() => {
 *         dispose(); // Prevent memory leak
 *     });
 *
 *     createEffect(() => {
 *         if(stopped()) {
 *             console.log("Animation complete");
 *         }
 *     });
 * }
 */
export const startCoroutine = (fn: CoroutineFn) => {
  const iterator = fn();
  const coroutineState = createCoroutineState();
  const [stopped, setStopped] = createSignal(false);

  const onCoroutineDone = () => {
    setStopped(true);
    dispose();
  };

  const dispose = onEveryFrame((time) => {
    if (coroutineState.isWaitingOnNextTick(time.elapsedMS)) return;

    const result = iterator.next(time.elapsedMS);

    if (result.done) return onCoroutineDone();

    switch (result.value.type) {
      case "GeneratorContinue":
        return;
      case "GeneratorStop":
        return onCoroutineDone();
      case "GeneratorWaitMs":
        return coroutineState.waitMs(result.value.ms);
      case "GeneratorWaitFrames":
        return coroutineState.waitFrames(Math.max(result.value.frames, 1));
      default:
        return unreachable(result.value);
    }
  });

  return { dispose, stopped };
};

type CoroutineEasingFunction = (
    onStepCallback: (fn: (a: number, b: number) => number) => void,
    easingFn: (x: number) => number,
    duration: number,
) => CoroutineFn;

/**
 * Creates a specialized coroutine for smooth, eased animations over a fixed duration.
 * Provides a lerp function with pre-applied easing to animate any numeric properties.
 *
 * **When to use:**
 * - Smooth transitions between two values (position, scale, opacity, etc.)
 * - UI animations with acceleration/deceleration curves
 * - Camera movements with cinematic easing
 * - Any property animation requiring non-linear interpolation
 *
 * **How it works:**
 * 1. Runs for exactly the specified duration in milliseconds
 * 2. Each frame, calculates progress percentage (0 to 1)
 * 3. Applies easing function to the percentage
 * 4. Provides a lerp function that uses the eased percentage
 * 5. Callback can use this lerp to interpolate any values
 * 6. Yields elapsed time back to accumulate for next frame's progress calculation
 *
 * @param {Function} cb - Callback that receives a lerp function. Called once per frame.
 *                        The lerp function signature: (start, end) => number
 * @param {Function} easingFn - Easing function that takes progress (0-1) and returns eased value (0-1)
 * @param {number} duration - Total animation duration in milliseconds
 * @returns {CoroutineFn} Generator function ready to be passed to startCoroutine
 *
 * @example
 * // Simple position animation with ease-in-out
 * const moveToTarget = createEasingCoroutine(
 *     (lerp) => {
 *         sprite.x = lerp(startX, targetX);
 *         sprite.y = lerp(startY, targetY);
 *     },
 *     easeInOut,  // Slow start and end
 *     1000        // 1 second duration
 * );
 * const {dispose} = startCoroutine(moveToTarget);
 *
 * @example
 * // Complex multi-property animation
 * const explodeEffect = createEasingCoroutine(
 *     (lerp) => {
 *         sprite.scale.x = lerp(1, 3);      // Grow 3x
 *         sprite.scale.y = lerp(1, 3);
 *         sprite.alpha = lerp(1, 0);        // Fade out
 *         sprite.rotation = lerp(0, Math.PI * 2); // Full rotation
 *     },
 *     circularIn,  // Accelerating curve
 *     500          // Half second
 * );
 *
 * @example
 * // Custom easing function
 * const bounce = (t) => {
 *     if (t < 0.5) return 4 * t * t * t;
 *     const p = 2 * t - 2;
 *     return 1 + p * p * p / 2;
 * };
 *
 * const bounceAnimation = createEasingCoroutine(
 *     (lerp) => {
 *         enemy.y = lerp(groundY, groundY - 100);
 *     },
 *     bounce,
 *     750
 * );
 *
 * @example
 * // Chaining easing coroutines
 * function* complexSequence() {
 *     // Move to position
 *     yield* createEasingCoroutine(
 *         (lerp) => sprite.x = lerp(0, 400),
 *         easeOut,
 *         1000
 *     )();
 *
 *     // Then scale up
 *     yield* createEasingCoroutine(
 *         (lerp) => sprite.scale.x = sprite.scale.y = lerp(1, 2),
 *         elasticIn(1),
 *         500
 *     )();
 * }
 */
export const createEasingCoroutine: CoroutineEasingFunction = (
  cb: (fn: (a: number, b: number) => number) => void,
  easingFn: (x: number) => number,
  duration: number,
): CoroutineFn => {
  return function* () {
    let elapsed = 0;
    while (true) {
      const progress = duration === 0 ? 1 : Math.min(elapsed / duration, 1);
      cb((a, b) => lerp(a, b, easingFn(progress)));
      if (elapsed >= duration) break;
      elapsed += yield CoroutineControl.continue();
    }
  };
};

/**
 * Creates a coroutine that automatically repeats when it completes.
 * Each iteration creates a fresh coroutine instance, allowing for clean state resets.
 * The repeatable coroutine transparently propagates control instructions to its executor.
 *
 * **When to use:**
 * - Looping behaviors like enemy patrols or idle animations
 * - Repeating effects like pulsing UI elements or particle emitters
 * - State machines that cycle through states indefinitely
 * - Any animation or behavior that should restart after completion
 *
 * **How it works:**
 * 1. Calls the constructor to create a new coroutine instance
 * 2. Executes the coroutine to completion using yield*
 * 3. If the coroutine returns a control instruction, propagates it to the outer executor
 * 4. If no control instruction returned, immediately starts next iteration
 * 5. Stops only when inner coroutine explicitly returns stop() or another control instruction
 *
 * @param {() => CoroutineFn} constructor - Factory function that creates a fresh coroutine instance for each iteration
 * @returns {CoroutineFn} A repeating coroutine generator function
 *
 * @example
 * // Simple repeating patrol
 * const enemyPatrol = createRepeatableCoroutine(() => function*() {
 *     yield* moveToPosition(pointA);
 *     yield waitMs(1000);
 *     yield* moveToPosition(pointB);
 *     yield waitMs(1000);
 *     // Automatically repeats from pointA
 * });
 * startCoroutine(enemyPatrol);
 *
 * @example
 * // Stop after condition is met
 * const attackLoop = createRepeatableCoroutine(() => function*() {
 *     yield* playAttackAnimation();
 *     dealDamage();
 *
 *     if(enemy.health <= 0) {
 *         return CoroutineControl.stop(); // Breaks the repeat loop
 *     }
 *
 *     yield waitMs(500); // Delay between attacks
 * });
 *
 * @example
 * // Pulsing UI element
 * const pulse = createRepeatableCoroutine(() => createEasingCoroutine(
 *     (lerp) => {
 *         button.scale.x = button.scale.y = lerp(1, 1.2);
 *     },
 *     easeInOut,
 *     800
 * ));
 *
 * @example
 * // Controlling from outside
 * const {dispose, stopped} = startCoroutine(
 *     createRepeatableCoroutine(() => function*() {
 *         sprite.rotation += 0.1;
 *         yield CoroutineControl.continue();
 *     })
 * );
 *
 * // Later: stop the infinite rotation
 * dispose();
 */
export const createRepeatableCoroutine = (constructor: () => CoroutineFn): CoroutineFn => function*() {
  while(true){
    const iterator = constructor();
    const result = yield * iterator();

    if(result) yield result;
  }
}
