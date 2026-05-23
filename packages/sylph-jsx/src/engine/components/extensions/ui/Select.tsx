import {
  createEffect,
  createSignal,
  onCleanup,
} from "../../../../pixi-jsx/solidjs-universal-renderer/index.js";
import { PixiExternalContainer } from "../../PixiExternalContainer.jsx";
import { useApplicationState } from "../../Application.jsx";
import { Graphics } from "pixi.js";
import { Select as PixiSelect, type SelectOptions } from "@pixi/ui";

/**
 * Props for {@link Select}.
 */
export type SelectProps = {
  /** Item labels shown in the dropdown. */
  items: string[];
  /** Initially selected item index. Defaults to `0`. */
  selected?: number;
  /** Width of the select control and dropdown. */
  width: number;
  /** Height of the closed select control. */
  height: number;
  /** Height of each dropdown item. Defaults to `height`, then `40`. */
  itemHeight?: number;
  /** Fill color for the closed control and dropdown items. */
  backgroundColor: number;
  /** Fill color for hovered dropdown items. Defaults to `backgroundColor`. */
  hoverColor?: number;
  /** Text and chevron color. Defaults to white. */
  textColor?: number;
  /** Font size for selected and item text. Defaults to `14`. */
  fontSize?: number;
  /** Font family for selected and item text. */
  fontFamily?: string;
  /** Optional border color for the select background. */
  borderColor?: number;
  /** Optional border width for the select background. */
  borderWidth?: number;
  /** Corner radius for backgrounds. Defaults to `4`. */
  radius?: number;
  /** Maximum visible dropdown items before scrolling. Defaults to min(items.length, 4). */
  visibleItems?: number;
  /** Optional offset for selected text in the closed/open buttons. */
  selectedTextOffset?: SelectOptions["selectedTextOffset"];
  /** Optional offset for the dropdown ScrollBox. */
  scrollBoxOffset?: NonNullable<SelectOptions["scrollBox"]>["offset"];
  /** Called when the user selects an item. */
  onSelect?: (value: number, text: string) => void;
};

const DEFAULT_ITEM_HEIGHT = 40;
const DEFAULT_RADIUS = 4;
const DEFAULT_VISIBLE_ITEM_LIMIT = 4;
const DEFAULT_TEXT_COLOR = 0xffffff;
const DEFAULT_FONT_SIZE = 14;
const DEFAULT_FONT_FAMILY = "Cinzel Decorative";
const DEFAULT_CHEVRON_SIZE = 10;
const DEFAULT_CHEVRON_MARGIN_RIGHT = 20;

/**
 * Creates the rounded Pixi `Graphics` background used by {@link Select}.
 *
 * @param width - Background width.
 * @param height - Background height.
 * @param backgroundColor - Fill color.
 * @param borderColor - Optional border color.
 * @param borderWidth - Optional border width.
 * @param radius - Optional corner radius.
 * @returns A Pixi graphics object suitable for `@pixi/ui` select backgrounds.
 */
export const createSelectBackground = (
  width: number,
  height: number,
  backgroundColor: number,
  borderColor?: number,
  borderWidth?: number,
  radius = DEFAULT_RADIUS,
) => {
  const graphics = new Graphics();
  graphics.roundRect(0, 0, width, height, radius);
  graphics.fill(backgroundColor);

  if (borderColor !== undefined && borderWidth !== undefined) {
    graphics.roundRect(0, 0, width, height, radius);
    graphics.stroke({ color: borderColor, width: borderWidth });
  }

  return graphics;
};

/**
 * Creates the up/down chevron used by {@link Select}.
 *
 * @param x - Chevron center x-coordinate.
 * @param y - Chevron center y-coordinate.
 * @param size - Chevron width in pixels.
 * @param color - Stroke color.
 * @param direction - Whether the chevron points up or down.
 * @returns A Pixi graphics object containing the chevron stroke.
 */
export const createSelectChevron = (
  x: number,
  y: number,
  size: number,
  color: number,
  direction: "up" | "down",
) => {
  const graphics = new Graphics();
  const halfSize = size / 2;

  if (direction === "down") {
    graphics.moveTo(x - halfSize, y - halfSize / 2);
    graphics.lineTo(x, y + halfSize / 2);
    graphics.lineTo(x + halfSize, y - halfSize / 2);
  } else {
    graphics.moveTo(x - halfSize, y + halfSize / 2);
    graphics.lineTo(x, y - halfSize / 2);
    graphics.lineTo(x + halfSize, y + halfSize / 2);
  }

  graphics.stroke({ color, width: 2 });
  return graphics;
};

const isSelectOpen = (select: PixiSelect) =>
  (select as unknown as { view: { visible: boolean } }).view.visible;

/**
 * Pixi UI select/dropdown component.
 *
 * This component wraps `@pixi/ui`'s `Select` class and recreates the underlying
 * Pixi control when its declarative props change. It also installs an
 * application-canvas `pointerdown` listener that closes the dropdown when the
 * user clicks outside the select bounds.
 *
 * @param props - Select items, styling, sizing, and selection callback.
 * @returns A Pixi external-container bridge containing the Pixi UI select.
 *
 * @example
 * ```tsx
 * <Select
 *   items={["Low", "Medium", "High"]}
 *   selected={1}
 *   width={220}
 *   height={40}
 *   backgroundColor={0x111111}
 *   borderColor={0xffffff}
 *   borderWidth={2}
 *   onSelect={(index, text) => console.log(index, text)}
 * />
 * ```
 */
export const Select = (props: SelectProps) => {
  const [select, setSelect] = createSignal<PixiSelect>();
  const appState = useApplicationState();

  createEffect(() => {
    const itemHeight = props.itemHeight ?? props.height ?? DEFAULT_ITEM_HEIGHT;
    const radius = props.radius ?? DEFAULT_RADIUS;
    const visibleItems =
      props.visibleItems ?? Math.min(props.items.length, DEFAULT_VISIBLE_ITEM_LIMIT);
    const scrollBoxHeight = itemHeight * visibleItems;
    const chevronColor = props.textColor ?? DEFAULT_TEXT_COLOR;
    const chevronX = props.width - DEFAULT_CHEVRON_MARGIN_RIGHT;
    const chevronY = itemHeight / 2;

    const closedBG = createSelectBackground(
      props.width,
      itemHeight,
      props.backgroundColor,
      props.borderColor,
      props.borderWidth,
      radius,
    );
    closedBG.addChild(
      createSelectChevron(
        chevronX,
        chevronY,
        DEFAULT_CHEVRON_SIZE,
        chevronColor,
        "down",
      ),
    );

    const openBG = createSelectBackground(
      props.width,
      itemHeight,
      props.backgroundColor,
      props.borderColor,
      props.borderWidth,
      radius,
    );
    openBG.addChild(
      createSelectChevron(
        chevronX,
        chevronY,
        DEFAULT_CHEVRON_SIZE,
        chevronColor,
        "up",
      ),
    );

    const textStyle = {
      fill: chevronColor,
      fontSize: props.fontSize ?? DEFAULT_FONT_SIZE,
      fontFamily: props.fontFamily ?? DEFAULT_FONT_FAMILY,
    };

    const instance = new PixiSelect({
      closedBG,
      openBG,
      textStyle,
      selected: props.selected ?? 0,
      selectedTextOffset: props.selectedTextOffset,
      items: {
        items: props.items,
        backgroundColor: props.backgroundColor,
        hoverColor: props.hoverColor ?? props.backgroundColor,
        width: props.width,
        height: itemHeight,
        textStyle,
        radius,
      },
      scrollBox: {
        width: props.width,
        height: scrollBoxHeight,
        radius,
        offset: props.scrollBoxOffset,
      },
      visibleItems,
    });

    if (props.onSelect) {
      instance.onSelect.connect(props.onSelect);
    }

    const app = appState.application;
    const handleClickOutside = (event: PointerEvent) => {
      if (!isSelectOpen(instance)) return;

      const bounds = instance.getBounds();
      const rect = app.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const isInside =
        x >= bounds.minX &&
        x <= bounds.maxX &&
        y >= bounds.minY &&
        y <= bounds.maxY;

      if (!isInside) {
        instance.close();
      }
    };

    app.canvas.addEventListener("pointerdown", handleClickOutside);
    setSelect(instance);

    onCleanup(() => {
      app.canvas.removeEventListener("pointerdown", handleClickOutside);
      instance.onSelect.disconnectAll();
      setSelect((current) => (current === instance ? undefined : current));
      instance.destroy({ children: true });
    });
  });

  return <PixiExternalContainer container={select()} />;
};
