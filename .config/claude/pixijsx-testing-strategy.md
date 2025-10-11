# pixi-jsx Integration Testing Strategy

## Testing Philosophy

We are testing the **contract** between JSX/SolidJS (input) and PixiJS (output):

```
JSX + SolidJS Reactivity → [Renderer Pipeline] → PixiJS Scene Graph
     (INPUT)                  (SYSTEM)              (OUTPUT)
```

This is **integration testing** - we verify that the system produces correct outputs for given inputs, just like web integration tests verify DOM output from component state.

## What We're Testing

### The Contract
"Given this JSX with SolidJS reactivity, the PixiJS scene graph should match these expectations"

### Key Behaviors to Verify
1. **Initial Rendering** - JSX structure becomes correct PixiJS hierarchy
2. **Reactive Updates** - Signal changes update PixiJS properties
3. **Conditional Rendering** - Show/For/Switch correctly add/remove PixiJS objects
4. **Parent-Child Relationships** - PixiJS Container.children matches JSX structure
5. **Property Mapping** - JSX props correctly set PixiJS properties
6. **Text Content** - Dynamic text updates PixiJS Text.text
7. **Cleanup** - Removed JSX elements properly clean up PixiJS objects

## Test Utility Design

### Core Function: `renderPixiScene()`

```typescript
type PixiSceneResult = {
    // The root PixiJS Container - primary observation point
    rootContainer: Container;

    // Access to the Application if rendered
    application?: Application;

    // Cleanup function
    cleanup: () => void;

    // Helper to wait for SolidJS reactivity to settle
    waitForUpdate: () => Promise<void>;

    // Find PixiJS objects in the scene graph
    findByType: <T extends DisplayObject>(type: new (...args: any[]) => T) => T | undefined;
    findAllByType: <T extends DisplayObject>(type: new (...args: any[]) => T) => T[];

    // Get all DisplayObjects as flat array (for counting, debugging)
    getAllDisplayObjects: () => DisplayObject[];

    // Render tree as string (debugging)
    debug: () => string;
};

const renderPixiScene = (jsx: () => JSX.Element): PixiSceneResult => {
    // Implementation details...
}
```

### Design Principles

1. **Return PixiJS objects, not ProxyNodes**
   - Tests should assert on `container.x`, not `proxyNode.container.x`
   - The ProxyNode layer is implementation detail

2. **Minimal test infrastructure**
   - Use the library's own `render()` function
   - Use SolidJS's `createRoot()` for disposal
   - No heavy mocking

3. **Type-safe helpers**
   - `findByType(Text)` returns `Text | undefined`
   - `findAllByType(Sprite)` returns `Sprite[]`

4. **Async-aware**
   - Provide `waitForUpdate()` for reactivity
   - Support async Application initialization

## Test Structure

### Location
```
src/pixi-jsx/__tests__/
├── test-utils.tsx          # Core rendering utilities
├── rendering.test.tsx      # Basic rendering tests
├── reactivity.test.tsx     # Signal/reactive updates
├── lifecycle.test.tsx      # Conditional rendering, cleanup
├── text-nodes.test.tsx     # Text content updates
├── application.test.tsx    # Application initialization
├── tree-structure.test.tsx # Parent-child relationships
└── edge-cases.test.tsx     # Critical/high severity bugs
```

## Test Patterns

### Pattern 1: Static Rendering
Verify initial JSX produces correct PixiJS structure

```tsx
test('container with nested children', () => {
    const { rootContainer, cleanup } = renderPixiScene(() => (
        <container x={100} y={200}>
            <text>Hello</text>
            <sprite />
        </container>
    ));

    // Observe PixiJS Container
    expect(rootContainer.children.length).toBe(1);

    const container = rootContainer.children[0] as Container;
    expect(container.x).toBe(100);
    expect(container.y).toBe(200);
    expect(container.children.length).toBe(2);

    // Verify types
    expect(container.children[0]).toBeInstanceOf(Text);
    expect(container.children[1]).toBeInstanceOf(Sprite);

    cleanup();
});
```

### Pattern 2: Reactive Properties
Verify signal changes update PixiJS

```tsx
test('reactive position updates', async () => {
    const [x, setX] = createSignal(0);
    const [y, setY] = createSignal(0);

    const { rootContainer, waitForUpdate, cleanup } = renderPixiScene(() => (
        <sprite x={x()} y={y()} />
    ));

    const sprite = rootContainer.children[0] as Sprite;

    // Initial state
    expect(sprite.x).toBe(0);
    expect(sprite.y).toBe(0);

    // Update signals
    setX(100);
    setY(200);
    await waitForUpdate();

    // Observe PixiJS updated
    expect(sprite.x).toBe(100);
    expect(sprite.y).toBe(200);

    cleanup();
});
```

### Pattern 3: Conditional Rendering
Verify Show/For add/remove PixiJS objects

```tsx
test('Show conditionally adds/removes from scene', async () => {
    const [visible, setVisible] = createSignal(false);

    const { rootContainer, waitForUpdate, cleanup } = renderPixiScene(() => (
        <container>
            <Show when={visible()}>
                <text>Conditional</text>
            </Show>
        </container>
    ));

    const container = rootContainer.children[0] as Container;

    // Not visible initially
    expect(container.children.length).toBe(0);

    // Show it
    setVisible(true);
    await waitForUpdate();

    // Now in scene
    expect(container.children.length).toBe(1);
    expect(container.children[0]).toBeInstanceOf(Text);
    expect((container.children[0] as Text).text).toBe('Conditional');

    // Hide it
    setVisible(false);
    await waitForUpdate();

    // Removed from scene
    expect(container.children.length).toBe(0);

    cleanup();
});
```

### Pattern 4: Dynamic Lists
Verify For creates/removes PixiJS objects

```tsx
test('For loop creates correct number of children', async () => {
    const [items, setItems] = createSignal(['A', 'B', 'C']);

    const { rootContainer, findAllByType, waitForUpdate, cleanup } = renderPixiScene(() => (
        <container>
            <For each={items()}>
                {(item) => <text>{item}</text>}
            </For>
        </container>
    ));

    // Initial render
    let textNodes = findAllByType(Text);
    expect(textNodes.length).toBe(3);
    expect(textNodes.map(t => t.text)).toEqual(['A', 'B', 'C']);

    // Add items
    setItems(['A', 'B', 'C', 'D', 'E']);
    await waitForUpdate();

    textNodes = findAllByType(Text);
    expect(textNodes.length).toBe(5);

    // Remove items
    setItems(['A']);
    await waitForUpdate();

    textNodes = findAllByType(Text);
    expect(textNodes.length).toBe(1);
    expect(textNodes[0].text).toBe('A');

    cleanup();
});
```

### Pattern 5: Text Content Updates
Verify dynamic text updates Text.text

```tsx
test('reactive text content', async () => {
    const [name, setName] = createSignal('World');

    const { findByType, waitForUpdate, cleanup } = renderPixiScene(() => (
        <text>Hello {name()}!</text>
    ));

    const textNode = findByType(Text)!;
    expect(textNode.text).toBe('Hello World!');

    setName('Universe');
    await waitForUpdate();

    expect(textNode.text).toBe('Hello Universe!');

    cleanup();
});
```

### Pattern 6: Nested Reactivity
Verify complex reactive patterns

```tsx
test('computed values update scene', async () => {
    const [radius, setRadius] = createSignal(10);
    const diameter = () => radius() * 2;

    const { findByType, waitForUpdate, cleanup } = renderPixiScene(() => (
        <sprite width={diameter()} height={diameter()} />
    ));

    const sprite = findByType(Sprite)!;
    expect(sprite.width).toBe(20);
    expect(sprite.height).toBe(20);

    setRadius(25);
    await waitForUpdate();

    expect(sprite.width).toBe(50);
    expect(sprite.height).toBe(50);

    cleanup();
});
```

## Critical/High Severity Test Coverage

### 1. Memory Leak: Parent References
```tsx
test('removed nodes clear parent references', async () => {
    const [show, setShow] = createSignal(true);
    const nodeRef: ProxyDomNode[] = [];

    const { waitForUpdate, cleanup } = renderPixiScene(() => (
        <container>
            {show() && (
                <text ref={(n) => nodeRef.push(n)}>Temp</text>
            )}
        </container>
    ));

    const node = nodeRef[0];
    expect(node.getParent()).toBeTruthy();

    setShow(false);
    await waitForUpdate();

    // CRITICAL: Parent should be null
    expect(node.getParent()).toBeNull();

    cleanup();
});
```

### 2. TextNode Concatenation
```tsx
test('multiple text segments concatenate correctly', async () => {
    const [a, setA] = createSignal('A');
    const [b, setB] = createSignal('B');

    const { findByType, waitForUpdate, cleanup } = renderPixiScene(() => (
        <text>{a()} - {b()}</text>
    ));

    const text = findByType(Text)!;
    expect(text.text).toBe('A - B');

    setA('X');
    await waitForUpdate();
    expect(text.text).toBe('X - B');

    setB('Y');
    await waitForUpdate();
    expect(text.text).toBe('X - Y');

    cleanup();
});
```

### 3. Application Initialization
```tsx
test('Application initializes once', async () => {
    const { application, cleanup } = await renderPixiApplication(() => (
        <text>Content</text>
    ));

    expect(application).toBeDefined();
    expect(application.stage).toBeDefined();

    // Should throw on re-init
    await expect(application.init({})).rejects.toThrow();

    cleanup();
});
```

### 4. Cleanup
```tsx
test('cleanup removes all PixiJS objects', () => {
    const { rootContainer, cleanup } = renderPixiScene(() => (
        <container>
            <text>A</text>
            <text>B</text>
            <sprite />
        </container>
    ));

    expect(rootContainer.children.length).toBeGreaterThan(0);

    cleanup();

    // Should be empty after cleanup
    expect(rootContainer.children.length).toBe(0);
});
```

## Implementation Details

### renderPixiScene() Implementation

```typescript
export const renderPixiScene = (jsx: () => JSX.Element): PixiSceneResult => {
    // Create root container
    const rootNode = ContainerNode.create();
    const rootContainer = rootNode.container;

    // Render with SolidJS
    let disposeRoot: (() => void) | undefined;
    createRoot((dispose) => {
        disposeRoot = dispose;
        render(jsx, rootNode);
    });

    // Traverse PixiJS DisplayObjects
    const getAllDisplayObjects = (): DisplayObject[] => {
        const objects: DisplayObject[] = [];
        const traverse = (obj: Container) => {
            objects.push(obj);
            obj.children.forEach(child => {
                if (child instanceof Container) {
                    traverse(child);
                } else {
                    objects.push(child);
                }
            });
        };
        rootContainer.children.forEach(child => {
            if (child instanceof Container) {
                traverse(child);
            } else {
                objects.push(child);
            }
        });
        return objects;
    };

    return {
        rootContainer,
        cleanup: () => {
            disposeRoot?.();
            rootContainer.removeChildren();
        },
        waitForUpdate: () => new Promise(resolve => setTimeout(resolve, 0)),
        findByType: <T extends DisplayObject>(type: new (...args: any[]) => T) => {
            return getAllDisplayObjects().find(obj => obj instanceof type) as T | undefined;
        },
        findAllByType: <T extends DisplayObject>(type: new (...args: any[]) => T) => {
            return getAllDisplayObjects().filter(obj => obj instanceof type) as T[];
        },
        getAllDisplayObjects,
        debug: () => {
            const print = (obj: DisplayObject, indent = 0): string => {
                const spaces = '  '.repeat(indent);
                const name = obj.constructor.name;
                const props = obj instanceof Text ? ` text="${obj.text}"` : '';
                let result = `${spaces}${name}${props}\n`;
                if (obj instanceof Container) {
                    obj.children.forEach(child => {
                        result += print(child, indent + 1);
                    });
                }
                return result;
            };
            return rootContainer.children.map(c => print(c)).join('');
        }
    };
};
```

### renderPixiApplication() for Application tests

```typescript
export const renderPixiApplication = async (
    jsx: () => JSX.Element,
    options: { width?: number; height?: number } = {}
): Promise<PixiSceneResult & { application: Application }> => {
    // Minimal HTMLElement mock
    const mockElement = {
        appendChild: vi.fn()
    } as unknown as HTMLElement;

    const htmlNode = HtmlElementNode.create(mockElement);
    let appNode: ApplicationNode | undefined;
    let disposeRoot: (() => void) | undefined;

    createRoot((dispose) => {
        disposeRoot = dispose;
        render(
            () => (
                <application
                    width={options.width ?? 800}
                    height={options.height ?? 600}
                    ref={(node) => { appNode = node; }}
                >
                    {jsx()}
                </application>
            ),
            htmlNode
        );
    });

    expect(appNode).toBeDefined();
    await appNode!.initialize();

    const application = appNode!.container;
    const rootContainer = application.stage;

    // Same helpers but using stage as root
    const getAllDisplayObjects = (): DisplayObject[] => {
        const objects: DisplayObject[] = [];
        const traverse = (obj: Container) => {
            objects.push(obj);
            obj.children.forEach(child => {
                if (child instanceof Container) traverse(child);
                else objects.push(child);
            });
        };
        traverse(rootContainer);
        return objects;
    };

    return {
        rootContainer,
        application,
        cleanup: () => {
            disposeRoot?.();
            application.destroy();
        },
        waitForUpdate: () => new Promise(resolve => setTimeout(resolve, 0)),
        findByType: <T extends DisplayObject>(type: new (...args: any[]) => T) => {
            return getAllDisplayObjects().find(obj => obj instanceof type) as T | undefined;
        },
        findAllByType: <T extends DisplayObject>(type: new (...args: any[]) => T) => {
            return getAllDisplayObjects().filter(obj => obj instanceof type) as T[];
        },
        getAllDisplayObjects,
        debug: () => {
            const print = (obj: DisplayObject, indent = 0): string => {
                const spaces = '  '.repeat(indent);
                return `${spaces}${obj.constructor.name}\n` +
                    (obj instanceof Container
                        ? obj.children.map(c => print(c, indent + 1)).join('')
                        : '');
            };
            return print(rootContainer);
        }
    };
};
```

## Running Tests

```bash
# Run all integration tests
npm test src/pixi-jsx/__tests__

# Run specific test file
npm test src/pixi-jsx/__tests__/reactivity.test.tsx

# Watch mode during development
npm test -- --watch

# With coverage
npm test -- --coverage
```

## Success Criteria

Tests are successful when:
1. ✅ We write JSX with SolidJS reactivity
2. ✅ We observe PixiJS Container properties and structure
3. ✅ We never manually construct ProxyNodes
4. ✅ We cover all critical/high severity issues
5. ✅ Tests are readable and maintainable
6. ✅ Tests fail when the rendering contract is broken

## Next Steps

1. Implement `test-utils.tsx` with `renderPixiScene()` and `renderPixiApplication()`
2. Write basic rendering tests to validate utilities work
3. Implement reactivity tests for signals and effects
4. Add lifecycle tests for conditional rendering and cleanup
5. Cover critical bugs from risk-analysis.md
6. Add edge case tests