# Release Process

Automated releases powered by semantic-release and conventional commits.

## Release Strategy

**Dev Releases** - Automatic prerelease versions on every merge to `main`
**Stable Releases** - Manual release PR → review → merge → publish

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
- `docs:` - Documentation changes (triggers **patch** for README)
- `test:` - Adding or updating tests (no release)
- `chore:` - Maintenance tasks (no release)
- `ci:` - CI/CD changes (no release)
- `style:` - Code style changes (no release)

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
```

## Workflow

### Dev Releases

Merge to `main` → semantic-release publishes `x.y.z-dev.N` to npm `@dev` tag.

Package version in git stays at last stable release.

### Stable Releases

1. **Create**: Actions → Create Release PR → select package
2. **Review**: PR shows version bump + changelog
3. **Merge**: Auto-publishes to npm `@latest` + creates git tag
