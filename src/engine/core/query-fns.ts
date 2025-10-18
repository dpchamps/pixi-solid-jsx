import {
  createComputed,
  createRoot,
  getOwner,
  onCleanup,
  runWithOwner,
  createUniqueId
} from "solid-custom-renderer/index.ts";
import { useGameLoopContext } from "./game-loop-context.ts";
import { Ticker } from "pixi.js";
import { Accessor } from "solid-js";

export type OnNextFrameQuery<QueryResult> = {
  id: string;
  query: (frameCount: Accessor<number>) => QueryResult;
  effect: (queryResult: QueryResult, ticker: Ticker) => void;
};

/**
 * Creates a reactive effect that executes on the next game loop frame.
 *
 * Core primitive for synchronizing SolidJS reactivity with the PixiJS game loop.
 * Separates reactive dependency tracking (query phase) from execution (effect phase).
 *
 * @internal
 *
 * ## Execution phases:
 * 1. **Query**: Tracks reactive dependencies via `frameCount`. Reruns on dependency changes.
 * 2. **Schedule**: Adds effect to next tick queue.
 * 3. **Effect**: Executes with query result and current frame's ticker.
 * 4. **Cleanup**: Self-removes from tick queue.
 *
 * ## Timing correctness:
 * - Query phase: Tracks frame changes only (no timing calculations)
 * - Effect phase: Receives current ticker for accurate frame timing
 *
 * ## Disposal:
 * - `cancel`: Reactive cancellation signal
 * - `dispose`: Cleans up root scope
 * - `onCleanup`: Removes from tick queue on component cleanup
 *
 * @param args - Query and effect functions
 * @param args.query - Tracks reactive state changes. Receives frameCount accessor.
 * @param args.effect - Executes on next frame. Receives query result and current ticker.
 * @returns Disposal function
 */
function createEffectOnNextFrame<QueryResult>(
  args: OnNextFrameQuery<QueryResult>,
) {
  const gameLoopContext = useGameLoopContext();
  let dispose = () => {};
  // Create a new root here to lift the dispose function up
  // It's desirable to allow for the caller to dispose this context
  // manually.
  // Effectively, this disposal is a `cancelNextFrame`
  createRoot((_dispose) => {
    dispose = _dispose;
    createComputed(() => {
      // Initially, I'd suspected that it might be possible for dispose to have been
      // before this `createComputed callback is fired.
      // However, after studying the solid code, I've convinced myself it's not possible
      // Therefore, we do not need to preemptively check to see if it's already been disposed before scheduling
      const queryResult = args.query(gameLoopContext.frameCount);
      const execution = (ticker: Ticker) => args.effect(queryResult, ticker);
      gameLoopContext.scheduledEffects.set(args.id, execution);
      onCleanup(() => {
        gameLoopContext.scheduledEffects.delete(args.id);
      });
    });
  });

  // Wire the lifted dispose function into the cleanup
  // of the owner context, so we don't leave these roots dangling.
  // The consequences of this would be effects left in the
  // scheduler for one scheduled frame longer than
  // expected
  onCleanup(dispose);

  return dispose;
}

/**
 * Creates a frame-synchronized reactive effect.
 *
 * Primary API for synchronizing reactive state with the game loop.
 *
 * ## Key features:
 * - Query phase tracks reactive dependencies
 * - Effect phase executes on next frame with current ticker
 * - Preserves component ownership across frame boundaries
 *
 * ## Query function:
 * Accesses reactive state to determine when effects should re-run.
 * Cannot perform timing calculations - reactive dependencies only.
 *
 * ## Effect function:
 * Receives the queried value and current frame's ticker.
 * No reactive tracking occurs during execution.
 * Ticker parameter is optional - use only when frame timing is needed.
 *
 * ## Ownership:
 * Captures current owner and wraps effect with `runWithOwner` for proper cleanup.
 *
 * @template T - Type returned by query
 * @param query - Tracks reactive state. No timing calculations allowed.
 * @param effect - Executes on next frame with query result and ticker.
 * @param owner - Optional owner context. Defaults to `getOwner()`.
 * @returns Disposal function
 *
 * @example
 * // Track reactive state without timing
 * const [visible, setVisible] = createSignal(true);
 * createSynchronizedEffect(
 *     () => visible(),
 *     (isVisible) => {
 *         sprite.visible = isVisible;
 *     }
 * );
 *
 * @example
 * // Frame-independent movement with deltaTime
 * const [speed, setSpeed] = createSignal(5);
 * createSynchronizedEffect(
 *     () => speed(),
 *     (currentSpeed, ticker) => {
 *         sprite.x += currentSpeed * ticker.deltaTime;
 *     }
 * );
 *
 * @example
 * // Combine multiple signals with timing
 * const [isPaused, setIsPaused] = createSignal(false);
 * const [velocity, setVelocity] = createSignal(10);
 *
 * createSynchronizedEffect(
 *     () => ({
 *         paused: isPaused(),
 *         vel: velocity()
 *     }),
 *     ({paused, vel}, ticker) => {
 *         if (!paused) {
 *             sprite.x += vel * ticker.deltaTime;
 *         }
 *     }
 * );
 */
export const createSynchronizedEffect = <T>(
  query: () => T,
  effect: (queryResult: T, ticker: Ticker) => void,
  owner = getOwner(),
) =>
  createEffectOnNextFrame({
    id: createUniqueId(),
    query: () => query(),
    effect: (queryResult, ticker) =>
      runWithOwner(owner, () => effect(queryResult, ticker)),
  });

/**
 * Executes a function every frame with current ticker values.
 *
 * @warn Runs ~60 times per second. Use only for continuous updates.
 * For reactive/conditional updates, use `createSynchronizedEffect`.
 *
 * ## Use cases:
 * - Physics simulations requiring fixed time steps
 * - Continuous animations (rotation, oscillation)
 * - Time accumulation
 * - Performance monitoring
 *
 * ## Avoid for:
 * - State-dependent updates (use `createSynchronizedEffect`)
 * - Event-driven changes (use event handlers)
 * - Periodic updates (use `createTimeout`/`createInterval`)
 *
 * @param fn - Receives PIXI Ticker with current frame timing
 * @returns Disposal function
 *
 * @example
 * // Continuous rotation
 * onEveryFrame((ticker) => {
 *     sprite.rotation += rotationSpeed * ticker.deltaTime;
 * });
 *
 * @example
 * // Physics simulation
 * onEveryFrame((ticker) => {
 *     physicsWorld.step(ticker.elapsedMS / 1000);
 *     updatePhysicsSprites();
 * });
 *
 * @example
 * // Particle system
 * const dispose = onEveryFrame((ticker) => {
 *     particles.forEach(p => {
 *         p.life -= ticker.elapsedMS;
 *         p.y += p.velocity * ticker.deltaTime;
 *         if (p.life <= 0) removeParticle(p);
 *     });
 * });
 *
 * @example
 * // BAD: Conditional check runs every frame
 * onEveryFrame((ticker) => {
 *     if (isAnimating()) {  // Checked 60x/second
 *         updateAnimation(ticker.deltaTime);
 *     }
 * });
 *
 * @example
 * // GOOD: Reactive conditional
 * createSynchronizedEffect(
 *     () => isAnimating(),
 *     (animating) => {
 *         if (animating) updateAnimation();
 *     }
 * );
 */
export const onEveryFrame = (fn: (ticker: Ticker) => void) =>
  createEffectOnNextFrame({
    id: createUniqueId(),
    query: (frameCount) => {
      frameCount();
    },
    effect: (_, ticker) => fn(ticker),
  });
