import {
  createComputed,
  createRoot,
  createSignal,
  getOwner,
  onCleanup,
  runWithOwner,
} from "solid-custom-renderer/index.ts";
import { GameLoopContext, useGameLoopContext } from "./game-loop-context.ts";

export type OnNextFrameQuery<QueryResult> = {
  query: (time: GameLoopContext["time"]) => QueryResult;
  effect: (queryResult: QueryResult) => void;
};

/**
 * Creates a reactive effect that executes on the next game loop frame.
 *
 * This is the core primitive for synchronizing SolidJS reactivity with the PixiJS game loop.
 * It implements a query-effect pattern that separates reactive dependency tracking from execution.
 *
 * @internal
 *
 * ## How it works:
 * 1. **Query Phase**: Runs in a reactive context (`createComputed`), tracking any reactive dependencies
 *    accessed during the query. Re-runs whenever those dependencies change.
 * 2. **Scheduling**: Adds the effect to the game loop's next tick queue.
 * 3. **Effect Phase**: Executes the effect on the next frame with the queried value, outside reactive tracking.
 * 4. **Self-cleanup**: Removes itself from the tick queue after execution.
 *
 * ## Disposal Strategy:
 * - `_earlyDispose` flag: Guards against execution if disposed before root setup
 * - `cancel` signal: Provides reactive cancellation
 * - `dispose` function: Cleans up the createRoot scope
 * - `onCleanup`: Ensures removal from tick queue on component cleanup
 *
 * @param args - Object containing query and effect functions
 * @param args.query - Function that receives frame time and can query any reactive state. Runs in reactive context.
 * @param args.effect - Function that uses the queried value. Runs on next frame without reactive tracking.
 * @returns Disposal function that cancels the effect and cleans up resources
 */
function createEffectOnNextFrame<QueryResult>(
  args: OnNextFrameQuery<QueryResult>,
) {
  const appState = useGameLoopContext();
  const [cancel, setCancel] = createSignal(false);
  let _earlyDispose = false;
  let dispose = () => {
    _earlyDispose = true;
  };
  createRoot((__dispose) => {
    dispose = __dispose;
    createComputed(() => {
      if (_earlyDispose) return;
      const queryResult = args.query(appState.time);
      if (cancel()) return;
      const execution = () => {
        args.effect(queryResult);
        appState.onNextTick.delete(execution);
      };
      appState.onNextTick.add(execution);
      onCleanup(() => {
        appState.onNextTick.delete(execution);
      });
    });
  });

  onCleanup(() => {
    dispose();
  });

  return () => {
    dispose();
    setCancel(true);
  };
}

/**
 * Creates a frame-synchronized reactive effect that queries reactive state and executes on the next frame.
 *
 * This is the primary API for synchronizing reactive state with the game loop. It ensures that:
 * - Reactive tracking happens cleanly in the query phase
 * - Effects execute on the next frame without creating reactive dependencies
 * - Component ownership is preserved across frame boundaries
 *
 * ## The query function:
 * The query receives the current frame time as a parameter but can access ANY reactive state:
 * - Component signals and stores
 * - Time values from the provided parameter
 * - Any other reactive dependencies in scope
 *
 * The time parameter is provided for convenience, but the query tracks all reactive
 * dependencies it accesses, re-running whenever any of them change.
 *
 * ## Ownership preservation:
 * Effects run on the next frame outside the original component context. This function
 * captures the current owner and wraps the effect with `runWithOwner` to ensure proper
 * cleanup and reactive tracking for any signals created inside the effect.
 *
 * @template T - The type of value returned by the query
 * @param query - Function that receives time and can query any reactive state. Runs in reactive context.
 * @param effect - Function that receives the queried value. Executes on next frame.
 * @param owner - Optional owner context. Defaults to current owner via `getOwner()`.
 * @returns Disposal function that cancels the effect and cleans up resources
 *
 * @example
 * // Animate based on delta time
 * createSynchronizedEffect(
 *     (time) => time.deltaTime(),
 *     (dt) => {
 *         setPosition(p => ({ x: p.x + velocity * dt, y: p.y }));
 *     }
 * );
 *
 * @example
 * // Combine time with component state
 * const [isPaused, setIsPaused] = createSignal(false);
 * const [speed, setSpeed] = createSignal(5);
 *
 * createSynchronizedEffect(
 *     (time) => ({
 *         dt: time.deltaTime(),
 *         paused: isPaused(),
 *         velocity: speed()
 *     }),
 *     ({dt, paused, velocity}) => {
 *         if (!paused) {
 *             sprite.x += velocity * dt;
 *         }
 *     }
 * );
 *
 * @example
 * // Track multiple signals
 * const [x, setX] = createSignal(0);
 * const [y, setY] = createSignal(0);
 *
 * createSynchronizedEffect(
 *     (time) => ({
 *         pos: { x: x(), y: y() },
 *         elapsed: time.elapsedMsSinceLastFrame()
 *     }),
 *     ({pos, elapsed}) => {
 *         updateSprite(pos, elapsed);
 *     }
 * );
 */
export const createSynchronizedEffect = <T>(
  query: (time: GameLoopContext["time"]) => T,
  effect: (x: T) => void,
  owner = getOwner(),
) =>
  createEffectOnNextFrame({
    query,
    effect: (x) => runWithOwner(owner, () => effect(x)),
  });

/**
 * Executes a function on every single frame of the game loop.
 *
 * @warn **Performance Warning**: This function will execute EVERY FRAME (~60 times per second).
 * Only use for logic that must run continuously. For conditional or reactive updates,
 * use `createSynchronizedEffect` instead.
 *
 * ## When to use:
 * - Physics simulations that must step every frame
 * - Continuous animations (rotation, oscillation, particles)
 * - Time accumulators and counters
 * - Debug overlays and performance monitoring
 *
 * ## When NOT to use:
 * - State-dependent updates (use `createSynchronizedEffect`)
 * - Event-driven changes (use event handlers)
 * - One-time or periodic updates (use `createTimeout`/`createInterval`)
 *
 * @param fn - Function to execute every frame, receives current frame timing data
 * @param fn.time - Object containing frame timing information
 * @param fn.time.deltaTime - Time scaling factor for frame-independent movement (typically ~1 at 60fps)
 * @param fn.time.elapsedMsSinceLastFrame - Actual milliseconds since last frame
 * @param fn.time.fps - Current frames per second
 * @returns Disposal function to stop the frame updates
 *
 * @example
 * // Continuous rotation
 * onEveryFrame((time) => {
 *     sprite.rotation += rotationSpeed * time.deltaTime;
 * });
 *
 * @example
 * // Physics simulation
 * onEveryFrame((time) => {
 *     physicsWorld.step(time.elapsedMsSinceLastFrame / 1000);
 *     updatePhysicsSprites();
 * });
 *
 * @example
 * // Particle system update
 * const dispose = onEveryFrame((time) => {
 *     particles.forEach(p => {
 *         p.life -= time.elapsedMsSinceLastFrame;
 *         p.y += p.velocity * time.deltaTime;
 *         if (p.life <= 0) removeParticle(p);
 *     });
 * });
 * // Later: dispose() to stop updates
 *
 * @example
 * // BAD: Conditional logic that doesn't need to run every frame
 * onEveryFrame((time) => {
 *     if (isAnimating()) {  // This check runs 60 times/second even when false!
 *         updateAnimation(time.deltaTime);
 *     }
 * });
 *
 * @example
 *
 * // GOOD: Use createSynchronizedEffect for conditional updates
 * createSynchronizedEffect(
 *     (time) => ({ animating: isAnimating(), dt: time.deltaTime() }),
 *     ({ animating, dt }) => {
 *         if (animating) updateAnimation(dt);
 *     }
 * );
 */
export const onEveryFrame = (
  fn: (time: {
    deltaTime: number;
    elapsedMsSinceLastFrame: number;
    fps: number;
  }) => void,
) =>
  createSynchronizedEffect((time) => {
    return {
      deltaTime: time.deltaTime(),
      elapsedMsSinceLastFrame: time.elapsedMsSinceLastFrame(),
      fps: time.fps(),
    };
  }, fn);
