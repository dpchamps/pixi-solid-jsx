# Proxy-DOM Architecture Deep Dive

## The Core Abstraction: ProxyNode

The **ProxyNode** base class (Node.ts:42) is the foundation of the entire rendering system. It maintains a **dual-tracking system**:

```typescript
protected children: NodeType[] = [];         // Original children
protected proxiedChildren: NodeType[] = [];  // Transformed/proxied versions
protected untrackedChildren: Container[] = []; // Direct PixiJS containers
```

This dual-tracking allows nodes to **transform children** during insertion while maintaining references to both the original and transformed versions.

## Node Type Hierarchy & Capabilities

### Container Nodes (Can have children)

- **ContainerNode** - General-purpose container, can have any child except `application` and `html`
- **ApplicationNode** - Root node, adds children to `stage`, converts `raw` nodes to `TextNode`
- **TextNode** - Special container that concatenates `raw` string children into text content
- **HtmlElementNode** - DOM bridge, only accepts `application` as child

### Leaf Nodes (Cannot have children)

- **SpriteNode** - Image rendering, throws on any child addition
- **GraphicsNode** - Vector graphics, throws on any child addition
- **RawNode** - String literal, throws on any child addition

## Key Mechanisms

### 1. Child Transformation via addChildProxy()

Nodes can return a **different node** than what was passed in:

```typescript
// ApplicationNode.ts:14
override addChildProxy(node: ProxyDomNode) {
    const child = node.tag === "raw" ? TextNode.create() : node;
    this.container.stage.addChild(child.container);
    return child; // Returns transformed child
}
```

This enables **automatic coercion**: raw text under `<application>` becomes a `<text>` node.

### 2. Parallel Child Arrays

The base class tracks both:
- `children[]` - What SolidJS thinks is there (source of truth)
- `proxiedChildren[]` - What's actually in PixiJS scene graph

Example: When you add a `RawNode` to `ApplicationNode`:
- `children[0]` = RawNode instance
- `proxiedChildren[0]` = TextNode instance (the transformed version)

### 3. Untracked Children System

ContainerNode (ContainerNode.ts:21) implements `addChildProxyUntracked()` to manage **direct PixiJS containers** outside the reactive system:

```typescript
override addChildProxyUntracked(untracked: Container) {
    this.container.addChild(untracked);
    this.untrackedChildren.push(untracked)
}

override syncUntracked() {
    for(const untracked of this.untrackedChildren){
        if(!this.container.children.includes(untracked)){
            this.container.children.push(untracked);
        }
    }
}
```

This enables **imperative PixiJS manipulation** alongside reactive SolidJS code - useful for third-party PixiJS libraries or manual scene management.

### 4. TextNode's String Concatenation

TextNode (TextNode.ts:11) has unique logic - it **concatenates all raw children** into a single text value:

```typescript
addChildProxy(node: ProxyDomNode, anchor?: ProxyDomNode): void {
    expectNode(node, "raw", `unexpect tag for text`);
    const nextText = this.children.reduce((acc, el, idx, arr) => {
        // Complex anchor/insertion logic
        return `${acc}${el.container}`;
    }, "");
    this.container.text = value;
}
```

This allows: `<text>{variable1} {variable2}</text>` to work reactively - each variable is a `RawNode` child.

### 5. ApplicationNode's Deferred Initialization

ApplicationNode (ApplicationNode.ts:26) intercepts `setProp()` to **collect initialization props** before the PixiJS Application exists:

```typescript
override setProp<T>(name: string, value: T) {
    this.initializationProps[name] = value; // Store for later
}

async initialize(){
    await this.container.init(this.initializationProps); // Apply all at once
    this.container.render();
    root.container.appendChild(this.container.canvas);
}
```

This solves a timing issue: SolidJS sets props before the Application can be initialized, so props are buffered and applied during `initialize()`.

## Integration with SolidJS Universal Renderer

The renderer (solidjs-universal-renderer/index.ts:19) maps DOM operations to ProxyNode methods:

```typescript
createRenderer<ProxyDomNode>({
    createElement(tag) {
        return createProxiedPixieContainerNode(tag); // Factory function
    },
    insertNode(parent, node, anchor): void {
        parent.addChild(node, anchor); // Uses dual-tracking
    },
    removeNode(parent, node): void {
        parent.removeChild(node); // Cleans up both arrays
    },
    setProperty(node, name, value, prev): void {
        node.setProp(name, value, prev); // Delegates to node
    }
})
```

## Node Validation & Type Safety

Two utility functions enforce the scene graph rules:

```typescript
expectNode<Node, Tag>(node, tag, context)     // Assert node IS a tag
expectNodeNot<Node, Tag>(node, context, ...tags) // Assert node is NOT tags
```

Examples:
- ApplicationNode: `expectNodeNot(node, "...", "application", "html")` - prevents nesting Applications
- TextNode: `expectNode(node, "raw", "...")` - only allows raw strings
- HtmlElementNode: `expectNode(node, "application", "...")` - enforces Application as only child

## Design Patterns Summary

1. **Template Method Pattern** - ProxyNode defines the skeleton, subclasses implement specifics
2. **Proxy Pattern** - ProxyNode wraps PixiJS objects with SolidJS-friendly interface
3. **Factory Pattern** - `createProxiedPixieContainerNode()` creates appropriate node types
4. **Command Pattern** - Props are captured and applied later (ApplicationNode)
5. **Composite Pattern** - Tree structure with uniform interface

## Statistics

- **7 node types** total (340 lines combined)
- **ContainerNode** is the only node supporting untracked children
- **ApplicationNode** is the only node with deferred initialization
- **TextNode** is the only node that concatenates children
- **4 nodes** are pure leaf nodes (Sprite, Graphics, Raw, Html)

## Key Insights

This architecture elegantly bridges the **declarative reactive world** of SolidJS with the **imperative scene graph** of PixiJS, while maintaining type safety and clear separation of concerns.

The dual-tracking system is the key innovation that allows:
- Transparent node transformation (raw → text)
- Proper cleanup when nodes are removed
- Integration with imperative PixiJS code via untracked children
- Type-safe scene graph validation

The design follows functional programming principles while managing mutable PixiJS state internally, providing a clean reactive interface to consumers.