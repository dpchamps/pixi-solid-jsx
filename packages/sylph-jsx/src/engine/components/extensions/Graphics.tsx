import { createSignal } from "../../../pixi-jsx/solidjs-universal-renderer/index.js";
import type {
  GraphicsProps,
  Ref,
} from "../../../pixi-jsx/jsx/jsx-runtime.js";
import { createSynchronizedEffect } from "../../core/query-fns.js";
import type { Graphics as PixiGraphics } from "pixi.js";

/**
 * Props for {@link GraphicsBuilder}.
 */
type GraphicsBuilderProps = {
  /**
   * Callback used to draw into the underlying Pixi `Graphics` instance.
   *
   * The callback is executed on the Sylph/Pixi ticker via `createSynchronizedEffect`,
   * so drawing work is synchronized with the game loop. Callers should usually clear
   * the graphics object themselves when redrawing dynamic content.
   */
  graphicsBuilder: (graphics: PixiGraphics) => void;
};

/**
 * Declarative wrapper for imperative Pixi `Graphics` drawing.
 *
 * Use this component when JSX props are not enough and a Pixi `Graphics` path must be
 * drawn manually. The component owns a native `<graphics>` node and passes the Pixi
 * `Graphics` container to `graphicsBuilder` on the next synchronized frame.
 *
 * @param props - Drawing callback configuration.
 * @returns A Sylph `<graphics>` node.
 *
 * @example
 * ```tsx
 * <GraphicsBuilder
 *   graphicsBuilder={(graphics) => {
 *     graphics.clear();
 *     graphics.roundRect(0, 0, 200, 40, 8);
 *     graphics.fill(0x4b805f);
 *   }}
 * />
 * ```
 */
export const GraphicsBuilder = (props: GraphicsBuilderProps) => {
  const [graphics, setGraphics] = createSignal<Ref<GraphicsProps>>();

  createSynchronizedEffect(
    () => ({
      node: graphics(),
      builder: props.graphicsBuilder,
    }),
    ({ node, builder }) => {
      if (!node) return;
      builder(node.container);
    },
  );

  return <graphics ref={setGraphics} />;
};
