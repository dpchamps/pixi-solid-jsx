import {
  createEffect,
  createSignal,
  onCleanup,
} from "../../../../pixi-jsx/solidjs-universal-renderer/index.js";
import type {
  ContainerIntrinsicProps,
  Ref,
} from "../../../../pixi-jsx/jsx/jsx-node.js";
import { Graphics, Text, TextStyle } from "pixi.js";

/**
 * Props for {@link Checkbox}.
 */
export type CheckboxProps = {
  /** Whether the checkmark is currently visible. */
  checked: boolean;
  /** Width and height of the square checkbox in pixels. Defaults to `24`. */
  size?: number;
  /** Optional text rendered to the right of the checkbox. */
  label?: string;
  /** Fill color for the optional label. Defaults to `checkColor`. */
  labelColor?: number;
  /** Font size for the optional label. Defaults to `14`. */
  fontSize?: number;
  /** Fill color for the checkbox square. */
  boxColor: number;
  /** Stroke color for the checkmark. */
  checkColor: number;
  /** Stroke color for the checkbox border. Defaults to `checkColor`. */
  borderColor?: number;
  /** Called with the next checked value when the checkbox is pressed. */
  onChange?: (checked: boolean) => void;
};

const DEFAULT_SIZE = 24;
const DEFAULT_FONT_SIZE = 14;
const DEFAULT_CORNER_RADIUS = 4;
const DEFAULT_LABEL_GAP = 10;
const DEFAULT_CHECKMARK_WIDTH = 3;

const drawBox = (
  graphics: Graphics,
  size: number,
  boxColor: number,
  borderColor: number,
) => {
  graphics.roundRect(0, 0, size, size, DEFAULT_CORNER_RADIUS);
  graphics.fill(boxColor);
  graphics.roundRect(0, 0, size, size, DEFAULT_CORNER_RADIUS);
  graphics.stroke({ color: borderColor, width: 2 });
};

const drawCheckmark = (
  graphics: Graphics,
  visible: boolean,
  size: number,
  checkColor: number,
) => {
  graphics.clear();
  if (!visible) return;

  const padding = size * 0.2;
  const startX = padding;
  const startY = size * 0.5;
  const midX = size * 0.4;
  const midY = size - padding;
  const endX = size - padding;
  const endY = padding;

  graphics.moveTo(startX, startY);
  graphics.lineTo(midX, midY);
  graphics.lineTo(endX, endY);
  graphics.stroke({ color: checkColor, width: DEFAULT_CHECKMARK_WIDTH });
};

/**
 * Interactive Pixi checkbox with an optional text label.
 *
 * The component renders a `container` containing a box graphic, a checkmark
 * graphic, and an optional Pixi `Text` label. It is controlled: user presses
 * call `onChange(!checked)`, and callers update `checked` to redraw the visual
 * state.
 *
 * @param props - Checkbox visual state, colors, label, and change callback.
 * @returns A Pixi container JSX node containing the checkbox graphics.
 *
 * @example
 * ```tsx
 * const [muted, setMuted] = createSignal(false);
 *
 * <Checkbox
 *   checked={muted()}
 *   label="Mute"
 *   boxColor={0x111111}
 *   checkColor={0xffffff}
 *   onChange={setMuted}
 * />
 * ```
 */
export const Checkbox = (props: CheckboxProps) => {
  const [containerRef, setContainerRef] =
    createSignal<Ref<ContainerIntrinsicProps>>();

  createEffect(() => {
    const node = containerRef();
    if (!node) return;

    const container = node.container;
    const size = props.size ?? DEFAULT_SIZE;
    const borderColor = props.borderColor ?? props.checkColor;

    container.removeChildren().forEach((child) => child.destroy());

    const box = new Graphics();
    drawBox(box, size, props.boxColor, borderColor);

    const checkmark = new Graphics();
    drawCheckmark(checkmark, props.checked, size, props.checkColor);

    container.addChild(box, checkmark);

    if (props.label) {
      const labelText = new Text({
        text: props.label,
        style: new TextStyle({
          fill: props.labelColor ?? props.checkColor,
          fontSize: props.fontSize ?? DEFAULT_FONT_SIZE,
        }),
      });
      labelText.x = size + DEFAULT_LABEL_GAP;
      labelText.y = (size - labelText.height) / 2;
      container.addChild(labelText);
    }

    container.eventMode = "static";
    container.cursor = "pointer";

    const onClick = () => {
      props.onChange?.(!props.checked);
    };

    container.on("pointerdown", onClick);

    onCleanup(() => {
      container.off("pointerdown", onClick);
      container.removeChildren().forEach((child) => child.destroy());
      container.eventMode = "auto";
      container.cursor = "auto";
    });
  });

  return <container ref={setContainerRef} />;
};
