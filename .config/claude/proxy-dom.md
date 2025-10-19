# Proxy DOM Architecture Deep Dive

This document describes the current Proxy DOM implementation under `src/pixi-jsx/proxy-dom`. It reflects the runtime as of v0.1.0 and emphasizes how Solid’s renderer cooperates with Pixi nodes through proxy objects.

---

## 1. Core Concepts

### 1.1 ProxyNode base (`nodes/Node.ts`)
- Every intrinsic maps to a `ProxyNode<Tag, Container, ProxyDomNode>` instance.
- Common responsibilities:
  - Maintain `children`, `proxiedChildren`, and `untrackedChildren` arrays.
  - Track parent/child pointers with `id` stability for renderer traversal.
  - Optionally cache a `RenderLayer` reference and propagate it to descendants.
  - Provide template methods: `addChildProxy`, `removeChildProxy`, `setProp`, `addChildProxyUntracked`, and `removeChildProxyUntracked`.
  - Expose helpers (`getChildren`, `getParent`, `getRenderLayer`, `setRenderLayer`) so Solid’s renderer can explore the tree without touching Pixi directly.
- `addChild` / `removeChild` wrap the specialized `addChildProxy` / `removeChildProxy` and keep the logical arrays in sync. When a specialized implementation returns a different node (e.g., `ApplicationNode` converting raw text into `TextNode`), `proxiedChildren` stores the transformed node while `children` retains the original reference.

### 1.2 Type definitions (`nodes/types.ts`)
- `ProxyDomNode` is a tagged union covering: `application`, `container`, `text`, `sprite`, `graphics`, `render-layer`, `raw`, and `html`.
- Utility type `GenericNode` keeps renderer code agnostic of specific node classes.

### 1.3 Factory (`proxy-dom/index.ts`)
- `createProxiedPixieContainerNode(tag)` instantiates the correct subclass or throws on unknown tags.
- Re-exports node classes (`ApplicationNode`, `ContainerNode`, etc.) plus helpers like `HtmlElementNode` for consumers that need direct access.

---

## 2. Node Catalog & Responsibilities

### 2.1 Structural nodes

| Node | Responsibilities | Highlights |
| --- | --- | --- |
| `ApplicationNode` | root Pixi `Application` wrapper | buffers initialization props in `initializationProps`, converts raw children into `TextNode`s, attaches / removes children to the Pixi stage, inserts the canvas into the DOM inside `initialize()` |
| `ContainerNode` | scene graph containers | enforces child invariants (`application`/`html` disallowed), resolves anchor positions with `resolveInsertIndex`, propagates attached render layers to children, supports untracked child management |
| `RenderLayerNode` | transparent render-layer shim | owns a Pixi `RenderLayer`, queues children until `setParent` runs, automatically calls `ProxyNode.attachRenderLayer`, clears layer attachments on removal |
| `HtmlElementNode` | DOM bridge | only accepts an `application` child, handles canvas insertion/removal from a host HTMLElement |

### 2.2 Leaf nodes

| Node | Responsibilities | Highlights |
| --- | --- | --- |
| `TextNode` | Pixi `Text` wrapper | only accepts `raw` children, concatenates strings in `recomputeProxy`, recreates the text string when children change |
| `SpriteNode` | Pixi `Sprite` wrapper | rejects all children (throws on misuse), simply reflects prop updates onto the sprite |
| `GraphicsNode` | Pixi `Graphics` wrapper | rejects children, used for imperative drawing with `createGraphics` helpers |
| `RawNode` | JSX raw text node | wraps bare strings/numbers so Solid can treat them uniformly; transparent to Pixi |

---

## 3. Render Layer Propagation

### 3.1 Attach semantics
- When a `<render-layer>` intrinsic is encountered, `RenderLayerNode` creates a `RenderLayer` instance and stores it on `this.renderLayer`.
- `addChildProxy` on `RenderLayerNode`:
  1. Calls `child.setRenderLayer(this.renderLayer)`.
  2. Optimistically attaches the layer to the child via `ProxyNode.attachRenderLayer`.
  3. If the layer does not yet have a parent, queues the `(child, anchor)` pair in `pendingChildren`. Once `setParent` runs, the node flushes the queue by re-inserting children into the parent container.

### 3.2 Container cooperation
- `ContainerNode.addChildProxy` attaches render-layer nodes directly to the container and keeps render-layer children in sync with Pixi ordering.
- When removing a `RenderLayerNode`, `ContainerNode` detaches both the layer and any Pixi containers the layer had previously attached.

### 3.3 Transparent hierarchy
- Render layer nodes never appear as Pixi display objects; instead, the underlying `RenderLayer` sits alongside the parent container’s children. This enables declarative JSX nesting while maintaining explicit ordering controls.

---

## 4. Untracked Children (External Containers)

### 4.1 Use case
- `ContainerNode` supports imperative Pixi children (e.g., via `<PixiExternalContainer>`) without Solid tracking their lifecycle.
- `addChildProxyUntracked(container)` pushes the foreign container into Pixi, records it in `untrackedChildren`, and excludes it from `proxiedChildren`.
- `removeChildProxyUntracked` detaches a specific container by Pixi UID.
- `syncUntracked` re-inserts missing containers—used when a Pixi consumer manipulates the display list outside Sylph’s knowledge.

### 4.2 Guarantees
- Tracked Solid children remain in `children`/`proxiedChildren`, while untracked containers only appear inside the Pixi display tree. Consumers must clean up their own foreign containers on unmount to avoid leaks.

---

## 5. Text Handling

### 5.1 Raw node ingestion
- JSX raw strings become `RawNode` instances via the renderer’s `createTextNode`.
- `TextNode.addChildProxy` asserts every child is `raw`; Solid’s renderer relies on this to throw early when developers attempt to nest elements under `<text>`.

### 5.2 Recompute
- `recomputeProxy` concatenates child `.container` values to produce the final text string (`this.container.text`).
- Removal recomputes the string by skipping the removed child, ensuring partial updates (e.g., toggling falsy values) do not require rebuilding the entire node.

---

## 6. Application Initialization

### 6.1 Prop buffering
- `ApplicationNode.setProp` stores all prop mutations in `initializationProps` instead of applying them directly.
- During Solid’s mounting sequence, `ApplicationNode.initialize()`:
  1. Validates its parent is an `HtmlElementNode` (`expectNode`).
  2. Calls `app.init(initializationProps)` to initialize the Pixi renderer with the buffered options.
  3. Calls `app.render()` once so the canvas has content before insertion.
  4. Appends `app.canvas` to the parent HTML element.

### 6.2 Render layer compatibility
- When children include `<render-layer>`, `ApplicationNode` ensures both the layer and the proxied children (converted text nodes, sprites, etc.) attach to the Pixi stage in proper order.

---

## 7. Solid Renderer Integration

### 7.1 Renderer contract (`solidjs-universal-renderer/index.ts`)
- `createRenderer<ProxyDomNode>` implementation:
  - `createElement` dispatches tag creation to `createProxiedPixieContainerNode`.
  - `insertNode(parent, node, anchor)` delegates to `parent.addChild(node, anchor)`.
  - `removeNode(parent, node)` delegates to `parent.removeChild(node)`.
  - `replaceText` swaps a `RawNode` with a new instance via the parent’s `replaceChild`.
  - `setProperty` calls `node.setProp`.
  - `getFirstChild`, `getNextSibling`, `getParentNode` rely on `ProxyNode` sibling arrays and parent pointers.
- The renderer never touches Pixi objects directly; it trusts each proxy class to enforce invariants.

### 7.2 Typing surface
- `patched-types.ts` re-exports Solid primitives so project code can use `createSignal`, `createEffect`, `Show`, `For`, etc., without leaving the Pixi-adapted renderer context.

---

## 8. Validation Helpers

- `expectNode` and `expectNodeNot` (in `nodes/utility-node.ts`) throw descriptive errors when a node receives unsupported children or is removed from an illegal habitat.
- `isNodeWithPixiContainer` type guard differentiates nodes that wrap actual Pixi display objects (`container`, `sprite`, `text`, `graphics`) from transparent wrappers (`raw`, `html`, `render-layer`, `application`).
- These helpers make misconfiguration errors obvious at runtime, which is essential when debugging complex control flows like nested `<Show>` or `<For>` blocks.

---

## 9. Testing Signals

- `src/pixi-jsx/__tests__/renderer/*.test.tsx` validate insertion/removal order, anchor handling, raw text behavior, and nested node traversal.
- `render-layer.test.tsx` covers inheritance, mixed content, list updates, and regression cases (e.g., removing scoped raw text).
- `untracked-children.test.tsx` ensures `addChildProxyUntracked` / `removeChildProxyUntracked` behave predictably under interleaved tracked children.
- `node-ids.test.tsx` guarantees ID stability for Solid’s reconciliation.

---

## 10. Practical Guidance

1. **Add new intrinsics** by implementing a `ProxyNode` subclass, updating `createProxiedPixieContainerNode`, and expanding `JSX.IntrinsicElements`.
2. **Be cautious with render layers**: transparent nodes rely on parents correctly honoring `setRenderLayer`. Follow the existing pattern inside `ContainerNode` when introducing new container-like nodes.
3. **Use untracked children** sparingly: they bypass Solid’s cleanup guarantees. Always pair with `onCleanup` if you add imperative containers.
4. **Debugging tips**: watch for descriptive `expectNode` errors when JSX structure doesn’t match expected child tags.

---

The Proxy DOM system enables Sylph to present a declarative JSX surface while staying tightly aligned with Pixi’s imperative display list. By isolating all Pixi mutations inside proxy classes and keeping Solid’s renderer oblivious to Pixi internals, the architecture remains both testable and extensible.
