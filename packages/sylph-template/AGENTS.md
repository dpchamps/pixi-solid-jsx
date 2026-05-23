# Sylph.jsx Game Development Guide

This guide is for agents working inside a cloned Sylph.jsx starter project to build games and interactive PixiJS applications. Treat the project as a game/app codebase, not as a DOM application.

## First principles

- Use Sylph JSX primitives for Pixi content: `<Application>`, `<container>`, `<sprite>`, `<text>`, `<graphics>`, and occasionally `<render-layer>`.
- Use Solid-style fine-grained reactivity from `sylph-jsx`; components do not re-render like React components.
- Keep state in signals and derived values. Let JSX props bind signals directly to Pixi objects.
- Use `createSynchronizedEffect` for reactive side effects that should run on the Pixi ticker.
- Use `onEveryFrame` only for continuous frame work such as movement, physics, particles, or polling.
- Use `PixiExternalContainer` when integrating an imperative Pixi object or third-party Pixi UI object.
- Prefer small components that accept `PixiNodeProps<...>` and forward `children` when wrapping Pixi nodes.

## Project map

- `src/main.ts` mounts the app with `renderRoot(AppRoot, document.body)`.
- `src/AppRoot.tsx` owns the root `<Application>` and global Pixi application options.
- `src/components/Game.tsx` is the demo scene and the best local example of signals, ticker effects, assets, refs, and render layers.
- `vite.config.ts` configures Solid's universal renderer for Sylph:
  - `moduleName: "sylph-jsx"`
  - `generate: "universal"`
  - `optimizeDeps.exclude: ["sylph-jsx"]`
- `tsconfig.json` configures JSX:
  - `"jsx": "react-jsx"`
  - `"jsxImportSource": "sylph-jsx"`

## Required imports

Import Solid/Sylph primitives from `sylph-jsx`, not directly from `solid-js`, unless there is a specific reason.

```ts
import {
  Application,
  Show,
  For,
  createSignal,
  createMemo,
  createEffect,
  createSynchronizedEffect,
  onEveryFrame,
  createAsset,
  PixiExternalContainer,
  type PixiNodeProps,
  type Ref,
  type GraphicsIntrinsicProps,
} from "sylph-jsx";
```

Import Pixi classes and types from `pixi.js`.

```ts
import { Texture, Graphics, Container } from "pixi.js";
```

## Reactive Pixi patterns

Bind signals directly to props:

```tsx
const [position, setPosition] = createSignal({ x: 100, y: 100 });

<sprite x={position().x} y={position().y} texture={texture()} />;
```

Use `createAsset<T>()` for Pixi assets:

```tsx
const texture = createAsset<Texture>("sylph-logo.png");

<sprite texture={texture()} />;
```

Use `createSynchronizedEffect` for signal-driven ticker work:

```ts
createSynchronizedEffect(
  () => props.health,
  (health, ticker) => {
    // Runs on the Sylph/Pixi ticker after health changes.
  },
);
```

Use `onEveryFrame` for true per-frame work:

```ts
onEveryFrame((ticker) => {
  setPosition((last) => ({
    x: last.x + 2 * ticker.deltaTime,
    y: last.y,
  }));
});
```

Do not put large state cascades or expensive allocations in `onEveryFrame` unless unavoidable.

## Ref typing

Use the `Ref<IntrinsicProps>` helper to type refs. This avoids exposing or guessing internal node/container handle types.

```tsx
import {
  createSignal,
  createEffect,
  type Ref,
  type GraphicsIntrinsicProps,
} from "sylph-jsx";

const HealthBar = () => {
  const [graphics, setGraphics] = createSignal<Ref<GraphicsIntrinsicProps>>();

  createEffect(() => {
    const node = graphics();
    if (!node) return;

    const g = node.container;
    g.clear();
    g.roundRect(0, 0, 200, 20, 6);
    g.fill(0x4b805f);
  });

  return <graphics ref={setGraphics} />;
};
```

Common ref aliases:

```ts
import type {
  Ref,
  ContainerIntrinsicProps,
  SpriteIntrinsicProps,
  TextIntrinsicProps,
  GraphicsIntrinsicProps,
  RenderLayerIntrinsicProps,
} from "sylph-jsx";

type ContainerRef = Ref<ContainerIntrinsicProps>;
type SpriteRef = Ref<SpriteIntrinsicProps>;
type TextRef = Ref<TextIntrinsicProps>;
type GraphicsRef = Ref<GraphicsIntrinsicProps>;
type RenderLayerRef = Ref<RenderLayerIntrinsicProps>;
```

## Render-layer footgun

Use `<render-layer>` judiciously. It is not a general grouping primitive.

Reserve render layers for top-level UI/HUD/overlay ordering where you need independent depth control. Do not wrap every card, sprite, component, or local group in a render layer.

Prefer this:

```tsx
<container sortableChildren>
  <GameWorld />
  <render-layer zIndex={1000} sortableChildren>
    <HUD />
    <Dialog />
  </render-layer>
</container>
```

Avoid this:

```tsx
<For each={cards()}>
  {(card) => (
    <render-layer>
      <Card card={card} />
    </render-layer>
  )}
</For>
```

For ordinary visual grouping, use `<container sortableChildren>` and `zIndex`.

## External Pixi objects

Use `PixiExternalContainer` for Pixi objects not represented by native Sylph intrinsics, such as `TilingSprite`, `ParticleContainer`, `HTMLText`, or `@pixi/ui` widgets.

```tsx
const [external, setExternal] = createSignal<Container>();

createSynchronizedEffect(texture, (tex) => {
  if (!tex) return;
  const container = new Container();
  // Build imperative Pixi subtree here.
  setExternal(container);
});

return <PixiExternalContainer container={external()} />;
```

Clean up manually when creating long-lived imperative objects, filters, event listeners, or audio resources.

## Event handling

Pixi event props are passed through to Pixi objects. Set `eventMode` and, when useful, `hitArea`.

```tsx
<container
  eventMode="static"
  hitArea={new Rectangle(0, 0, width, height)}
  onpointertap={(event) => {
    event.stopPropagation();
    select();
  }}
/>
```

For buttons and clickable sprites, usually use `eventMode="static"` or `eventMode="dynamic"` and `cursor="pointer"`.

## Cleanup expectations

Use `onCleanup` for:

- coroutines started with `startCoroutine`
- manually created filters
- DOM or canvas event listeners
- externally created Pixi containers/widgets
- sound or resource handles that are not managed by Pixi `Assets`

```ts
const filter = new BlurFilter();
onCleanup(() => filter.destroy());
```

## Documentation

Before making non-trivial game or framework changes, read the relevant file in `docs/`:

- `docs/framework-overview.md`
- `docs/reactivity-and-game-loop.md`
- `docs/refs-and-imperative-pixi.md`
- `docs/render-layers.md`
- `docs/assets-audio-and-loading.md`
- `docs/layout-and-ui.md`
- `docs/testing-and-debugging.md`
- `docs/common-patterns.md`

