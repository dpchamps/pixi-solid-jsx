import {
  createSignal,
  onCleanup,
} from "../../../pixi-jsx/solidjs-universal-renderer/index.js";
import { createSynchronizedEffect } from "../../core/query-fns.js";
import { PixiExternalContainer } from "../PixiExternalContainer.jsx";
import {
  Texture,
  TilingSprite as PixiTilingSprite,
  type TilingSpriteOptions,
} from "pixi.js";

/**
 * Props for {@link TilingSprite}.
 *
 * This matches Pixi's `TilingSpriteOptions`, including texture, dimensions,
 * transforms, anchor, and tile transform fields.
 */
export type TilingSpriteProps = TilingSpriteOptions;

/**
 * Bridges Pixi's imperative `TilingSprite` into a Sylph JSX scene graph.
 *
 * `TilingSprite` is useful for repeating backgrounds, scrolling textures,
 * patterned panels, parallax layers, and tileable effects. Because Pixi does not
 * expose a native Sylph intrinsic for it, this component creates the Pixi
 * `TilingSprite` imperatively and mounts it through `PixiExternalContainer`.
 *
 * Lifecycle behavior:
 * - Renders an empty wrapper until `texture` is available.
 * - Creates a new Pixi `TilingSprite` when the texture changes.
 * - Reactively updates common size, transform, and tile properties.
 * - Destroys the owned Pixi instance when replaced or unmounted.
 *
 * @param props - Pixi `TilingSpriteOptions` passed to the underlying instance.
 * @returns A `PixiExternalContainer` wrapper containing the Pixi `TilingSprite`.
 *
 * @example
 * ```tsx
 * const texture = createAsset<Texture>("background-tile.webp");
 *
 * <TilingSprite
 *   texture={texture()}
 *   width={layout.canvasSize.width}
 *   height={layout.canvasSize.height}
 *   tilePosition={{ x: scrollX(), y: 0 }}
 * />
 * ```
 */
export const TilingSprite = (props: TilingSpriteProps) => {
  const [tilingSprite, setTilingSprite] = createSignal<PixiTilingSprite>();
  let lastInstance: PixiTilingSprite | undefined;

  createSynchronizedEffect(
    () => props.texture,
    (texture) => {
      if (!texture) {
        setTilingSprite(undefined);
        lastInstance?.destroy();
        lastInstance = undefined;
        return;
      }

      const previousInstance = lastInstance;
      const nextInstance = new PixiTilingSprite({
        ...props,
        texture,
      });

      lastInstance = nextInstance;
      setTilingSprite(nextInstance);
      previousInstance?.destroy();
    },
  );

  createSynchronizedEffect(
    () => ({
      instance: tilingSprite(),
      texture: props.texture,
      width: props.width,
      height: props.height,
      x: props.x,
      y: props.y,
      alpha: props.alpha,
      visible: props.visible,
      rotation: props.rotation,
      tilePosition: props.tilePosition,
      tileScale: props.tileScale,
      tileRotation: props.tileRotation,
      anchor: props.anchor,
      roundPixels: props.roundPixels,
      applyAnchorToTexture: props.applyAnchorToTexture,
    }),
    ({
      instance,
      texture,
      width,
      height,
      x,
      y,
      alpha,
      visible,
      rotation,
      tilePosition,
      tileScale,
      tileRotation,
      anchor,
      roundPixels,
      applyAnchorToTexture,
    }) => {
      if (!instance) return;

      instance.texture = texture ?? Texture.EMPTY;
      if (width !== undefined) instance.width = width;
      if (height !== undefined) instance.height = height;
      if (x !== undefined) instance.x = x;
      if (y !== undefined) instance.y = y;
      if (alpha !== undefined) instance.alpha = alpha;
      if (visible !== undefined) instance.visible = visible;
      if (rotation !== undefined) instance.rotation = rotation;
      if (tilePosition !== undefined) instance.tilePosition = tilePosition;
      if (tileScale !== undefined) instance.tileScale = tileScale;
      if (tileRotation !== undefined) instance.tileRotation = tileRotation;
      if (anchor !== undefined) instance.anchor = anchor;
      if (roundPixels !== undefined) instance.roundPixels = roundPixels;
      if (applyAnchorToTexture !== undefined) {
        instance.applyAnchorToTexture = applyAnchorToTexture;
      }
    },
  );

  onCleanup(() => {
    lastInstance?.destroy();
  });

  return (
    <PixiExternalContainer
      zIndex={props.zIndex}
      container={tilingSprite()}
    />
  );
};
