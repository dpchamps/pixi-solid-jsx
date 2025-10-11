# pixi-jsx Project Overview

## Project Overview

**pixi-jsx** is a **SolidJS Universal Renderer** that targets canvas rendering with PixiJS nodes. It brings SolidJS's fine-grained reactivity to PixiJS, enabling declarative canvas graphics programming with JSX syntax.

## Architecture

### Core Components

**1. JSX Runtime Layer** (`src/pixi-jsx/jsx/`)
- Custom JSX runtime that defines intrinsic elements (text, container, application, sprite, graphics)
- Type definitions for PixiJS nodes as JSX elements
- Located in jsx-runtime.ts:1

**2. Proxy DOM Implementation** (`src/pixi-jsx/proxy-dom/`)
- Abstraction layer between SolidJS's universal renderer and PixiJS
- **ProxyNode** base class (proxy-dom/nodes/Node.ts:42) - manages parent-child relationships
- Node implementations for each PixiJS element:
  - `ApplicationNode` - Root application container
  - `ContainerNode` - Generic PixiJS container
  - `TextNode` - Text rendering
  - `SpriteNode` - Sprite/image rendering
  - `GraphicsNode` - Vector graphics
  - `HtmlElementNode` - Bridge to DOM
  - `RawNode` - Raw string values

**3. SolidJS Universal Renderer Integration** (`src/pixi-jsx/solidjs-universal-renderer/`)
- Implements SolidJS's `createRenderer` API (index.ts:6)
- Maps DOM-like operations to PixiJS scene graph:
  - `createElement` → creates proxy nodes
  - `insertNode` → adds to PixiJS hierarchy
  - `removeNode` → removes from scene graph
  - `setProperty` → updates PixiJS object properties

**4. Engine/Effects Layer** (`src/engine/`)
Higher-level utilities and components:
- **Effects**:
  - `createAsset()` - Asset loading with SolidJS resources
  - `createMouse()` - Mouse event tracking
  - `createWindow()` - Window dimension tracking
  - `createTimers()` - Timer utilities
  - `createGraphics()` - Graphics helpers
  - `startCoroutine()` - Generator-based animation coroutines (coroutines.ts:64)

- **Tags** (React-like components):
  - `<Application/>` - Root component with ticker integration (Application.tsx:75)
  - `<FlexBox/>` - Layout container with flexbox-like behavior

- **Libs**:
  - Math utilities (lerp, clamp, etc.)
  - Easing functions
  - Point utilities

## Key Design Patterns

**Functional & Reactive**
- Uses const arrow functions exclusively (per CLAUDE.md:14)
- Functional programming patterns (map/filter/reduce over loops)
- Immutable data structures
- Type inference over explicit typing

**Strict TypeScript**
- Strict null checks enabled
- No `any` types allowed
- `unknown` for truly unknown data
- Runtime assertions with `invariant()` (utility-types.ts:4)

**SolidJS Integration**
- Fine-grained reactivity with `createSignal`, `createEffect`
- Resources for async data loading
- Context for application state sharing

## Example Usage

```tsx
<Application width={600} height={800} backgroundColor="pink">
  <container>
    <sprite
      texture={texture()}
      eventMode="static"
      onclick={onClick}
      scale={scale()}
    />
    <text style={{fontSize: 24}}>
      Hello World
    </text>
  </container>
</Application>
```

## Build & Development

- **Vite** for bundling (vite.config.ts:1)
- **TypeScript** with strict mode
- Builds library (core) and JSX runtime separately
- ~1,561 lines of TypeScript code
- Sandbox directory with examples and testing components

## Notable Features

1. **Coroutine System** - Generator-based animations with `waitMs`, `waitFrames`, `stop` utilities
2. **Application Context** - Provides time/FPS tracking via context (Application.tsx:31)
3. **Refs Work** - SolidJS ref pattern fully supported
4. **Event Handling** - PixiJS events map to JSX event props (onclick, etc.)
5. **Type Safety** - Strong typing throughout with PixiJS types

## Project Statistics

- Total lines of code: ~1,561
- Main dependencies: pixi.js (8.3.2), solid-js (1.9.4)
- Build tool: Vite 7.1.5
- TypeScript with ESNext target

The codebase is well-structured, follows functional patterns, and successfully bridges SolidJS's reactivity with PixiJS's rendering capabilities.