# Release Process

Automated releases powered by semantic-release and conventional commits.

## Release Strategy

**Trunk-based development** - Every merge to `main` automatically publishes a new version to npm.

## Commit Message Format

All commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Scopes

The scope indicates which package is affected. This is **required** and used by semantic-release to determine which packages to version and publish:

- `sylph-jsx` - Core library package
- Add more package scopes as you add publishable packages to the monorepo

**Examples:**
```bash
feat(sylph-jsx): add createAsyncEffect hook
fix(sylph-jsx): prevent memory leak in ticker cleanup
docs(sylph-jsx): update API documentation
```

**Important:** Commits affecting multiple packages should use separate commits, one per package:
```bash
feat(sylph-jsx): add new reactive primitive
feat(sylph-devtools): add inspector UI for new primitive
```

Commits without a scope or with an unrecognized scope will not trigger a release.

### Types

- `feat:` - New feature (triggers **minor** version bump)
- `fix:` - Bug fix (triggers **patch** version bump)
- `perf:` - Performance improvement (triggers **patch** version bump)
- `refactor:` - Code refactoring (triggers **patch** version bump)
- `chore:` - Maintenance tasks (triggers **patch** version bump)
- `docs:` - Documentation changes (triggers **patch** for README scope)
- `test:` - Adding or updating tests (no release)
- `ci:` - CI/CD changes (no release)
- `style:` - Code style changes (no release)
- `build:` - Build system changes (no release)

### Breaking Changes

To trigger a **major** version bump, use one of these:

```bash
feat(sylph-jsx)!: breaking change in feature
# or
feat(sylph-jsx): description

BREAKING CHANGE: explanation of breaking change
```

### Examples

```bash
feat(sylph-jsx): add createAsyncEffect hook
fix(sylph-jsx): prevent memory leak in ticker cleanup
perf(sylph-jsx): optimize sprite batch rendering
docs(sylph-jsx): update installation instructions
refactor(sylph-jsx): simplify event handler logic
chore(sylph-jsx): update dependencies
```

## Workflow

1. Make changes with properly scoped conventional commits
2. Create a PR and merge to `main`
3. semantic-release automatically:
   - Analyzes commits to determine version bump
   - Updates package.json and CHANGELOG.md
   - Creates git tag (e.g., `sylph-jsx-v0.1.2`)
   - Publishes to npm
   - Commits version changes back to `main` with `[skip ci]`
   - Creates GitHub release with changelog

Version format: `x.y.z` (e.g., `0.1.0`, `0.1.1`, `0.2.0`)
