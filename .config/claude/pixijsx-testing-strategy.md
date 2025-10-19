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

## Test Structure

### Location
```
src/**/*/__tests__/
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

## Implementation Details


## Running Tests

```bash
# Run all integration tests
npm test 

# Run specific test file
npm test -- src/pixi-jsx/__tests__/reactivity/signals.test.tsx
```

## Success Criteria

Tests are successful when:
1. ✅ We write JSX with SolidJS reactivity
2. ✅ We observe PixiJS Container properties and structure
3. ✅ We never manually construct ProxyNodes
4. ✅ We cover all critical/high severity issues
5. ✅ Tests are readable and maintainable
6. ✅ Tests fail when the rendering contract is broken