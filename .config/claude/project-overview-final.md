# Sylph.jsx: Comprehensive Technical Reference

> A complete architectural and implementation guide to Sylph.jsx - a SolidJS-powered declarative runtime for building high-performance PixiJS applications.

**Version:** 0.1.0 (Pre-1.0 - APIs subject to change)
**Package:** `sylph-jsx`
**Last Updated:** 2025-10-18

---

## Table of Contents

1. [Introduction & Core Philosophy](#1-introduction--core-philosophy)
2. [Architecture Overview](#2-architecture-overview)
3. [Layered System Design](#3-layered-system-design)
4. [JSX Runtime & Type System](#4-jsx-runtime--type-system)
5. [SolidJS Universal Renderer](#5-solidjs-universal-renderer)
6. [Proxy DOM System](#6-proxy-dom-system)
7. [Engine Runtime](#7-engine-runtime)
8. [Render Layer System](#8-render-layer-system)
9. [Application Lifecycle](#9-application-lifecycle)
10. [Key Patterns & Abstractions](#10-key-patterns--abstractions)
11. [Testing Architecture](#11-testing-architecture)
12. [Design Decisions & Rationale](#12-design-decisions--rationale)
13. [Critical Implementation Details](#13-critical-implementation-details)
14. [Extensibility & Integration](#14-extensibility--integration)
15. [Future Considerations](#15-future-considerations)
16. [Conclusion](#16-conclusion)

---

## 1. Introduction & Core Philosophy

**Sylph.jsx** bridges **SolidJS's fine-grained reactivity** with **PixiJS's high-performance 2D rendering**, enabling developers to write declarative, component-based PixiJS applications using JSX while maintaining the performance characteristics critical for real-time graphics and games.

### Core Principles

- **Declarative over Imperative**: Write what you want, not how to achieve it
- **Fine-Grained Reactivity**: Only update what changed, when it changed
- **Frame-Synchronized Effects**: Deterministic, low-latency updates aligned with the render loop
- **Progressive Enhancement**: Escape hatches for imperative code when needed
- **Type Safety**: Full TypeScript support throughout

### Project Snapshot

- **Package name:** `sylph-jsx` (from `package.json`)
- **Entry point:** `src/index.ts` re-exports all public APIs
- **Primary exports:**
  - JSX runtime helpers (`src/pixi-jsx`)
  - Engine utilities (ticker integration, effects, tags)
  - Utility helpers (arrays, types, numbers, math)
- **Build targets:** Core engine + JSX runtime (via `tsconfig.jsx-runtime.json`)

---

## 2. Architecture Overview

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: User Components & Effects                         │
│  (createSynchronizedEffect, onEveryFrame, startCoroutine)   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: SolidJS Reactive System                           │
│  (signals, effects, components, context)                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Rendering Pipeline                                │
│  SolidJS Universal Renderer → Proxy DOM → PixiJS            │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User writes JSX** using PixiJS primitive elements (`<sprite>`, `<container>`, `<text>`, etc.)
2. **SolidJS Universal Renderer** processes JSX into a tree of ProxyDomNodes
3. **ProxyDomNodes** wrap PixiJS objects (Application, Container, Sprite, Text)
4. **Reactive primitives** (signals) trigger fine-grained updates via SolidJS reactivity
5. **Frame synchronization** happens via GameLoopContext and PixiJS Ticker

### Signal → PixiJS Flow

1. **Signals update** (e.g., `createSignal` in user code)
2. **SolidJS reconciles** using the custom renderer; diffing results in calls to `setProp`, `insertNode`, `removeNode`
3. **Proxy nodes** transform updates into PixiJS mutations, enforcing invariants and maintaining render-layer associations
4. **Ticker loop** drives scheduled frame effects and coroutines, ensuring updates align with PixiJS's rendering cadence
5. **PixiJS renderer** draws the latest scene graph to the canvas

---

## 3. Layered System Design

| Layer | Responsibilities | Key Modules |
| ----- | ---------------- | ----------- |
| **JSX Runtime** | Type definitions and SolidJS runtime exports so consumers can write `<application>` trees | `src/pixi-jsx/jsx/*`, `src/pixi-jsx/index.ts` |
| **SolidJS Renderer Bridge** | Custom renderer so SolidJS mounts into Pixi proxy nodes instead of the DOM | `src/pixi-jsx/solidjs-universal-renderer/index.ts` |
| **Proxy DOM** | Tree of `ProxyNode` instances mirroring the JSX tree and orchestrating Pixi node mutations | `src/pixi-jsx/proxy-dom/**/*` |
| **Engine Runtime** | Higher-level hooks, effects, coroutines, specialized tags (`Application`, `PixiExternalContainer`, etc.) | `src/engine/**/*` |
| **Utilities** | Shared types, math helpers, arrays, numbers | `src/utility-*.ts` |
| **Tests** | High-coverage suites asserting renderer correctness, reactivity, game loop, and node behaviors | `src/pixi-jsx/__tests__`, `src/engine/__tests__`, `src/__tests__` |

---

## 4. JSX Runtime & Type System

### 4.1 JSX Node Types (`src/pixi-jsx/jsx/jsx-node.ts`)

**Purpose**: Define TypeScript types for JSX elements that map to PixiJS objects

**Key Type Definitions**:

```typescript
// Recursive union of proxy nodes, arrays, functions, or undefined
type JSXNode = ProxyDomNode | ProxyDomNode[] | (() => ProxyDomNode) | undefined;

// Base props mixing PixiJS options with SolidJS primitives
type PixiNodeProps<Options> = Partial<Omit<Options, "children">> & {
    children?: JSX.Element;
    ref?: Setter<ProxyDomNode | undefined>;
    class?: string;
};
```

**Intrinsic Prop Types**:

- **`ApplicationIntrinsicProps`**: Merges PixiJS `ApplicationOptions` with initialization hooks (`loadingState`, `appInitialize`, `createTicker`)
- **`RenderLayerIntrinsicProps`**: Uses `RenderLayer` configuration; supports `sortableChildren` and other layer metadata
- **`TextIntrinsicProps`**: Allows raw children as strings/numbers or reactive factories, converting them into PixiJS `Text`
- **Container/Sprite/Graphics props**: Map directly to PixiJS object properties

### 4.2 JSX Runtime (`src/pixi-jsx/jsx/jsx-runtime.ts`)

**Purpose**: Provide typings consumed by TypeScript's JSX transform

**Intrinsic Elements**:
- `application` - Root PixiJS application
- `container` - Scene graph grouping element
- `sprite` - Textured display object
- `text` - Dynamic text display
- `graphics` - Vector graphics primitive
- `render-layer` - Transparent layer wrapper for rendering control

**Type Contract**:
```typescript
namespace JSX {
    type Element = JSXNode;
    interface IntrinsicElements {
        application: ApplicationIntrinsicProps;
        container: ContainerIntrinsicProps;
        // ... etc
    }
}
```

### 4.3 Render Root (`src/pixi-jsx/index.ts`)

**Purpose**: Export rendering utilities for mounting JSX into the DOM

```typescript
export const renderRoot = (component: () => JSX.Element, container: HTMLElement) => {
    // Uses solid-js/universal renderer
    // Mounts into HtmlElementNode wrapper
    // Inserts PixiJS canvas into DOM
};
```

---

## 5. SolidJS Universal Renderer

### Location: `src/pixi-jsx/solidjs-universal-renderer/index.ts`

**Purpose**: Bridge JSX syntax to ProxyDomNode operations

### Core Renderer API

```typescript
export const {
    render,
    effect,
    memo,
    createComponent,
    createElement,
    createTextNode,
    insertNode,
    insert,
    spread,
    setProp,
    mergeProps,
    use,
} = createRenderer<ProxyDomNode>({
    createElement(tag: string): ProxyDomNode { /* ... */ },
    createTextNode(value: string): ProxyDomNode { /* ... */ },
    replaceText(textNode: ProxyDomNode, value: string): void { /* ... */ },
    insertNode(parent: ProxyDomNode, node: ProxyDomNode, anchor?: ProxyDomNode): void { /* ... */ },
    isTextNode(node: ProxyDomNode): boolean { /* ... */ },
    removeNode(parent: ProxyDomNode, node: ProxyDomNode): void { /* ... */ },
    getParentNode(node: ProxyDomNode): Maybe<ProxyDomNode> { /* ... */ },
    getFirstChild(node: ProxyDomNode): Maybe<ProxyDomNode> { /* ... */ },
    getNextSibling(node: ProxyDomNode): Maybe<ProxyDomNode> { /* ... */ },
    setProperty(node: ProxyDomNode, name: string, value: any, prev?: any): void { /* ... */ },
});
```

### Key Responsibilities

1. **Element Creation**: `createElement` dispatches through `createProxiedPixieContainerNode`, instantiating the correct `ProxyNode` subclass
2. **Text Nodes**: Represented as `RawNode` instances, preserving raw string values until the owning `TextNode` consumes them
3. **Tree Navigation**: `getFirstChild`, `getNextSibling`, `getParentNode` rely on proxy relationships stored in the node tree
4. **Node Insertion/Removal**: Delegate to proxy methods, ensuring both logical (proxy) and physical (PixiJS) trees stay synchronized
5. **Property Setting**: Defers to `ProxyNode.setProp`, which handles both PixiJS instances and render-layer property writes

### Patched Types (`patched-types.ts`)

Re-exports SolidJS primitives without DOM-centric typings:
- `createSignal`, `createEffect`, `createMemo`
- `Show`, `For`, `Index`, `Switch`, `Match`
- `createContext`, `useContext`
- All reactive primitives consumers need

### Testing Coverage

Renderer behavior validated in `src/pixi-jsx/__tests__/renderer/*.test.tsx`:
- Element creation and type mapping
- Insertion heuristics and sibling ordering
- Raw text replacement
- Node traversal invariants

---

## 6. Proxy DOM System

### 6.1 Base Node Architecture (`src/pixi-jsx/proxy-dom/nodes/Node.ts`)

**Purpose**: Foundation of the proxy system - all node types extend this abstract class

```typescript
abstract class ProxyNode<T> {
    // Core properties
    tag: string;                              // JSX tag name
    container: T;                             // Wrapped PixiJS object
    parent: Maybe<ProxyDomNode>;             // Parent node
    children: ProxyDomNode[];                // All children (tracked + untracked)
    proxiedChildren: ProxyDomNode[];         // Only reactive children

    // RenderLayer support
    renderLayer: Maybe<RenderLayer>;         // Attached render layer
    renderLayerChildren: Container[];        // Children attached to layer

    // Core methods
    abstract addChildProxy(node: ProxyDomNode, index: number): void;
    abstract removeChildProxy(node: ProxyDomNode): void;
    abstract recomputeProxy(): void;

    addChild(node: ProxyDomNode, anchor?: ProxyDomNode): void;
    removeChild(node: ProxyDomNode): void;
    setProp<T>(name: string, value: T, prev: Maybe<T>): void;

    // External container support
    addChildProxyUntracked(child: Container): void;
    removeChildProxyUntracked(child: Container): void;
    syncUntracked(): void;

    // Render layer management
    setRenderLayer(layer: RenderLayer): void;
    attachRenderLayer(layer: RenderLayer): void;
    attachRenderLayerRecursive(layer: RenderLayer): void;
}
```

**Design Insight**: The distinction between `children` and `proxiedChildren` enables **tracked** (reactive) and **untracked** (external) child management—critical for `PixiExternalContainer`.

### 6.2 Node Type Implementations

#### ApplicationNode (`ApplicationNode.ts`)

**Purpose**: Root of the display hierarchy

**Key Features**:
- Wraps PixiJS `Application`
- Manages async initialization
- Mounts to DOM element
- Special-cases render-layer insertion

**Critical Method - `initialize()`**:
```typescript
const initialize = async () => {
    invariant(parent?.tag === "html-element");

    // CRITICAL: Ticker must be assigned BEFORE init()
    await container.init({
        width: initializationProps.width,
        height: initializationProps.height,
        // ... other props
    });

    container.render();
    parent.container.appendChild(container.canvas);
};
```

#### ContainerNode (`ContainerNode.ts`)

**Purpose**: Most complex node implementation - general-purpose scene graph container

**Key Features**:
- Maintains insertion order across SolidJS updates
- Supports children (other containers, sprites, text)
- Handles RenderLayer insertion and propagation
- Manages insert index resolution (accounting for transparent RawNodes)

**Critical Method - `resolveInsertIndex`**:
```typescript
private resolveInsertIndex(anchor?: ProxyDomNode): number {
    // Skips raw nodes (transparent) to find correct PixiJS insertion point
    if (!anchor) return this.container.children.length;

    const index = this.children.indexOf(anchor);
    if (index === -1) return this.container.children.length;

    // Count only non-raw nodes before anchor
    let pixiIndex = 0;
    for (let i = 0; i < index; i++) {
        if (this.children[i].tag !== "raw") pixiIndex++;
    }
    return pixiIndex;
}
```

**Why This Matters**: PixiJS insertion index must map to actual PixiJS children, not reactive children. RawNodes exist in the reactive tree but not in the PixiJS hierarchy.

#### SpriteNode (`SpriteNode.ts`)

**Purpose**: Leaf node for textured display objects

**Key Features**:
- Wraps PixiJS `Sprite`
- Cannot have children (enforced at runtime)
- Supports all sprite properties (texture, tint, anchor, pivot, etc.)

#### TextNode (`TextNode.ts`)

**Purpose**: Dynamic text display with reactive content

**Key Features**:
- Wraps PixiJS `Text`
- Automatically concatenates RawNode children into text string
- Updates reactively when children change

**Critical Method - `recomputeProxy`**:
```typescript
protected override recomputeProxy(): void {
    this.container.text = this.children.reduce(
        (acc, child) => `${acc}${child.container}`,
        ""
    );
}
```

**Usage Example**:
```tsx
// JSX
<text>Score: {score()}</text>

// Becomes
TextNode {
    children: [
        RawNode("Score: "),
        RawNode(score())  // reactively updates
    ]
}

// Result: "Score: 42"
```

#### GraphicsNode (`GraphicsNode.ts`)

**Purpose**: Vector graphics primitive

**Key Features**:
- Wraps PixiJS `Graphics`
- Leaf node (no children)
- Supports drawing commands via props

#### RenderLayerNode (`RenderLayerNode.ts`)

**Purpose**: Transparent wrapper for PixiJS `RenderLayer`

**Key Features**:
- Creates PixiJS `RenderLayer` instance
- Children attach to layer AND parent container
- Enables separate rendering passes without breaking JSX nesting
- Queues children in `pendingChildren` until attached to parent

**Transparency Pattern**:
```typescript
override addChild(child: ProxyDomNode, anchor?: ProxyDomNode): void {
    this.children.push(child);
    child.parent = this;

    // Attach to layer
    if (this.renderLayer) {
        child.attachRenderLayer(this.renderLayer);
    }

    // Add to parent container (transparency!)
    if (this.parent) {
        this.parent.addChild(child, anchor);
    } else {
        this.pendingChildren.push({ child, anchor });
    }
}
```

**Visual vs Reactive Hierarchy**:

```
PixiJS Visual Hierarchy:
Container
  ├─ RenderLayer (attached, not a child)
  ├─ Sprite (attached to layer)
  └─ Text (attached to layer)

Reactive JSX Hierarchy:
<container>
  <render-layer>
    <sprite />
    <text />
  </render-layer>
</container>
```

#### Support Nodes

- **RawNode (`RawNode.ts`)**: Wraps string values for text content
- **HtmlElementNode (`HtmlElementNode.ts`)**: Ensures `<application>` is the only child; manages canvas lifecycle

### 6.3 Node Utilities (`utility-node.ts`)

**Purpose**: Type guards and invariant helpers

**Key Exports**:
- `expectNode(condition, message)`: Runtime invariant checking
- `expectNodeNot(condition, message)`: Inverse invariant
- `isNodeWithPixiContainer(node)`: Type guard for container-bearing nodes

These guards are integrated into nearly every node mutation, catching invalid structures early.

### 6.4 Testing Coverage

`src/pixi-jsx/__tests__/nodes/*` thoroughly exercises:
- Logical vs. physical tree alignment
- Render-layer propagation
- Untracked children management
- Fragment handling
- ID stability

---

## 7. Engine Runtime

### 7.1 Core Game Loop (`src/engine/core/`)

#### Timer and Ticker (`time.ts`)

**Purpose**: Create PixiJS Ticker with reactive effect cascade processing

```typescript
export const createTimer = (args: CreateTimerArgs) => {
    const ticker = new Ticker();

    const frameTick = (ticker: Ticker) => {
        const now = performance.now();
        const frameStart = now;

        // Run continuous effects
        args.everyFrameFns.forEach((fn) => fn(ticker));

        // Effect cascade: process all scheduled effects within frame budget
        let next: EffectCallback[] = [];
        while (args.nextFrameFns.size && performance.now() - frameStart < FRAME_BUDGET) {
            next = Array.from(args.nextFrameFns.values());
            args.nextFrameFns.clear();
            batch(() => next.forEach((x) => x(ticker)));
        }

        args.setFrameCount((last) => last + 1);
    };

    ticker.add(frameTick);
    return { ticker, dispose: () => ticker.destroy() };
};
```

**Key Features**:
- **Frame budget (16.6ms)**: Prevents frame overruns
- **Effect cascade**: Runs all queued effects in a single frame
- **Batching**: Uses SolidJS `batch()` to collapse signal updates

**Why This Matters**: Traditional reactive systems create multi-frame latency:
- Frame 1: Input event → update signal
- Frame 2: Effect runs → updates another signal
- Frame 3: Second effect runs → updates display

Sylph collapses this into a single frame (within budget):
- Frame 1: Input → stateA → stateB → render

**Timing Comparison**:
```
Traditional (3 frames):
Frame 1: input → stateA
Frame 2: stateA → stateB
Frame 3: stateB → render
Total latency: ~50ms @ 60fps

Sylph (1 frame):
Frame 1: input → stateA → stateB → render
Total latency: ~16.6ms @ 60fps
```

#### GameLoopContext (`game-loop-context.ts`)

**Purpose**: Context providing frame synchronization infrastructure

```typescript
type GameLoopContext = {
    frameCount: Accessor<number>;                    // Current frame number
    scheduledEffects: Map<symbol, EffectCallback>;   // Queued effects for next frame
    everyFrameFns: Map<symbol, EffectCallback>;      // Continuous effects
};

// Usage
const gameLoopContext = useGameLoopContext();
```

**Provided by**: `Application` component
**Consumed by**: `createSynchronizedEffect`, `onEveryFrame`

#### Query Functions (`query-fns.ts`)

##### createSynchronizedEffect

**Purpose**: Frame-synchronized reactive effects

```typescript
export const createSynchronizedEffect = <T>(
    args: {
        query: () => T;                    // Reactive query function
        effect: (value: T, time: Ticker) => void;  // Effect callback
    },
    owner?: Owner
): Dispose => {
    const gameLoopContext = useGameLoopContext();
    const id = Symbol("synchronized-effect");
    const queryOwner = owner || getOwner();

    let queryResult: T;
    let dispose: Dispose;

    const execution = (ticker: Ticker) => {
        if (queryOwner) {
            runWithOwner(queryOwner, () => args.effect(queryResult, ticker));
        } else {
            args.effect(queryResult, ticker);
        }
    };

    createRoot((_dispose) => {
        dispose = _dispose;
        createComputed(() => {
            queryResult = args.query();  // Track dependencies
            gameLoopContext.scheduledEffects.set(id, execution);  // Schedule for next frame
        });
    });

    onCleanup(() => {
        dispose();
        gameLoopContext.scheduledEffects.delete(id);
    });

    return dispose;
};
```

**Execution Flow**:
1. **Query phase**: `query()` runs, tracks reactive dependencies
2. **Schedule phase**: Effect callback added to `scheduledEffects` map
3. **Next frame**: Ticker calls all scheduled effects with current frame data
4. **Effect phase**: Callback executes with queried value and ticker

**Ownership Preservation**: Uses `runWithOwner()` to maintain component cleanup semantics.

##### onEveryFrame

**Purpose**: Continuous per-frame effects (no reactive tracking)

```typescript
export const onEveryFrame = (effect: (ticker: Ticker) => void): Dispose => {
    const gameLoopContext = useGameLoopContext();
    const id = Symbol("every-frame-effect");

    gameLoopContext.everyFrameFns.set(id, effect);

    onCleanup(() => {
        gameLoopContext.everyFrameFns.delete(id);
    });

    return () => gameLoopContext.everyFrameFns.delete(id);
};
```

**Use Cases**:
- Fixed-step simulations
- Continuous animations
- Physics updates
- Debug displays

**Best Practice**: Prefer `createSynchronizedEffect` when updates only need to happen in response to state changes. Reserve `onEveryFrame` for unavoidable per-frame work.

### 7.2 Coroutine System (`src/engine/effects/coroutines.ts`)

**Purpose**: Frame-synchronized generator-based sequential programming

#### Core API

```typescript
export const startCoroutine = (
    generatorFn: () => Generator<CoroutineControl, void, void>
): CoroutineReturn => {
    const generator = generatorFn();
    const state = { paused: false, waitingFrames: 0, waitingMs: 0 };

    const dispose = onEveryFrame((ticker) => {
        if (state.paused) return;

        // Update wait timers
        if (state.waitingFrames > 0) {
            state.waitingFrames--;
            return;
        }

        if (state.waitingMs > 0) {
            state.waitingMs -= ticker.deltaMS;
            return;
        }

        // Execute next step
        const result = generator.next();

        if (result.done) {
            dispose();
            state.stopped.resolve();
            return;
        }

        // Process control instruction
        const control = result.value;
        if (control.type === "waitMs") {
            state.waitingMs = control.ms;
        }
        // ... handle other control types
    });

    return { dispose, stopped: state.stopped.promise, pause, resume };
};
```

#### Control Instructions

```typescript
enum CoroutineControl {
    continue,           // Continue immediately next frame
    waitMs(ms),        // Wait for time in milliseconds
    waitFrames(n),     // Wait for N frames
    stop,              // Terminate coroutine
}
```

#### Composition Utilities

```typescript
// Easing animation
const easeInOut = createEasingCoroutine({
    from: 0,
    to: 100,
    durationMs: 1000,
    easing: easings.easeInOutQuad,
    onUpdate: (value) => sprite.x = value,
});

// Infinite loop
const looping = createRepeatableCoroutine(function* () {
    yield* moveUp();
    yield* moveDown();
});

// Sequential chaining
const sequence = chainCoroutine([
    moveToPosition,
    waitMsCoroutine(500),
    fadeOut,
]);
```

**Real-World Example**:
```typescript
function* attackSequence() {
    // Move to target
    yield* createEasingCoroutine({
        from: sprite.x,
        to: target.x,
        durationMs: 500,
        easing: easings.easeInOutQuad,
        onUpdate: (x) => sprite.x = x,
    });

    // Wait for impact
    yield waitMs(100);

    // Flash effect
    for (let i = 0; i < 3; i++) {
        sprite.tint = 0xff0000;
        yield waitFrames(2);
        sprite.tint = 0xffffff;
        yield waitFrames(2);
    }

    // Return to original position
    yield* createEasingCoroutine({
        from: sprite.x,
        to: originalX,
        durationMs: 500,
        easing: easings.easeOutQuad,
        onUpdate: (x) => sprite.x = x,
    });
}

const { dispose, pause, resume, stopped } = startCoroutine(attackSequence);
```

**Design Insight**: Coroutines provide a **synchronous programming model** for asynchronous frame-based logic, preserving local state across frames.

### 7.3 Engine Tags (`src/engine/tags/`)

#### Application Component (`Application.tsx`)

**Purpose**: Root component integrating all framework features

**Key Features**:
- Async initialization with loading state
- Custom ticker integration (assigned before `app.init()`)
- Context providers (ApplicationContext, GameLoopContext)
- PixiJS devtools integration

**Initialization Flow**:
```typescript
export const Application = (props: ApplicationProps) => {
    const timer = createTimer(/* ... */);

    // CRITICAL: Assign ticker BEFORE initialization
    const appInitialize = async (app: PixiJSApplication) => {
        app.ticker = timer.ticker;  // Must be first!
        await app.init(/* ... */);
        await props.appInitialize?.(app);
        timer.ticker.start();
        initDevtools({ app });
    };

    return (
        <ApplicationContext.Provider value={createApplicationState}>
            <GameLoopContextProvider frameCount={frameCount} /* ... */>
                <application appInitialize={appInitialize} /* ... */>
                    <Show when={appReady()} fallback={props.loadingState}>
                        {props.children}
                    </Show>
                </application>
            </GameLoopContextProvider>
        </ApplicationContext.Provider>
    );
};
```

**Lifecycle**:
1. `Application` component renders `<application ref={setApplication}>`
2. SolidJS renderer instantiates `ApplicationNode`
3. `createResource` waits until `onMount` triggers
4. Custom ticker assigned to `app.ticker` **before** `app.init()`
5. `ApplicationNode.initialize()` runs initialization
6. Optional `props.appInitialize` callback executes
7. Ticker starts, devtools initialized
8. Children rendered when `applicationReady()` resolves

#### PixiExternalContainer (`PixiExternalContainer.tsx`)

**Purpose**: Bridge between imperative PixiJS code and reactive Sylph components

```typescript
export const PixiExternalContainer = (props: PixiExternalContainerProps) => {
    return (
        <container
            ref={(node) => {
                const containerNode = node as ContainerNode;
                containerNode.addChildProxyUntracked(props.container);
            }}
            {...props}
        >
            {props.children}
        </container>
    );
};
```

**Use Case**:
```tsx
// Imperative PixiJS code
const externalContainer = new Container();
externalContainer.addChild(complexSprite);
updateExternalLogic(externalContainer);

// Integrated with reactive components
<PixiExternalContainer container={externalContainer} x={100} y={200}>
    <text>Reactive overlay on imperative container</text>
</PixiExternalContainer>
```

**How It Works**:
- Uses `addChildProxyUntracked()` to add external container without reactive tracking
- Properties (`x`, `y`, etc.) are still reactive
- JSX children are tracked normally
- `syncUntracked()` ensures external children stay in hierarchy

#### CoroutineContainer (`tags/extensions/CoroutineContainer.tsx`)

**Purpose**: Bridge coroutine utilities with JSX

**Features**:
- Accepts `duration`, `easingFn`, `from`/`to`, optional `delay`, `shouldStart`, `replay`
- Constructs coroutine pipeline (delay → easing-based interpolation)
- Exposes progress to children via render props
- Uses `createSynchronizedEffect` to pause/resume based on `shouldStart`

### 7.4 Effects Library (`src/engine/effects/`)

- **`createGraphics.ts`**: Helper to instantiate and configure PixiJS `Graphics`
- **`createWindow.ts`**: Reactive tracker for window dimensions with resize listeners
- **`createMouse.ts`**: Wraps mouse events into SolidJS signals (`click`, `lastClickPosition`, `currentMousePosition`, `wheel`)
- **`createAsset.ts`**: Lazy resource loading using SolidJS `createResource`
- **`createTimers.ts`**: Reactive `setInterval`/`setTimeout` analogs leveraging `onEveryFrame`

### 7.5 Libraries (`src/engine/libs/`)

- **`Math.ts`**: `lerp` implementation supporting easing utilities
- **`Easing.ts`**: Common easing curves (`linear`, `easeIn`, `easeOut`, `easeInOut`, `circularIn`, `elasticIn`)
- **`Point.ts`**: Point equality, distance calculations, and `Point` shape definition

---

## 8. Render Layer System

### Purpose

`<render-layer>` creates a PixiJS `RenderLayer` alongside display objects, enabling:
- Independent depth sorting without restructuring JSX
- Render batching optimization
- Post-processing passes
- Z-index control

### Lifecycle Flow

1. SolidJS inserts `<render-layer>`, renderer creates `RenderLayerNode` with PixiJS `RenderLayer`
2. Children get `renderLayer` pointer set via `setRenderLayer`
3. `ProxyNode.attachRenderLayer` attaches PixiJS display objects to the layer
4. If layer not yet attached to parent, children queue in `pendingChildren`
5. When parent attached, queued children flush
6. On removal, node detaches children from layer and restores default container ownership

### JSX Example

```tsx
<container>
    <render-layer zIndex={100} sortableChildren>
        <text x={16} y={16}>HUD Overlay</text>
        <container>
            <sprite texture={hudTexture()} />
        </container>
        <For each={alerts()}>
            {(alert) => <text y={alert().y}>{alert().label}</text>}
        </For>
    </render-layer>

    <sprite texture={playerTexture()} x={player().x} y={player().y} />
</container>
```

### How It Works

- `<render-layer>` acts as transparent wrapper
- All descendants automatically attach to layer via `renderLayerChildren` array
- Layer itself inserted into parent container
- Children remain siblings in display list, just marked for layer rendering
- Reactive props update layer properties
- Nested `<render-layer>` blocks work correctly
- Works with SolidJS control flow (`<Show>`, `<For>`, `<Index>`)

### Testing Coverage

`render-layer.test.tsx` validates:
- Children appear in both parent container's `children` array and layer's `renderLayerChildren`
- Property forwarding to RenderLayer instance
- Reactive toggling (Show/For/Index)
- Nested layers and deep tree propagation
- Mixing layered and non-layered siblings
- Render order preservation
- Raw text removal (regression test)
- Dynamic list rendering

### Design Implications

- Render layers propagate downward recursively
- Nested components inherit layer context automatically
- Layer ordering controlled by container's child order
- CPU cost similar to normal hierarchy, but draw ordering controllable

---

## 9. Application Lifecycle

### Detailed Initialization Flow

1. **Mounting**
   - `Application` component renders `<application ref={setApplication}>`
   - SolidJS renderer instantiates `ApplicationNode` and stores in `application` signal
   - `createResource(mount, ...)` waits until `onMount` flips `mount` to `true`

2. **Ticker Setup**
   - `createTimer` builds ticker using supplied `createTicker` (e.g., `FakeTestingTicker` for tests) or default
   - Before `application.initialize()`, ticker assigned: `app.container.ticker = timer.ticker`
   - This prevents PixiJS from auto-creating its own ticker (would cause dual render loops)

3. **Initialization**
   - `ApplicationNode.initialize()` runs `pixiApp.init` with cached props (width, height, etc.)
   - Performs initial render
   - Appends canvas to provided HTML element
   - Optional `props.appInitialize` executes (enables async asset loading)

4. **Contexts**
   - `GameLoopContextProvider` exposes `{ frameCount, scheduledEffects, everyFrameFns }`
   - `ApplicationContext.Provider` exposes `{ application }` for `useApplicationState()`

5. **Rendering Children**
   - `Show` component waits for `applicationReady()`
   - Until resolved, renders `loadingState` (defaults to `<text>Loading...</text>`)
   - Once ready, SolidJS renders children under `<container>` wrapper

6. **Cleanup**
   - `onCleanup` of `createEffectOnNextFrame` ensures scheduled callbacks removed from queue
   - Ticker removal handled by `createTimer` (removes frame callback on cleanup)
   - Prevents memory leaks when Application unmounts

---

## 10. Key Patterns & Abstractions

### Pattern 1: Tracked vs Untracked Children

**Problem**: Need to mix reactive and imperative code in the same hierarchy

**Solution**: Dual child tracking

```typescript
class ProxyNode<T> {
    children: ProxyDomNode[];          // All children (tracked + untracked)
    proxiedChildren: ProxyDomNode[];   // Only tracked (reactive) children

    // Tracked child (reactive)
    addChild(node: ProxyDomNode): void {
        this.children.push(node);
        this.proxiedChildren.push(node);
        // ... add to PixiJS container
    }

    // Untracked child (external/imperative)
    addChildProxyUntracked(child: Container): void {
        this.children.push(createProxyNode(child));
        // Note: NOT added to proxiedChildren
    }

    // Ensure untracked children stay in hierarchy
    syncUntracked(): void {
        const untrackedChildren = this.children.filter(
            (child) => !this.proxiedChildren.includes(child)
        );

        untrackedChildren.forEach((child) => {
            if (!this.container.children.includes(child.container)) {
                this.container.addChild(child.container);
            }
        });
    }
}
```

**Benefits**:
- Escape reactive system when needed
- Maintain unified parent-child relationships
- Enable gradual migration from imperative to declarative code

### Pattern 2: RenderLayer Transparency

**Problem**: PixiJS RenderLayers need to be children of containers, but JSX nesting shouldn't expose this implementation detail

**Solution**: Transparent node that propagates children upward

See [Section 8: Render Layer System](#8-render-layer-system) for details.

**Benefits**:
- Natural JSX nesting
- No API leakage
- Works with SolidJS control flow

### Pattern 3: Effect Cascade Processing

**Problem**: Multi-frame latency in reactive updates (input → state → derived state → render takes 3 frames)

**Solution**: Process all triggered effects within single frame, respecting frame budget

See [Section 7.1: Timer and Ticker](#timer-and-ticker-timets) for implementation.

**Trade-off**: Limited by 16.6ms budget. If cascade exceeds budget, remaining effects defer to next frame (graceful degradation).

### Pattern 4: Raw Nodes & Text Concatenation

**Problem**: PixiJS Text expects a single string, but JSX children can be multiple dynamic values

**Solution**: RawNode for transparent text fragments + TextNode concatenation

See [Section 6.2: TextNode](#textnode-textnodets) for details.

**Benefits**:
- Natural JSX syntax for text
- Reactive text fragments
- No manual string concatenation in user code

### Pattern 5: Ownership Preservation

**Problem**: SolidJS effects need component ownership for cleanup, but effects run asynchronously in ticker

**Solution**: Capture owner and use `runWithOwner()`

See [Section 7.1: createSynchronizedEffect](#createsynchronizedeffect) for implementation.

**Benefits**:
- Proper cleanup when component unmounts
- Maintains SolidJS disposal semantics
- Prevents memory leaks

### Pattern 6: Property Reflection

**Problem**: PixiJS objects have hundreds of properties; manually mapping them is impractical

**Solution**: Use `Reflect.set()` for generic property binding

```typescript
class ProxyNode<T> {
    setProp<V>(name: string, value: V, prev: Maybe<V>): void {
        if (typeof this.container === "object" && this.container !== null) {
            Reflect.set(this.container, name, value);
        } else if (this.tag === "render-layer" && this.renderLayer) {
            Reflect.set(this.renderLayer, name, value);
        }
    }
}
```

**Benefits**:
- Works with any PixiJS property
- Type-safe via JSX prop types
- No manual mapping needed
- Extensible to future PixiJS APIs

---

## 11. Testing Architecture

### Testing Strategy

High-coverage test suites across three major areas:

1. **Renderer & Node Behavior** (`src/pixi-jsx/__tests__`)
2. **Reactivity & SolidJS Integration** (`src/pixi-jsx/__tests__/reactivity`)
3. **Game Loop & Effects** (`src/engine/__tests__`)

### FakeTestingTicker

**Purpose**: Deterministic frame-by-frame testing

**Location**: `src/__tests__/test-utils/FakeTestingTicker.ts`

```typescript
class FakeTestingTicker extends Ticker {
    private time = 0;

    override tick(deltaMS = 16.67) {
        this.time += deltaMS;
        this.update(this.time);  // Triggers all ticker listeners
    }

    async tickFrames(frames: number) {
        for (let i = 0; i < frames; i++) {
            this.tick(17);  // ~60fps
            await setImmediate();  // Allow microtasks to flush
        }
    }
}
```

**Benefits**:
- Synchronous frame control
- No real-time waiting
- Predictable timing
- Fast test execution

### Test Utilities

**Location**: `src/__tests__/test-utils/test-utils.tsx`

```typescript
export const renderApplicationWithFakeTicker = async (
    component: () => JSX.Element
) => {
    const ticker = new FakeTestingTicker();
    const container = document.createElement("div");

    const app = await renderApplication(component, {
        container,
        createTicker: () => ticker,
    });

    return { app, stage: app.stage, ticker };
};
```

### Test Coverage Areas

#### Renderer Tests (`src/pixi-jsx/__tests__/renderer/`)
- `createElement.test.tsx` - Element creation and type mapping
- `insertNode.test.tsx` - Insertion heuristics, sibling ordering, anchor insertion
- `removeNode.test.tsx` - Node removal, cleanup, conditional toggles
- `node-traversal.test.tsx` - Tree navigation APIs

#### Node Tests (`src/pixi-jsx/__tests__/nodes/`)
- `fragments.test.tsx` - Fragment handling
- `node-ids.test.tsx` - ID stability
- `untracked-children.test.tsx` - Untracked child management
- `render-layer.test.tsx` - Comprehensive render layer testing

#### Reactivity Tests (`src/pixi-jsx/__tests__/reactivity/`)
- `signals.test.tsx` - Signal updates trigger PixiJS prop changes
- `nested-reactivity.test.tsx` - Derived signals and memos
- `cleanup.test.tsx` - Effect cleanup and disposal
- `conditional-rendering.test.tsx` - Show/Switch/Match components
- `list-rendering.test.tsx` - For/Index with dynamic arrays

#### Game Loop Tests (`src/engine/__tests__/core/`)
- `query-fns.test.tsx` - `createSynchronizedEffect`, `onEveryFrame`
- Multi-signal queries
- Conditional updates
- Sprite mutations
- Owner preservation

#### Coroutine Tests (`src/engine/__tests__/effects/coroutines/`)
- Wait timing precision
- Control flow (pause, resume, stop)
- Easing integration
- Loops and repetition
- Early termination

#### Integration Tests
- `PixiExternalContainer.test.tsx` - External container add/remove/cleanup

### Test Patterns

**Testing Reactive Updates**:
```typescript
test("sprite position updates", async () => {
    const [x, setX] = createSignal(0);

    const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <Application>
            <sprite texture={Texture.WHITE} x={x()} />
        </Application>
    ));

    setX(100);
    await ticker.tickFrames(1);  // Process effects

    expect(stage.children[0].x).toBe(100);
});
```

**Testing Coroutines**:
```typescript
test("waitFrames pauses for exact frame count", async () => {
    let completed = false;

    const { ticker } = await renderApplicationWithFakeTicker(() => (
        <Application>
            <container
                ref={() => {
                    startCoroutine(function* () {
                        yield waitFrames(5);
                        completed = true;
                    });
                }}
            />
        </Application>
    ));

    await ticker.tickFrames(4);
    expect(completed).toBe(false);

    await ticker.tickFrames(1);
    expect(completed).toBe(true);
});
```

---

## 12. Design Decisions & Rationale

### Why SolidJS?

**Alternatives Considered**: React, Vue, Svelte, Preact

**Chosen**: SolidJS

**Rationale**:
- **Fine-grained reactivity**: Updates only what changed, critical for 60fps
- **No Virtual DOM overhead**: Direct updates to PixiJS objects
- **Small bundle size**: ~7kb gzipped
- **Universal Renderer API**: Official abstraction for custom renderers
- **Mature ecosystem**: Context, effects, control flow components

**Trade-offs**:
- Smaller community than React
- Fewer third-party libraries
- Different mental model (no re-rendering components)

### Why Proxy DOM Abstraction?

**Alternatives Considered**: Direct PixiJS manipulation, custom JSX transform

**Chosen**: Proxy DOM layer

**Rationale**:
- **Decouples JSX from PixiJS**: Can swap PixiJS versions without breaking renderer
- **Type safety**: JSX props are fully typed
- **Node transformations**: Enables RenderLayer transparency pattern
- **Testability**: Can test renderer independently of PixiJS
- **Flexibility**: Tracked/untracked children, external containers

**Trade-offs**:
- Extra layer of indirection
- Slight memory overhead (one ProxyNode per PixiJS object)

### Why Frame-Synchronized Effects?

**Alternatives Considered**: Immediate effect execution (like standard SolidJS)

**Chosen**: Ticker-synchronized effects

**Rationale**:
- **Deterministic ordering**: All updates happen in known frame
- **Low latency**: Cascade processing collapses multi-frame updates into one
- **Game loop alignment**: Natural for game development patterns
- **Budget control**: 16.6ms limit prevents frame drops

**Trade-offs**:
- One frame delay for first effect (not instant)
- More complex implementation
- Requires understanding of frame synchronization

### Why Generator-Based Coroutines?

**Alternatives Considered**: Promises, async/await, state machines

**Chosen**: Generator functions

**Rationale**:
- **Local state**: Variables preserved across frames (no closures needed)
- **Readable**: Sequential code for sequential logic
- **Composable**: Can nest and chain coroutines
- **Control flow**: `yield*` for delegation, early termination
- **Pause/resume**: Built-in state machine

**Trade-offs**:
- Unfamiliar syntax for some developers
- Generator overhead (minimal)
- No TypeScript type inference for yield values

### Why Ticker Before Initialization?

**Problem**: PixiJS creates default ticker during `init()` if none exists

**Solution**: Assign custom ticker BEFORE calling `app.init()`

**Rationale**:
- **Single render loop**: Prevents two simultaneous tickers
- **Frame synchronization**: Ensures effects run in custom ticker
- **Stability**: Avoids race conditions between tickers

**Consequence**: This is a **critical implementation detail**. Violating this causes frame drops and jitter.

---

## 13. Critical Implementation Details

### 1. Ticker Assignment Timing

**CRITICAL**: Custom ticker MUST be assigned BEFORE `app.init()`

```typescript
// CORRECT
app.ticker = customTicker;
await app.init();

// WRONG - causes dual render loops!
await app.init();
app.ticker = customTicker;
```

**Why**: PixiJS creates default ticker during `init()` if none exists. Assigning after means two tickers run simultaneously.

**Symptoms of violation**:
- Frame drops
- Jitter
- Effects run twice per frame
- Unpredictable timing

### 2. Effect Cascade Budget

**Constant**: `FRAME_BUDGET = 16.6` (milliseconds)

**Purpose**: Prevent cascade processing from exceeding frame time

**Behavior**:
- If cascade completes within budget: all effects execute in one frame
- If cascade exceeds budget: remaining effects deferred to next frame

**Tuning**: Adjust budget based on target frame rate:
- 60fps: 16.6ms
- 30fps: 33.3ms
- 120fps: 8.3ms

### 3. Insert Index Resolution

**Problem**: RawNodes exist in reactive tree but not PixiJS hierarchy

**Solution**: Skip RawNodes when calculating insertion index

See [Section 6.2: ContainerNode](#containernode-containernodets) for implementation.

**Why**: PixiJS insertion index must map to actual PixiJS children, not reactive children.

### 4. RenderLayer Pending Children

**Problem**: RenderLayerNode may receive children before attached to parent

**Solution**: Queue children until attachment

```typescript
class RenderLayerNode {
    private pendingChildren: Array<{ child: ProxyDomNode; anchor?: ProxyDomNode }> = [];

    override addChild(child: ProxyDomNode, anchor?: ProxyDomNode): void {
        this.children.push(child);
        child.parent = this;

        if (this.parent) {
            // Attached: add directly
            this.parent.addChild(child, anchor);
        } else {
            // Detached: queue for later
            this.pendingChildren.push({ child, anchor });
        }
    }

    override attachToParent(parent: ProxyDomNode): void {
        this.parent = parent;

        // Flush pending children
        this.pendingChildren.forEach(({ child, anchor }) => {
            parent.addChild(child, anchor);
        });
        this.pendingChildren = [];
    }
}
```

**Why**: SolidJS may construct component trees bottom-up. This ensures children don't get lost.

### 5. Ownership Preservation in Effects

**Problem**: Effects run asynchronously in ticker, outside component context

**Solution**: Capture owner and restore via `runWithOwner()`

See [Section 7.1: createSynchronizedEffect](#createsynchronizedeffect) for implementation.

**Why**: Enables `onCleanup()` and other ownership-dependent APIs to work correctly inside effects.

---

## 14. Extensibility & Integration

### Adding New PixiJS Intrinsics

1. **Implement ProxyNode subclass** with behavior for child management and prop forwarding
2. **Register in `createProxiedPixieContainerNode`** (`src/pixi-jsx/proxy-dom/index.ts`)
3. **Update `JSX.IntrinsicElements`** typing in `jsx-runtime.ts`
4. **Add tests** in `renderer` and `nodes` suites to validate lifecycle behavior

### Integrating External PixiJS Modules

- Use `PixiExternalContainer` to bridge imperative containers
- Remember: SolidJS will not diff inside the external subtree
- Callers must manage lifecycle of external containers

### Managing Frame-Bound Work

- **Prefer `createSynchronizedEffect`** for reactive-driven updates (responding to signals)
- **Use `onEveryFrame` sparingly** for continuous loops
- **Long-running callbacks** should yield via coroutines or schedule work piecemeal to avoid blowing the frame budget

### Render Layer Nuances

- Render layers keep PixiJS children attached to parent container (similar CPU cost)
- Draw ordering controlled via `RenderLayer.renderLayerChildren`
- Nested layers inherit layering context
- Ensure nested logic accounts for multiple render-layer associations if mixing scenes

### Testing Considerations

- `FakeTestingTicker` should accompany any new ticker-dependent feature tests
- When interacting with timers or async initialization, rely on `setImmediate` to await SolidJS flushes
- Test both logical tree (proxy nodes) and physical tree (PixiJS containers)

### Working with External PixiJS Systems

**Example: Integrating Third-Party PixiJS Library**:
```tsx
import { SomePixiPlugin } from 'pixi-plugin';

const MyComponent = () => {
    const externalContainer = new Container();

    // Initialize third-party plugin imperatively
    const plugin = new SomePixiPlugin(externalContainer);
    plugin.configure({ /* ... */ });

    onCleanup(() => {
        plugin.destroy();
    });

    return (
        <PixiExternalContainer container={externalContainer}>
            <text>Reactive overlay on plugin</text>
        </PixiExternalContainer>
    );
};
```

---

## 15. Future Considerations

### Documentation Alignment

- Ensure README mirrors lowercase intrinsic names (`<application>`, `<container>`)
- Keep public examples consistent with current API surface
- Document render-layer semantics with visual diagrams

### Devtools Integration

- `Application` currently loads `@pixi/devtools` unconditionally
- Consider conditional inclusion strategy for production builds to reduce bundle size
- Evaluate opt-in/opt-out configuration

### Frame Budget Configuration

- `FRAME_BUDGET = 16.6` ms currently hardcoded in `createTimer`
- Consider making configurable for:
  - High-load scenarios
  - Different target frame rates (30fps, 120fps)
  - Dynamic adjustment based on performance metrics

### Coroutine Ergonomics

- Control instructions must be yielded explicitly (`CoroutineControl.continue()`)
- Future APIs could provide higher-level abstractions for simpler cases
- Consider TypeScript type inference improvements for yield values

### Deprecated Assets

- Legacy tags (`Assets`, `FlexBox`) kept for backward compatibility
- Consider documentation of deprecation or removal before 1.0
- Clear migration path for users of deprecated APIs

### Type Safety Improvements

- `PixiNodeProps` uses `Partial<Omit<Options,...>>`
- Some PixiJS options may benefit from stricter typing
- Provide usage examples to reduce common mistakes (e.g., `anchor`, `pivot`)

### Performance Monitoring

- Built-in performance profiling utilities
- Effect cascade timing metrics
- Frame budget utilization tracking
- Memory leak detection helpers

---

## 16. Conclusion

**Sylph.jsx** successfully bridges two powerful but distinct paradigms:

1. **SolidJS's fine-grained reactivity**: Declarative, component-based UI development
2. **PixiJS's high-performance rendering**: Imperative, performance-critical graphics

### Key Architectural Strengths

1. **Layered Design**: Clear separation between JSX, reactivity, and rendering
2. **Frame Synchronization**: Deterministic, low-latency updates via ticker integration
3. **Composable Abstractions**: Coroutines, easing, asset loading work seamlessly together
4. **Type Safety**: Full TypeScript support with proper JSX element props
5. **Escape Hatches**: External containers and untracked children enable gradual adoption
6. **Testability**: FakeTestingTicker enables deterministic frame-by-frame testing

### Performance Characteristics

- **Fine-grained updates**: Only modified properties update, not entire components
- **Effect cascade**: Collapses multi-frame latency into single frame (within budget)
- **No Virtual DOM**: Direct PixiJS object manipulation
- **Small bundle**: SolidJS (~7kb) + framework code (~15kb estimated)

### Ideal Use Cases

- **Interactive visualizations**: Data dashboards, charts, graphs
- **2D games**: Platformers, puzzle games, top-down games
- **Creative tools**: Drawing apps, animation editors
- **Educational software**: Interactive simulations, tutorials
- **Real-time data displays**: Monitoring dashboards, live feeds

### Not Ideal For

- **3D graphics**: Use Three.js or Babylon.js instead
- **DOM-heavy UIs**: Use standard SolidJS with DOM renderer
- **Server-side rendering**: PixiJS is client-only
- **Simple static content**: Overkill for non-interactive graphics

---

## Recommended Reading Order

### For New Contributors

1. **Start**: `src/pixi-jsx/solidjs-universal-renderer/index.ts` - Core renderer
2. **ProxyDOM**: `src/pixi-jsx/proxy-dom/nodes/Node.ts` - Base abstraction
3. **Effects**: `src/engine/core/query-fns.ts` - Reactive primitives
4. **Ticker**: `src/engine/core/time.ts` - Frame synchronization
5. **Components**: `src/engine/tags/Application.tsx` - Framework integration

### Key Files by Topic

- **JSX Types**: `src/pixi-jsx/jsx/jsx-node.ts`
- **RenderLayers**: `src/pixi-jsx/proxy-dom/nodes/RenderLayerNode.ts`
- **Coroutines**: `src/engine/effects/coroutines.ts`
- **External Containers**: `src/engine/tags/PixiExternalContainer.tsx`
- **Testing**: `src/__tests__/test-utils/FakeTestingTicker.ts`

### Extension Points

- **Custom Nodes**: Extend `ProxyNode<T>` for new PixiJS object types
- **Custom Effects**: Build on `createSynchronizedEffect` and `onEveryFrame`
- **Custom Coroutines**: Compose via `chainCoroutine` and `yield*`
- **Custom Components**: Wrap intrinsics with additional logic (like `Application`)

---

**Document Version**: 1.0
**Framework Version**: 0.1.0
**Last Updated**: 2025-10-18

This document represents the complete architectural and implementation reference for Sylph.jsx, synthesizing insights from multiple project overviews into a single authoritative source.