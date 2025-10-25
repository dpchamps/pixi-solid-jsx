import { beforeAll, describe, expect, test, vi } from "vitest";
import { createSignal } from "../../../../pixi-jsx/solidjs-universal-renderer/index";
import { createKeyboard } from "../../../effects/input/create-keyboard";
import { renderApplicationWithFakeTicker } from "../../../../__tests__/test-utils/test-utils";
import { assert, invariant } from "../../../../utility-types";
import { Sprite, Text } from "pixi.js";
import { createSynchronizedEffect } from "../../../core/query-fns";

type MockKeyboardElement = {
  addEventListener: (
    name: "keydown" | "keyup",
    cb: (evt: { code: string }) => void,
  ) => void;
  removeEventListener: (
    name: "keydown" | "keyup",
    cb: (evt: { code: string }) => void,
  ) => void;
  dispatch: (name: "keydown" | "keyup", code: string) => void;
};

const createMockKeyboardElement = (): MockKeyboardElement => {
  const listeners = new Map<
    "keydown" | "keyup",
    (evt: { code: string }) => void
  >();

  return {
    addEventListener: (name, cb) => listeners.set(name, cb),
    removeEventListener: (name) => listeners.delete(name),
    dispatch: (name, code) => {
      const listener = listeners.get(name);
      if (listener) {
        listener({ code });
      }
    },
  };
};

describe("createKeyboard", () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  describe("Basic Keyboard Event Handling", () => {
    test("single key press adds to keyMap", async () => {
      const mockEl = createMockKeyboardElement();

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const pressed = keyboard.onKeyPress("KeyA");

        return <text>{pressed().join(",")}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("");

      mockEl.dispatch("keydown", "KeyA");
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("KeyA");
    });

    test("key release removes from keyMap", async () => {
      const mockEl = createMockKeyboardElement();

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const pressed = keyboard.onKeyPress("KeyA");

        return <text>{pressed().join(",")}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatch("keydown", "KeyA");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("KeyA");

      mockEl.dispatch("keyup", "KeyA");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("");
    });

    test("multiple simultaneous keys tracked correctly", async () => {
      const mockEl = createMockKeyboardElement();

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const pressed = keyboard.onKeyPress("KeyA", "KeyB", "KeyC");

        return <text>{pressed().sort().join(",")}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatch("keydown", "KeyA");
      mockEl.dispatch("keydown", "KeyB");
      mockEl.dispatch("keydown", "KeyC");
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("KeyA,KeyB,KeyC");

      mockEl.dispatch("keyup", "KeyB");
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("KeyA,KeyC");
    });

    test("rapid press/release sequences", async () => {
      const mockEl = createMockKeyboardElement();

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const pressed = keyboard.onKeyPress("KeyA");

        return <text>{pressed().join(",")}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatch("keydown", "KeyA");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("KeyA");

      mockEl.dispatch("keyup", "KeyA");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("");

      mockEl.dispatch("keydown", "KeyA");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("KeyA");

      mockEl.dispatch("keyup", "KeyA");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("");
    });

    test("same key pressed multiple times does not duplicate", async () => {
      const mockEl = createMockKeyboardElement();

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const pressed = keyboard.onKeyPress("KeyA");

        return <text>{pressed().length}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatch("keydown", "KeyA");
      mockEl.dispatch("keydown", "KeyA");
      mockEl.dispatch("keydown", "KeyA");
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("1");
    });

    test("unknown/unmapped keys handled gracefully", async () => {
      const mockEl = createMockKeyboardElement();

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const pressed = keyboard.onKeyPress("KeyA", "KeyB");

        return <text>{pressed().join(",")}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatch("keydown", "UnknownKey123");
      mockEl.dispatch("keydown", "KeyA");
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("KeyA");
    });
  });

  describe("onKeyPress Behavior", () => {
    test("returns signal with pressed keys matching filter", async () => {
      const mockEl = createMockKeyboardElement();

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const pressed = keyboard.onKeyPress("KeyA", "KeyB");

        return <text>{pressed().sort().join(",")}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatch("keydown", "KeyA");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("KeyA");

      mockEl.dispatch("keydown", "KeyB");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("KeyA,KeyB");
    });

    test("filters only watched keyCodes", async () => {
      const mockEl = createMockKeyboardElement();

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const pressed = keyboard.onKeyPress("KeyA", "KeyB");

        return <text>{pressed().join(",")}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatch("keydown", "KeyA");
      mockEl.dispatch("keydown", "KeyC");
      mockEl.dispatch("keydown", "KeyD");
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("KeyA");
    });

    test("multiple subscribers watch different keys independently", async () => {
      const mockEl = createMockKeyboardElement();

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const pressedA = keyboard.onKeyPress("KeyA");
        const pressedB = keyboard.onKeyPress("KeyB");

        return (
          <>
            <text>{pressedA().join(",")}</text>
            <text y={50}>{pressedB().join(",")}</text>
          </>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const container = stage.children[0];
      invariant(container);
      const textA = container.children[0];
      const textB = container.children[1];
      invariant(textA instanceof Text);
      invariant(textB instanceof Text);

      mockEl.dispatch("keydown", "KeyA");
      await ticker.tickFrames(1);
      expect(textA.text).toBe("KeyA");
      expect(textB.text).toBe("");

      mockEl.dispatch("keydown", "KeyB");
      await ticker.tickFrames(1);
      expect(textA.text).toBe("KeyA");
      expect(textB.text).toBe("KeyB");
    });

    test("initial value reflects current key state (keys already pressed)", async () => {
      const mockEl = createMockKeyboardElement();

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const pressed = keyboard.onKeyPress("KeyA", "KeyB");

        return <text>{pressed().join(",")}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      mockEl.dispatch("keydown", "KeyA");

      await ticker.tickFrames(1);

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("KeyA");
    });

    test("shallowEqual behavior: same keys held don't trigger updates across frames", async () => {
      const mockEl = createMockKeyboardElement();
      const updateLog: number[] = [];

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const pressed = keyboard.onKeyPress("KeyA");

        createSynchronizedEffect(pressed, () => {
          updateLog.push(updateLog.length + 1);
        });

        return <text>{pressed().join(",")}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatch("keydown", "KeyA");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("KeyA");
      const updateCountAfterPress = updateLog.length;

      await ticker.tickFrames(5);
      expect(textNode.text).toBe("KeyA");
      expect(updateLog.length).toBe(updateCountAfterPress);
    });

    test("shallowEqual behavior: different key combinations trigger updates", async () => {
      const mockEl = createMockKeyboardElement();
      const updateLog: number[] = [];

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const pressed = keyboard.onKeyPress("KeyA", "KeyB");

        createSynchronizedEffect(pressed, () => {
          updateLog.push(updateLog.length + 1);
        });

        return <text>{pressed().sort().join(",")}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatch("keydown", "KeyA");
      await ticker.tickFrames(1);
      const countAfterA = updateLog.length;

      mockEl.dispatch("keydown", "KeyB");
      await ticker.tickFrames(1);
      expect(updateLog.length).toBeGreaterThan(countAfterA);

      mockEl.dispatch("keyup", "KeyA");
      await ticker.tickFrames(1);
      expect(updateLog.length).toBeGreaterThan(countAfterA + 1);
    });

    test("pressing additional watched keys triggers update", async () => {
      const mockEl = createMockKeyboardElement();

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const pressed = keyboard.onKeyPress("KeyA", "KeyB", "KeyC");

        return <text>{pressed().sort().join(",")}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatch("keydown", "KeyA");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("KeyA");

      mockEl.dispatch("keydown", "KeyB");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("KeyA,KeyB");

      mockEl.dispatch("keydown", "KeyC");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("KeyA,KeyB,KeyC");
    });

    test("releasing watched keys triggers update", async () => {
      const mockEl = createMockKeyboardElement();

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const pressed = keyboard.onKeyPress("KeyA", "KeyB");

        return <text>{pressed().sort().join(",")}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatch("keydown", "KeyA");
      mockEl.dispatch("keydown", "KeyB");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("KeyA,KeyB");

      mockEl.dispatch("keyup", "KeyA");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("KeyB");
    });

    test("pressing unwatched keys doesn't trigger update", async () => {
      const mockEl = createMockKeyboardElement();
      const updateLog: number[] = [];

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const pressed = keyboard.onKeyPress("KeyA", "KeyB");

        createSynchronizedEffect(pressed, () => {
          updateLog.push(updateLog.length + 1);
        });

        return <text>{pressed().join(",")}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      await ticker.tickFrames(1);
      const initialCount = updateLog.length;

      mockEl.dispatch("keydown", "KeyC");
      mockEl.dispatch("keydown", "KeyD");
      await ticker.tickFrames(5);

      expect(textNode.text).toBe("");
      expect(updateLog.length).toBe(initialCount);
    });

    test("empty keyCodes array returns empty array signal", async () => {
      const mockEl = createMockKeyboardElement();

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const pressed = keyboard.onKeyPress();

        return <text>{pressed().length}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatch("keydown", "KeyA");
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("0");
    });

    test("duplicate keyCodes are automatically deduplicated", async () => {
      const mockEl = createMockKeyboardElement();

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const pressed = keyboard.onKeyPress("KeyA", "KeyA", "KeyA");

        return <text>{pressed().join(",")}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatch("keydown", "KeyA");
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("KeyA");
    });
  });

  describe("onKeyHold Behavior", () => {
    test("returns signal with held keys matching filter", async () => {
      const mockEl = createMockKeyboardElement();

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const held = keyboard.onKeyHold("KeyA", "KeyB");

        return <text>{held().sort().join(",")}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatch("keydown", "KeyA");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("KeyA");

      mockEl.dispatch("keydown", "KeyB");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("KeyA,KeyB");
    });

    test("filters only watched keyCodes", async () => {
      const mockEl = createMockKeyboardElement();

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const held = keyboard.onKeyHold("KeyA", "KeyB");

        return <text>{held().join(",")}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatch("keydown", "KeyA");
      mockEl.dispatch("keydown", "KeyC");
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("KeyA");
    });

    test("multiple subscribers watch different keys independently", async () => {
      const mockEl = createMockKeyboardElement();

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const heldA = keyboard.onKeyHold("KeyA");
        const heldB = keyboard.onKeyHold("KeyB");

        return (
          <>
            <text>{heldA().join(",")}</text>
            <text y={50}>{heldB().join(",")}</text>
          </>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const container = stage.children[0];
      invariant(container);
      const textA = container.children[0];
      const textB = container.children[1];
      invariant(textA instanceof Text);
      invariant(textB instanceof Text);

      mockEl.dispatch("keydown", "KeyA");
      await ticker.tickFrames(1);
      expect(textA.text).toBe("KeyA");
      expect(textB.text).toBe("");

      mockEl.dispatch("keydown", "KeyB");
      await ticker.tickFrames(1);
      expect(textA.text).toBe("KeyA");
      expect(textB.text).toBe("KeyB");
    });

    test("initial value reflects current key state", async () => {
      const mockEl = createMockKeyboardElement();

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const held = keyboard.onKeyHold("KeyA", "KeyB");

        return <text>{held().join(",")}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      mockEl.dispatch("keydown", "KeyA");

      await ticker.tickFrames(1);

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("KeyA");
    });

    test("equals: false behavior: held keys trigger updates EVERY frame", async () => {
      const mockEl = createMockKeyboardElement();
      const updateLog: number[] = [];

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const held = keyboard.onKeyHold("KeyA");

        createSynchronizedEffect(held, () => {
          updateLog.push(updateLog.length + 1);
        });

        return <text>{held().join(",")}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatch("keydown", "KeyA");
      await ticker.tickFrames(1);
      const updateCountAfterPress = updateLog.length;

      await ticker.tickFrames(5);
      expect(updateLog.length).toBeGreaterThan(updateCountAfterPress);
      expect(updateLog.length).toBe(updateCountAfterPress + 5);
    });

    test("equals: false behavior: no updates when no keys held", async () => {
      const mockEl = createMockKeyboardElement();
      const updateLog: number[] = [];

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const held = keyboard.onKeyHold("KeyA");

        createSynchronizedEffect(held, () => {
          updateLog.push(updateLog.length + 1);
        });

        return <text>{held().join(",")}</text>;
      };

      const { ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      await ticker.tickFrames(1);
      const countIdle = updateLog.length;

      await ticker.tickFrames(3);
      expect(updateLog.length).toBe(countIdle);

      mockEl.dispatch("keydown", "KeyA");
      await ticker.tickFrames(1);
      const countAfterPress = updateLog.length;
      expect(countAfterPress).toBeGreaterThan(countIdle);

      await ticker.tickFrames(2);
      expect(updateLog.length).toBe(countAfterPress + 2);

      mockEl.dispatch("keyup", "KeyA");
      await ticker.tickFrames(1);
      const countAfterRelease = updateLog.length;
      expect(countAfterRelease).toBe(countAfterPress + 3);

      await ticker.tickFrames(3);
      expect(updateLog.length).toBe(countAfterRelease);
    });

    test("holding additional watched keys triggers update", async () => {
      const mockEl = createMockKeyboardElement();

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const held = keyboard.onKeyHold("KeyA", "KeyB", "KeyC");

        return <text>{held().sort().join(",")}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatch("keydown", "KeyA");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("KeyA");

      mockEl.dispatch("keydown", "KeyB");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("KeyA,KeyB");
    });

    test("releasing held keys triggers update", async () => {
      const mockEl = createMockKeyboardElement();

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const held = keyboard.onKeyHold("KeyA", "KeyB");

        return <text>{held().sort().join(",")}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatch("keydown", "KeyA");
      mockEl.dispatch("keydown", "KeyB");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("KeyA,KeyB");

      mockEl.dispatch("keyup", "KeyA");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("KeyB");
    });

    test("holding unwatched keys doesn't affect watched keys", async () => {
      const mockEl = createMockKeyboardElement();

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const held = keyboard.onKeyHold("KeyA", "KeyB");

        return <text>{held().join(",")}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatch("keydown", "KeyC");
      mockEl.dispatch("keydown", "KeyD");
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("");
    });

    test("empty keyCodes array returns empty array signal (updates every frame)", async () => {
      const mockEl = createMockKeyboardElement();
      const updateLog: number[] = [];

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const held = keyboard.onKeyHold();

        createSynchronizedEffect(held, () => {
          updateLog.push(updateLog.length + 1);
        });

        return <text>{held().length}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatch("keydown", "KeyA");
      await ticker.tickFrames(3);

      expect(textNode.text).toBe("0");
      expect(updateLog.length).toBeGreaterThan(0);
    });
  });

  describe("onKeyPress vs onKeyHold Difference", () => {
    test("Press: holding same keys doesn't update across frames (shallowEqual)", async () => {
      const mockEl = createMockKeyboardElement();
      const pressLog: number[] = [];

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const pressed = keyboard.onKeyPress("KeyA");

        createSynchronizedEffect(pressed, () => {
          pressLog.push(pressLog.length + 1);
        });

        return <text>{pressed().join(",")}</text>;
      };

      const { ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      mockEl.dispatch("keydown", "KeyA");
      await ticker.tickFrames(1);
      const count = pressLog.length;

      await ticker.tickFrames(5);
      expect(pressLog.length).toBe(count);
    });

    test("Hold: holding same keys updates every frame (equals: false)", async () => {
      const mockEl = createMockKeyboardElement();
      const holdLog: number[] = [];

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const held = keyboard.onKeyHold("KeyA");

        createSynchronizedEffect(held, () => {
          holdLog.push(holdLog.length + 1);
        });

        return <text>{held().join(",")}</text>;
      };

      const { ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      mockEl.dispatch("keydown", "KeyA");
      await ticker.tickFrames(1);
      const count = holdLog.length;

      await ticker.tickFrames(5);
      expect(holdLog.length).toBe(count + 5);
    });

    test("Press: only updates when key set changes", async () => {
      const mockEl = createMockKeyboardElement();
      const pressLog: string[] = [];

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const pressed = keyboard.onKeyPress("KeyA", "KeyB");

        createSynchronizedEffect(pressed, (keys) => {
          pressLog.push(keys.join(","));
        });

        return <text>{pressed().join(",")}</text>;
      };

      const { ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      await ticker.tickFrames(1);
      const initialCount = pressLog.length;

      mockEl.dispatch("keydown", "KeyA");
      await ticker.tickFrames(1);
      expect(pressLog[pressLog.length - 1]).toBe("KeyA");

      await ticker.tickFrames(3);
      expect(pressLog.length).toBe(initialCount + 1);

      mockEl.dispatch("keydown", "KeyB");
      await ticker.tickFrames(1);
      expect(pressLog.length).toBe(initialCount + 2);
    });

    test("Hold: updates continuously while keys held", async () => {
      const mockEl = createMockKeyboardElement();
      const holdLog: string[] = [];

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const held = keyboard.onKeyHold("KeyA");

        createSynchronizedEffect(held, (keys) => {
          holdLog.push(keys.join(","));
        });

        return <text>{held().join(",")}</text>;
      };

      const { ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      mockEl.dispatch("keydown", "KeyA");
      await ticker.tickFrames(1);
      const count1 = holdLog.length;

      await ticker.tickFrames(3);
      expect(holdLog.length).toBe(count1 + 3);
    });
  });

  describe("Frame-based Update Mechanism", () => {
    test("subscribers notified on every frame tick while keys held", async () => {
      const mockEl = createMockKeyboardElement();
      const updateLog: number[] = [];

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const held = keyboard.onKeyHold("KeyA");

        createSynchronizedEffect(held, () => {
          updateLog.push(updateLog.length + 1);
        });

        return <text>{held().join(",")}</text>;
      };

      const { ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      mockEl.dispatch("keydown", "KeyA");

      await ticker.tickFrames(1);
      const count1 = updateLog.length;
      expect(count1).toBeGreaterThan(0);

      await ticker.tickFrames(1);
      expect(updateLog.length).toBe(count1 + 1);

      await ticker.tickFrames(1);
      expect(updateLog.length).toBe(count1 + 2);
    });

    test("no frame callbacks registered when no subscribers", async () => {
      const mockEl = createMockKeyboardElement();

      const TestComponent = () => {
        createKeyboard(mockEl);
        return <text>No subscribers</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      await ticker.tickFrames(5);
      expect(textNode.text).toBe("No subscribers");
    });

    test("multiple subscribers updated in same frame", async () => {
      const mockEl = createMockKeyboardElement();
      const log1: number[] = [];
      const log2: number[] = [];

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const held1 = keyboard.onKeyHold("KeyA");
        const held2 = keyboard.onKeyHold("KeyB");

        createSynchronizedEffect(held1, () => log1.push(log1.length + 1));
        createSynchronizedEffect(held2, () => log2.push(log2.length + 1));

        return <text>test</text>;
      };

      const { ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      await ticker.tickFrames(1);
      expect(log1.length).toBeGreaterThan(0);
      expect(log2.length).toBeGreaterThan(0);
      expect(log1.length).toBe(log2.length);
    });

    test("adding subscriber mid-execution starts updates", async () => {
      const mockEl = createMockKeyboardElement();
      const [showSubscriber, setShowSubscriber] = createSignal(false);

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const held = keyboard.onKeyHold("KeyA");

        return (
          <>
            <text>{held().join(",")}</text>
            <text y={50}>
              {showSubscriber() ? held().join(",") : "waiting"}
            </text>
          </>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const container = stage.children[0];
      invariant(container);

      mockEl.dispatch("keydown", "KeyA");
      await ticker.tickFrames(1);
      expect((container.children[0] as Text).text).toBe("KeyA");
      expect((container.children[1] as Text).text).toBe("waiting");

      setShowSubscriber(true);
      await ticker.tickFrames(1);
      expect((container.children[0] as Text).text).toBe("KeyA");
      expect((container.children[1] as Text).text).toBe("KeyA");
    });

    test("frame updates only happen when ticker ticks", async () => {
      const mockEl = createMockKeyboardElement();
      const updateLog: number[] = [];

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const held = keyboard.onKeyHold("KeyA");

        createSynchronizedEffect(held, () => {
          updateLog.push(updateLog.length + 1);
        });

        return <text>{held().join(",")}</text>;
      };

      await renderApplicationWithFakeTicker(() => <TestComponent />);

      const initialCount = updateLog.length;
      await vi.advanceTimersByTimeAsync(1000);
      expect(updateLog.length).toBe(initialCount);
    });
  });

  describe("Cleanup and Lifecycle", () => {
    test("re-creating keyboard after cleanup works", async () => {
      const mockEl = createMockKeyboardElement();
      const [version, setVersion] = createSignal(1);

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const pressed = keyboard.onKeyPress("KeyA");

        return (
          <text>
            v{version()}:{pressed().join(",")}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatch("keydown", "KeyA");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("v1:KeyA");

      setVersion(2);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("v2:KeyA");
    });

    test("multiple keyboard instances are independent", async () => {
      const mockEl1 = createMockKeyboardElement();
      const mockEl2 = createMockKeyboardElement();

      const TestComponent = () => {
        const keyboard1 = createKeyboard(mockEl1);
        const keyboard2 = createKeyboard(mockEl2);
        const pressed1 = keyboard1.onKeyPress("KeyA");
        const pressed2 = keyboard2.onKeyPress("KeyA");

        return (
          <>
            <text>{pressed1().join(",")}</text>
            <text y={50}>{pressed2().join(",")}</text>
          </>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const container = stage.children[0];
      invariant(container);
      const text1 = container.children[0];
      const text2 = container.children[1];
      invariant(text1 instanceof Text);
      invariant(text2 instanceof Text);

      mockEl1.dispatch("keydown", "KeyA");
      await ticker.tickFrames(1);
      expect(text1.text).toBe("KeyA");
      expect(text2.text).toBe("");

      mockEl2.dispatch("keydown", "KeyA");
      await ticker.tickFrames(1);
      expect(text1.text).toBe("KeyA");
      expect(text2.text).toBe("KeyA");
    });
  });

  describe("Integration with PixiJS Scene", () => {
    test("sprite position updates based on onKeyPress", async () => {
      const mockEl = createMockKeyboardElement();

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const pressed = keyboard.onKeyPress("ArrowRight");
        const [x, setX] = createSignal(0);

        createSynchronizedEffect(pressed, (keys) => {
          if (keys.length > 0) {
            setX((prev) => prev + 10);
          }
        });

        return <sprite x={x()} />;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const sprite = stage.children[0]?.children[0];
      invariant(sprite);
      assert(sprite instanceof Sprite);

      expect(sprite.x).toBe(0);

      mockEl.dispatch("keydown", "ArrowRight");
      await ticker.tickFrames(1);
      expect(sprite.x).toBe(10);

      mockEl.dispatch("keyup", "ArrowRight");
      await ticker.tickFrames(1);
      expect(sprite.x).toBe(10);

      mockEl.dispatch("keydown", "ArrowRight");
      await ticker.tickFrames(1);
      expect(sprite.x).toBe(20);
    });

    test("sprite position updates based on onKeyHold", async () => {
      const mockEl = createMockKeyboardElement();

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const held = keyboard.onKeyHold("ArrowRight");
        const [x, setX] = createSignal(0);

        createSynchronizedEffect(held, (keys) => {
          if (keys.length > 0) {
            setX((prev) => prev + 1);
          }
        });

        return <sprite x={x()} />;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const sprite = stage.children[0]?.children[0];
      invariant(sprite);
      assert(sprite instanceof Sprite);

      expect(sprite.x).toBe(0);

      mockEl.dispatch("keydown", "ArrowRight");
      await ticker.tickFrames(1);
      expect(sprite.x).toBe(1);

      await ticker.tickFrames(5);
      expect(sprite.x).toBe(6);

      mockEl.dispatch("keyup", "ArrowRight");
      await ticker.tickFrames(3);
      expect(sprite.x).toBe(6);
    });

    test("text displays current pressed keys", async () => {
      const mockEl = createMockKeyboardElement();

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const pressed = keyboard.onKeyPress("KeyA", "KeyB", "KeyC");

        return <text>Pressed: {pressed().sort().join(", ")}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("Pressed: ");

      mockEl.dispatch("keydown", "KeyA");
      mockEl.dispatch("keydown", "KeyC");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("Pressed: KeyA, KeyC");
    });

    test("text displays current held keys", async () => {
      const mockEl = createMockKeyboardElement();

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const held = keyboard.onKeyHold("KeyA", "KeyB");

        return <text>Held: {held().sort().join(", ")}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatch("keydown", "KeyA");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("Held: KeyA");

      mockEl.dispatch("keydown", "KeyB");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("Held: KeyA, KeyB");
    });

    test("createSynchronizedEffect tracks key press changes", async () => {
      const mockEl = createMockKeyboardElement();
      const pressLog: string[] = [];

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const pressed = keyboard.onKeyPress("KeyA", "KeyB");

        createSynchronizedEffect(pressed, (keys) => {
          pressLog.push(keys.join(","));
        });

        return <text>tracking</text>;
      };

      const { ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      mockEl.dispatch("keydown", "KeyA");
      await ticker.tickFrames(1);
      expect(pressLog).toContain("KeyA");

      mockEl.dispatch("keydown", "KeyB");
      await ticker.tickFrames(1);
      expect(pressLog.length).toBeGreaterThan(1);
    });

    test("createSynchronizedEffect tracks key hold updates", async () => {
      const mockEl = createMockKeyboardElement();
      const holdLog: string[] = [];

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const held = keyboard.onKeyHold("KeyA");

        createSynchronizedEffect(held, (keys) => {
          holdLog.push(keys.join(","));
        });

        return <text>tracking</text>;
      };

      const { ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      mockEl.dispatch("keydown", "KeyA");
      await ticker.tickFrames(1);
      const count1 = holdLog.length;

      await ticker.tickFrames(3);
      expect(holdLog.length).toBe(count1 + 3);
    });

    test("complex keyboard-driven animation (WASD movement)", async () => {
      const mockEl = createMockKeyboardElement();

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const movement = keyboard.onKeyHold("KeyW", "KeyA", "KeyS", "KeyD");
        const [x, setX] = createSignal(0);
        const [y, setY] = createSignal(0);

        createSynchronizedEffect(movement, (keys) => {
          if (keys.includes("KeyW")) setY((prev) => prev - 1);
          if (keys.includes("KeyS")) setY((prev) => prev + 1);
          if (keys.includes("KeyA")) setX((prev) => prev - 1);
          if (keys.includes("KeyD")) setX((prev) => prev + 1);
        });

        return <sprite x={x()} y={y()} />;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const sprite = stage.children[0]?.children[0];
      invariant(sprite);
      assert(sprite instanceof Sprite);

      expect(sprite.x).toBe(0);
      expect(sprite.y).toBe(0);

      mockEl.dispatch("keydown", "KeyD");
      await ticker.tickFrames(3);
      expect(sprite.x).toBe(3);
      expect(sprite.y).toBe(0);

      mockEl.dispatch("keydown", "KeyW");
      await ticker.tickFrames(2);
      expect(sprite.x).toBe(5);
      expect(sprite.y).toBe(-2);

      mockEl.dispatch("keyup", "KeyD");
      await ticker.tickFrames(1);
      expect(sprite.x).toBe(5);
      expect(sprite.y).toBe(-3);
    });

    test("multiple UI elements react to different key combinations", async () => {
      const mockEl = createMockKeyboardElement();

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const arrows = keyboard.onKeyPress(
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
        );
        const wasd = keyboard.onKeyPress("KeyW", "KeyA", "KeyS", "KeyD");

        return (
          <>
            <text>Arrows: {arrows().length}</text>
            <text y={50}>WASD: {wasd().length}</text>
          </>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const container = stage.children[0];
      invariant(container);
      const arrowText = container.children[0];
      const wasdText = container.children[1];
      invariant(arrowText instanceof Text);
      invariant(wasdText instanceof Text);

      mockEl.dispatch("keydown", "ArrowUp");
      mockEl.dispatch("keydown", "ArrowDown");
      await ticker.tickFrames(1);
      expect(arrowText.text).toBe("Arrows: 2");
      expect(wasdText.text).toBe("WASD: 0");

      mockEl.dispatch("keydown", "KeyW");
      await ticker.tickFrames(1);
      expect(arrowText.text).toBe("Arrows: 2");
      expect(wasdText.text).toBe("WASD: 1");
    });
  });

  describe("Edge Cases and Error Scenarios", () => {
    test("watching zero keys (empty array)", async () => {
      const mockEl = createMockKeyboardElement();

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const pressed = keyboard.onKeyPress();

        return <text>{pressed().length}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatch("keydown", "KeyA");
      mockEl.dispatch("keydown", "KeyB");
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("0");
    });

    test("watching same key in multiple subscribers", async () => {
      const mockEl = createMockKeyboardElement();

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const pressed1 = keyboard.onKeyPress("KeyA");
        const pressed2 = keyboard.onKeyPress("KeyA");

        return (
          <>
            <text>{pressed1().join(",")}</text>
            <text y={50}>{pressed2().join(",")}</text>
          </>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const container = stage.children[0];
      invariant(container);
      const text1 = container.children[0];
      const text2 = container.children[1];
      invariant(text1 instanceof Text);
      invariant(text2 instanceof Text);

      mockEl.dispatch("keydown", "KeyA");
      await ticker.tickFrames(1);
      expect(text1.text).toBe("KeyA");
      expect(text2.text).toBe("KeyA");
    });

    test("rapid subscribe/unsubscribe cycles", async () => {
      const mockEl = createMockKeyboardElement();
      const [cycle, setCycle] = createSignal(0);

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const pressed = keyboard.onKeyPress("KeyA");

        return (
          <text>
            Cycle {cycle()}: {pressed().join(",")}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      for (let i = 1; i <= 5; i++) {
        setCycle(i);
        mockEl.dispatch("keydown", "KeyA");
        await ticker.tickFrames(1);
        expect(textNode.text).toContain("KeyA");
        mockEl.dispatch("keyup", "KeyA");
        await ticker.tickFrames(1);
      }
    });

    test("subscriber created, key pressed, value updates", async () => {
      const mockEl = createMockKeyboardElement();

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const pressed = keyboard.onKeyPress("KeyA");

        return <text>{pressed().join(",")}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      mockEl.dispatch("keydown", "KeyA");
      await ticker.tickFrames(1);

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("KeyA");
    });

    test("adding late subscriber picks up current key state", async () => {
      const mockEl = createMockKeyboardElement();
      const [showSecondSubscriber, setShowSecondSubscriber] =
        createSignal(false);

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const pressed1 = keyboard.onKeyPress("KeyA");

        return (
          <>
            <text>{pressed1().join(",")}</text>
            <text y={50}>
              {showSecondSubscriber()
                ? keyboard.onKeyPress("KeyA")().join(",")
                : "waiting"}
            </text>
          </>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const container = stage.children[0];
      invariant(container);

      mockEl.dispatch("keydown", "KeyA");
      await ticker.tickFrames(1);
      expect((container.children[0] as Text).text).toBe("KeyA");
      expect((container.children[1] as Text).text).toBe("waiting");

      setShowSecondSubscriber(true);
      await ticker.tickFrames(1);
      expect((container.children[0] as Text).text).toBe("KeyA");
      expect((container.children[1] as Text).text).toBe("KeyA");

      mockEl.dispatch("keyup", "KeyA");
      await ticker.tickFrames(1);
      expect((container.children[0] as Text).text).toBe("");
      expect((container.children[1] as Text).text).toBe("");
    });

    test("all keys released updates all subscribers", async () => {
      const mockEl = createMockKeyboardElement();

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const pressed1 = keyboard.onKeyPress("KeyA", "KeyB");
        const pressed2 = keyboard.onKeyPress("KeyB", "KeyC");

        return (
          <>
            <text>{pressed1().sort().join(",")}</text>
            <text y={50}>{pressed2().sort().join(",")}</text>
          </>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const container = stage.children[0];
      invariant(container);
      const text1 = container.children[0];
      const text2 = container.children[1];
      invariant(text1 instanceof Text);
      invariant(text2 instanceof Text);

      mockEl.dispatch("keydown", "KeyA");
      mockEl.dispatch("keydown", "KeyB");
      mockEl.dispatch("keydown", "KeyC");
      await ticker.tickFrames(1);
      expect(text1.text).toBe("KeyA,KeyB");
      expect(text2.text).toBe("KeyB,KeyC");

      mockEl.dispatch("keyup", "KeyA");
      mockEl.dispatch("keyup", "KeyB");
      mockEl.dispatch("keyup", "KeyC");
      await ticker.tickFrames(1);
      expect(text1.text).toBe("");
      expect(text2.text).toBe("");
    });

    test("non-standard keyCodes handled", async () => {
      const mockEl = createMockKeyboardElement();

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);
        const pressed = keyboard.onKeyPress("Unidentified", "Fn");

        return <text>{pressed().join(",")}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatch("keydown", "Unidentified");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("Unidentified");

      mockEl.dispatch("keydown", "Fn");
      await ticker.tickFrames(1);
      expect(textNode.text).toContain("Fn");
    });

    test("subscriber cleanup while keys still pressed", async () => {
      const mockEl = createMockKeyboardElement();
      const [showPressTracker, setShowPressTracker] = createSignal(true);

      const TestComponent = () => {
        const keyboard = createKeyboard(mockEl);

        return (
          <>
            <text>
              {showPressTracker()
                ? keyboard.onKeyPress("KeyA")().join(",")
                : ""}
            </text>
            <text y={50}>{showPressTracker() ? "tracking" : "cleaned"}</text>
          </>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const container = stage.children[0];
      invariant(container);

      mockEl.dispatch("keydown", "KeyA");
      await ticker.tickFrames(1);
      expect((container.children[0] as Text).text).toBe("KeyA");
      expect((container.children[1] as Text).text).toBe("tracking");

      setShowPressTracker(false);
      await ticker.tickFrames(1);
      expect((container.children[0] as Text).text).toBe("");
      expect((container.children[1] as Text).text).toBe("cleaned");

      mockEl.dispatch("keyup", "KeyA");
      await ticker.tickFrames(1);
      expect((container.children[0] as Text).text).toBe("");
      expect((container.children[1] as Text).text).toBe("cleaned");
    });
  });
});
