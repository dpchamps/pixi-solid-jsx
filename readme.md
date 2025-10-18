# Sylph

A lightweight, SolidJS-powered runtime for building declarative PixiJS experiences. 

> Why "Sylph"?

Sprites, Pixi.js's... A reactive framework that's lighter than air.

> **Project status:** 0.x pre-release. APIs are still settling and may change between minor versions.

## Installation

```bash
npm install sylph-jsx
```

Peer dependencies:

- pixi.js@8.14.0
- solid-js@1.9.4

## Development

```bash 
npm install
npm run test # run test suite with watch, show coverage
npm run dev # run the sandbox app
```

## Quick start

```tsx
import { createAsset, Application, createSignal, render } from "sylph";

const App = () => {
    const texture = createAsset("fire.png");
    const [angle, setAngle] = createSignal(0);
    
    createSynchronizedEffect(
      angle,
      (rotation, ticker) => setAngle(rotation + 0.05 * ticker.deltaTime)
    );
    
    return (
      <Application width={800} height={600} backgroundColor={0x101820}>
        <sprite
          texture={texture()}
          pivot={{ x: 0.5, y: 0.5 }}
          x={400}
          y={300}
          rotation={angle()}
        />
      </Application>
    );
};

render(() => <App />, document.getElementById("root")!);
```

## JSX primitives

### `<application>`
Handles Pixi initialization, waits to mount until `.initialize()` runs, and accepts standard `ApplicationOptions` plus `loadingState`, `appInitialize`, and `createTicker` hooks.

```tsx
<application width={800} height={600} backgroundColor={0x101820}>
  {children}
</application>
```

### `<container>`
Standard scene graph grouping element. Accepts other intrinsics (including `<render-layer>`) and supports Pixi container options such as `sortableChildren`, `eventMode`, and position properties.

```tsx
<container x={100} y={120} sortableChildren>
  <sprite texture={texture()} />
  <text>x: {position().x}</text>
</container>
```

### `<sprite>`
Leaf element for textured display objects. Provide a Pixi `Texture`, positional props, interactivity settings, and transforms.

```tsx
<sprite
  texture={createAsset("fire.png")()}
  x={400}
  y={300}
  pivot={{ x: 0.5, y: 0.5 }}
  eventMode="static"
  onclick={() => setAngle((angle) => angle + 0.1)}
/>
```

### `<text>`
Displays dynamic copy. String children automatically concatenate into the Pixi `Text` value, and updates react when signals change.

```tsx
<text style={{ fontSize: 24 }} fill={0xffffff} x={32} y={32}>
  Score: {score()}
</text>
```

### `<render-layer>`
Wrap a subtree in a Pixi `RenderLayer`. Useful for independent z-sorting, compositing, or post-processing passes without leaving JSX.

```tsx
<render-layer zIndex={100}>
  <text x={16} y={16}>HUD Overlay</text>
  <container>
    <sprite texture={hudTexture()} />
  </container>
</render-layer>
```

## Frame-aware query functions (src/engine/core/query-fns.ts)

### createSynchronizedEffect(query, effect, owner?)

> Run when reactive state changes and commit changes during the next frame

- Tracks reactive dependencies in the query function.
- Queues the effect for the next Pixi ticker frame and runs it with the most recent Ticker.
- Preserves the caller’s Solid owner so cleanup and disposals behave as if the effect lived in the component.

### onEveryFrame(effect)

> Run on every frame

- Schedules effect on every ticker frame without reactive tracking.
- Ideal for fixed-step simulations, counters, and other continuous work.
- Prefer createSynchronizedEffect when you only need updates in response to state changes; reserve onEveryFrame for unavoidable per-frame work.

## Core Framework Components

### Application

The `<Application>` component constructs the intrinsic `<application>` tag, 
and adds all necessary lifecycle management and core providers required for framework functionality.

There's usually no good reason to not use this component.

- Awaits `appInitialize` and shows `loadingState` (defaults to `<text>Loading...</text>`) while asynchronous setup completes.
- Starts the ticker only after the Pixi application is ready and exposes the instance through `useApplicationState()`.
- Seeds the internal game-loop context so that `createSynchronizedEffect` and `onEveryFrame` can schedule work onto the game loop.
- Boots the Pixi devtools overlay via `initDevtools` when available.

Use the intrinsic form (`<application>`) when authoring low-level JSX trees and the component form when you want the full runtime integration.


### PixiExternalContainer

You may want to manage some or most of you logic outside the reactive render tree. For these cases, you may reach for `PixiExternalContainer` :

```tsx
const external = new Container();

<PixiExternalContainer container={external} x={120} y={180}>
  <text>Overlay UI</text>
</PixiExternalContainer>;
```

- Adds reactivity around the managed container


## Working with render layers

`<render-layer>` mounts a Pixi `RenderLayer` alongside your display objects and automatically registers every descendant with that layer. The layer itself is inserted into the parent container, while the children remain regular siblings in the display list; they are simply marked as `renderLayerChildren` so Pixi sorts and composites them through the layer. This means you can freely mix layered and non-layered content inside the same container without losing control over draw order.

- Any prop you pass to `<render-layer>` (such as `sortableChildren` or `zIndex`) updates the underlying layer immediately, and reactive props will resync as signals change.
- Descendants inherit the layer recursively: nested containers, sprites, text nodes, and additional `render-layer` blocks all attach correctly, so complex hierarchies continue to render through the intended layer.
- Conditional rendering, `For`/`Index` loops, and other Solid control flow work the same way—adding or removing nodes updates both the container’s display list and the layer’s child registry.
- Removing the layer detaches the `RenderLayer` itself and clears the associated `renderLayerChildren`, leaving the rest of the scene untouched.

```tsx
<container>
  <render-layer zIndex={100} sortableChildren>
    <text x={16} y={16}>HUD Overlay</text>
    <container>
      <sprite texture={hudTexture()} />
    </container>
    <For each={alerts()}>{(alert) => <text y={alert().y}>{alert().label}</text>}</For>
  </render-layer>

  <sprite texture={playerTexture()} x={player().x} y={player().y} />
</container>
```

The overlay subtree above always renders through the same layer, even as the `alerts()` array grows or shrinks, while the player sprite continues to follow normal container ordering.
