import {describe, expect, test} from "vitest";
import {createSignal} from "solid-custom-renderer/index.ts";
import {
    CoroutineControl, createEasingCoroutine,
    createRepeatableCoroutine,
    startCoroutine,
    waitFrames,
    waitMs
} from "../../../effects/coroutines.ts";
import {renderApplicationWithFakeTicker} from "../../../../__tests__/test-utils/test-utils.tsx";
import {assert, invariant} from "../../../../utility-types.ts";
import {Sprite, Text} from "pixi.js";

describe("createRepeatableCoroutine", () => {
    describe("basic repeating behavior", () => {
        test("automatically repeats coroutine after completion", async () => {
            const TestComponent = () => {
                const [cycles, setCycles] = createSignal(0);

                startCoroutine(
                    createRepeatableCoroutine(
                        () =>
                            function* () {
                                setCycles((prev) => prev + 1);
                                yield CoroutineControl.continue();
                                yield CoroutineControl.continue();
                            },
                    ),
                );

                return <text>{cycles()}</text>;
            };

            const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
                <TestComponent />
            ));
            const textNode = stage.children[0]?.children[0];
            invariant(textNode);
            assert(textNode instanceof Text);

            expect(textNode.text).toBe("0");
            await ticker.tickFrames(1);
            expect(textNode.text).toBe("1"); // First cycle starts
            await ticker.tickFrames(2);
            expect(textNode.text).toBe("2"); // First cycle completes, second starts
            await ticker.tickFrames(2);
            expect(textNode.text).toBe("3"); // Second cycle completes, third starts
        });

        test("creates fresh state on each iteration", async () => {
            const TestComponent = () => {
                const [iterations, setIterations] = createSignal<string>("");

                startCoroutine(
                    createRepeatableCoroutine(
                        () =>
                            function* () {
                                // Local state that should reset each iteration
                                let localCount = 0;
                                setIterations((prev) => prev + `${localCount},`);
                                localCount++;
                                yield CoroutineControl.continue();
                                setIterations((prev) => prev + `${localCount};`);
                            },
                    ),
                );

                return <text>{iterations()}</text>;
            };

            const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
                <TestComponent />
            ));
            const textNode = stage.children[0]?.children[0];
            invariant(textNode);
            assert(textNode instanceof Text);

            expect(textNode.text).toBe("");
            await ticker.tickFrames(1);
            expect(textNode.text).toBe("0,");
            await ticker.tickFrames(1);
            // First cycle completes and second starts immediately (same frame)
            expect(textNode.text).toBe("0,1;0,");
            await ticker.tickFrames(1);
            expect(textNode.text).toBe("0,1;0,1;0,"); // Second completes, third starts
            await ticker.tickFrames(1);
            expect(textNode.text).toBe("0,1;0,1;0,1;0,"); // Third completes, fourth starts
        });
    });

    describe("stopping behavior", () => {
        test("stops repeating when inner coroutine returns stop()", async () => {
            const TestComponent = () => {
                const [cycles, setCycles] = createSignal(0);

                startCoroutine(
                    createRepeatableCoroutine(
                        () =>
                            function* () {
                                const current = cycles();
                                setCycles(current + 1);

                                if (current >= 2) {
                                    return CoroutineControl.stop();
                                }

                                return CoroutineControl.continue();
                            },
                    ),
                );

                return <text>{cycles()}</text>;
            };

            const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
                <TestComponent />
            ));
            const textNode = stage.children[0]?.children[0];
            invariant(textNode);
            assert(textNode instanceof Text);

            expect(textNode.text).toBe("0");
            await ticker.tickFrames(1);
            expect(textNode.text).toBe("1"); // First cycle
            await ticker.tickFrames(1);
            expect(textNode.text).toBe("2"); // Second cycle
            await ticker.tickFrames(1);
            expect(textNode.text).toBe("3"); // Third cycle, then stops
            await ticker.tickFrames(5);
            expect(textNode.text).toBe("3"); // No more cycles
        });

        test("stops when dispose is called from outside", async () => {
            const TestComponent = () => {
                const [x, setX] = createSignal(0);

                const { dispose } = startCoroutine(
                    createRepeatableCoroutine(
                        () =>
                            function* () {
                                setX((prev) => prev + 10);
                                yield CoroutineControl.continue();
                            },
                    ),
                );

                (globalThis as any).testDispose3 = dispose;

                return <sprite x={x()} />;
            };

            const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
                <TestComponent />
            ));
            const sprite = stage.children[0]?.children[0];
            invariant(sprite);
            assert(sprite instanceof Sprite);

            expect(sprite.x).toBe(0);
            await ticker.tickFrames(1);
            expect(sprite.x).toBe(10); // First cycle
            await ticker.tickFrames(1);
            expect(sprite.x).toBe(20); // Second cycle

            // Dispose the coroutine
            (globalThis as any).testDispose3();

            await ticker.tickFrames(5);
            expect(sprite.x).toBe(20); // No more updates

            delete (globalThis as any).testDispose3;
        });

        test("sets stopped signal to true when stopped via return", async () => {
            const TestComponent = () => {
                const [count, setCount] = createSignal(0);

                const { stopped } = startCoroutine(
                    createRepeatableCoroutine(
                        () =>
                            function* () {
                                const current = count();
                                setCount(current + 1);

                                if (current >= 2) {
                                    return CoroutineControl.stop();
                                }

                                return CoroutineControl.continue();
                            },
                    ),
                );

                return <text>{stopped() ? "stopped" : "running"}</text>;
            };

            const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
                <TestComponent />
            ));
            const textNode = stage.children[0]?.children[0];
            invariant(textNode);
            assert(textNode instanceof Text);

            expect(textNode.text).toBe("running");
            await ticker.tickFrames(3);
            expect(textNode.text).toBe("stopped");
        });
    });

    describe("control instruction propagation", () => {
        test("propagates waitMs from inner coroutine", async () => {
            const TestComponent = () => {
                const [cycles, setCycles] = createSignal(0);

                startCoroutine(
                    createRepeatableCoroutine(
                        () =>
                            function* () {
                                setCycles((prev) => prev + 1);
                                yield waitMs(34); // Wait 2 frames (17ms each)
                            },
                    ),
                );

                return <text>{cycles()}</text>;
            };

            const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
                <TestComponent />
            ));
            const textNode = stage.children[0]?.children[0];
            invariant(textNode);
            assert(textNode instanceof Text);

            expect(textNode.text).toBe("0");
            await ticker.tickFrames(1);
            expect(textNode.text).toBe("1"); // First cycle starts
            await ticker.tickFrames(1);
            expect(textNode.text).toBe("1"); // Still waiting
            await ticker.tickFrames(1);
            expect(textNode.text).toBe("2"); // Wait complete, second cycle starts
        });

        test("propagates waitFrames from inner coroutine", async () => {
            const TestComponent = () => {
                const [cycles, setCycles] = createSignal(0);

                startCoroutine(
                    createRepeatableCoroutine(
                        () =>
                            function* () {
                                setCycles((prev) => prev + 1);
                                yield waitFrames(2);
                            },
                    ),
                );

                return <text>{cycles()}</text>;
            };

            const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
                <TestComponent />
            ));
            const textNode = stage.children[0]?.children[0];
            invariant(textNode);
            assert(textNode instanceof Text);

            expect(textNode.text).toBe("0");
            await ticker.tickFrames(1);
            expect(textNode.text).toBe("1"); // First cycle starts
            await ticker.tickFrames(1);
            expect(textNode.text).toBe("1"); // Waiting frame 1
            await ticker.tickFrames(1);
            // Waiting frame 2 completes, coroutine repeats immediately
            expect(textNode.text).toBe("2"); // Second cycle starts
            await ticker.tickFrames(1);
            expect(textNode.text).toBe("2"); // Waiting frame 1 of second cycle
        });
    });

    describe("composition with other coroutines", () => {
        test("composes with createEasingCoroutine for repeating animations", async () => {
            const TestComponent = () => {
                const [x, setX] = createSignal(0);
                const [cycles, setCycles] = createSignal(0);

                startCoroutine(
                    createRepeatableCoroutine(() => {
                        setCycles((prev) => prev + 1);
                        return createEasingCoroutine(
                            (lerp) => {
                                setX(lerp(0, 100));
                            },
                            (t) => t, // Linear
                            51, // 4 frames: 0ms, 17ms, 34ms, 51ms
                        );
                    }),
                );

                return (
                    <text>
                        {x().toFixed(0)},{cycles()}
                    </text>
                );
            };

            const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
                <TestComponent />
            ));
            const textNode = stage.children[0]?.children[0];
            invariant(textNode);
            assert(textNode instanceof Text);

            await ticker.tickFrames(1);
            expect(textNode.text).toMatch(/^\d+,1$/); // First cycle started

            await ticker.tickFrames(4);
            // After 4 frames, first cycle completes (51ms) and second starts immediately
            expect(textNode.text).toMatch(/^\d+,2$/); // First cycle complete, second started

            await ticker.tickFrames(4);
            expect(textNode.text).toMatch(/^\d+,3$/); // Second cycle complete, third started
        });

        test("supports yield* delegation to nested coroutines", async () => {
            const TestComponent = () => {
                const [log, setLog] = createSignal<string>("");

                const innerCoroutine = function* () {
                    setLog((prev) => prev + "A");
                    yield CoroutineControl.continue();
                    setLog((prev) => prev + "B");
                };

                startCoroutine(
                    createRepeatableCoroutine(
                        () =>
                            function* () {
                                setLog((prev) => prev + "[");
                                yield* innerCoroutine();
                                setLog((prev) => prev + "]");
                                yield CoroutineControl.continue();
                            },
                    ),
                );

                return <text>{log()}</text>;
            };

            const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
                <TestComponent />
            ));
            const textNode = stage.children[0]?.children[0];
            invariant(textNode);
            assert(textNode instanceof Text);

            expect(textNode.text).toBe("");
            await ticker.tickFrames(1);
            expect(textNode.text).toBe("[A");
            await ticker.tickFrames(1);
            expect(textNode.text).toBe("[AB]");
            await ticker.tickFrames(1);
            // New cycle starts
            expect(textNode.text).toBe("[AB][A");
            await ticker.tickFrames(1);
            expect(textNode.text).toBe("[AB][AB]");
        });
    });

    describe("edge cases", () => {
        test("coroutine that yields once per iteration", async () => {
            const TestComponent = () => {
                const [x, setX] = createSignal(0);

                startCoroutine(
                    createRepeatableCoroutine(
                        () =>
                            function* () {
                                setX((prev) => prev + 5);
                                yield CoroutineControl.continue();
                            },
                    ),
                );

                return <sprite x={x()} />;
            };

            const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
                <TestComponent />
            ));
            const sprite = stage.children[0]?.children[0];
            invariant(sprite);
            assert(sprite instanceof Sprite);

            expect(sprite.x).toBe(0);
            await ticker.tickFrames(1);
            expect(sprite.x).toBe(5);
            await ticker.tickFrames(1);
            expect(sprite.x).toBe(10);
            await ticker.tickFrames(1);
            expect(sprite.x).toBe(15);
            await ticker.tickFrames(3);
            expect(sprite.x).toBe(30); // 3 more cycles
        });
    });
});