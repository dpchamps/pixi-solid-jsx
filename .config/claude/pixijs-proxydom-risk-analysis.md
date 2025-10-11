# pixi-jsx Risk Analysis & Improvement Recommendations

## CRITICAL ISSUES

### 1. Memory Leak: Parent References Not Cleared (Node.ts:102) ⚠️ CRITICAL

**Issue**: When a node is removed, its `parent` reference is never cleared.

```typescript
removeChild(node: NodeType){
    const proxiedChild = this.removeChildBase(node);
    this.removeChildProxy(proxiedChild);
    // BUG: node.parent is still set!
}
```

**Impact**:
- Removed nodes hold references to their former parents
- Prevents garbage collection
- Memory accumulates over time in dynamic scenes

**Fix**:
```typescript
removeChild(node: NodeType){
    const proxiedChild = this.removeChildBase(node);
    this.removeChildProxy(proxiedChild);
    node.setParent(null); // Clear parent reference
}
```

### 2. Global Module State Violates Functional Principles (Node.ts:39-40) ⚠️ CRITICAL

**Issue**: ID generation uses module-level mutable state.

```typescript
// Bad foo for now
let _id = 0;
const getId = () => ++_id;
```

**Problems**:
1. Violates functional programming principles in CLAUDE.md
2. Never resets (hot reload accumulation)
3. Makes testing non-deterministic
4. Can't be controlled or mocked
5. Could theoretically overflow in long-running apps

**Fix**: Use Symbol() for unique IDs or dependency injection:
```typescript
export const createIdGenerator = () => {
    let _id = 0;
    return () => ++_id;
};

// In ProxyNode constructor, inject ID generator
protected constructor(tag: Tag, container: Container, idGen: () => number) {
    this.id = idGen();
}
```

### 3. isTextNode Semantic Mismatch (solidjs-universal-renderer/index.ts:45) ⚠️ HIGH

**Issue**: Implementation doesn't match SolidJS semantics.

```typescript
isTextNode(node): boolean {
    return node.tag === "text"; // Checks for TextNode (PixiJS Text)
}
```

**Problem**: SolidJS expects this to identify **text content nodes** (strings), not Text elements. Should check for `"raw"` tag.

**Impact**: May break SolidJS optimizations that special-case text content updates.

**Fix**:
```typescript
isTextNode(node): boolean {
    return node.tag === "raw"; // Identifies string content
}
```

### 4. replaceText Unimplemented (solidjs-universal-renderer/index.ts:51) ⚠️ HIGH

**Issue**: Core renderer capability throws error.

```typescript
replaceText(textNode, value): void {
    return unimplemented(textNode, value)
}
```

**Impact**: If SolidJS tries to optimize text updates, it will crash.

**Fix**: Implement text replacement:
```typescript
replaceText(textNode, value): void {
    if (textNode.tag !== "raw") return;
    // RawNode's container is the string value
    (textNode as any).container = String(value);
    // If parent is TextNode, trigger text update
    const parent = textNode.getParent();
    if (parent?.tag === "text") {
        parent.setProp("text", parent.getChildren()
            .map(c => c.container).join(""), undefined);
    }
}
```

## HIGH SEVERITY ISSUES

### 5. TextNode Anchor Insertion Logic Bug (TextNode.ts:15)

**Issue**: Impossible condition in insertion logic.

```typescript
if(isDefined(anchor) && el.id === anchor.id && node.id === anchor.id) {
    return `${acc}${node.container}`
}
```

**Problem**: `node.id === anchor.id` can never be true when inserting a new node before an anchor.

**Impact**: Text ordering may be incorrect when using anchored insertion.

**Fix**:
```typescript
addChildProxy(node: ProxyDomNode, anchor?: ProxyDomNode): void {
    expectNode(node, "raw", `unexpect tag for text`);

    if (!isDefined(anchor)) {
        // Append mode - add to end
        const currentText = this.container.text;
        this.container.text = `${currentText}${node.container}`;
        return;
    }

    // Insert before anchor
    const nextText = this.children.reduce((acc, el) => {
        if (el.id === anchor.id) {
            return `${acc}${node.container}${el.container}`;
        }
        return `${acc}${el.container}`;
    }, "");

    this.container.text = nextText;
}
```

### 6. ApplicationNode Initialization Race Conditions (ApplicationNode.ts:30)

**Issue**: No guards against multiple/concurrent initialization.

```typescript
async initialize(){
    const root = this.getParent();
    // ... no check if already initializing/initialized
}
```

**Problems**:
1. Can be called multiple times
2. No tracking of initialization state
3. Children could be added during initialization

**Fix**:
```typescript
private _initializing = false;
private _initialized = false;

async initialize(){
    if (this._initialized || this._initializing) {
        throw new Error("Application already initialized or initializing");
    }
    this._initializing = true;
    try {
        // ... existing logic
        this._initialized = true;
    } finally {
        this._initializing = false;
    }
}
```

### 7. Application Context Type Unsafety (Application.tsx:84-106)

**Issue**: Context provides `application: null` but typed as non-null.

```typescript
const applicationState = {
    application: null as Maybe<ApplicationState['application']>
} satisfies Omit<ApplicationState, "application"> & {application: Maybe<...>}

// Later cast to full ApplicationState
<ApplicationContext.Provider value={applicationState as ApplicationState}>
```

**Impact**: Code accessing `applicationState.application` before initialization gets null → crashes.

**Fix**: Use discriminated union:
```typescript
type ApplicationState = {
    time: {...},
    onNextTick: Set<...>,
} & (
    | { initialized: false, application: null }
    | { initialized: true, application: PixiApplication }
);
```

### 8. setProp Unchecked Property Assignment (Node.ts:111-115)

**Issue**: Blindly sets any property on PixiJS containers.

```typescript
setProp<T>(name: string, value: T, _prev: Maybe<T>): void {
    if(typeof this.container === "object" && this.container !== null){
        Reflect.set(this.container, name, value);
    }
}
```

**Problems**:
1. No validation property exists
2. Could overwrite critical internal properties
3. No type checking
4. Could set `container.children = "foo"` and break everything

**Fix**: Implement property whitelist or validation:
```typescript
private static PROTECTED_PROPS = new Set(['children', 'parent', 'uid', '_events']);

setProp<T>(name: string, value: T, _prev: Maybe<T>): void {
    if (ProxyNode.PROTECTED_PROPS.has(name)) {
        console.warn(`Attempted to set protected property: ${name}`);
        return;
    }
    if(typeof this.container === "object" && this.container !== null){
        if (!(name in this.container)) {
            console.warn(`Property ${name} does not exist on ${this.tag}`);
        }
        Reflect.set(this.container, name, value);
    }
}
```

## MEDIUM SEVERITY ISSUES

### 9. syncUntracked Never Called (ContainerNode.ts:31)

**Issue**: Method exists but is never invoked.

```typescript
override syncUntracked() {
    for(const untracked of this.untrackedChildren){
        if(!this.container.children.includes(untracked)){
            this.container.children.push(untracked);
        }
    }
}
```

**Impact**: Untracked children can desync and there's no recovery mechanism.

**Fix**: Either:
1. Call it automatically after each operation
2. Expose it publicly for manual sync
3. Remove the feature if unused

Also, use `addChild()` instead of directly pushing:
```typescript
override syncUntracked() {
    for(const untracked of this.untrackedChildren){
        if(!this.container.children.includes(untracked)){
            this.container.addChild(untracked);
        }
    }
}
```

### 10. Anchor Insertion Silent Failure (Node.ts:58-66)

**Issue**: If anchor not found, silently appends to end.

```typescript
const idx = this.children.findIndex((n) => anchor?.id === n.id);
const spliceAt = idx === -1 ? this.children.length : idx;
```

**Impact**: Makes debugging insertion order issues very difficult.

**Fix**: Throw on missing anchor:
```typescript
private addChildWithProxy(child: NodeType, proxiedChild: NodeType, anchor?: NodeType){
    if (anchor) {
        const idx = this.children.findIndex((n) => anchor.id === n.id);
        if (idx === -1) {
            throw new Error(`Anchor node (id: ${anchor.id}) not found in children`);
        }
        this.children.splice(idx, 0, child);
        this.proxiedChildren.splice(idx, 0, proxiedChild);
    } else {
        this.children.push(child);
        this.proxiedChildren.push(proxiedChild);
    }
    child.setParent(this);
}
```

### 11. getNextSibling Invariant Violation (solidjs-universal-renderer/index.ts:34)

**Issue**: Returns undefined if node not in parent.

```typescript
const index = children.findIndex((el) => el.id === node.id);
if(index === -1 || index === children.length-1) return undefined;
```

**Problem**: `index === -1` means the node isn't in parent's children array - this is an invariant violation.

**Fix**: Throw on invariant violation:
```typescript
getNextSibling(node) {
    const parent = node.getParent();
    invariant(parent);
    const children = parent.getChildren();
    const index = children.findIndex((el) => el.id === node.id);

    if(index === -1) {
        throw new Error(`Node (id: ${node.id}) not found in parent's children`);
    }

    if(index === children.length-1) return undefined;
    return children[index+1]
}
```

### 12. Application Props Not Filtered (ApplicationNode.ts:26-34)

**Issue**: All props passed to PixiJS Application.init(), including non-Application props.

```typescript
override setProp<T>(name: string, value: T) {
    this.initializationProps[name] = value;
}

await this.container.init(this.initializationProps);
```

**Impact**: Props like `ref`, `children`, `appInitialize`, event handlers get passed to PixiJS (ignored but sloppy).

**Fix**: Filter to valid Application options:
```typescript
private static PIXI_APPLICATION_PROPS = new Set([
    'background', 'backgroundAlpha', 'width', 'height',
    'resolution', 'antialias', 'autoDensity', // etc.
]);

override setProp<T>(name: string, value: T) {
    if (ApplicationNode.PIXI_APPLICATION_PROPS.has(name)) {
        this.initializationProps[name] = value;
    }
}
```

### 13. No PixiJS Resource Cleanup

**Issue**: No `.destroy()` calls on PixiJS objects.

**Impact**:
- Textures not freed
- WebGL contexts not released
- Event listeners persist

**Fix**: Implement cleanup methods:
```typescript
abstract class ProxyNode {
    destroy(): void {
        // Clear references
        this.parent = null;
        this.children = [];
        this.proxiedChildren = [];

        // Destroy PixiJS container if it has destroy method
        if (this.container && 'destroy' in this.container) {
            (this.container as any).destroy();
        }
    }
}
```

Call on removal:
```typescript
removeChild(node: NodeType){
    const proxiedChild = this.removeChildBase(node);
    this.removeChildProxy(proxiedChild);
    node.setParent(null);
    node.destroy(); // Clean up resources
}
```

### 14. onNextFrame Double Disposal (Application.tsx:44-73)

**Issue**: Disposal function can be called multiple times.

```typescript
onCleanup(() => {
    dispose();
})

return () => {
    dispose();
    setCancel(true);
}
```

**Impact**: If component cleans up AND user calls cancel, `dispose()` executes twice.

**Fix**: Make disposal idempotent:
```typescript
let disposed = false;
const safeDispose = () => {
    if (!disposed) {
        dispose();
        disposed = true;
    }
};

onCleanup(safeDispose);
return () => {
    safeDispose();
    setCancel(true);
}
```

## PERFORMANCE ISSUES

### 15. Linear Sibling Search (solidjs-universal-renderer/index.ts:34)

**Issue**: O(n) search for every sibling lookup.

```typescript
const index = children.findIndex((el) => el.id === node.id);
```

**Impact**: For large child lists, traversal becomes expensive.

**Fix**: Maintain index map:
```typescript
private childIndexMap = new Map<number, number>();

addChild(node: NodeType, anchor?: NodeType) {
    // ... existing logic
    this.rebuildIndexMap();
}

private rebuildIndexMap() {
    this.childIndexMap.clear();
    this.children.forEach((child, idx) => {
        this.childIndexMap.set(child.id, idx);
    });
}

// Then in renderer:
getNextSibling(node) {
    const parent = node.getParent();
    const index = parent.childIndexMap.get(node.id);
    // O(1) lookup
}
```

### 16. TextNode String Rebuild (TextNode.ts:13-27)

**Issue**: Entire text string rebuilt on every child change.

**Impact**: O(n) per update for text with many dynamic segments.

**Fix**: Only update affected portion:
```typescript
// Store text segments as array, join only when reading
private textSegments: string[] = [];

addChildProxy(node: ProxyDomNode, anchor?: ProxyDomNode): void {
    expectNode(node, "raw", `unexpect tag for text`);

    if (!anchor) {
        this.textSegments.push(node.container);
    } else {
        const idx = this.children.findIndex(c => c.id === anchor.id);
        this.textSegments.splice(idx, 0, node.container);
    }

    this.container.text = this.textSegments.join('');
}
```

### 17. No Object Pooling

**Issue**: Every node creation allocates new objects.

**Impact**: GC pressure in scenes with rapid node creation/destruction (particles, etc.).

**Recommendation**: Implement object pooling for frequently created nodes:
```typescript
class NodePool<T extends ProxyNode<any, any, any>> {
    private pool: T[] = [];

    acquire(factory: () => T): T {
        return this.pool.pop() || factory();
    }

    release(node: T): void {
        node.reset(); // Clear state
        this.pool.push(node);
    }
}
```

## CODE QUALITY ISSUES

### 18. Array Synchronization Not Enforced

**Issue**: `children` and `proxiedChildren` must stay in sync, but no guards.

**Risk**: Single missed splice causes silent corruption.

**Fix**: Add debug assertions:
```typescript
private validateSync(): void {
    if (this.children.length !== this.proxiedChildren.length) {
        throw new Error(
            `Array sync violation: children=${this.children.length}, ` +
            `proxied=${this.proxiedChildren.length}`
        );
    }
}

// Call after every mutation in development
addChild(...) {
    // ... logic
    if (process.env.NODE_ENV === 'development') {
        this.validateSync();
    }
}
```

### 19. Generic Error Types

**Issue**: All errors use generic `Error`.

**Impact**: Hard to catch specific error types, poor debugging.

**Fix**: Create error hierarchy:
```typescript
export class ProxyNodeError extends Error {
    constructor(message: string, public node: ProxyDomNode) {
        super(message);
        this.name = 'ProxyNodeError';
    }
}

export class InvalidChildError extends ProxyNodeError {
    constructor(parent: ProxyDomNode, child: ProxyDomNode) {
        super(
            `Cannot add ${child.tag} as child of ${parent.tag}`,
            parent
        );
        this.name = 'InvalidChildError';
    }
}
```

### 20. No Hot Module Reload Cleanup

**Issue**: Global state and PixiJS resources persist across HMR.

**Impact**: Memory leaks and duplicate tickers in development.

**Fix**: Add HMR cleanup:
```typescript
// In module scope
if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        // Reset ID counter
        _id = 0;
        // Clean up any global resources
    });
}
```

## TESTING GAPS

**Missing Test Coverage**:
1. Memory leak scenarios (parent references)
2. Race conditions in Application initialization
3. Anchor insertion edge cases
4. TextNode text ordering with anchors
5. Untracked children synchronization
6. PixiJS resource cleanup
7. HMR behavior
8. Error cases and recovery
9. Large child list performance
10. Concurrent prop updates

**Recommendation**: Minimum test suite:
- Unit tests for each ProxyNode subclass
- Integration tests for renderer operations
- Memory leak tests with cleanup verification
- Race condition tests with async initialization
- Performance benchmarks for large scenes

## SUMMARY

**Critical** (Must Fix): 3 issues
**High** (Should Fix): 5 issues
**Medium** (Nice to Fix): 9 issues
**Performance**: 3 issues
**Code Quality**: 2 issues

**Priority Order**:
1. Fix memory leak (parent references)
2. Implement replaceText
3. Fix isTextNode semantics
4. Add initialization guards
5. Implement resource cleanup
6. Refactor ID generation
7. Fix TextNode insertion logic
8. Add comprehensive tests

The codebase is well-architected but has several critical production issues that need addressing before it can be considered stable.