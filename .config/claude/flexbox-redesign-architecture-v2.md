# FlexBox Component Redesign: Architecture & Design (v2)

**Version:** 2.0 - Revised with reactivity fixes
**Target Package:** `sylph-jsx`
**Location:** `/packages/sylph-jsx/src/engine/components/extensions/FlexBox`
**Date:** 2025-10-26

---

## Revision Notes (v1 → v2)

This revision addresses critical architectural flaws identified in v1:

1. **Reactivity Gap**: Added frame-synchronized measurement tracking since PixiJS container dimensions are plain numbers, not reactive signals
2. **Frozen FlexItem Config**: Changed from immutable `Object.defineProperty` to mutable reactive object that updates via `createEffect`
3. **Ephemeral IDs**: Implemented stable ID system using persistent symbols attached to ProxyNodes
4. **Lost Ordering**: Fixed normalize to propagate sorted children through entire pipeline
5. **Infinity in Calculations**: Added clamping and fallback logic for auto-sized containers
6. **Misleading API**: Documented stretch/baseline limitations clearly and removed unsupported values from types

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Implementation Analysis](#current-implementation-analysis)
3. [Design Principles](#design-principles)
4. [Architecture Overview](#architecture-overview)
5. [Critical Solutions](#critical-solutions)
6. [API Design](#api-design)
7. [Layout Algorithm](#layout-algorithm)
8. [Reactivity Model](#reactivity-model)
9. [Type System](#type-system)
10. [Component Structure](#component-structure)
11. [Implementation Phases](#implementation-phases)

---

## Executive Summary

The FlexBox redesign provides CSS Flexbox-aligned layout for PixiJS applications with proper SolidJS reactivity patterns. Version 2 addresses critical reactivity and lifecycle issues from the initial design.

### Core Improvements Over v1

1. **Frame-Synchronized Measurements**: Uses `onEveryFrame` to track PixiJS container dimension changes
2. **Reactive FlexItem Props**: Mutable config objects updated via `createEffect`
3. **Stable Child IDs**: Persistent symbols ensure layout positions always match children
4. **Working Order Property**: Sorted children propagate through entire layout pipeline
5. **Finite Calculations**: Graceful handling of auto-sized containers
6. **Honest API**: Clear documentation of CSS Flexbox subset actually supported

---

## Current Implementation Analysis

[Previous analysis unchanged - see v1 document]

---

## Design Principles

[Previous principles unchanged - see v1 document]

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
│  • Frame-synchronized measurement tracking                   │
│  • Measurement memoization (createMemo)                      │
│  • Layout calculation (createMemo)                           │
│  • Position application (createSynchronizedEffect)           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: Layout Engine (Pure)                               │
│  • Child measurement extraction                              │
│  • Order-based sorting                                       │
│  • Main/cross axis calculation                               │
│  • Wrapping algorithm                                        │
│  • Alignment calculation                                     │
│  • Position generation                                       │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Input**: FlexBox receives props and children
2. **ID Assignment**: Stable IDs attached to ProxyNodes via symbols
3. **Measurement Tracking**: Frame-synchronized dimension tracking
4. **Calculation**: Pure layout engine calculates positions from stable measurements
5. **Memoization**: Layout result memoized via `createMemo`
6. **Application**: `createSynchronizedEffect` applies positions to ProxyNodes
7. **Output**: Positioned children rendered in container

---

## Critical Solutions

### Solution 1: Frame-Synchronized Measurements

**Problem**: PixiJS `container.width` and `container.height` are plain number getters, not reactive signals. Memos reading these values won't re-run when dimensions change.

**Solution**: Use `onEveryFrame` to create a reactive measurement signal that tracks dimension changes.

```typescript
const createMeasurementTracker = () => {
  const [measurements, setMeasurements] = createSignal<Map<symbol, ChildDimensions>>(
    new Map()
  );

  return { measurements, setMeasurements };
};

const FlexBox = (props: FlexBoxProps) => {
  const childrenSignal = children(() => props.children);
  const { measurements, setMeasurements } = createMeasurementTracker();

  onEveryFrame(() => {
    const currentChildren = childrenSignal.toArray();
    const nextMeasurements = new Map<symbol, ChildDimensions>();

    for (const child of currentChildren) {
      if (!isFlexChild(child)) continue;

      const id = getOrCreateStableId(child);
      const current = measurements().get(id);

      const bounds = child.container.getLocalBounds();
      const width = bounds.width;
      const height = bounds.height;

      if (!current || current.width !== width || current.height !== height) {
        nextMeasurements.set(id, { width, height });
      } else {
        nextMeasurements.set(id, current);
      }
    }

    if (!areMeasurementsEqual(measurements(), nextMeasurements)) {
      setMeasurements(nextMeasurements);
    }
  });

  const layoutMeasurements = createMemo(() => {
    const dims = measurements();
    return currentChildren.toArray()
      .map(child => {
        if (!isFlexChild(child)) return null;
        const id = getStableId(child);
        if (!id) return null;

        const dimensions = dims.get(id);
        if (!dimensions) return null;

        return {
          id,
          width: dimensions.width,
          height: dimensions.height,
          flexConfig: getFlexConfig(child),
        };
      })
      .filter((m): m is ChildMeasurement => m !== null);
  });
};
```

**Why This Works**:
- `onEveryFrame` runs every frame, checking actual PixiJS dimensions
- Dimensions stored in signal, triggering reactivity when they change
- Memo depends on signal, re-runs when dimensions update
- Equality check prevents unnecessary signal updates

**Trade-offs**:
- Every-frame overhead (mitigated by equality checks)
- Slight latency (one frame) for dimension changes to propagate
- Memory overhead for dimension cache

**Alternative Considered**: Ticker-driven store pattern with explicit invalidation. Rejected because it requires more boilerplate and doesn't integrate as cleanly with SolidJS.

### Solution 2: Reactive FlexItem Configuration

**Problem**: `Object.defineProperty` with `writable: false` makes config immutable. Reactive prop updates impossible.

**Solution**: Store mutable config object and update it via `createEffect`.

```typescript
const FLEX_CONFIG_SYMBOL = Symbol('flex-config');

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

export const FlexItem = (props: FlexItemProps) => {
  const mergedProps = mergeProps(FLEXITEM_DEFAULTS, props);
  let containerNode: ContainerNode | undefined;

  const setupFlexConfig = (node: ContainerNode) => {
    containerNode = node;

    const config: FlexItemConfig = {
      grow: mergedProps.grow,
      shrink: mergedProps.shrink,
      basis: mergedProps.basis,
      alignSelf: mergedProps.alignSelf,
      order: mergedProps.order,
      margin: resolveMargin(mergedProps),
    };

    Object.defineProperty(node, FLEX_CONFIG_SYMBOL, {
      value: config,
      enumerable: false,
      writable: false,
    });

    props.ref?.(node);
  };

  createEffect(() => {
    if (!containerNode) return;

    const config = containerNode[FLEX_CONFIG_SYMBOL] as FlexItemConfig;
    if (!config) return;

    config.grow = mergedProps.grow;
    config.shrink = mergedProps.shrink;
    config.basis = mergedProps.basis;
    config.alignSelf = mergedProps.alignSelf;
    config.order = mergedProps.order;
    config.margin = resolveMargin(mergedProps);
  });

  return (
    <container ref={setupFlexConfig}>
      {props.children}
    </container>
  );
};

const getFlexConfig = (child: ProxyNode): FlexItemConfig => {
  if (FLEX_CONFIG_SYMBOL in child) {
    return child[FLEX_CONFIG_SYMBOL] as FlexItemConfig;
  }

  return {
    grow: 0,
    shrink: 1,
    basis: 'auto',
    alignSelf: 'auto',
    order: 0,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  };
};
```

**Why This Works**:
- Config object is mutable (only the symbol property is non-writable)
- `createEffect` tracks prop changes and updates config
- FlexBox reads config object, gets latest values
- Reactivity preserved through effect

**Alternative Considered**: WeakMap<ProxyNode, FlexItemConfig>. Rejected because symbol attachment is more performant and doesn't require external storage.

### Solution 3: Stable Child Identifiers

**Problem**: Ephemeral `Symbol()` created each measurement pass means layout positions never match children.

**Solution**: Persistent symbol attached to ProxyNode on first access.

```typescript
const FLEX_ID_SYMBOL = Symbol('flex-id');

const getOrCreateStableId = (node: ProxyNode): symbol => {
  if (FLEX_ID_SYMBOL in node) {
    return node[FLEX_ID_SYMBOL] as symbol;
  }

  const id = Symbol('flex-child');
  Object.defineProperty(node, FLEX_ID_SYMBOL, {
    value: id,
    enumerable: false,
    writable: false,
    configurable: false,
  });

  return id;
};

const getStableId = (node: ProxyNode): symbol | null => {
  if (FLEX_ID_SYMBOL in node) {
    return node[FLEX_ID_SYMBOL] as symbol;
  }
  return null;
};

const extractMeasurements = (
  children: unknown[]
): ChildMeasurement[] => {
  return children
    .map(child => {
      if (!isFlexChild(child)) return null;

      const id = getOrCreateStableId(child);

      return {
        id,
        width: child.container.width,
        height: child.container.height,
        flexConfig: getFlexConfig(child),
      };
    })
    .filter((m): m is ChildMeasurement => m !== null);
};

const applyLayout = (
  children: unknown[],
  layout: LayoutResult
): void => {
  children.forEach(child => {
    if (!isFlexChild(child)) return;

    const id = getStableId(child);
    if (!id) return;

    const position = layout.positions.get(id);
    if (!position) return;

    child.container.x = position.x;
    child.container.y = position.y;
  });
};
```

**Why This Works**:
- Symbol created once, stored on ProxyNode
- Same symbol used in measurement and application
- Map lookups succeed
- ProxyNode lifecycle manages symbol lifetime (no leaks)

**Alternative Considered**: Array indices. Rejected because children can reorder, making indices unstable.

### Solution 4: Order Property Pipeline

**Problem**: Normalized config sorts children by `order`, but sorted array isn't propagated, making `order` a no-op.

**Solution**: Return sorted children from normalize and use throughout pipeline.

```typescript
type NormalizedData = {
  children: ChildMeasurement[];  // ✅ Added: sorted children
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

const normalize = (
  children: ChildMeasurement[],
  config: LayoutConfig
): NormalizedData => {
  const sorted = [...children].sort((a, b) =>
    a.flexConfig.order - b.flexConfig.order
  );

  const isRow = config.direction === 'row' || config.direction === 'row-reverse';
  const mainAxis = isRow ? 'horizontal' : 'vertical';
  const crossAxis = isRow ? 'vertical' : 'horizontal';

  const mainReverse = config.direction.endsWith('-reverse');
  const crossReverse = config.wrap === 'wrap-reverse';

  const mainGap = isRow ? config.columnGap : config.rowGap;
  const crossGap = isRow ? config.rowGap : config.columnGap;

  const paddingMain = isRow
    ? config.padding.left + config.padding.right
    : config.padding.top + config.padding.bottom;
  const paddingCross = isRow
    ? config.padding.top + config.padding.bottom
    : config.padding.left + config.padding.right;

  const availableMain = config.containerWidth !== undefined
    ? (isRow ? config.containerWidth : config.containerHeight ?? Infinity) - paddingMain
    : Infinity;
  const availableCross = config.containerHeight !== undefined
    ? (isRow ? config.containerHeight : config.containerWidth ?? Infinity) - paddingCross
    : Infinity;

  return {
    children: sorted,  // ✅ Return sorted children
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

export const calculateLayout = (
  children: ChildMeasurement[],
  config: LayoutConfig
): LayoutResult => {
  const normalized = normalize(children, config);

  const lines = breakLines(normalized.children, normalized, config);  // ✅ Use sorted

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

  const linePositions = alignLines(processedLines, normalized, config);

  return calculateFinalPositions(processedLines, linePositions, normalized, config);
};
```

**Why This Works**:
- Sorted array explicitly returned from normalize
- All subsequent steps use `normalized.children`
- Order property actually affects visual order
- Type system enforces propagation

### Solution 5: Finite Auto-Size Calculations

**Problem**: When container constraints omitted, `availableMain`/`availableCross` become `Infinity`, producing `NaN` or `Infinity` in alignment calculations.

**Solution**: Detect infinite constraints and use appropriate fallbacks for each alignment mode.

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

  const isFinite = Number.isFinite(normalized.availableMain);
  const freeSpace = isFinite ? normalized.availableMain - usedSpace : 0;

  let currentPosition = normalized.mainReverse
    ? (isFinite ? normalized.availableMain : usedSpace)
    : 0;
  let gap = normalized.mainGap;

  switch (config.justifyContent) {
    case 'flex-start':
      break;

    case 'flex-end':
      if (isFinite) {
        currentPosition += normalized.mainReverse ? 0 : freeSpace;
      }
      break;

    case 'center':
      if (isFinite) {
        currentPosition += normalized.mainReverse ? -freeSpace / 2 : freeSpace / 2;
      }
      break;

    case 'space-between':
      if (isFinite && line.children.length > 1) {
        gap = normalized.mainGap + freeSpace / (line.children.length - 1);
      }
      break;

    case 'space-around':
      if (isFinite) {
        const spaceAround = freeSpace / line.children.length;
        currentPosition += spaceAround / 2;
        gap = normalized.mainGap + spaceAround;
      }
      break;

    case 'space-evenly':
      if (isFinite) {
        const spaceEvenly = freeSpace / (line.children.length + 1);
        currentPosition += spaceEvenly;
        gap = normalized.mainGap + spaceEvenly;
      }
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

  const isFinite = Number.isFinite(normalized.availableCross);
  const freeSpace = isFinite ? normalized.availableCross - usedSpace : 0;

  let currentPosition = 0;
  let gap = normalized.crossGap;

  switch (config.alignContent) {
    case 'flex-start':
      break;

    case 'flex-end':
      if (isFinite) {
        currentPosition = freeSpace;
      }
      break;

    case 'center':
      if (isFinite) {
        currentPosition = freeSpace / 2;
      }
      break;

    case 'space-between':
      if (isFinite && lines.length > 1) {
        gap = normalized.crossGap + freeSpace / (lines.length - 1);
      }
      break;

    case 'space-around':
      if (isFinite) {
        const spaceAround = freeSpace / lines.length;
        currentPosition = spaceAround / 2;
        gap = normalized.crossGap + spaceAround;
      }
      break;

    case 'stretch':
      if (isFinite) {
        const additionalPerLine = lines.length > 0 ? freeSpace / lines.length : 0;
        lines.forEach((line, i) => {
          linePositions.set(i, currentPosition);
          currentPosition += line.crossSize + additionalPerLine + normalized.crossGap;
        });
        return linePositions;
      }
      break;
  }

  lines.forEach((line, i) => {
    linePositions.set(i, currentPosition);
    currentPosition += line.crossSize + gap;
  });

  return linePositions;
};
```

**Why This Works**:
- Explicit `Number.isFinite()` checks before using constraints
- Auto-sized containers default to `flex-start` behavior
- Space distribution modes gracefully degrade to packed layout
- No `NaN` or `Infinity` in final positions

**Documented Behavior**:
- Without `width`: `justify-content` behaves as `flex-start` (except in reverse modes)
- Without `height`: `align-content` behaves as `flex-start`
- Developers must provide constraints for distribution modes to work

### Solution 6: Honest API Documentation

**Problem**: API promises `stretch` and `baseline` alignment but implementation silently degrades to `flex-start`.

**Solution**: Remove unsupported values from types and clearly document limitations.

```typescript
type AlignItems =
  | 'flex-start'    // Align to start of cross axis
  | 'flex-end'      // Align to end of cross axis
  | 'center';       // Center on cross axis

type AlignSelf =
  | 'auto'          // Inherit from parent's alignItems
  | 'flex-start'    // Align to start
  | 'flex-end'      // Align to end
  | 'center';       // Center

type AlignContent =
  | 'flex-start'    // Pack lines to start
  | 'flex-end'      // Pack lines to end
  | 'center'        // Center lines
  | 'space-between' // Distribute lines, no edge spacing
  | 'space-around'; // Distribute lines, half edge spacing
```

**Removed**:
- `alignItems: 'stretch'` - Would require resizing children, not just positioning
- `alignItems: 'baseline'` - Would require text baseline metrics
- `alignContent: 'stretch'` - Would require resizing children

**Documentation Added**:

```typescript
/**
 * FlexBox Layout Component
 *
 * Implements a subset of CSS Flexbox for PixiJS layouts.
 *
 * ## Limitations vs CSS Flexbox
 *
 * - **No stretch alignment**: PixiJS children have intrinsic sizes that
 *   cannot be automatically resized. Use explicit width/height props instead.
 *
 * - **No baseline alignment**: Text baseline metrics not available in PixiJS.
 *   Use 'center' or manual offsets for text alignment.
 *
 * - **No flex-basis percentages**: Only pixel values and 'auto' supported.
 *
 * - **No min-width/max-width on items**: Container-level constraints only.
 *
 * - **Auto-sized containers**: Without width/height constraints, distribution
 *   modes (space-between, space-around, space-evenly) behave as flex-start.
 */
export const FlexBox: Component<FlexBoxProps>;
```

**Why This Approach**:
- Type system prevents using unsupported features
- Documentation explicitly calls out limitations
- No silent degradation surprises
- Clear migration path if features added later

---

## API Design

### FlexBox Component Props

```typescript
type FlexBoxProps = {
  x?: number;
  y?: number;
  direction?: FlexDirection;
  wrap?: FlexWrap;
  justifyContent?: JustifyContent;
  alignItems?: AlignItems;        // ✅ Reduced to supported values
  alignContent?: AlignContent;    // ✅ Reduced to supported values
  gap?: number;
  rowGap?: number;
  columnGap?: number;
  width?: number;
  height?: number;
  padding?: number;
  paddingX?: number;
  paddingY?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  children?: JSX.Element;
  ref?: (node: ContainerNode) => void;
};

type FlexDirection =
  | 'row'
  | 'row-reverse'
  | 'column'
  | 'column-reverse';

type FlexWrap =
  | 'nowrap'
  | 'wrap'
  | 'wrap-reverse';

type JustifyContent =
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'space-between'
  | 'space-around'
  | 'space-evenly';

type AlignItems =
  | 'flex-start'
  | 'flex-end'
  | 'center';

type AlignContent =
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'space-between'
  | 'space-around';

type AlignSelf =
  | 'auto'
  | 'flex-start'
  | 'flex-end'
  | 'center';
```

### FlexItem Component Props

```typescript
type FlexItemProps = {
  flex?: number;
  grow?: number;
  shrink?: number;
  basis?: number | 'auto';
  alignSelf?: AlignSelf;
  order?: number;
  margin?: number;
  marginX?: number;
  marginY?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  children?: JSX.Element;
  ref?: (node: ContainerNode) => void;
};
```

[Defaults and usage examples follow same patterns as v1, but with corrected types]

---

## Layout Algorithm

[Core algorithm unchanged from v1, with these corrections:]

### Updated Normalize Function

```typescript
const normalize = (
  children: ChildMeasurement[],
  config: LayoutConfig
): NormalizedData => {
  const sorted = [...children].sort((a, b) =>
    a.flexConfig.order - b.flexConfig.order
  );

  const isRow = config.direction === 'row' || config.direction === 'row-reverse';

  const availableMain = (() => {
    const constraint = isRow ? config.containerWidth : config.containerHeight;
    if (constraint === undefined) return Infinity;

    const paddingMain = isRow
      ? config.padding.left + config.padding.right
      : config.padding.top + config.padding.bottom;

    return constraint - paddingMain;
  })();

  const availableCross = (() => {
    const constraint = isRow ? config.containerHeight : config.containerWidth;
    if (constraint === undefined) return Infinity;

    const paddingCross = isRow
      ? config.padding.top + config.padding.bottom
      : config.padding.left + config.padding.right;

    return constraint - paddingCross;
  })();

  return {
    children: sorted,
    mainAxis: isRow ? 'horizontal' : 'vertical',
    crossAxis: isRow ? 'vertical' : 'horizontal',
    mainReverse: config.direction.endsWith('-reverse'),
    crossReverse: config.wrap === 'wrap-reverse',
    mainGap: isRow ? config.columnGap : config.rowGap,
    crossGap: isRow ? config.rowGap : config.columnGap,
    availableMain,
    availableCross,
    paddingMain: isRow
      ? config.padding.left + config.padding.right
      : config.padding.top + config.padding.bottom,
    paddingCross: isRow
      ? config.padding.top + config.padding.bottom
      : config.padding.left + config.padding.right,
  };
};
```

### Updated Cross-Axis Alignment

```typescript
const alignCrossAxis = (
  child: ChildMeasurement,
  lineCrossSize: number,
  normalized: NormalizedData,
  config: LayoutConfig
): number => {
  const alignSelf = child.flexConfig.alignSelf === 'auto'
    ? config.alignItems
    : child.flexConfig.alignSelf;

  const childCrossSize = getCrossSize(child, normalized.crossAxis);
  const marginCrossStart = getCrossMarginStart(child.flexConfig.margin, normalized.crossAxis);
  const marginCrossEnd = getCrossMarginEnd(child.flexConfig.margin, normalized.crossAxis);

  switch (alignSelf) {
    case 'flex-start':
      return marginCrossStart;

    case 'flex-end':
      return lineCrossSize - childCrossSize - marginCrossEnd;

    case 'center':
      return (lineCrossSize - childCrossSize - marginCrossStart - marginCrossEnd) / 2
        + marginCrossStart;
  }
};
```

---

## Reactivity Model

### Complete Component Implementation

```typescript
export const FlexBox = (props: FlexBoxProps) => {
  const mergedProps = mergeProps(FLEXBOX_DEFAULTS, props);
  const childrenSignal = children(() => props.children);

  const { measurements, setMeasurements } = createMeasurementTracker();

  onEveryFrame(() => {
    const currentChildren = childrenSignal.toArray();
    const nextMeasurements = new Map<symbol, ChildDimensions>();

    for (const child of currentChildren) {
      if (!isFlexChild(child)) continue;

      const id = getOrCreateStableId(child);
      const current = measurements().get(id);

      const bounds = child.container.getLocalBounds();
      const width = bounds.width;
      const height = bounds.height;

      if (!current || current.width !== width || current.height !== height) {
        nextMeasurements.set(id, { width, height });
      } else {
        nextMeasurements.set(id, current);
      }
    }

    if (!areMeasurementsEqual(measurements(), nextMeasurements)) {
      setMeasurements(nextMeasurements);
    }
  });

  const layoutMeasurements = createMemo(() => {
    const dims = measurements();
    const currentChildren = childrenSignal.toArray();

    return currentChildren
      .map(child => {
        if (!isFlexChild(child)) return null;

        const id = getStableId(child);
        if (!id) return null;

        const dimensions = dims.get(id);
        if (!dimensions) return null;

        return {
          id,
          width: dimensions.width,
          height: dimensions.height,
          flexConfig: getFlexConfig(child),
        };
      })
      .filter((m): m is ChildMeasurement => m !== null);
  });

  const layout = createMemo(() => {
    return calculateLayout(layoutMeasurements(), {
      direction: mergedProps.direction,
      wrap: mergedProps.wrap,
      justifyContent: mergedProps.justifyContent,
      alignItems: mergedProps.alignItems,
      alignContent: mergedProps.alignContent,
      gap: mergedProps.gap,
      rowGap: mergedProps.rowGap ?? mergedProps.gap,
      columnGap: mergedProps.columnGap ?? mergedProps.gap,
      containerWidth: mergedProps.width,
      containerHeight: mergedProps.height,
      padding: resolvePadding(mergedProps),
    });
  });

  createSynchronizedEffect({
    query: () => ({
      layout: layout(),
      children: childrenSignal.toArray(),
    }),
    effect: ({ layout, children }) => {
      applyLayout(children, layout);
    },
  });

  return (
    <container x={mergedProps.x} y={mergedProps.y}>
      {childrenSignal()}
    </container>
  );
};
```

### Reactivity Flow Diagram

```
Every Frame (onEveryFrame)
     ↓
Read PixiJS getLocalBounds() → Plain Numbers
     ↓
Detect Changes → Update Signal
     ↓
[Signal] measurements
     ↓
[Memo] layoutMeasurements (filters & maps)
     ↓
[Memo] layout (pure calculation)
     ↓
[SynchronizedEffect] Apply positions
     ↓
Next Frame Render
```

### Performance Characteristics

**Every Frame Overhead**:
- Iterate children: O(n)
- Read bounds: O(n)
- Equality check: O(n)
- Signal update: O(1) when unchanged, triggers cascade when changed

**Optimization**: Equality check prevents signal updates (and downstream recalculation) when dimensions haven't changed.

**Memo Efficiency**:
- `layoutMeasurements` only re-runs when `measurements` signal or `childrenSignal` changes
- `layout` only re-runs when `layoutMeasurements` or props change
- Effect only re-runs when `layout` memo changes

**Frame Synchronization**:
- Uses `createSynchronizedEffect` to apply positions in same frame as layout calculation
- Prevents multi-frame latency
- Respects frame budget

---

## Type System

[All types from v1 with these corrections:]

```typescript
const FLEX_ID_SYMBOL = Symbol('flex-id');
const FLEX_CONFIG_SYMBOL = Symbol('flex-config');

type ChildDimensions = {
  width: number;
  height: number;
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

type ChildMeasurement = {
  id: symbol;
  width: number;
  height: number;
  flexConfig: FlexItemConfig;
};

type NormalizedData = {
  children: ChildMeasurement[];  // ✅ Sorted children included
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
```

---

## Component Structure

```
FlexBox/
├── index.ts                     # Public exports
├── FlexBox.tsx                  # Main component with frame-sync
├── FlexItem.tsx                 # Item wrapper with reactive config
├── types.ts                     # Public type definitions
├── defaults.ts                  # Default values
├── symbols.ts                   # Shared symbols (ID, CONFIG)
├── layout/
│   ├── index.ts                 # Layout engine exports
│   ├── types.ts                 # Layout-specific types
│   ├── calculate.ts             # Main calculation function
│   ├── normalize.ts             # Configuration normalization (returns sorted children)
│   ├── line-breaking.ts         # Wrap algorithm
│   ├── flex-sizing.ts           # Grow/shrink calculations
│   ├── align-main.ts            # justify-content logic (with Infinity handling)
│   ├── align-cross.ts           # align-items logic (reduced feature set)
│   ├── align-lines.ts           # align-content logic (with Infinity handling)
│   └── utils.ts                 # Helper functions
├── measure/
│   ├── index.ts                 # Measurement exports
│   ├── tracker.ts               # Frame-synchronized dimension tracking
│   ├── extract.ts               # Extract measurements with stable IDs
│   ├── flex-config.ts           # FlexConfig getters
│   ├── stable-id.ts             # Stable ID management
│   ├── padding.ts               # Padding resolution
│   └── margin.ts                # Margin resolution
└── utils/
    ├── type-guards.ts           # Type guard functions
    ├── equality.ts              # Measurement equality checks
    └── apply.ts                 # Position application
```

---

## Implementation Phases

### Phase 1: Foundation & Symbols

**Deliverables**:
- `symbols.ts` - Define FLEX_ID_SYMBOL and FLEX_CONFIG_SYMBOL
- `types.ts` - All type definitions (with corrected AlignItems/AlignContent)
- `defaults.ts` - Default values
- `utils/type-guards.ts` - Type guard functions
- `measure/stable-id.ts` - Stable ID management functions

**Validation**:
- All types compile
- No `any` types
- Symbols exported correctly

### Phase 2: Measurement Tracking

**Deliverables**:
- `measure/tracker.ts` - Frame-synchronized measurement tracking
- `utils/equality.ts` - Measurement equality checks
- `measure/flex-config.ts` - FlexConfig accessor functions

**Validation**:
- Can detect dimension changes
- Signal updates only when dimensions change
- Stable IDs persist across frames

### Phase 3: Layout Engine - Core

**Deliverables**:
- `layout/types.ts` - Layout-specific types (with sorted children in NormalizedData)
- `layout/utils.ts` - Axis helpers (getMainSize, getCrossSize, etc.)
- `layout/normalize.ts` - Normalization with sorting and Infinity handling
- `layout/line-breaking.ts` - Wrapping algorithm using sorted children

**Validation**:
- Sorting by order works
- Sorted children propagate to line breaking
- Infinity constraints handled gracefully

### Phase 4: Layout Engine - Sizing & Alignment

**Deliverables**:
- `layout/flex-sizing.ts` - Flex grow/shrink with finite checks
- `layout/align-main.ts` - justify-content with Infinity handling
- `layout/align-cross.ts` - align-items (reduced feature set)
- `layout/align-lines.ts` - align-content with Infinity handling
- `layout/calculate.ts` - Main orchestration

**Validation**:
- Auto-sized containers produce finite positions
- All alignment modes work correctly
- Stretch/baseline omitted from types

### Phase 5: FlexItem Component

**Deliverables**:
- `FlexItem.tsx` - Component with reactive config updates
- Mutable config object
- `createEffect` for prop reactivity

**Validation**:
- Config attached to node
- Props updates flow through effect
- FlexBox reads latest config values

### Phase 6: FlexBox Component

**Deliverables**:
- `FlexBox.tsx` - Component with onEveryFrame tracking
- Children tracking
- Measurement signal
- Layout memos
- `createSynchronizedEffect` for position application

**Validation**:
- Renders correctly
- Dimension changes detected
- Positions update reactively
- Order property works
- Works with SolidJS control flow

### Phase 7: Integration & Polish

**Deliverables**:
- `measure/extract.ts` - Complete measurement extraction
- `measure/padding.ts` - Padding resolution
- `measure/margin.ts` - Margin resolution
- `utils/apply.ts` - Position application with stable ID lookup
- `index.ts` - Public exports

**Validation**:
- All features working
- Nested FlexBoxes work
- Render layers compatible
- Performance acceptable

### Phase 8: Documentation

**Deliverables**:
- API documentation with limitations clearly stated
- Usage examples
- Migration guide from deprecated FlexBox
- Performance best practices

**Validation**:
- All props documented
- Limitations clearly called out
- Examples cover common patterns

---

## Conclusion

Version 2 addresses all critical architectural flaws from v1:

1. ✅ **Reactive measurements** via frame-synchronized tracking
2. ✅ **Reactive FlexItem props** via mutable config and effects
3. ✅ **Stable IDs** persisted on ProxyNodes
4. ✅ **Working order property** with sorted children propagation
5. ✅ **Finite calculations** with Infinity handling
6. ✅ **Honest API** with documented limitations

The design is now ready for implementation.

---

**End of Document**
