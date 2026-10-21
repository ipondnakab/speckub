# npm release preparation

This repository contains three public npm packages at version `0.1.0`:

1. `@speckub/schema`
2. `@speckub/core` (depends on schema)
3. `@speckub/cli` (depends on core)

## Prerequisites

- Confirm the `@speckub` npm organization/scope is available and the publisher has permission to publish packages in that scope.
- Configure npm trusted publishing for each package to authorize GitHub repository `ipondnakab/speckub` and workflow `npm-publish.yml`. Trusted publishing must be supported by the npm/pnpm versions in the runner; otherwise revise the workflow to use a secure supported authentication method.
- Create a protected GitHub Actions environment named `npm-release` and require manual approval.
- Review versions and changelog before publishing. The workflow currently targets `0.1.0`; bump versions and the confirmation string together for future releases.

## Dry-run

Run **Actions → Publish npm packages → Run workflow** with the default `dry-run` confirmation. It runs frozen-lockfile installation, lint, typecheck, tests, build and package archive inspection without publishing.

## Publish

After reviewing the dry-run and package archives, invoke the workflow with `publish-0.1.0`. It publishes schema, core and CLI in dependency order. **This is a real external release**; do not invoke without approval.

## Local package smoke test

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm --filter @speckub/cli pack
```

Check that the CLI tarball includes `dist/bin.js`, `dist/init.js` and `templates/AGENTS.md`. Workspace protocol dependencies are converted to semver ranges in packed manifests.

This PR prepares publishing; no packages have been published by this change.
