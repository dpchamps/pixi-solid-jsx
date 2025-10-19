# Sylph

A lightweight, SolidJS-powered runtime for building declarative PixiJS experiences. 

> Why "Sylph"?

Sprites, Pixi.js's... A reactive framework that's lighter than air.

## Status

The framework is fully-functional, but APIs are subject to change.

## Installation

Right now Sylph.jsx is in such active development that it is recommended you build and link
manually. What's published to the package registry is not guaranteed to be stable.

<details>
```bash
npm install sylph-jsx
```

Peer dependencies:

- pixi.js@8.14.0
- solid-js@1.9.4

</details>

## Overview

Sylph uses the [SolidJs Universal Renderer](./src/pixi-jsx/solidjs-universal-renderer/index.ts) to construct 
a Pixi.js container hierarchy.

Additionally, it provides top-level mechanisms for writing declarative components with fine-grained reactivity. Effects
are synchronized to the Pixi.js ticker to ensure deterministic sequencing and updating within a given frame.

What this means is that you can write Pixi.js applications that leverage SolidJs reactive primitives. An example
would be:

```tsx
import { createAsset, Application, createSignal, render, onEveryFrame } from "sylph-jsx";

const App = () => {
    const texture = createAsset("fire.png");
    const [angle, setAngle] = createSignal(0);

    onEveryFrame((time) => {
        setAngle((last) => last-(0.05*time.deltaTime))
    });
    
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
```
The above example creates an `Application` component, with a single `sprite` as a child.

It uses the `onEveryFrame` lifecycle hook to execute a side effect on every frame of the PixiJS ticker. The side effect
in this case is updating the `angle` signal. Note that we have `ticker` primitives available: `time.deltaTime`
is used to ensure smoothness across frames.

We can then consume this signal in the `sprite` component below. 

The end result is that we have updates applied to containers that trigger re-renders _only when_ the
reactive primitives they're dependent on are triggered. Read more about fine-grained reactivity here:
[SolidJs Docs on fine-grained reactivity](https://docs.solidjs.com/advanced-concepts/fine-grained-reactivity).

### Motivations

Sylph is intended to be a general-purpose framework for writing canvas/webgpu PixiJs Applications. The personal
goals that inspired this project were to have a general suite of tools that enabled performant push-based 
reactivity for game development.

For example:

```tsx
const PLAYER_SPEED = 5;
const DESTINATION = {x: 500, y: 500};

const ExampleSprite = (props: PixiNodeProps<{x: number, y: number}>) => {
    const texture = createAsset<Texture>('fire.png');

    return (
        <sprite
            texture={texture()}
            scale={1}
            x={props.x}
            y={props.y}
            tint={"white"}
            pivot={{x: 0.5, y: 0.5}}
        />
    )
}


export const ControlsAndMovement = () => {
    const wasdController = createWASDController();
    const [playerPosition, setPlayerPosition] = createSignal({x: 0, y: 0});
    const winCondition = () => euclideanDistance(playerPosition(), DESTINATION) < 20;

    createSynchronizedEffect(wasdController, ({x, y}, time) => {
        setPlayerPosition((last) => ({
            x: last.x+x*PLAYER_SPEED*time.deltaTime,
            y: last.y+y*PLAYER_SPEED*time.deltaTime
        }))
    });
    
    return (
        <Show when={!winCondition()} fallback={<text>You Won!</text>}>
            <ExampleSprite x={playerPosition().x} y={playerPosition().y}/>
            <ExampleSprite x={DESTINATION.x} y={DESTINATION.y}/>
        </Show>
    )
}
```

The above example demonstrates generally how we can compose effects and signals together to write a 
declarative scene where parts only update when the dependencies change:

1. The first `ExampleSprite` updates only when player position changes
2. The second `ExampleSprite` never updates
3. The `Show` block only updates when the winCondition changes

Further, the example shows how effects, signals and components are composable:

1. `winCondition` is a simple function, but it preserves reactivity from its inner computation
2. `ExampleSprite` is a reusable component for a sprite with a given texture
3. `wasdController` (not shown in example) is similar to `winCondition`: derived signals bound to input

This kind of development may not be desirable or appropriate for parts of the application. The component `PixiExternalContainer`
is provided to allow you to eject from the reactive runtime at any point and perform your own logic directly in 
a PixiJs container. See [#pixiexternalcontainer](#pixiexternalcontainer) below for more info.

## Development

```bash 
npm install
npm run test # run test suite with watch, show coverage
npm run dev # run the sandbox app
```

## Quick start

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

## Frame-aware query functions [src/engine/core/query-fns.ts](./src/engine/core/query-fns.ts)

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

You may want to manage some or most of your logic outside the reactive render tree. For these cases, you may reach for `PixiExternalContainer` :

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
