# Refs and Imperative Pixi

Most Sylph.jsx code should be declarative. Use refs and imperative Pixi APIs when you need to draw graphics, integrate unsupported Pixi objects, attach event listeners manually, or manage filters/widgets.

## Ref helper

Sylph exports a `Ref<IntrinsicProps>` helper. Use it to derive the correct ref handle type for an intrinsic node instead of exposing direct proxy classes or guessing container types.

```ts
/**
 * Use this to get handle into a ref type, instead of exposing direct container types.
 */
export type Ref<Intrinsic extends PixiNodeProps> =
  Intrinsic extends PixiNodeProps<{}, infer T, any> ? T : never;
```

Use it like this:

```tsx
import {
  createSignal,
  createEffect,
  type Ref,
  type GraphicsIntrinsicProps,
} from "sylph-jsx";

const [graphics, setGraphics] = createSignal<Ref<GraphicsIntrinsicProps>>();

createEffect(() => {
  const node = graphics();
  if (!node) return;

  node.container.clear();
  node.container.circle(0, 0, 20);
  node.container.fill(0xffffff);
});

<graphics ref={setGraphics} />;
```

The ref value is the Sylph node handle. Its `.container` is the Pixi object.

## Common ref aliases

```ts
import type {
  Ref,
  ApplicationIntrinsicProps,
  ContainerIntrinsicProps,
  SpriteIntrinsicProps,
  TextIntrinsicProps,
  GraphicsIntrinsicProps,
  RenderLayerIntrinsicProps,
} from "sylph-jsx";

type ApplicationRef = Ref<ApplicationIntrinsicProps>;
type ContainerRef = Ref<ContainerIntrinsicProps>;
type SpriteRef = Ref<SpriteIntrinsicProps>;
type TextRef = Ref<TextIntrinsicProps>;
type GraphicsRef = Ref<GraphicsIntrinsicProps>;
type RenderLayerRef = Ref<RenderLayerIntrinsicProps>;
```

Prefer local aliases when a component has multiple refs:

```ts
type GraphicsRef = Ref<GraphicsIntrinsicProps>;

const [background, setBackground] = createSignal<GraphicsRef>();
const [foreground, setForeground] = createSignal<GraphicsRef>();
```

## Drawing with `<graphics>`

For dynamic vector drawing, attach a graphics ref and redraw in an effect.

```tsx
import {
  createEffect,
  createSignal,
  type GraphicsIntrinsicProps,
  type PixiNodeProps,
  type Ref,
} from "sylph-jsx";

type BarProps = PixiNodeProps<{
  width: number;
  height: number;
  progress: number;
}>;

export const Bar = (props: BarProps) => {
  const [gfx, setGfx] = createSignal<Ref<GraphicsIntrinsicProps>>();

  createEffect(() => {
    const node = gfx();
    if (!node) return;

    const g = node.container;
    g.clear();
    g.roundRect(0, 0, props.width, props.height, props.height / 2);
    g.fill(0x333333);
    g.roundRect(0, 0, props.width * props.progress, props.height, props.height / 2);
    g.fill(0x4b805f);
  });

  return <graphics ref={setGfx} />;
};
```

Rules:

- Always `clear()` before redrawing reusable graphics.
- Keep drawing effects small.
- Avoid creating new filters or textures inside the drawing effect unless necessary.

## Ref callbacks

Refs accept setters and callback functions.

```tsx
<container
  ref={(node) => {
    if (!node) return;
    node.container.sortableChildren = true;
  }}
/>
```

Prefer signal setters when the ref is read by effects.

## External Pixi containers

Use `PixiExternalContainer` for Pixi classes that do not have Sylph intrinsics.

Examples:

- `TilingSprite`
- `ParticleContainer`
- `HTMLText`
- `@pixi/ui` widgets such as `ScrollBox`, `Select`, `Slider`
- complex imperative containers from third-party libraries

```tsx
import {
  PixiExternalContainer,
  createSignal,
  createSynchronizedEffect,
} from "sylph-jsx";
import { TilingSprite, Texture } from "pixi.js";

export const TiledBackground = (props: {
  texture: Texture | undefined;
  width: number;
  height: number;
}) => {
  const [sprite, setSprite] = createSignal<TilingSprite>();

  createSynchronizedEffect(
    () => props.texture,
    (texture) => {
      if (!texture) return;
      setSprite(new TilingSprite({ texture, width: props.width, height: props.height }));
    },
  );

  createSynchronizedEffect(
    () => [sprite(), props.width, props.height] as const,
    ([instance, width, height]) => {
      if (!instance) return;
      instance.width = width;
      instance.height = height;
    },
  );

  return <PixiExternalContainer container={sprite()} />;
};
```

## Cleanup for imperative objects

Declarative intrinsic nodes are managed by Sylph. Imperative objects you create may need manual cleanup.

Use `onCleanup` for:

- manually created filters,
- event listeners,
- coroutines,
- UI widgets with signal/event subscriptions,
- objects replaced by effects,
- generated textures/canvases when not managed elsewhere.

```ts
import { onCleanup } from "sylph-jsx";
import { BlurFilter } from "pixi.js";

const filter = new BlurFilter({ strength: 8 });

onCleanup(() => {
  filter.destroy();
});
```

When replacing external instances, destroy the old one if the class owns GPU or event resources.

```ts
setInstance((old) => {
  old?.destroy();
  return next;
});
```

Check the Pixi class API before calling `destroy`; some third-party objects have custom cleanup methods.

## Do not over-imperativize

Avoid this when props would work:

```tsx
const [sprite, setSprite] = createSignal<Ref<SpriteIntrinsicProps>>();

createEffect(() => {
  const node = sprite();
  if (!node) return;
  node.container.x = props.x;
  node.container.y = props.y;
});

<sprite ref={setSprite} />;
```

Prefer this:

```tsx
<sprite x={props.x} y={props.y} />
```

Use refs to fill the gaps in declarative APIs, not as the default rendering model.
