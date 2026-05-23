import {
  createSignal,
  onCleanup,
} from "../../../pixi-jsx/solidjs-universal-renderer/index.js";
import { createSynchronizedEffect } from "../../core/query-fns.js";
import { PixiExternalContainer } from "../PixiExternalContainer.jsx";
import { HTMLText, type HTMLTextOptions } from "pixi.js";

/**
 * Props for {@link HTMLTextNode}.
 *
 * This mirrors Pixi's `HTMLTextOptions`, including HTML string content,
 * `HTMLTextStyle` configuration, transform props, anchor, resolution, and texture
 * styling options.
 */
export type HTMLTextNodeProps = HTMLTextOptions;

/**
 * Declarative Sylph wrapper for Pixi's `HTMLText` display object.
 *
 * `HTMLText` renders rich text through browser HTML/CSS and SVG `foreignObject`,
 * making it useful for formatted labels, emphasized inline content, tooltips, and
 * UI copy that needs more styling flexibility than canvas text.
 *
 * Lifecycle behavior:
 * - Renders an empty wrapper until `text` is defined.
 * - Creates and owns a Pixi `HTMLText` instance.
 * - Reactively updates common text, style, layout, and transform props.
 * - Recreates the instance when `textureStyle` changes because Pixi documents that
 *   `textureStyle` is not fully reactive after construction.
 * - Destroys the owned Pixi instance when replaced or unmounted.
 *
 * @param props - Pixi `HTMLTextOptions` for the underlying `HTMLText` instance.
 * @returns A `PixiExternalContainer` wrapper containing the Pixi `HTMLText`.
 *
 * @example
 * ```tsx
 * <HTMLTextNode
 *   text={'Click <strong>Start</strong> to begin'}
 *   style={{ fontSize: 18, fill: '#ffffff' }}
 *   x={24}
 *   y={32}
 * />
 * ```
 */
export const HTMLTextNode = (props: HTMLTextNodeProps) => {
  const [htmlText, setHtmlText] = createSignal<HTMLText>();
  let lastInstance: HTMLText | undefined;
  let lastTextureStyle: HTMLTextOptions["textureStyle"] | undefined;

  createSynchronizedEffect(
    () => ({
      hasText: props.text !== undefined,
      textureStyle: props.textureStyle,
    }),
    ({ hasText, textureStyle }) => {
      if (!hasText) {
        setHtmlText(undefined);
        lastInstance?.destroy();
        lastInstance = undefined;
        lastTextureStyle = undefined;
        return;
      }

      if (lastInstance && lastTextureStyle === textureStyle) return;

      const previousInstance = lastInstance;
      const nextInstance = new HTMLText(props);

      lastInstance = nextInstance;
      lastTextureStyle = textureStyle;
      setHtmlText(nextInstance);
      previousInstance?.destroy();
    },
  );

  createSynchronizedEffect(
    () => ({
      instance: htmlText(),
      text: props.text,
      style: props.style,
      x: props.x,
      y: props.y,
      width: props.width,
      height: props.height,
      alpha: props.alpha,
      visible: props.visible,
      rotation: props.rotation,
      angle: props.angle,
      scale: props.scale,
      pivot: props.pivot,
      skew: props.skew,
      anchor: props.anchor,
      resolution: props.resolution,
      roundPixels: props.roundPixels,
    }),
    ({
      instance,
      text,
      style,
      x,
      y,
      width,
      height,
      alpha,
      visible,
      rotation,
      angle,
      scale,
      pivot,
      skew,
      anchor,
      resolution,
      roundPixels,
    }) => {
      if (!instance || instance.destroyed) return;

      if (text !== undefined) instance.text = text;
      if (style !== undefined) instance.style = style;
      if (x !== undefined) instance.x = x;
      if (y !== undefined) instance.y = y;
      if (width !== undefined) instance.width = width;
      if (height !== undefined) instance.height = height;
      if (alpha !== undefined) instance.alpha = alpha;
      if (visible !== undefined) instance.visible = visible;
      if (rotation !== undefined) instance.rotation = rotation;
      if (angle !== undefined) instance.angle = angle;
      if (scale !== undefined) instance.scale = scale;
      if (pivot !== undefined) instance.pivot = pivot;
      if (skew !== undefined) instance.skew = skew;
      if (anchor !== undefined) instance.anchor = anchor;
      if (resolution !== undefined) instance.resolution = resolution;
      if (roundPixels !== undefined) instance.roundPixels = roundPixels;
    },
  );

  onCleanup(() => {
    lastInstance?.destroy();
  });

  return (
    <PixiExternalContainer
      zIndex={props.zIndex}
      container={htmlText()}
    />
  );
};
