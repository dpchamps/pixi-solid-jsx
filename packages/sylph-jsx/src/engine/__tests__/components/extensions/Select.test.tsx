import { beforeEach, describe, expect, test, vi } from "vitest";
import { createSignal } from "../../../../pixi-jsx/solidjs-universal-renderer/index.js";
import { Container, Graphics, Text } from "pixi.js";
import { Select as PixiSelect } from "@pixi/ui";
import { renderApplicationWithFakeTicker } from "../../../../__tests__/test-utils/test-utils.js";
import { Select } from "../../../components/extensions/ui/Select.jsx";

const getSceneRoot = (stage: Container) => stage.children[0] as Container;
const getWrapper = (stage: Container) => getSceneRoot(stage).children[0] as Container;

const getPixiSelect = (stage: Container) => {
  const wrapper = getWrapper(stage);
  const select = wrapper.children[0];

  expect(select).toBeInstanceOf(PixiSelect);
  return select as PixiSelect;
};

const selectInternals = (select: PixiSelect) =>
  select as unknown as {
    view: Container;
    openButton: Container & { text?: string; visible: boolean };
    closeButton: Container & { text?: string; visible: boolean };
    openView: Container;
    scrollBox: { width: number; height: number; items: Container[] };
  };

const findText = (container: Container): Text | undefined => {
  for (const child of container.children) {
    if (child instanceof Text) return child;
    if (child instanceof Container) {
      const nested = findText(child);
      if (nested) return nested;
    }
  }

  return undefined;
};

const findGraphics = (container: Container): Graphics | undefined => {
  for (const child of container.children) {
    if (child instanceof Graphics) return child;
    if (child instanceof Container) {
      const nested = findGraphics(child);
      if (nested) return nested;
    }
  }

  return undefined;
};

describe("Select", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("creates a Pixi UI select with items, selected text, dimensions, and styles", async () => {
    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => (
        <Select
          items={["Easy", "Normal", "Hard"]}
          selected={1}
          width={240}
          height={44}
          backgroundColor={0x111111}
          hoverColor={0x222222}
          textColor={0xffcc00}
          fontSize={18}
          fontFamily="Arial"
          borderColor={0xffffff}
          borderWidth={2}
          radius={8}
          visibleItems={2}
        />
      ),
    );

    await ticker.tickFrames(1);

    const select = getPixiSelect(stage);
    const internals = selectInternals(select);
    const selectedText = findText(internals.openButton);

    expect(internals.openButton.text).toBe("Normal");
    expect(internals.closeButton.text).toBe("Normal");
    expect(selectedText?.style.fontSize).toBe(18);
    expect(selectedText?.style.fontFamily).toBe("Arial");
    expect(selectedText?.style.fill).toBe(0xffcc00);
    expect(internals.scrollBox.width).toBe(240);
    expect(internals.scrollBox.height).toBe(88);
    expect(internals.scrollBox.items).toHaveLength(3);
    expect(internals.openButton.width).toBeGreaterThanOrEqual(240);
    expect(findGraphics(internals.openButton)).toBeInstanceOf(Graphics);

    dispose();
  });

  test("emits selection callback and updates visible selected text", async () => {
    const onSelect = vi.fn();
    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => (
        <Select
          items={["One", "Two", "Three"]}
          width={180}
          height={40}
          backgroundColor={0x111111}
          onSelect={onSelect}
        />
      ),
    );

    await ticker.tickFrames(1);

    const select = getPixiSelect(stage);
    const internals = selectInternals(select);
    const secondItem = internals.scrollBox.items[1] as Container & {
      onPress: { emit: () => void };
    };

    secondItem.onPress.emit();

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(1, "Two");
    expect(select.value).toBe(1);
    expect(internals.openButton.text).toBe("Two");
    expect(internals.closeButton.text).toBe("Two");
    expect(internals.view.visible).toBe(false);

    dispose();
  });

  test("closes on outside canvas pointerdown and ignores inside pointerdown", async () => {
    const pointerListeners = new Set<EventListener>();
    const originalAdd = HTMLCanvasElement.prototype.addEventListener;
    const originalRemove = HTMLCanvasElement.prototype.removeEventListener;

    vi.spyOn(HTMLCanvasElement.prototype, "addEventListener").mockImplementation(
      function (this: HTMLCanvasElement, type, listener, options) {
        if (type === "pointerdown" && typeof listener === "function") {
          pointerListeners.add(listener as EventListener);
        }
        return originalAdd.call(this, type, listener, options);
      },
    );
    vi.spyOn(
      HTMLCanvasElement.prototype,
      "removeEventListener",
    ).mockImplementation(function (this: HTMLCanvasElement, type, listener, options) {
      if (type === "pointerdown" && typeof listener === "function") {
        pointerListeners.delete(listener as EventListener);
      }
      return originalRemove.call(this, type, listener, options);
    });
    vi.spyOn(
      HTMLCanvasElement.prototype,
      "getBoundingClientRect",
    ).mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      toJSON: () => undefined,
    });

    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => (
        <Select
          items={["One", "Two"]}
          width={160}
          height={40}
          backgroundColor={0x111111}
        />
      ),
    );

    await ticker.tickFrames(1);

    const select = getPixiSelect(stage);
    vi.spyOn(select, "getBounds").mockReturnValue({
      minX: 0,
      minY: 0,
      maxX: 160,
      maxY: 80,
    } as ReturnType<PixiSelect["getBounds"]>);
    const internals = selectInternals(select);
    const listener = [...pointerListeners].at(-1);
    expect(listener).toBeDefined();
    if (!listener) throw new Error("Expected select pointer listener");

    select.open();
    expect(internals.view.visible).toBe(true);

    listener(new PointerEvent("pointerdown", { clientX: 10, clientY: 10 }));
    expect(internals.view.visible).toBe(true);

    listener(new PointerEvent("pointerdown", { clientX: 500, clientY: 500 }));
    expect(internals.view.visible).toBe(false);

    dispose();
    expect(pointerListeners.has(listener)).toBe(false);
  });

  test("recreates the Pixi UI select when items or selected index change", async () => {
    const [items, setItems] = createSignal(["A", "B"]);
    const [selected, setSelected] = createSignal(0);

    const TestComponent = () => (
      <Select
        items={items()}
        selected={selected()}
        width={150}
        height={36}
        backgroundColor={0x111111}
      />
    );

    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => <TestComponent />,
    );

    await ticker.tickFrames(1);
    const firstSelect = getPixiSelect(stage);
    expect(selectInternals(firstSelect).openButton.text).toBe("A");
    expect(selectInternals(firstSelect).scrollBox.items).toHaveLength(2);

    setItems(["A", "B", "C"]);
    setSelected(2);
    await ticker.tickFrames(1);

    const secondSelect = getPixiSelect(stage);
    expect(secondSelect).not.toBe(firstSelect);
    expect(firstSelect.destroyed).toBe(true);
    expect(selectInternals(secondSelect).openButton.text).toBe("C");
    expect(selectInternals(secondSelect).scrollBox.items).toHaveLength(3);
    expect(getWrapper(stage).children).toEqual([secondSelect]);

    dispose();
  });

  test("disconnects select callbacks and destroys the instance on cleanup", async () => {
    const onSelect = vi.fn();
    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => (
        <Select
          items={["One", "Two"]}
          width={160}
          height={40}
          backgroundColor={0x111111}
          onSelect={onSelect}
        />
      ),
    );

    await ticker.tickFrames(1);
    const select = getPixiSelect(stage);
    const secondItem = selectInternals(select).scrollBox.items[1] as Container & {
      onPress: { emit: () => void };
    };

    dispose();

    expect(select.destroyed).toBe(true);
    secondItem.onPress.emit();
    expect(onSelect).not.toHaveBeenCalled();
  });
});
