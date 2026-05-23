import { describe, expect, test, vi } from "vitest";
import { createSignal } from "../../../../pixi-jsx/solidjs-universal-renderer/index.js";
import { Container, Graphics } from "pixi.js";
import { Slider as PixiSlider } from "@pixi/ui";
import { renderApplicationWithFakeTicker } from "../../../../__tests__/test-utils/test-utils.js";
import { Slider } from "../../../components/extensions/ui/Slider.jsx";

const getSceneRoot = (stage: Container) => stage.children[0] as Container;
const getWrapper = (stage: Container) => getSceneRoot(stage).children[0] as Container;

const getPixiSlider = (stage: Container) => {
  const wrapper = getWrapper(stage);
  const slider = wrapper.children[0];

  expect(slider).toBeInstanceOf(PixiSlider);
  return slider as PixiSlider;
};

const sliderInternals = (slider: PixiSlider) =>
  slider as unknown as {
    bg: Graphics;
    fill: Graphics;
    _slider1: Container;
  };

describe("Slider", () => {
  test("creates a Pixi UI slider with track, fill, handle, and value options", async () => {
    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => (
        <Slider
          value={5}
          min={0}
          max={10}
          step={0.5}
          width={240}
          height={12}
          trackColor={0x222222}
          fillColor={0x66ccff}
          handleColor={0xffffff}
          handleRadius={14}
        />
      ),
    );

    await ticker.tickFrames(1);

    const slider = getPixiSlider(stage);
    const internals = sliderInternals(slider);

    expect(slider.min).toBe(0);
    expect(slider.max).toBe(10);
    expect(slider.step).toBe(0.5);
    expect(slider.value).toBe(5);
    expect(slider.width).toBe(240);
    expect(internals.bg).toBeInstanceOf(Graphics);
    expect(internals.fill).toBeInstanceOf(Graphics);
    expect(internals._slider1).toBeInstanceOf(Container);
    expect(internals._slider1.width).toBeGreaterThan(0);
    expect(slider.progress).toBe(50);

    dispose();
  });

  test("connects Pixi UI onUpdate to onChange", async () => {
    const onChange = vi.fn();
    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => (
        <Slider
          value={0}
          min={0}
          max={1}
          step={0.1}
          width={100}
          trackColor={0x222222}
          fillColor={0x66ccff}
          handleColor={0xffffff}
          onChange={onChange}
        />
      ),
    );

    await ticker.tickFrames(1);

    const slider = getPixiSlider(stage);
    slider.value = 0.7;

    expect(onChange).toHaveBeenCalledWith(0.7);

    dispose();
  });

  test("synchronizes controlled value changes to the Pixi UI slider", async () => {
    const [value, setValue] = createSignal(0.25);

    const TestComponent = () => (
      <Slider
        value={value()}
        min={0}
        max={1}
        step={0.05}
        width={100}
        trackColor={0x222222}
        fillColor={0x66ccff}
        handleColor={0xffffff}
      />
    );

    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => <TestComponent />,
    );

    await ticker.tickFrames(1);
    const slider = getPixiSlider(stage);
    expect(slider.value).toBe(0.25);

    setValue(0.75);
    await ticker.tickFrames(1);

    expect(slider.value).toBe(0.75);
    expect(slider.progress).toBe(75);

    dispose();
  });

  test("recreates the Pixi UI slider when visual options change", async () => {
    const [width, setWidth] = createSignal(120);
    const [height, setHeight] = createSignal(8);
    const [handleRadius, setHandleRadius] = createSignal(10);

    const TestComponent = () => (
      <Slider
        value={0.5}
        min={0}
        max={1}
        step={0.1}
        width={width()}
        height={height()}
        handleRadius={handleRadius()}
        trackColor={0x222222}
        fillColor={0x66ccff}
        handleColor={0xffffff}
      />
    );

    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => <TestComponent />,
    );

    await ticker.tickFrames(1);
    const firstSlider = getPixiSlider(stage);
    const firstHandleWidth = sliderInternals(firstSlider)._slider1.width;

    setWidth(220);
    setHeight(12);
    setHandleRadius(16);
    await ticker.tickFrames(1);

    const secondSlider = getPixiSlider(stage);
    expect(secondSlider).not.toBe(firstSlider);
    expect(firstSlider.destroyed).toBe(true);
    expect(secondSlider.width).toBe(220);
    expect(sliderInternals(secondSlider)._slider1.width).toBeGreaterThan(
      firstHandleWidth,
    );
    expect(getWrapper(stage).children).toEqual([secondSlider]);

    dispose();
  });

  test("disconnects callbacks and destroys the slider on cleanup", async () => {
    const onChange = vi.fn();
    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => (
        <Slider
          value={0}
          width={100}
          trackColor={0x222222}
          fillColor={0x66ccff}
          handleColor={0xffffff}
          onChange={onChange}
        />
      ),
    );

    await ticker.tickFrames(1);
    const slider = getPixiSlider(stage);

    dispose();

    expect(slider.destroyed).toBe(true);
    slider.onUpdate.emit(0.5);
    expect(onChange).not.toHaveBeenCalled();
  });
});
