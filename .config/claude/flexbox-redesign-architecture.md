# FlexBox Component Redesign: Architecture & Design

**Version:** 1.0
**Target Package:** `sylph-jsx`
**Location:** `/packages/sylph-jsx/src/engine/components/extensions/FlexBox`
**Date:** 2025-10-26

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Implementation Analysis](#current-implementation-analysis)
3. [Design Principles](#design-principles)
4. [Architecture Overview](#architecture-overview)
5. [API Design](#api-design)
6. [Layout Algorithm](#layout-algorithm)
7. [Reactivity Model](#reactivity-model)
8. [Type System](#type-system)
9. [Component Structure](#component-structure)
10. [Implementation Phases](#implementation-phases)

---

## Executive Summary

The current FlexBox component suffers from several architectural issues that violate SolidJS best practices and the project's code style guide. This redesign addresses these issues while providing a CSS Flexbox-aligned API that is ergonomic, type-safe, and performant.

### Core Issues with Current Implementation

1. **Side-effect driven layout**: Uses `reduce()` purely for mutations, discarding accumulator
2. **Direct ProxyNode mutation**: Violates functional programming principles
3. **Type safety violations**: Uses `any` types extensively
4. **Limited feature set**: No alignment, no gap, unclear semantics
5. **Poor reactivity**: Effect runs entire layout on any change
6. **Unclear API**: Props don't match their semantic meaning

### Redesign Goals

1. **Pure layout calculations** separated from reactive updates
2. **CSS Flexbox API alignment** for familiarity and clarity
3. **Complete type safety** with no `any` types
4. **Comprehensive feature set** including alignment, gaps, wrapping
5. **Efficient reactivity** using memoization and targeted effects
6. **Clear, ergonomic API** with predictable behavior

---

## Current Implementation Analysis

### What It Does

The deprecated FlexBox creates a PixiJS container that positions children in either horizontal or vertical orientation:

- **Horizontal mode**: Lays out children left-to-right, wrapping to new rows when width exceeded
- **Vertical mode**: Stacks children top-to-bottom with spacing
- Uses SolidJS `children()` helper to track child ProxyNodes
- Uses `createEffect` to reactively update positions when children change

### Critical Problems

#### 1. Anti-Pattern: Side Effects in Reduce

```typescript
createEffect(() => {
  childrenSignal.toArray().reduce(
    (acc, el, i) => {
      // ... mutations happen in childWithSpacing
      const { node, ...next } = childWithSpacing(/* ... */);
      return { elements: [...acc.elements, node], ...next };
    },
    { /* initial state */ }
  );
  // ❌ Accumulator never used! Reduce used purely for side effects
});
```

**Problem**: `reduce()` builds state that's discarded. The function is purely for triggering mutations in `childWithSpacing()`.

**Correct Pattern**: Either use `forEach()` for side effects, or use the accumulator meaningfully.

#### 2. Direct Mutation of ProxyNode Properties

```typescript
// In horizontal-spacing.ts
el.container.x = acc.width;
el.container.y = acc.height;
```

**Problem**: Directly mutates ProxyNode container properties within layout calculation functions.

**Issues**:
- Violates functional programming (no pure functions)
- Makes testing difficult
- Unclear data flow
- Potential for cascading reactive updates

**Correct Pattern**: Calculate positions, return data structure, apply mutations in isolated effect.

#### 3. Type Safety Violations

```typescript
export type AnyProxyNode = ProxyNode<any, any, any>;
```

**Problem**: Uses `any` to bypass type system, violating code style guide's strictest rule.

**Issues**:
- Loses all type safety
- Runtime errors not caught at compile time
- IDE autocomplete broken
- Defeats TypeScript's purpose

**Correct Pattern**: Use proper generic constraints or `unknown` with type guards.

#### 4. Limited and Unclear API

```typescript
type FlexBoxProps = Partial<{
  x: number;
  y: number;
  orientation: FlexBoxOrientation | undefined;
  margin: number;
  padding: number;
  width: number;
}>;
```

**Problems**:
- `width` doesn't set container width—it sets wrap threshold
- `margin` and `padding` combined unclearly in calculations
- No alignment control (justify-content, align-items)
- No gap property for spacing between items
- Single number for margin/padding (no directional control)
- No flex-wrap control
- No reverse directions

#### 5. Poor Reactivity Pattern

```typescript
createEffect(() => {
  childrenSignal.toArray().reduce(/* ... */);
});
```

**Problems**:
- Entire layout recalculated on any child change
- No memoization of intermediate calculations
- Effect dependencies unclear
- Mutations trigger additional reactive updates

**Correct Pattern**:
- Use `createMemo` for pure calculations
- Use targeted `createEffect` only for mutations
- Minimize effect scope

#### 6. Semantic Confusion

The component conflates several concepts:
- **Container width** vs **wrap width** (both called "width")
- **Gap between items** vs **padding around items** (uses padding for gaps)
- **Item margin** vs **container padding** (combined in offset calculation)

---

## Design Principles

### 1. CSS Flexbox Alignment

**Principle**: Match CSS Flexbox terminology and behavior wherever possible.

**Rationale**:
- Familiar to web developers
- Well-understood mental model
- Extensive documentation exists
- Predictable behavior

**Application**:
- Use `flex-direction`, `justify-content`, `align-items` terminology
- Support `gap` property for spacing
- Support wrapping modes
- Support alignment modes

### 2. Pure Layout Calculations

**Principle**: Separate calculation from mutation. Layout logic should be pure functions.

**Rationale**:
- Testable without SolidJS runtime
- Composable
- No hidden side effects
- Clear data flow

**Application**:
- Layout engine is pure TypeScript module
- Takes measurements, returns positions
- No DOM/ProxyNode access in calculations
- Mutations happen in dedicated effects

### 3. Type Safety First

**Principle**: No `any` types. Use proper generics, constraints, and type guards.

**Rationale**:
- Catches errors at compile time
- Better IDE support
- Self-documenting code
- Matches code style guide

**Application**:
- Properly typed child elements
- Generic constraints for ProxyNode types
- Type guards for runtime validation
- No type assertions

### 4. Reactive Efficiency

**Principle**: Minimize recalculation. Use memoization. Isolate effects.

**Rationale**:
- Performance at 60fps critical
- Avoid unnecessary work
- Clear reactive dependencies
- Predictable update timing

**Application**:
- `createMemo` for layout calculations
- Targeted `createEffect` for mutations
- Dependency tracking explicit
- Frame-synchronized updates when appropriate

### 5. Ergonomic API

**Principle**: Props should do what developers expect. Defaults should be sensible.

**Rationale**:
- Reduce learning curve
- Prevent mistakes
- Match expectations from CSS
- Enable progressive disclosure

**Application**:
- Clear prop names
- Sensible defaults
- Shorthand props when useful
- Comprehensive prop types

### 6. Compositional Design

**Principle**: Enable nesting, wrapping, and extension.

**Rationale**:
- Flexible layouts
- Reusable patterns
- Progressive enhancement
- Integration with Sylph ecosystem

**Application**:
- FlexBox can contain FlexBox
- Optional FlexItem wrapper for item-specific props
- Works with all Sylph components
- Plays well with render-layers

---

## Architecture Overview

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Component API                                      │
│  • FlexBox component (container)                             │
│  • FlexItem component (optional wrapper)                     │
│  • Props validation and defaults                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: Reactive Layer                                     │
│  • Children tracking (SolidJS children() helper)             │
│  • Layout memoization (createMemo)                           │
│  • Position application (createEffect)                       │
│  • Bounds calculation (derived signals)                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: Layout Engine (Pure)                               │
│  • Child measurement extraction                              │
│  • Main/cross axis calculation                               │
│  • Wrapping algorithm                                        │
│  • Alignment calculation                                     │
│  • Position generation                                       │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Input**: FlexBox receives props and children
2. **Measurement**: Extract dimensions from child ProxyNodes
3. **Calculation**: Pure layout engine calculates positions
4. **Memoization**: Layout result memoized via `createMemo`
5. **Application**: `createEffect` applies positions to ProxyNodes
6. **Output**: Positioned children rendered in container

### Module Structure

```
FlexBox/
├── index.ts                  # Public exports
├── FlexBox.tsx              # Main container component
├── FlexItem.tsx             # Optional item wrapper
├── types.ts                 # Type definitions
├── layout-engine.ts         # Pure layout calculations
├── measure.ts               # Child measurement utilities
├── defaults.ts              # Default prop values
└── utils.ts                 # Helper functions
```

---

## API Design

### FlexBox Component Props

```typescript
type FlexBoxProps = {
  // ===== Container Positioning =====
  x?: number;                    // Container X position (default: 0)
  y?: number;                    // Container Y position (default: 0)

  // ===== Flex Direction =====
  direction?: FlexDirection;     // Main axis direction (default: 'row')

  // ===== Wrapping =====
  wrap?: FlexWrap;              // Wrap behavior (default: 'nowrap')

  // ===== Alignment =====
  justifyContent?: JustifyContent;  // Main axis alignment (default: 'flex-start')
  alignItems?: AlignItems;          // Cross axis alignment (default: 'flex-start')
  alignContent?: AlignContent;      // Multi-line alignment (default: 'flex-start')

  // ===== Spacing =====
  gap?: number;                  // Gap between items (both axes)
  rowGap?: number;              // Gap between rows (overrides gap)
  columnGap?: number;           // Gap between columns (overrides gap)

  // ===== Container Constraints =====
  width?: number;               // Container width for wrapping
  height?: number;              // Container height
  minWidth?: number;            // Minimum width
  minHeight?: number;           // Minimum height
  maxWidth?: number;            // Maximum width
  maxHeight?: number;           // Maximum height

  // ===== Padding =====
  padding?: number;             // All sides padding
  paddingX?: number;            // Horizontal padding (overrides padding)
  paddingY?: number;            // Vertical padding (overrides padding)
  paddingTop?: number;          // Top padding (overrides paddingY)
  paddingRight?: number;        // Right padding (overrides paddingX)
  paddingBottom?: number;       // Bottom padding (overrides paddingY)
  paddingLeft?: number;         // Left padding (overrides paddingX)

  // ===== Children =====
  children?: JSX.Element;

  // ===== Ref =====
  ref?: (node: ContainerNode) => void;
};
```

### Type Definitions

```typescript
type FlexDirection =
  | 'row'           // Left to right
  | 'row-reverse'   // Right to left
  | 'column'        // Top to bottom
  | 'column-reverse'; // Bottom to top

type FlexWrap =
  | 'nowrap'        // Single line
  | 'wrap'          // Multi-line, natural direction
  | 'wrap-reverse'; // Multi-line, reverse direction

type JustifyContent =
  | 'flex-start'    // Pack to start of main axis
  | 'flex-end'      // Pack to end of main axis
  | 'center'        // Center on main axis
  | 'space-between' // Even distribution, no edge spacing
  | 'space-around'  // Even distribution, half edge spacing
  | 'space-evenly'; // Even distribution, full edge spacing

type AlignItems =
  | 'flex-start'    // Align to start of cross axis
  | 'flex-end'      // Align to end of cross axis
  | 'center'        // Center on cross axis
  | 'stretch'       // Stretch to fill cross axis
  | 'baseline';     // Align baselines (text alignment)

type AlignContent =
  | 'flex-start'    // Pack lines to start
  | 'flex-end'      // Pack lines to end
  | 'center'        // Center lines
  | 'space-between' // Distribute lines, no edge spacing
  | 'space-around'  // Distribute lines, half edge spacing
  | 'stretch';      // Stretch lines to fill
```

### FlexItem Component Props

```typescript
type FlexItemProps = {
  // ===== Flex Behavior =====
  flex?: number;              // Shorthand for flex: <n> 1 0
  grow?: number;             // Flex grow factor (default: 0)
  shrink?: number;           // Flex shrink factor (default: 1)
  basis?: number | 'auto';   // Flex basis (default: 'auto')

  // ===== Alignment Override =====
  alignSelf?: AlignSelf;     // Override parent's alignItems

  // ===== Order =====
  order?: number;            // Display order (default: 0)

  // ===== Margin =====
  margin?: number;           // All sides margin
  marginX?: number;          // Horizontal margin (overrides margin)
  marginY?: number;          // Vertical margin (overrides margin)
  marginTop?: number;        // Top margin (overrides marginY)
  marginRight?: number;      // Right margin (overrides marginX)
  marginBottom?: number;     // Bottom margin (overrides marginY)
  marginLeft?: number;       // Left margin (overrides marginX)

  // ===== Children =====
  children?: JSX.Element;

  // ===== Ref =====
  ref?: (node: ContainerNode) => void;
};

type AlignSelf =
  | 'auto'          // Inherit from parent's alignItems
  | 'flex-start'    // Align to start
  | 'flex-end'      // Align to end
  | 'center'        // Center
  | 'stretch'       // Stretch
  | 'baseline';     // Baseline align
```

### Default Values

```typescript
const FLEXBOX_DEFAULTS = {
  x: 0,
  y: 0,
  direction: 'row' as FlexDirection,
  wrap: 'nowrap' as FlexWrap,
  justifyContent: 'flex-start' as JustifyContent,
  alignItems: 'flex-start' as AlignItems,
  alignContent: 'flex-start' as AlignContent,
  gap: 0,
  padding: 0,
};

const FLEXITEM_DEFAULTS = {
  grow: 0,
  shrink: 1,
  basis: 'auto' as const,
  alignSelf: 'auto' as AlignSelf,
  order: 0,
  margin: 0,
};
```

### Usage Examples

#### Basic Horizontal Layout

```tsx
<FlexBox direction="row" gap={10}>
  <sprite texture={icon1} />
  <sprite texture={icon2} />
  <sprite texture={icon3} />
</FlexBox>
```

#### Centered Column

```tsx
<FlexBox
  direction="column"
  alignItems="center"
  gap={20}
  padding={40}
>
  <text>Title</text>
  <sprite texture={image} />
  <text>Description</text>
</FlexBox>
```

#### Wrapping Grid with Spacing

```tsx
<FlexBox
  direction="row"
  wrap="wrap"
  justifyContent="space-between"
  gap={16}
  width={800}
>
  <For each={items()}>
    {(item) => <sprite texture={item.texture} />}
  </For>
</FlexBox>
```

#### Flex Item Control

```tsx
<FlexBox direction="row" width={600}>
  <FlexItem grow={1}>
    <text>Flexible content</text>
  </FlexItem>
  <FlexItem grow={0} shrink={0} basis={200}>
    <sprite texture={fixedWidth} />
  </FlexItem>
  <FlexItem grow={2}>
    <text>More flexible</text>
  </FlexItem>
</FlexBox>
```

#### Complex Layout

```tsx
<FlexBox
  direction="column"
  width={1200}
  height={800}
  padding={32}
  gap={24}
>
  {/* Header */}
  <FlexBox
    direction="row"
    justifyContent="space-between"
    alignItems="center"
  >
    <text>Header</text>
    <sprite texture={logo} />
  </FlexBox>

  {/* Main content */}
  <FlexItem grow={1}>
    <FlexBox
      direction="row"
      wrap="wrap"
      gap={16}
      justifyContent="space-evenly"
    >
      <For each={cards()}>
        {(card) => <sprite texture={card.texture} />}
      </For>
    </FlexBox>
  </FlexItem>

  {/* Footer */}
  <FlexBox direction="row" justifyContent="center">
    <text>Footer</text>
  </FlexBox>
</FlexBox>
```

---

## Layout Algorithm

### Overview

The layout engine is a pure function that:
1. Takes child measurements and flex configuration
2. Calculates main axis and cross axis based on direction
3. Applies wrapping logic if needed
4. Calculates positions based on alignment
5. Returns position data for each child

### Input Data Structure

```typescript
type ChildMeasurement = {
  id: symbol;                    // Unique identifier for child
  width: number;                 // Child width
  height: number;                // Child height
  flexGrow: number;             // Flex grow factor
  flexShrink: number;           // Flex shrink factor
  flexBasis: number | 'auto';   // Flex basis
  alignSelf: AlignSelf;         // Alignment override
  order: number;                // Display order
  margin: {                     // Margin on all sides
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
};

type LayoutConfig = {
  direction: FlexDirection;
  wrap: FlexWrap;
  justifyContent: JustifyContent;
  alignItems: AlignItems;
  alignContent: AlignContent;
  gap: number;
  rowGap: number;
  columnGap: number;
  containerWidth?: number;      // Container constraint
  containerHeight?: number;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
};
```

### Output Data Structure

```typescript
type LayoutResult = {
  positions: Map<symbol, { x: number; y: number }>;
  containerBounds: {
    width: number;              // Calculated container width
    height: number;             // Calculated container height
  };
  lines: LineInfo[];           // Information about each flex line
};

type LineInfo = {
  children: symbol[];          // Child IDs in this line
  mainSize: number;            // Size along main axis
  crossSize: number;           // Size along cross axis
  startPosition: number;       // Starting position on cross axis
};
```

### Algorithm Steps

#### 1. Normalization

```typescript
const normalize = (
  children: ChildMeasurement[],
  config: LayoutConfig
): NormalizedData => {
  // Sort children by order property
  const sorted = [...children].sort((a, b) => a.order - b.order);

  // Determine main axis and cross axis
  const isRow = config.direction === 'row' || config.direction === 'row-reverse';
  const mainAxis = isRow ? 'horizontal' : 'vertical';
  const crossAxis = isRow ? 'vertical' : 'horizontal';

  // Determine axis directions
  const mainReverse = config.direction.endsWith('-reverse');
  const crossReverse = config.wrap === 'wrap-reverse';

  // Calculate gaps
  const mainGap = isRow ? config.columnGap : config.rowGap;
  const crossGap = isRow ? config.rowGap : config.columnGap;

  // Calculate available space
  const paddingMain = isRow
    ? config.padding.left + config.padding.right
    : config.padding.top + config.padding.bottom;
  const paddingCross = isRow
    ? config.padding.top + config.padding.bottom
    : config.padding.left + config.padding.right;

  const availableMain = config.containerWidth
    ? (isRow ? config.containerWidth : config.containerHeight) - paddingMain
    : Infinity;
  const availableCross = config.containerHeight
    ? (isRow ? config.containerHeight : config.containerWidth) - paddingCross
    : Infinity;

  return {
    sorted,
    mainAxis,
    crossAxis,
    mainReverse,
    crossReverse,
    mainGap,
    crossGap,
    availableMain,
    availableCross,
    paddingMain,
    paddingCross,
  };
};
```

#### 2. Line Breaking (Wrapping)

```typescript
const breakLines = (
  children: ChildMeasurement[],
  normalized: NormalizedData,
  config: LayoutConfig
): FlexLine[] => {
  if (config.wrap === 'nowrap') {
    return [{ children, hypotheticalMainSize: 0 }];
  }

  const lines: FlexLine[] = [];
  let currentLine: ChildMeasurement[] = [];
  let currentLineSize = 0;

  for (const child of children) {
    const childMainSize = getMainSize(child, normalized.mainAxis);
    const childMarginMain = getMainMargin(child, normalized.mainAxis);
    const totalSize = childMainSize + childMarginMain;

    const wouldExceed = currentLineSize + totalSize > normalized.availableMain;
    const lineNotEmpty = currentLine.length > 0;

    if (wouldExceed && lineNotEmpty) {
      // Start new line
      lines.push({
        children: currentLine,
        hypotheticalMainSize: currentLineSize,
      });
      currentLine = [child];
      currentLineSize = totalSize;
    } else {
      // Add to current line
      currentLine.push(child);
      currentLineSize += totalSize + (currentLine.length > 1 ? normalized.mainGap : 0);
    }
  }

  if (currentLine.length > 0) {
    lines.push({
      children: currentLine,
      hypotheticalMainSize: currentLineSize,
    });
  }

  return lines;
};
```

#### 3. Main Axis Sizing (Flex Grow/Shrink)

```typescript
const resolveFlexibleLengths = (
  line: FlexLine,
  normalized: NormalizedData
): Map<symbol, number> => {
  const sizes = new Map<symbol, number>();

  // Calculate initial sizes based on flex-basis
  let totalSize = 0;
  for (const child of line.children) {
    const basis = child.flexBasis === 'auto'
      ? getMainSize(child, normalized.mainAxis)
      : child.flexBasis;
    sizes.set(child.id, basis);
    totalSize += basis + getMainMargin(child, normalized.mainAxis);
  }

  // Add gaps
  totalSize += (line.children.length - 1) * normalized.mainGap;

  const freeSpace = normalized.availableMain - totalSize;

  if (freeSpace > 0) {
    // Grow items
    const totalGrow = line.children.reduce((sum, c) => sum + c.flexGrow, 0);
    if (totalGrow > 0) {
      for (const child of line.children) {
        const current = sizes.get(child.id)!;
        const additional = (freeSpace * child.flexGrow) / totalGrow;
        sizes.set(child.id, current + additional);
      }
    }
  } else if (freeSpace < 0) {
    // Shrink items
    const totalShrink = line.children.reduce((sum, c) => sum + c.flexShrink, 0);
    if (totalShrink > 0) {
      for (const child of line.children) {
        const current = sizes.get(child.id)!;
        const reduction = (Math.abs(freeSpace) * child.flexShrink) / totalShrink;
        sizes.set(child.id, Math.max(0, current - reduction));
      }
    }
  }

  return sizes;
};
```

#### 4. Main Axis Alignment (justify-content)

```typescript
const alignMainAxis = (
  line: FlexLine,
  sizes: Map<symbol, number>,
  normalized: NormalizedData,
  config: LayoutConfig
): Map<symbol, number> => {
  const positions = new Map<symbol, number>();

  const totalSize = line.children.reduce(
    (sum, child) => sum + sizes.get(child.id)! + getMainMargin(child, normalized.mainAxis),
    0
  );
  const totalGaps = (line.children.length - 1) * normalized.mainGap;
  const usedSpace = totalSize + totalGaps;
  const freeSpace = normalized.availableMain - usedSpace;

  let currentPosition = normalized.mainReverse
    ? normalized.availableMain
    : 0;
  let gap = normalized.mainGap;

  switch (config.justifyContent) {
    case 'flex-start':
      // Default: pack to start
      break;

    case 'flex-end':
      currentPosition += normalized.mainReverse ? 0 : freeSpace;
      break;

    case 'center':
      currentPosition += normalized.mainReverse ? -freeSpace / 2 : freeSpace / 2;
      break;

    case 'space-between':
      gap = line.children.length > 1
        ? normalized.mainGap + freeSpace / (line.children.length - 1)
        : normalized.mainGap;
      break;

    case 'space-around':
      const spaceAround = freeSpace / line.children.length;
      currentPosition += spaceAround / 2;
      gap = normalized.mainGap + spaceAround;
      break;

    case 'space-evenly':
      const spaceEvenly = freeSpace / (line.children.length + 1);
      currentPosition += spaceEvenly;
      gap = normalized.mainGap + spaceEvenly;
      break;
  }

  for (const child of line.children) {
    const marginStart = getMainMarginStart(child, normalized.mainAxis);
    const size = sizes.get(child.id)!;

    if (normalized.mainReverse) {
      currentPosition -= size + marginStart;
      positions.set(child.id, currentPosition);
      currentPosition -= getMainMarginEnd(child, normalized.mainAxis) + gap;
    } else {
      currentPosition += marginStart;
      positions.set(child.id, currentPosition);
      currentPosition += size + getMainMarginEnd(child, normalized.mainAxis) + gap;
    }
  }

  return positions;
};
```

#### 5. Cross Axis Alignment (align-items, align-self)

```typescript
const alignCrossAxis = (
  child: ChildMeasurement,
  lineCrossSize: number,
  normalized: NormalizedData,
  config: LayoutConfig
): number => {
  const alignSelf = child.alignSelf === 'auto'
    ? config.alignItems
    : child.alignSelf;

  const childCrossSize = getCrossSize(child, normalized.crossAxis);
  const marginCrossStart = getCrossMarginStart(child, normalized.crossAxis);
  const marginCrossEnd = getCrossMarginEnd(child, normalized.crossAxis);

  switch (alignSelf) {
    case 'flex-start':
      return marginCrossStart;

    case 'flex-end':
      return lineCrossSize - childCrossSize - marginCrossEnd;

    case 'center':
      return (lineCrossSize - childCrossSize - marginCrossStart - marginCrossEnd) / 2
        + marginCrossStart;

    case 'stretch':
      // Note: Stretching would require modifying child size, not just position
      // For PixiJS, we position only, so fall back to flex-start
      return marginCrossStart;

    case 'baseline':
      // Baseline alignment requires text metrics, complex to implement
      // Fall back to flex-start for non-text elements
      return marginCrossStart;
  }
};
```

#### 6. Line Alignment (align-content)

```typescript
const alignLines = (
  lines: ProcessedLine[],
  normalized: NormalizedData,
  config: LayoutConfig
): Map<number, number> => {
  const linePositions = new Map<number, number>();

  if (config.wrap === 'nowrap' || lines.length === 1) {
    linePositions.set(0, 0);
    return linePositions;
  }

  const totalCrossSize = lines.reduce((sum, line) => sum + line.crossSize, 0);
  const totalGaps = (lines.length - 1) * normalized.crossGap;
  const usedSpace = totalCrossSize + totalGaps;
  const freeSpace = normalized.availableCross - usedSpace;

  let currentPosition = 0;
  let gap = normalized.crossGap;

  switch (config.alignContent) {
    case 'flex-start':
      break;

    case 'flex-end':
      currentPosition = freeSpace;
      break;

    case 'center':
      currentPosition = freeSpace / 2;
      break;

    case 'space-between':
      gap = lines.length > 1
        ? normalized.crossGap + freeSpace / (lines.length - 1)
        : normalized.crossGap;
      break;

    case 'space-around':
      const spaceAround = freeSpace / lines.length;
      currentPosition = spaceAround / 2;
      gap = normalized.crossGap + spaceAround;
      break;

    case 'stretch':
      // Distribute free space evenly across lines
      const additionalPerLine = lines.length > 0 ? freeSpace / lines.length : 0;
      lines.forEach((line, i) => {
        linePositions.set(i, currentPosition);
        currentPosition += line.crossSize + additionalPerLine + normalized.crossGap;
      });
      return linePositions;
  }

  lines.forEach((line, i) => {
    linePositions.set(i, currentPosition);
    currentPosition += line.crossSize + gap;
  });

  return linePositions;
};
```

#### 7. Final Position Calculation

```typescript
const calculateFinalPositions = (
  lines: ProcessedLine[],
  linePositions: Map<number, number>,
  normalized: NormalizedData,
  config: LayoutConfig
): LayoutResult => {
  const positions = new Map<symbol, { x: number; y: number }>();

  const isRow = normalized.mainAxis === 'horizontal';
  const paddingStart = isRow ? config.padding.left : config.padding.top;
  const paddingCrossStart = isRow ? config.padding.top : config.padding.left;

  let maxMain = 0;
  let maxCross = 0;

  lines.forEach((line, lineIndex) => {
    const lineMainPositions = line.mainPositions;
    const lineCrossPosition = linePositions.get(lineIndex)!;

    line.children.forEach((child) => {
      const mainPos = lineMainPositions.get(child.id)! + paddingStart;
      const crossOffset = alignCrossAxis(child, line.crossSize, normalized, config);
      const crossPos = lineCrossPosition + crossOffset + paddingCrossStart;

      const pos = isRow
        ? { x: mainPos, y: crossPos }
        : { x: crossPos, y: mainPos };

      positions.set(child.id, pos);

      maxMain = Math.max(maxMain, mainPos + getMainSize(child, normalized.mainAxis));
      maxCross = Math.max(maxCross, crossPos + getCrossSize(child, normalized.crossAxis));
    });
  });

  return {
    positions,
    containerBounds: isRow
      ? { width: maxMain + config.padding.right, height: maxCross + config.padding.bottom }
      : { width: maxCross + config.padding.right, height: maxMain + config.padding.bottom },
    lines: lines.map(l => ({
      children: l.children.map(c => c.id),
      mainSize: l.mainSize,
      crossSize: l.crossSize,
      startPosition: linePositions.get(lines.indexOf(l))!,
    })),
  };
};
```

### Complete Layout Function

```typescript
export const calculateLayout = (
  children: ChildMeasurement[],
  config: LayoutConfig
): LayoutResult => {
  // 1. Normalize configuration and determine axes
  const normalized = normalize(children, config);

  // 2. Break into flex lines based on wrapping
  const lines = breakLines(children, normalized, config);

  // 3. Resolve flexible lengths (grow/shrink) for each line
  const processedLines = lines.map(line => {
    const sizes = resolveFlexibleLengths(line, normalized);
    const mainPositions = alignMainAxis(line, sizes, normalized, config);
    const lineCrossSize = Math.max(
      ...line.children.map(c => getCrossSize(c, normalized.crossAxis))
    );

    return {
      children: line.children,
      mainSize: line.hypotheticalMainSize,
      crossSize: lineCrossSize,
      mainPositions,
    };
  });

  // 4. Align lines along cross axis
  const linePositions = alignLines(processedLines, normalized, config);

  // 5. Calculate final positions
  return calculateFinalPositions(processedLines, linePositions, normalized, config);
};
```

---

## Reactivity Model

### Component Reactivity Flow

```
Props Change
     ↓
Children Change
     ↓
[createMemo] Extract measurements
     ↓
[createMemo] Calculate layout
     ↓
[createEffect] Apply positions to ProxyNodes
     ↓
PixiJS render
```

### Signal Dependencies

#### Level 1: Children Tracking

```typescript
const childrenSignal = children(() => props.children);
```

**Tracks**: Changes to children (add, remove, reorder)

#### Level 2: Measurement Extraction

```typescript
const measurements = createMemo(() => {
  return childrenSignal.toArray()
    .map(child => {
      if (!(child instanceof ProxyNode)) return null;

      return extractMeasurement(child, props);
    })
    .filter((m): m is ChildMeasurement => m !== null);
});
```

**Tracks**:
- Children changes (via childrenSignal)
- Child dimension changes (via ProxyNode.container.width/height)
- FlexItem prop changes (if child is FlexItem)

#### Level 3: Layout Calculation

```typescript
const layout = createMemo(() => {
  return calculateLayout(measurements(), {
    direction: props.direction ?? DEFAULTS.direction,
    wrap: props.wrap ?? DEFAULTS.wrap,
    justifyContent: props.justifyContent ?? DEFAULTS.justifyContent,
    alignItems: props.alignItems ?? DEFAULTS.alignItems,
    alignContent: props.alignContent ?? DEFAULTS.alignContent,
    gap: props.gap ?? DEFAULTS.gap,
    rowGap: props.rowGap ?? props.gap ?? DEFAULTS.gap,
    columnGap: props.columnGap ?? props.gap ?? DEFAULTS.gap,
    containerWidth: props.width,
    containerHeight: props.height,
    padding: resolvePadding(props),
  });
});
```

**Tracks**:
- Measurements (via measurements memo)
- All layout-affecting props

#### Level 4: Position Application

```typescript
createEffect(() => {
  const currentLayout = layout();
  const childNodes = childrenSignal.toArray();

  childNodes.forEach(child => {
    if (!(child instanceof ProxyNode)) return;

    const position = currentLayout.positions.get(child.id);
    if (position) {
      child.container.x = position.x;
      child.container.y = position.y;
    }
  });
});
```

**Triggers**: When layout memo changes

**Side Effects**: Mutates ProxyNode.container.x and .y

### Optimization Strategies

#### 1. Memoization Layers

Each transformation step is memoized:
- Measurements only recalculated when children or their props change
- Layout only recalculated when measurements or config changes
- Positions only applied when layout changes

#### 2. Batched Updates

Use SolidJS `batch()` for coordinated updates:

```typescript
batch(() => {
  setWidth(newWidth);
  setGap(newGap);
  setJustifyContent(newAlign);
});
// Layout calculated once, not three times
```

#### 3. Minimal Effect Scope

Effects only perform mutations, no calculations:

```typescript
// ❌ Bad: Calculation in effect
createEffect(() => {
  const positions = calculateSomething(children());
  applyPositions(positions);
});

// ✅ Good: Calculation in memo, effect only applies
const positions = createMemo(() => calculateSomething(children()));
createEffect(() => applyPositions(positions()));
```

#### 4. Conditional Reactivity

Skip work when unnecessary:

```typescript
const measurements = createMemo(() => {
  const kids = childrenSignal.toArray();

  // Early return for no children
  if (kids.length === 0) return [];

  return kids.map(extractMeasurement).filter(Boolean);
});
```

### Frame Synchronization

For performance-critical scenarios, use frame-synchronized effects:

```typescript
createSynchronizedEffect({
  query: () => layout(),
  effect: (currentLayout, ticker) => {
    // Apply positions within frame budget
    const childNodes = childrenSignal.toArray();

    childNodes.forEach(child => {
      if (!(child instanceof ProxyNode)) return;
      const position = currentLayout.positions.get(child.id);
      if (position) {
        child.container.x = position.x;
        child.container.y = position.y;
      }
    });
  },
});
```

**When to use**:
- Large numbers of children (>100)
- Frequent layout changes
- Need to synchronize with render loop
- Performance-critical applications

---

## Type System

### Core Type Constraints

#### ProxyNode Constraints

```typescript
type PixiContainer = import('pixi.js').Container;

type FlexChild = ProxyNode<PixiContainer> & {
  container: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};
```

**Constraint**: Child must be a ProxyNode wrapping a PixiJS Container or compatible object with position and dimensions.

#### Type Guards

```typescript
const isFlexChild = (node: unknown): node is FlexChild => {
  if (!(node instanceof ProxyNode)) return false;

  const container = node.container;
  return (
    typeof container === 'object' &&
    container !== null &&
    'x' in container &&
    'y' in container &&
    'width' in container &&
    'height' in container
  );
};
```

#### FlexItem Type Tracking

```typescript
const FLEX_ITEM_SYMBOL = Symbol('flex-item-props');

type FlexItemNode = ContainerNode & {
  [FLEX_ITEM_SYMBOL]: FlexItemConfig;
};

const isFlexItemNode = (node: ProxyNode): node is FlexItemNode => {
  return FLEX_ITEM_SYMBOL in node;
};

const getFlexItemProps = (node: ProxyNode): FlexItemConfig | null => {
  return isFlexItemNode(node) ? node[FLEX_ITEM_SYMBOL] : null;
};
```

### Measurement Types

```typescript
type Measurements = {
  id: symbol;
  width: number;
  height: number;
  flexConfig: FlexItemConfig;
};

type FlexItemConfig = {
  grow: number;
  shrink: number;
  basis: number | 'auto';
  alignSelf: AlignSelf;
  order: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
};
```

### Layout Engine Types

All layout engine types are in separate module for clarity:

```typescript
// layout-engine.ts

export type Axis = 'horizontal' | 'vertical';

export type NormalizedConfig = {
  mainAxis: Axis;
  crossAxis: Axis;
  mainReverse: boolean;
  crossReverse: boolean;
  mainGap: number;
  crossGap: number;
  availableMain: number;
  availableCross: number;
  paddingMain: number;
  paddingCross: number;
};

export type FlexLine = {
  children: ChildMeasurement[];
  hypotheticalMainSize: number;
};

export type ProcessedLine = {
  children: ChildMeasurement[];
  mainSize: number;
  crossSize: number;
  mainPositions: Map<symbol, number>;
};

export type Position = {
  x: number;
  y: number;
};

export type LayoutResult = {
  positions: Map<symbol, Position>;
  containerBounds: {
    width: number;
    height: number;
  };
  lines: LineInfo[];
};

export type LineInfo = {
  children: symbol[];
  mainSize: number;
  crossSize: number;
  startPosition: number;
};
```

### No `any` Types

**Principle**: Every type is explicitly defined or inferred. No `any` escape hatches.

**Approach**:
- Use `unknown` for truly unknown data, then narrow with type guards
- Use generic constraints instead of `any`
- Use union types for known alternatives
- Use type assertions only when type guard proves safety

```typescript
// ❌ Bad
const processChild = (child: any) => {
  child.container.x = 0; // No type safety
};

// ✅ Good
const processChild = (child: FlexChild) => {
  child.container.x = 0; // Type safe
};

// ✅ Good with unknown
const processChild = (child: unknown) => {
  if (!isFlexChild(child)) return;
  child.container.x = 0; // Type narrowed, safe
};
```

---

## Component Structure

### File Organization

```
FlexBox/
├── index.ts                  # Public exports
├── FlexBox.tsx              # Main component
├── FlexItem.tsx             # Item wrapper component
├── types.ts                 # Public type definitions
├── defaults.ts              # Default values
├── layout/
│   ├── index.ts             # Layout engine exports
│   ├── types.ts             # Layout-specific types
│   ├── calculate.ts         # Main calculation function
│   ├── normalize.ts         # Configuration normalization
│   ├── line-breaking.ts     # Wrap algorithm
│   ├── flex-sizing.ts       # Grow/shrink calculations
│   ├── align-main.ts        # justify-content logic
│   ├── align-cross.ts       # align-items logic
│   ├── align-lines.ts       # align-content logic
│   └── utils.ts             # Helper functions
├── measure/
│   ├── index.ts             # Measurement exports
│   ├── extract.ts           # Extract measurements from ProxyNodes
│   ├── flex-item.ts         # FlexItem prop resolution
│   ├── padding.ts           # Padding resolution
│   └── margin.ts            # Margin resolution
└── utils/
    ├── type-guards.ts       # Type guard functions
    └── symbols.ts           # Shared symbols
```

### Component Implementation Patterns

#### FlexBox.tsx

```typescript
export const FlexBox = (props: FlexBoxProps) => {
  // 1. Merge with defaults
  const mergedProps = mergeProps(FLEXBOX_DEFAULTS, props);

  // 2. Track children
  const childrenSignal = children(() => props.children);

  // 3. Extract measurements (memoized)
  const measurements = createMemo(() =>
    extractMeasurements(childrenSignal.toArray(), mergedProps)
  );

  // 4. Calculate layout (memoized)
  const layout = createMemo(() =>
    calculateLayout(measurements(), buildLayoutConfig(mergedProps))
  );

  // 5. Apply positions (effect)
  createEffect(() => {
    applyLayout(childrenSignal.toArray(), layout());
  });

  // 6. Render container
  return (
    <container x={mergedProps.x} y={mergedProps.y}>
      {childrenSignal()}
    </container>
  );
};
```

#### FlexItem.tsx

```typescript
export const FlexItem = (props: FlexItemProps) => {
  const mergedProps = mergeProps(FLEXITEM_DEFAULTS, props);

  return (
    <container
      ref={(node) => {
        // Attach flex config to node via symbol
        Object.defineProperty(node, FLEX_ITEM_SYMBOL, {
          value: {
            grow: mergedProps.grow,
            shrink: mergedProps.shrink,
            basis: mergedProps.basis,
            alignSelf: mergedProps.alignSelf,
            order: mergedProps.order,
            margin: resolveMargin(mergedProps),
          },
          enumerable: false,
          writable: false,
        });

        props.ref?.(node);
      }}
    >
      {props.children}
    </container>
  );
};
```

### Pure Functions Organization

#### Measurement Extraction

```typescript
// measure/extract.ts
export const extractMeasurements = (
  children: unknown[],
  parentProps: FlexBoxProps
): ChildMeasurement[] => {
  return children
    .map((child, index) => {
      if (!isFlexChild(child)) return null;

      const flexConfig = getFlexItemProps(child) ?? createDefaultFlexConfig();

      return {
        id: child.id ?? Symbol(`child-${index}`),
        width: child.container.width,
        height: child.container.height,
        flexGrow: flexConfig.grow,
        flexShrink: flexConfig.shrink,
        flexBasis: flexConfig.basis,
        alignSelf: flexConfig.alignSelf,
        order: flexConfig.order,
        margin: flexConfig.margin,
      };
    })
    .filter((m): m is ChildMeasurement => m !== null);
};
```

#### Layout Application

```typescript
// measure/apply.ts
export const applyLayout = (
  children: unknown[],
  layout: LayoutResult
): void => {
  children.forEach(child => {
    if (!isFlexChild(child)) return;

    const position = layout.positions.get(child.id);
    if (!position) return;

    child.container.x = position.x;
    child.container.y = position.y;
  });
};
```

#### Config Building

```typescript
// measure/config.ts
export const buildLayoutConfig = (props: FlexBoxProps): LayoutConfig => {
  return {
    direction: props.direction ?? DEFAULTS.direction,
    wrap: props.wrap ?? DEFAULTS.wrap,
    justifyContent: props.justifyContent ?? DEFAULTS.justifyContent,
    alignItems: props.alignItems ?? DEFAULTS.alignItems,
    alignContent: props.alignContent ?? DEFAULTS.alignContent,
    gap: props.gap ?? DEFAULTS.gap,
    rowGap: props.rowGap ?? props.gap ?? DEFAULTS.gap,
    columnGap: props.columnGap ?? props.gap ?? DEFAULTS.gap,
    containerWidth: props.width,
    containerHeight: props.height,
    padding: resolvePadding(props),
  };
};
```

---

## Implementation Phases

### Phase 1: Foundation

**Goal**: Core types, defaults, and project structure

**Deliverables**:
- Directory structure created
- Type definitions complete (`types.ts`)
- Default values defined (`defaults.ts`)
- Public exports defined (`index.ts`)
- Type guards implemented (`utils/type-guards.ts`)
- Symbols defined (`utils/symbols.ts`)

**Success Criteria**:
- All types compile without errors
- No `any` types present
- Exports are correctly structured

### Phase 2: Layout Engine - Core

**Goal**: Pure layout calculation functions (no reactivity)

**Deliverables**:
- `layout/types.ts` - Layout-specific types
- `layout/utils.ts` - Helper functions (getMainSize, getCrossSize, etc.)
- `layout/normalize.ts` - Configuration normalization
- `layout/line-breaking.ts` - Wrapping algorithm
- Basic test harness for layout calculations

**Success Criteria**:
- Can calculate line breaks correctly
- Normalization produces correct axis mapping
- Functions are pure (no side effects)
- All edge cases handled (empty children, no wrap, etc.)

### Phase 3: Layout Engine - Sizing & Alignment

**Goal**: Complete layout algorithm

**Deliverables**:
- `layout/flex-sizing.ts` - Flex grow/shrink calculations
- `layout/align-main.ts` - justify-content implementation
- `layout/align-cross.ts` - align-items implementation
- `layout/align-lines.ts` - align-content implementation
- `layout/calculate.ts` - Main orchestration function
- Comprehensive layout tests

**Success Criteria**:
- All justify-content modes work correctly
- All align-items modes work correctly
- Flex grow/shrink calculations accurate
- Multi-line alignment correct
- Layout engine fully functional

### Phase 4: Measurement System

**Goal**: Extract measurements from ProxyNodes

**Deliverables**:
- `measure/extract.ts` - Measurement extraction
- `measure/flex-item.ts` - FlexItem config resolution
- `measure/padding.ts` - Padding resolution
- `measure/margin.ts` - Margin resolution
- `measure/config.ts` - Layout config building

**Success Criteria**:
- Can extract dimensions from ProxyNodes
- FlexItem props correctly detected
- Padding/margin cascades work correctly
- Config building handles all prop combinations

### Phase 5: FlexItem Component

**Goal**: Optional wrapper for item-specific props

**Deliverables**:
- `FlexItem.tsx` - Component implementation
- Symbol-based prop attachment
- Ref forwarding
- Margin resolution

**Success Criteria**:
- FlexItem props attached to ProxyNode
- Can be detected by measurement extraction
- Works with all container types
- Ref forwarding functions correctly

### Phase 6: FlexBox Component

**Goal**: Main reactive component

**Deliverables**:
- `FlexBox.tsx` - Component implementation
- Children tracking
- Measurement memoization
- Layout calculation memoization
- Position application effect

**Success Criteria**:
- Renders container with positioned children
- Reacts to prop changes
- Reacts to children changes
- Performance acceptable (no unnecessary recalculations)
- Works with SolidJS control flow components

### Phase 7: Advanced Features

**Goal**: Polish and additional features

**Deliverables**:
- Container bounds calculation
- Support for nested FlexBoxes
- Integration with render-layers
- Performance optimization (frame synchronization for large lists)
- Edge case handling

**Success Criteria**:
- Nested FlexBoxes work correctly
- Container bounds accurate
- Works with render-layers
- Performance acceptable with 100+ children

### Phase 8: Documentation & Examples

**Goal**: Complete documentation and usage examples

**Deliverables**:
- API documentation
- Usage examples
- Migration guide from deprecated FlexBox
- Performance best practices
- Common patterns and recipes

**Success Criteria**:
- All props documented
- Examples cover common use cases
- Migration path clear
- Performance guidance comprehensive

---

## Appendix: Design Decisions

### Why CSS Flexbox API?

**Decision**: Use CSS Flexbox terminology and behavior

**Alternatives**:
- Custom layout API
- Unity-style layout
- iOS Auto Layout
- Custom "flow" layout

**Rationale**:
- CSS Flexbox is widely known and understood
- Extensive documentation and resources available
- Predictable behavior from web development
- No need to invent new terminology
- Easier to learn and teach

**Trade-offs**:
- Some CSS features don't map to PixiJS (e.g., stretch requires resizing)
- Baseline alignment complex without text metrics
- More complex than simple linear layout

### Why Separate Layout Engine?

**Decision**: Pure layout calculation module separate from reactive component

**Alternatives**:
- All logic in component
- Layout calculations in effects
- Imperative API

**Rationale**:
- Testable without SolidJS or PixiJS
- Reusable in other contexts
- Clear separation of concerns
- Easy to reason about
- Performance optimizations easier

**Trade-offs**:
- More code
- More files
- Indirection between component and calculations

### Why Memoization Layers?

**Decision**: Multiple memo layers (measurements → layout → positions)

**Alternatives**:
- Single memo for entire calculation
- No memoization, recalculate always
- Manual caching

**Rationale**:
- Granular reactivity tracking
- Avoid unnecessary recalculation
- Clear dependency graph
- Better performance with large child lists

**Trade-offs**:
- More memory overhead
- Slightly more complex code
- Need to understand memo dependencies

### Why Symbol-Based FlexItem Props?

**Decision**: Attach FlexItem config to ProxyNode via non-enumerable symbol property

**Alternatives**:
- Global WeakMap<ProxyNode, FlexItemConfig>
- Context-based prop passing
- Direct ProxyNode subclass
- Custom intrinsic element

**Rationale**:
- Attached directly to node (no external lookup)
- Non-enumerable (doesn't pollute node properties)
- Symbol ensures no conflicts
- Works with any container type
- No memory leaks (attached to object lifetime)

**Trade-offs**:
- Less discoverable (hidden property)
- Requires ref callback pattern
- Symbol must be shared across modules

### Why Optional FlexItem Component?

**Decision**: FlexItem is optional wrapper, not required

**Alternatives**:
- All children must be FlexItem
- FlexBox uses intrinsic props on children
- Context-based configuration

**Rationale**:
- Progressive disclosure (simple cases don't need it)
- Works with existing components
- Clear when item-specific config needed
- Composable with any child

**Trade-offs**:
- Two ways to configure children (FlexItem vs no wrapper)
- Documentation must explain when to use
- Implementation slightly more complex

---

**End of Document**
