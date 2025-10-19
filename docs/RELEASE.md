# Release Process

This project uses automated releases powered by semantic-release and conventional commits.

## Overview

We have a **dual-track release strategy**:

1. **Dev Releases** - Automatic prerelease versions published on every merge to `main`
2. **Stable Releases** - Explicitly triggered by merging to the `release` branch

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

## Package Versioning

This monorepo uses **independent versioning** powered by `semantic-release-monorepo`:

- `sylph-jsx` - Versioned and published independently
- `sylph-examples` - Private package, not published

Each publishable package has its own `.releaserc.cjs` configuration that extends the shared base configuration at `.releaserc.base.cjs`.

**Key behavior:**
- **Dev releases** (on `main`): Version is published to npm but **not committed back** to git. The package.json version stays at the last stable release.
- **Stable releases** (on `release`): Version is published to npm **and committed back** to the repository.

### Adding a New Package

To add a new publishable package:

1. **Create the package** in `packages/your-package/`

2. **Add `.releaserc.cjs`** that extends the base config:
   ```javascript
   const baseConfig = require('../../.releaserc.base.cjs');

   module.exports = {
     ...baseConfig,
     tagFormat: 'your-package-v${version}',
   };
   ```

3. **Add to workflow matrix** in `.github/workflows/dev-release.yml` and `stable-release.yml`:
   ```yaml
   matrix:
     package:
       - sylph-jsx
       - your-package  # Add here
   ```

4. **Make commits with the package scope:**
   ```bash
   feat(your-package): initial implementation
   ```

The semantic-release-monorepo plugin will automatically skip packages without changes.

## CI/CD Requirements

### GitHub Secrets

- `NPM_ACCESS_TOKEN`


## Branch Strategy

- `main` - Primary development branch, auto-publishes dev releases
- `release` - Stable release branch, auto-publishes stable releases
- Feature branches - Branch from `main`, PR back to `main`
