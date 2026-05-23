import {
  createEffect,
  createSignal,
  onCleanup,
  untrack,
} from "../../../../pixi-jsx/solidjs-universal-renderer/index.js";
import { PixiExternalContainer } from "../../PixiExternalContainer.jsx";
import { Graphics } from "pixi.js";
import { Slider as PixiSlider } from "@pixi/ui";

/**
 * Props for {@link Slider}.
 */
export type SliderProps = {
  /** Controlled slider value. */
  value: number;
  /** Minimum slider value. Defaults to `0`. */
  min?: number;
  /** Maximum slider value. Defaults to `1`. */
  max?: number;
  /** Width of the slider track. */
  width: number;
  /** Height of the slider track. Defaults to `8`. */
  height?: number;
  /** Value increment used by Pixi UI while dragging. Defaults to `1`. */
  step?: number;
  /** Color of the inactive track. */
  trackColor: number;
  /** Color of the active fill track. */
  fillColor: number;
  /** Color of the circular handle. */
  handleColor: number;
  /** Radius of the circular handle. Defaults to `12`. */
  handleRadius?: number;
  /** Called whenever Pixi UI emits an update value. */
  onChange?: (value: number) => void;
};

const DEFAULT_MIN = 0;
const DEFAULT_MAX = 1;
const DEFAULT_TRACK_HEIGHT = 8;
const DEFAULT_STEP = 1;
const DEFAULT_HANDLE_RADIUS = 12;

/**
 * Creates a rounded track graphic for {@link Slider}.
 *
 * @param width - Track width.
 * @param height - Track height.
 * @param color - Track fill color.
 * @returns A Pixi graphics object suitable for Pixi UI `Slider` backgrounds.
 */
export const createSliderTrackGraphics = (
  width: number,
  height: number,
  color: number,
) => {
  const graphics = new Graphics();
  graphics.roundRect(0, 0, width, height, height / 2);
  graphics.fill(color);
  return graphics;
};

/**
 * Creates a circular handle graphic for {@link Slider}.
 *
 * @param radius - Handle radius.
 * @param color - Handle fill color.
 * @returns A Pixi graphics object suitable for Pixi UI `Slider` handles.
 */
export const createSliderHandleGraphics = (radius: number, color: number) => {
  const graphics = new Graphics();
  graphics.circle(0, 0, radius);
  graphics.fill(color);
  return graphics;
};

/**
 * Pixi UI single-value slider component.
 *
 * This component wraps `@pixi/ui`'s `Slider` class and bridges it into the Sylph
 * JSX scene graph. Visual configuration changes recreate the underlying Pixi UI
 * slider, while `value` is also synchronized to the current instance.
 *
 * @param props - Slider value range, dimensions, colors, and update callback.
 * @returns A Pixi external-container bridge containing the Pixi UI slider.
 *
 * @example
 * ```tsx
 * const [volume, setVolume] = createSignal(0.5);
 *
 * <Slider
 *   value={volume()}
 *   min={0}
 *   max={1}
 *   step={0.05}
 *   width={220}
 *   trackColor={0x333333}
 *   fillColor={0x66ccff}
 *   handleColor={0xffffff}
 *   onChange={setVolume}
 * />
 * ```
 */
export const Slider = (props: SliderProps) => {
  const [slider, setSlider] = createSignal<PixiSlider>();

  createEffect(() => {
    const min = props.min ?? DEFAULT_MIN;
    const max = props.max ?? DEFAULT_MAX;
    const trackHeight = props.height ?? DEFAULT_TRACK_HEIGHT;
    const handleRadius = props.handleRadius ?? DEFAULT_HANDLE_RADIUS;
    const step = props.step ?? DEFAULT_STEP;
    const value = untrack(() => props.value);

    const instance = new PixiSlider({
      bg: createSliderTrackGraphics(props.width, trackHeight, props.trackColor),
      fill: createSliderTrackGraphics(props.width, trackHeight, props.fillColor),
      slider: createSliderHandleGraphics(handleRadius, props.handleColor),
      min,
      max,
      step,
      value,
      fillPaddings: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    });

    if (props.onChange) {
      instance.onUpdate.connect(props.onChange);
    }

    setSlider(instance);

    onCleanup(() => {
      instance.onUpdate.disconnectAll();
      instance.onChange.disconnectAll();
      setSlider((current) => (current === instance ? undefined : current));
      instance.destroy({ children: true });
    });
  });

  createEffect(() => {
    const instance = slider();
    if (!instance || instance.destroyed || instance.value === props.value) return;
    instance.value = props.value;
  });

  return <PixiExternalContainer container={slider()} />;
};
