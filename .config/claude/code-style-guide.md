## Code Style Guide

When writing code for this project, follow these established patterns:

### Function Declarations
- **Always use `const` arrow functions**:
  ```typescript
  export const functionName = async (params: Type) => {
    // implementation
  };
  ```
- **Never use `async function` syntax** unless matching existing utility patterns
- **Use higher-order functions** for creating specialized functions:
  ```typescript
  const createProcessor = (options: Opts) => (item: Item) => {
    // process item with options
  };
  ```

### Programming Style
- **Prefer functional programming**:
    - Use `map`, `filter`, `reduce` instead of for loops
    - Avoid mutations - return new objects/arrays
    - Compose functions rather than nesting imperative code
    - Example: `manifests.map(loadManifest)` not `for (const m of manifests)`

### Type Patterns - CRITICAL TYPING REQUIREMENTS
- **NEVER use `any` type** - This completely defeats TypeScript's purpose and creates runtime errors
- **Bad pattern**: `const model: any = await getModel()` - Loses all type safety
- **Good pattern**: `const model: FeatureExtractionPipeline = await getModel()` - Maintains type safety
- **Good pattern**: `const model = await getModel()` - Let TypeScript infer specific types
- **Always prefer type inference** - Let TypeScript infer return types and variable types
- **Only add explicit types for**:
    - Function parameters
    - When inference would be unclear
    - When narrowing is needed
- **Bad pattern**: `async (item): Promise<Result | null> => { ... }`
- **Good pattern**: `async (item) => { ... }` - Let TS infer the return type
- **Export types explicitly** alongside their usage
- **Use runtypes** for runtime validation when needed
- **Use `unknown` instead of `any`** when dealing with truly unknown data, then narrow with type guards
- **Use proper type imports** with `type` keyword for type-only imports

### Import/Export Patterns
- **Use named exports**, not default exports
- **Use `type` imports** when importing only types

### Error Handling
- **Always handle errors explicitly** - Never swallow errors with empty catch blocks or silent returns
- **Throw or propagate errors** - Let callers decide how to handle failures
- **Use `invariant()`** from utils/flow.ts for assertions
- **Use async/await** with try/catch, not .then().catch()
- **Log errors with context** before re-throwing when appropriate
- **Prefer functional error handling** with `.catch()` over imperative try/catch when possible
- **Bad pattern**: `catch (e) { return null; }` - This hides failures
- **Bad pattern**: `let x = ''; try { x = await fn(); } catch (e) { /* ignore */ }` - Mutation + error swallowing
- **Good pattern**: `catch (e) { throw new Error(\`Failed to process X: ${e}\`); }`
- **Good pattern**: `const result = await fn().catch(() => defaultValue)` - Functional error handling

### General Patterns
- **Model data explicitly**: Don't make parameters optional unless undefined is a valid use case
    - Bad: `loadShows(showNames?: string[])` when you always need show names
    - Good: `loadShows(showNames: string[])` or have separate functions for different cases
- **Immutability**: Always return new objects/arrays, don't mutate
- **Pure functions**: Prefer functions without side effects
- **Composition**: Build complex behavior by combining simple functions
- **No imperative loops**: Use functional array methods

### Module State - CRITICAL VIOLATION
- **NEVER store mutable state at module level** - This violates functional programming principles
- **Bad pattern**: `let embedder: any = null; const getEmbedder = async () => { if (!embedder) { embedder = ...; } }`
- **Good pattern**: Pass dependencies explicitly as parameters or use dependency injection patterns
- **Good pattern**: Create factory functions that return configured instances
- **Module-level state makes testing impossible**, creates hidden dependencies, and breaks function purity
- **Always prefer explicit parameter passing** over module-level caching or singletons

### Comments
- **DO NOT ADD COMMENTS** unless explicitly requested by the user
- **Never write comments that describe what the code does** - the code should be self-documenting
- **Bad pattern**: `// Delete manifest file` above `await fs.unlink(manifestPath)`
- **Bad pattern**: `// Read files to delete` above `await fs.readFile(markedForDeletionPath)`
- **Good pattern**: No comments - let the code speak for itself

### Code Quality Standards
- **Parse data structures properly** - Don't guess or extract from filenames when the data is available
- **Use the right data source** - If manifest files contain file paths, read and parse them
- **Functional composition** - Chain operations with `.then()`, `.catch()`, `.map()`, `.filter()`
- **Avoid unnecessary complexity** - Simple, direct solutions over clever extraction patterns
- **Example**: Parse manifest JSON to get file paths, don't regex-extract transaction IDs from filenames