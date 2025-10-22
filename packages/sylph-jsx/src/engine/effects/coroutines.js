"use strict";
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitMsCoroutine = exports.waitFrameCoroutine = exports.chainCoroutine = exports.createRepeatableCoroutine = exports.createEasingCoroutine = exports.startCoroutine = exports.CoroutineControl = exports.generatorContinue = exports.waitFrames = exports.waitMs = exports.stop = void 0;
var Math_js_1 = require("../libs/Math.js");
var patched_types_js_1 = require("../../pixi-jsx/solidjs-universal-renderer/patched-types.js");
var utility_types_js_1 = require("../../utility-types.js");
var query_fns_js_1 = require("../core/query-fns.js");
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
var stop = function () { return ({
    type: "GeneratorStop",
}); };
exports.stop = stop;
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
var waitMs = function (ms) { return ({
    type: "GeneratorWaitMs",
    ms: ms,
}); };
exports.waitMs = waitMs;
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
var waitFrames = function (frames) { return ({
    type: "GeneratorWaitFrames",
    frames: frames,
}); };
exports.waitFrames = waitFrames;
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
var generatorContinue = function () { return ({
    type: "GeneratorContinue",
}); };
exports.generatorContinue = generatorContinue;
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
exports.CoroutineControl = {
    waitMs: exports.waitMs,
    waitFrames: exports.waitFrames,
    stop: exports.stop,
    continue: exports.generatorContinue,
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
var getNextTimeStampState = function (state, elapsedMsSinceLastFrame) {
    if (state === null)
        return state;
    state.timeStamp += elapsedMsSinceLastFrame;
    if (state.timeStamp >= state.duration)
        return null;
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
var initializeTimeStampState = function (duration) { return ({
    duration: duration,
    timeStamp: 0,
}); };
/**
 * Decrements the frame counter for frame-based waits.
 * Called every frame to count down `waitFrames()` operations.
 *
 * @param {number | null} frames - Current frame count or null if not waiting
 * @returns {number | null} Returns null when counter reaches 0, otherwise returns decremented count
 * @private
 */
var getNextCounterState = function (frames) {
    return frames === null || frames === 0 ? null : frames - 1;
};
/**
 * Creates initial state for a frame-based wait operation.
 * Returns frames-1 to account for the decrement that happens before the waiting check.
 *
 * @param {number} frames - Number of frames to wait
 * @returns {number} The frame count minus 1
 * @private
 */
var initializeCounterState = function (frames) { return frames - 1; };
/**
 * Determines if the coroutine is currently in any waiting state.
 * Used to skip generator execution while waiting for time or frames.
 *
 * @param {TimestampState | null} timeStampState - Current time-based wait state
 * @param {number | null} counterState - Current frame-based wait state
 * @returns {boolean} True if any wait is active, false if ready to execute
 * @private
 */
var isInWaitingState = function (timeStampState, counterState) { return timeStampState !== null || counterState !== null; };
/**
 * Factory function that creates a stateful coroutine wait manager.
 * Encapsulates both time-based and frame-based wait state tracking, plus pause state.
 * Used internally by startCoroutine to manage wait operations and pause/resume functionality.
 *
 * @param {boolean} paused - Initial pause state
 * @returns {Object} State manager with methods for wait control:
 *   - waitMs: Initializes a millisecond-based wait
 *   - waitFrames: Initializes a frame-based wait
 *   - setPause: Sets the pause state (true = paused, false = running)
 *   - isWaitingOnNextTick: Updates and checks if any wait is active or coroutine is paused
 * @private
 */
var createCoroutineState = function (paused) {
    var timeStampState = null;
    var frameCounter = null;
    return {
        waitMs: function (ms) {
            timeStampState = initializeTimeStampState(ms);
        },
        waitFrames: function (frames) {
            frameCounter = initializeCounterState(frames);
        },
        setPause: function (nextPause) {
            paused = nextPause;
        },
        isWaitingOnNextTick: function (elapsedMsSinceLastFrame) {
            timeStampState = getNextTimeStampState(timeStampState, elapsedMsSinceLastFrame);
            frameCounter = getNextCounterState(frameCounter);
            return paused || isInWaitingState(timeStampState, frameCounter);
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
 * 5. Can be paused and resumed without losing state
 *
 *
 * @param {CoroutineFn} fn - Generator function to execute. Receives elapsed ms as input on each yield.
 * @param {boolean} [paused=false] - If true, coroutine starts in paused state and won't execute until resume() is called
 * @returns {{dispose: () => void, stopped: Accessor<boolean>, pause: () => void, resume: () => void}}
 *   Object with:
 *   - dispose: Function to stop and cleanup the coroutine
 *   - stopped: Reactive signal indicating if coroutine has completed
 *   - pause: Function to pause coroutine execution
 *   - resume: Function to resume a paused coroutine
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
 * // Pause and resume control
 * const {pause, resume, dispose} = startCoroutine(function*() {
 *     while(true) {
 *         sprite.rotation += 0.05;
 *         yield CoroutineControl.continue();
 *     }
 * });
 *
 * // Pause on user input
 * button.on('pointerdown', () => pause());
 * button.on('pointerup', () => resume());
 *
 * @example
 * // Start paused, resume later
 * const animation = startCoroutine(complexAnimation, true);
 * // ... later when ready
 * animation.resume();
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
var startCoroutine = function (fn, paused) {
    if (paused === void 0) { paused = false; }
    var iterator = fn();
    var coroutineState = createCoroutineState(paused);
    var _a = (0, patched_types_js_1.createSignal)(false), stopped = _a[0], setStopped = _a[1];
    var onCoroutineDone = function () {
        setStopped(true);
        dispose();
    };
    var dispose = (0, query_fns_js_1.onEveryFrame)(function (time) {
        if (coroutineState.isWaitingOnNextTick(time.elapsedMS))
            return;
        var result = iterator.next(time.elapsedMS);
        if (result.done)
            return onCoroutineDone();
        switch (result.value.type) {
            case "GeneratorContinue":
                return;
            case "GeneratorStop":
                return onCoroutineDone();
            case "GeneratorWaitMs":
                return coroutineState.waitMs(result.value.ms);
            case "GeneratorWaitFrames":
                return coroutineState.waitFrames(Math.max(result.value.frames, 1));
            case "GeneratorPause":
                return coroutineState.setPause(true);
            default:
                return (0, utility_types_js_1.unreachable)(result.value);
        }
    });
    return {
        dispose: dispose,
        stopped: stopped,
        pause: function () { return coroutineState.setPause(true); },
        resume: function () { return coroutineState.setPause(false); },
    };
};
exports.startCoroutine = startCoroutine;
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
var createEasingCoroutine = function (cb, easingFn, duration) {
    return function () {
        var elapsed, _loop_1, state_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    elapsed = 0;
                    _loop_1 = function () {
                        var progress, _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    progress = duration === 0 ? 1 : Math.min(elapsed / duration, 1);
                                    cb(function (a, b) { return (0, Math_js_1.lerp)(a, b, easingFn(progress)); });
                                    if (elapsed >= duration)
                                        return [2 /*return*/, "break"];
                                    _b = elapsed;
                                    return [4 /*yield*/, exports.CoroutineControl.continue()];
                                case 1:
                                    elapsed = _b + _c.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _a.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 3];
                    return [5 /*yield**/, _loop_1()];
                case 2:
                    state_1 = _a.sent();
                    if (state_1 === "break")
                        return [3 /*break*/, 3];
                    return [3 /*break*/, 1];
                case 3: return [2 /*return*/];
            }
        });
    };
};
exports.createEasingCoroutine = createEasingCoroutine;
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
var createRepeatableCoroutine = function (constructor) {
    return function () {
        var iterator, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!true) return [3 /*break*/, 4];
                    iterator = constructor();
                    return [5 /*yield**/, __values(iterator())];
                case 1:
                    result = _a.sent();
                    if (!result) return [3 /*break*/, 3];
                    return [4 /*yield*/, result];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [3 /*break*/, 0];
                case 4: return [2 /*return*/];
            }
        });
    };
};
exports.createRepeatableCoroutine = createRepeatableCoroutine;
/**
 * Chains multiple coroutines to execute sequentially.
 * Each coroutine runs to completion before the next one starts.
 *
 * **When to use:**
 * - Complex animation sequences with distinct phases
 * - Multi-step behaviors that need to execute in order
 * - Composing reusable coroutine building blocks
 * - Creating animation timelines
 *
 * **How it works:**
 * 1. Executes first coroutine to completion using yield*
 * 2. Proceeds to next coroutine immediately after previous completes
 * 3. Continues until all coroutines have executed
 * 4. Can be stopped early if any coroutine returns stop()
 *
 * @param {...CoroutineFn[]} coroutines - Variable number of coroutine functions to chain
 * @returns {CoroutineFn} A single coroutine that executes all provided coroutines in sequence
 *
 * @example
 * // Simple animation sequence
 * const moveAndFade = chainCoroutine(
 *     createEasingCoroutine(
 *         (lerp) => sprite.x = lerp(0, 100),
 *         easeOut,
 *         500
 *     ),
 *     createEasingCoroutine(
 *         (lerp) => sprite.alpha = lerp(1, 0),
 *         easeIn,
 *         300
 *     )
 * );
 * startCoroutine(moveAndFade);
 *
 * @example
 * // Multi-step game sequence
 * const attackSequence = chainCoroutine(
 *     // Wind up
 *     createEasingCoroutine(
 *         (lerp) => {
 *             sprite.scale.x = lerp(1, 1.2);
 *             sprite.scale.y = lerp(1, 0.8);
 *         },
 *         easeIn,
 *         200
 *     ),
 *     // Wait
 *     waitMsCoroutine(100),
 *     // Attack
 *     function* () {
 *         dealDamage();
 *         playSound('attack');
 *         yield CoroutineControl.continue();
 *     },
 *     // Recover
 *     createEasingCoroutine(
 *         (lerp) => {
 *             sprite.scale.x = lerp(1.2, 1);
 *             sprite.scale.y = lerp(0.8, 1);
 *         },
 *         easeOut,
 *         300
 *     )
 * );
 *
 * @example
 * // Conditional early exit
 * const patrolSequence = chainCoroutine(
 *     moveToPosition(pointA),
 *     waitMsCoroutine(1000),
 *     function* () {
 *         if (playerDetected()) {
 *             return CoroutineControl.stop(); // Stops entire chain
 *         }
 *         yield CoroutineControl.continue();
 *     },
 *     moveToPosition(pointB)
 * );
 */
var chainCoroutine = function () {
    var coroutines = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        coroutines[_i] = arguments[_i];
    }
    return function () {
        var _i, coroutines_1, coroutine;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _i = 0, coroutines_1 = coroutines;
                    _a.label = 1;
                case 1:
                    if (!(_i < coroutines_1.length)) return [3 /*break*/, 4];
                    coroutine = coroutines_1[_i];
                    return [5 /*yield**/, __values(coroutine())];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    };
};
exports.chainCoroutine = chainCoroutine;
/**
 * Creates a coroutine that waits for a specified number of frames.
 * Convenience wrapper around waitFrames() for use in coroutine composition.
 *
 * **When to use:**
 * - When chaining coroutines and need a frame-based delay
 * - Building reusable animation sequences
 * - Frame-perfect timing requirements
 * - Composing with other coroutine utilities
 *
 * @param {number} frames - Number of frames to wait
 * @returns {CoroutineFn} A coroutine that waits for the specified frames
 *
 * @example
 * // Simple delay in a chain
 * const sequence = chainCoroutine(
 *     doSomething,
 *     waitFrameCoroutine(30), // Wait 30 frames (0.5s at 60fps)
 *     doSomethingElse
 * );
 *
 * @example
 * // Frame-perfect combo timing
 * const comboAttack = chainCoroutine(
 *     lightPunch,
 *     waitFrameCoroutine(8),  // Exact 8-frame window
 *     heavyKick,
 *     waitFrameCoroutine(12),
 *     specialMove
 * );
 */
var waitFrameCoroutine = function (frames) {
    return function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, exports.CoroutineControl.waitFrames(frames)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    };
};
exports.waitFrameCoroutine = waitFrameCoroutine;
/**
 * Creates a coroutine that waits for a specified duration in milliseconds.
 * Convenience wrapper around waitMs() for use in coroutine composition.
 *
 * **When to use:**
 * - When chaining coroutines and need a time-based delay
 * - Building reusable animation sequences
 * - Time-based delays that should be framerate-independent
 * - Composing with other coroutine utilities
 *
 * @param {number} ms - Duration to wait in milliseconds
 * @returns {CoroutineFn} A coroutine that waits for the specified duration
 *
 * @example
 * // Simple delay in a chain
 * const notification = chainCoroutine(
 *     showMessage,
 *     waitMsCoroutine(3000), // Show for 3 seconds
 *     hideMessage
 * );
 *
 * @example
 * // Complex sequence with mixed delays
 * const cutscene = chainCoroutine(
 *     fadeIn,
 *     waitMsCoroutine(500),
 *     showDialogue("Hello"),
 *     waitMsCoroutine(2000),
 *     showDialogue("Welcome"),
 *     waitMsCoroutine(2000),
 *     fadeOut
 * );
 */
var waitMsCoroutine = function (ms) {
    return function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, exports.CoroutineControl.waitMs(ms)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    };
};
exports.waitMsCoroutine = waitMsCoroutine;
