"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onEveryFrame = exports.createSynchronizedEffect = void 0;
var index_js_1 = require("../../pixi-jsx/solidjs-universal-renderer/index.js");
var game_loop_context_js_1 = require("./game-loop-context.js");
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
function createEffectOnNextFrame(args) {
    var gameLoopContext = (0, game_loop_context_js_1.useGameLoopContext)();
    var dispose = function () { };
    // Create a new root here to lift the dispose function up
    // It's desirable to allow for the caller to dispose this context
    // manually.
    // Effectively, this disposal is a `cancelNextFrame`
    (0, index_js_1.createRoot)(function (_dispose) {
        dispose = _dispose;
        (0, index_js_1.createComputed)(function () {
            // Initially, I'd suspected that it might be possible for dispose to have been
            // before this `createComputed callback is fired.
            // However, after studying the solid code, I've convinced myself it's not possible
            // Therefore, we do not need to preemptively check to see if it's already been disposed before scheduling
            var queryResult = args.query(gameLoopContext.frameCount);
            var execution = function (ticker) { return args.effect(queryResult, ticker); };
            gameLoopContext.scheduledEffects.set(args.id, execution);
            (0, index_js_1.onCleanup)(function () {
                gameLoopContext.scheduledEffects.delete(args.id);
            });
        });
    });
    // Wire the lifted dispose function into the cleanup
    // of the owner context, so we don't leave these roots dangling.
    // The consequences of this would be effects left in the
    // scheduler for one scheduled frame longer than
    // expected
    (0, index_js_1.onCleanup)(dispose);
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
var createSynchronizedEffect = function (query, effect, owner) {
    if (owner === void 0) { owner = (0, index_js_1.getOwner)(); }
    return createEffectOnNextFrame({
        id: (0, index_js_1.createUniqueId)(),
        query: function () { return query(); },
        effect: function (queryResult, ticker) {
            return (0, index_js_1.runWithOwner)(owner, function () { return effect(queryResult, ticker); });
        },
    });
};
exports.createSynchronizedEffect = createSynchronizedEffect;
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
var onEveryFrame = function (fn) {
    return createEffectOnNextFrame({
        id: (0, index_js_1.createUniqueId)(),
        query: function (frameCount) {
            frameCount();
        },
        effect: function (_, ticker) { return fn(ticker); },
    });
};
exports.onEveryFrame = onEveryFrame;
