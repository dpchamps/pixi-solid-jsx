import { beforeAll, describe, expect, test, vi } from "vitest";
import {
  createSignal,
  Show,
} from "../../../pixi-jsx/solidjs-universal-renderer/index";
import { createInterval, createTimeout } from "../../effects/createTimers";
import { renderApplicationWithFakeTicker } from "../../../__tests__/test-utils/test-utils";
import { assert, invariant } from "../../../utility-types";
import { Text } from "pixi.js";

describe("createTimers", () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  describe("createInterval", () => {
    test("executes callback repeatedly at correct intervals", async () => {
      const TestComponent = () => {
        const [count, setCount] = createSignal(0);

        createInterval(() => setCount((c) => c + 1), 34);

        return <text>{count()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("0");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("0");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("1");
      await ticker.tickFrames(2);
      expect(textNode.text).toBe("2");
      await ticker.tickFrames(2);
      expect(textNode.text).toBe("3");
    });

    test("dispose stops interval execution", async () => {
      const TestComponent = () => {
        const [count, setCount] = createSignal(0);

        const dispose = createInterval(() => setCount((c) => c + 1), 17);

        (globalThis as any).testDispose = dispose;

        return <text>{count()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("0");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("1");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("2");

      (globalThis as any).testDispose();

      await ticker.tickFrames(5);
      expect(textNode.text).toBe("2");

      delete (globalThis as any).testDispose;
    });
  });

  describe("createTimeout", () => {
    test("executes callback once after delay then stops", async () => {
      const TestComponent = () => {
        const [status, setStatus] = createSignal("waiting");

        createTimeout(() => setStatus("fired"), 34);

        return <text>{status()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("waiting");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("waiting");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("fired");
      await ticker.tickFrames(5);
      expect(textNode.text).toBe("fired");
    });

    test("dispose before execution prevents callback from firing", async () => {
      const TestComponent = () => {
        const [status, setStatus] = createSignal("waiting");

        const dispose = createTimeout(() => setStatus("fired"), 50);

        (globalThis as any).testTimeoutDispose = dispose;

        return <text>{status()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("waiting");

      (globalThis as any).testTimeoutDispose();

      await ticker.tickFrames(5);
      expect(textNode.text).toBe("waiting");

      delete (globalThis as any).testTimeoutDispose;
    });
  });

  describe("edge cases", () => {
    test("very short interval (< frame time) fires once per frame", async () => {
      const TestComponent = () => {
        const [count, setCount] = createSignal(0);

        createInterval(() => setCount((c) => c + 1), 5);

        return <text>{count()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("0");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("1");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("2");
    });

    test("multiple timers run simultaneously without interference", async () => {
      const TestComponent = () => {
        const [intervalCount, setIntervalCount] = createSignal(0);
        const [timeoutFired, setTimeoutFired] = createSignal(false);

        createInterval(() => setIntervalCount((c) => c + 1), 17);
        createTimeout(() => setTimeoutFired(true), 34);

        return (
          <text>
            {intervalCount()},{timeoutFired() ? "yes" : "no"}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("0,no");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("1,no");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("2,yes");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("3,yes");
    });

    test("cleanup on component unmount stops timers", async () => {
      const TimerComponent = () => {
        const [count, setCount] = createSignal(0);

        createInterval(() => setCount((c) => c + 1), 17);

        return <text>{count()}</text>;
      };

      const [active, setActive] = createSignal(true);

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <container>
          <Show when={active()}>
            <TimerComponent />
          </Show>
        </container>
      ));

      const container = stage.children[0]?.children[0];
      invariant(container);

      let textNode = container.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("0");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("1");

      setActive(false);
      await ticker.tickFrames(1);

      expect(container.children.length).toBe(0);
    });
  });
});
