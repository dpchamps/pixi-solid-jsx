# Sylph.jsx Framework Overview

Sylph.jsx combines SolidJS fine-grained reactivity with PixiJS rendering. You write declarative JSX, and Sylph mutates Pixi objects directly through a custom Solid universal renderer.

## Mental model

A Sylph application has three layers:

1. User components and game logic.
2. Solid signals, memos, effects, context, and control flow.
3. Sylph renderer and proxy nodes that mutate Pixi containers, sprites, text, graphics, and render layers.

There is no DOM element for `<sprite>`, `<container>`, `<text>`, or `<graphics>`. Those JSX elements create Pixi objects wrapped by Sylph proxy nodes.

## Root application

The template starts in `src/main.ts`:

```ts
import { renderRoot } from "sylph-jsx";
import { AppRoot } from "./AppRoot";

const main = () => {
  renderRoot(AppRoot, document.body);
};

main();
```

`renderRoot` mounts Sylph into an HTML element. The root component should normally render one `<Application>` from `sylph-jsx`.

```tsx
import { Application } from "sylph-jsx";
import { Game } from "./components/Game";

export const AppRoot = () => (
  <Application
    resolution={window.devicePixelRatio}
    autoDensity={true}
    antialias={true}
    background="black"
    roundPixels={true}
  >
    <Game />
  </Application>
);
```

`<Application>` owns Pixi application creation, ticker setup, application context, and game-loop context.

## Intrinsics

Use these lowercase intrinsic JSX elements for Pixi scene construction:

- `<container>`: grouping and transforms.
- `<sprite>`: textured display object.
- `<text>`: Pixi `Text` with JSX children concatenated into text.
- `<graphics>`: Pixi `Graphics` for drawing.
- `<render-layer>`: transparent Pixi `RenderLayer` wrapper for carefully chosen top-level layers.

Use the capitalized component `<Application>` from `sylph-jsx` for the application root.

## Props

Most Pixi options and instance properties can be passed directly as JSX props. Sylph reflects prop changes onto the underlying Pixi object.

```tsx
<sprite
  texture={texture()}
  x={player().x}
  y={player().y}
  scale={0.5}
  tint={isActive() ? 0xffffff : 0x999999}
/>
```

For wrappers, type props with `PixiNodeProps`:

```tsx
import type { PixiNodeProps, TextIntrinsicProps } from "sylph-jsx";

const Label = (props: TextIntrinsicProps) => (
  <text style={{ fill: 0xffffff, fontSize: 24 }} {...props}>
    {props.children}
  </text>
);

type PlayerSpriteProps = PixiNodeProps<{
  x: number;
  y: number;
  texturePath: string;
}>;
```

## Text children

`<text>` accepts raw string/number children and reactive fragments.

```tsx
<text>Score: {score()}</text>
```

Sylph represents the text fragments internally as raw nodes and concatenates them into the Pixi `Text` object.

## Solid control flow

Import `Show`, `For`, `Index`, `Switch`, `Match`, `Suspense`, and `lazy` from `sylph-jsx`.

```tsx
import { For, Show } from "sylph-jsx";

<Show when={gameStarted()} fallback={<TitleScreen />}>
  <GameScreen />
</Show>

<For each={enemies()}>
  {(enemy) => <EnemySprite enemy={enemy} />}
</For>
```

## Context

Use `createContext` and `useContext` from `sylph-jsx` for game services such as audio, dialogs, settings, save data, or input.

Keep services narrow. Prefer explicit functions over broad mutable objects.

## Application initialization

Use `appInitialize` on `<Application>` for Pixi app setup that must happen after app creation but before children are shown.

```tsx
<Application
  appInitialize={async (app) => {
    app.canvas.addEventListener("wheel", (event) => event.preventDefault(), {
      passive: false,
    });
    await preloadAssets();
  }}
  loadingState={() => <LoadingScreen />}
>
  <Game />
</Application>
```

The framework assigns the custom ticker before Pixi initialization. Do not create a second render loop.

## Prefer declarative Pixi

A good Sylph component declares Pixi structure and binds reactive props:

```tsx
const Player = (props: PixiNodeProps<{ x: number; y: number; texture: Texture }>) => (
  <container x={props.x} y={props.y} sortableChildren>
    <sprite texture={props.texture} anchor={0.5} zIndex={1} />
    <text y={-40} anchor={0.5} zIndex={2}>Player</text>
  </container>
);
```

Reach for imperative Pixi only when:

- drawing dynamic graphics paths,
- integrating unsupported Pixi classes,
- using third-party Pixi UI/widgets,
- managing particles or performance-critical display lists,
- working with filters, masks, or low-level APIs.
