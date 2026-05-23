import { describe, expect, test, vi } from "vitest";
import {
  createSignal,
  Show,
} from "../../../../pixi-jsx/solidjs-universal-renderer/index.js";
import { Container, Graphics as PixiGraphics, Text } from "pixi.js";
import { renderApplicationWithFakeTicker } from "../../../../__tests__/test-utils/test-utils.js";
import { Checkbox } from "../../../components/extensions/ui/Checkbox.jsx";

const getSceneRoot = (stage: Container) => stage.children[0] as Container;
const getCheckboxContainer = (stage: Container) =>
  getSceneRoot(stage).children[0] as Container;

const getCheckboxParts = (stage: Container) => {
  const container = getCheckboxContainer(stage);
  const [box, checkmark, label] = container.children;

  expect(box).toBeInstanceOf(PixiGraphics);
  expect(checkmark).toBeInstanceOf(PixiGraphics);

  return {
    container,
    box: box as PixiGraphics,
    checkmark: checkmark as PixiGraphics,
    label: label as Text | undefined,
  };
};

describe("Checkbox", () => {
  test("renders box, checked checkmark, and label", async () => {
    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => (
        <Checkbox
          checked
          size={32}
          label="Enable sound"
          labelColor={0xff00ff}
          fontSize={18}
          boxColor={0x111111}
          checkColor={0xffffff}
          borderColor={0x222222}
        />
      ),
    );

    await ticker.tickFrames(1);

    const { container, box, checkmark, label } = getCheckboxParts(stage);
    expect(container.eventMode).toBe("static");
    expect(container.cursor).toBe("pointer");
    expect(container.children).toHaveLength(3);
    expect(box.width).toBe(34);
    expect(box.height).toBe(34);
    expect(checkmark.width).toBeGreaterThan(0);
    expect(checkmark.height).toBeGreaterThan(0);
    expect(label).toBeInstanceOf(Text);
    expect(label?.text).toBe("Enable sound");
    expect(label?.style.fontSize).toBe(18);
    expect(label?.style.fill).toBe(0xff00ff);
    expect(label?.x).toBe(42);

    dispose();
  });

  test("omits label and checkmark drawing when unchecked", async () => {
    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => (
        <Checkbox checked={false} boxColor={0x000000} checkColor={0xffffff} />
      ),
    );

    await ticker.tickFrames(1);

    const { container, box, checkmark, label } = getCheckboxParts(stage);
    expect(container.children).toHaveLength(2);
    expect(box.width).toBe(26);
    expect(box.height).toBe(26);
    expect(checkmark.width).toBe(0);
    expect(checkmark.height).toBe(0);
    expect(label).toBeUndefined();

    dispose();
  });

  test("toggles through pointerdown using the controlled checked value", async () => {
    const onChange = vi.fn();
    const [checked, setChecked] = createSignal(false);

    const TestComponent = () => (
      <Checkbox
        checked={checked()}
        boxColor={0x000000}
        checkColor={0xffffff}
        onChange={(nextChecked) => {
          onChange(nextChecked);
          setChecked(nextChecked);
        }}
      />
    );

    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => <TestComponent />,
    );

    await ticker.tickFrames(1);
    const container = getCheckboxContainer(stage);

    container.emit("pointerdown", {} as never);
    await ticker.tickFrames(1);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(true);
    expect(getCheckboxParts(stage).checkmark.width).toBeGreaterThan(0);

    container.emit("pointerdown", {} as never);
    await ticker.tickFrames(1);

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(getCheckboxParts(stage).checkmark.width).toBe(0);

    dispose();
  });

  test("reacts to checked, size, label, and color changes", async () => {
    const fillSpy = vi.spyOn(PixiGraphics.prototype, "fill");
    const strokeSpy = vi.spyOn(PixiGraphics.prototype, "stroke");
    const [checked, setChecked] = createSignal(false);
    const [size, setSize] = createSignal(20);
    const [label, setLabel] = createSignal("Off");
    const [boxColor, setBoxColor] = createSignal(0x111111);
    const [checkColor, setCheckColor] = createSignal(0x222222);
    const [borderColor, setBorderColor] = createSignal(0x333333);

    const TestComponent = () => (
      <Checkbox
        checked={checked()}
        size={size()}
        label={label()}
        boxColor={boxColor()}
        checkColor={checkColor()}
        borderColor={borderColor()}
      />
    );

    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => <TestComponent />,
    );

    await ticker.tickFrames(1);
    expect(getCheckboxParts(stage).box.width).toBe(22);
    expect(getCheckboxParts(stage).label?.text).toBe("Off");

    setChecked(true);
    setSize(40);
    setLabel("On");
    setBoxColor(0x444444);
    setCheckColor(0x555555);
    setBorderColor(0x666666);
    await ticker.tickFrames(1);

    const { box, checkmark, label: renderedLabel } = getCheckboxParts(stage);
    expect(box.width).toBe(42);
    expect(box.height).toBe(42);
    expect(checkmark.width).toBeGreaterThan(0);
    expect(renderedLabel?.text).toBe("On");
    expect(renderedLabel?.x).toBe(50);
    expect(fillSpy).toHaveBeenCalledWith(0x444444);
    expect(strokeSpy).toHaveBeenCalledWith({ color: 0x666666, width: 2 });
    expect(strokeSpy).toHaveBeenCalledWith({ color: 0x555555, width: 3 });

    dispose();
    fillSpy.mockRestore();
    strokeSpy.mockRestore();
  });

  test("cleans pointer listeners and leaves the scene graph when removed", async () => {
    const onChange = vi.fn();
    const [visible, setVisible] = createSignal(true);

    const TestComponent = () => (
      <Show when={visible()}>
        <Checkbox
          checked={false}
          boxColor={0x000000}
          checkColor={0xffffff}
          onChange={onChange}
        />
      </Show>
    );

    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => <TestComponent />,
    );

    await ticker.tickFrames(1);
    const root = getSceneRoot(stage);
    const container = getCheckboxContainer(stage);

    container.emit("pointerdown", {} as never);
    expect(onChange).toHaveBeenCalledTimes(1);

    setVisible(false);
    await ticker.tickFrames(1);

    expect(root.children).toHaveLength(0);
    container.emit("pointerdown", {} as never);
    expect(onChange).toHaveBeenCalledTimes(1);

    dispose();
  });
});
