import {
  children,
  createEffect,
  createSignal,
  onCleanup,
} from "../../../../pixi-jsx/solidjs-universal-renderer/index.js";
import type { PixiNodeProps } from "../../../../pixi-jsx/jsx/jsx-node.js";
import { PixiExternalContainer } from "../../PixiExternalContainer.jsx";
import { Container } from "pixi.js";
import { ScrollBox, type ScrollBoxOptions } from "@pixi/ui";

/**
 * Additional `@pixi/ui` ScrollBox options accepted by {@link ScrollableContent}.
 *
 * `width`, `height`, and `children` are controlled by the component itself.
 */
export type ScrollableContentOptions = Omit<
  ScrollBoxOptions,
  "width" | "height" | "children" | "items"
>;

/**
 * Props for {@link ScrollableContent}.
 */
export type ScrollableContentProps = PixiNodeProps<{
  /** Width of the `@pixi/ui` ScrollBox viewport. */
  width: number;
  /** Height of the `@pixi/ui` ScrollBox viewport. */
  height: number;
  /** Optional additional ScrollBox configuration. */
  scrollBoxOptions?: ScrollableContentOptions;
}>;

const DEFAULT_SCROLLBOX_OPTIONS = {
  elementsMargin: 0,
  globalScroll: false,
  radius: 0,
} satisfies ScrollableContentOptions;

export const getScrollableContentChildContainer = (value: unknown): Container => {
  if (value && typeof value === "object" && "container" in value) {
    return value.container as Container;
  }

  throw new Error(
    `ScrollableContent children must have a container property. Got: ${typeof value}`,
  );
};

/**
 * Wraps Sylph JSX children in an `@pixi/ui` {@link ScrollBox}.
 *
 * `ScrollableContent` is intended for lists, panels, inventories, logs, and other
 * UI regions whose content can exceed a fixed viewport. Children must be Sylph
 * JSX nodes backed by Pixi containers, such as `<container>`, `<sprite>`, or
 * other components that return a Pixi-backed node.
 *
 * The ScrollBox is recreated when dimensions, options, or child membership
 * changes so that Pixi UI can rebuild its internal list and masking state.
 *
 * @param props - Viewport dimensions, optional ScrollBox options, and children.
 * @returns A Pixi external-container bridge containing the ScrollBox.
 *
 * @example
 * ```tsx
 * <ScrollableContent width={320} height={180}>
 *   <container y={0}><text>Line 1</text></container>
 *   <container y={32}><text>Line 2</text></container>
 * </ScrollableContent>
 * ```
 */
export const ScrollableContent = (props: ScrollableContentProps) => {
  const [scrollBox, setScrollBox] = createSignal<ScrollBox>();
  const resolvedChildren = children(() => props.children);

  createEffect(() => {
    const childContainers = resolvedChildren
      .toArray()
      .filter((child) => child !== undefined && child !== null)
      .map(getScrollableContentChildContainer);
    const box = new ScrollBox({
      ...DEFAULT_SCROLLBOX_OPTIONS,
      ...props.scrollBoxOptions,
      width: props.width,
      height: props.height,
    });

    if (childContainers.length > 0) {
      box.addItems(childContainers);
    }

    setScrollBox(box);

    onCleanup(() => {
      setScrollBox((current) => (current === box ? undefined : current));
      box.removeItems();
      box.destroy({ children: false });
    });
  });

  return <PixiExternalContainer container={scrollBox()} />;
};
