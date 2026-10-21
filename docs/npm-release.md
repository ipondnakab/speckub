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

## First publication and Trusted Publishing

**Important:** npm Trusted Publishing can only be configured for packages that already exist on npm. For a brand-new `@speckub/*` package, first publish `0.1.0` using an authorized npm maintainer with 2FA, after reviewing the package archives. This is an external, irreversible publication step requiring explicit approval. Do **not** trigger `publish-0.1.0` on the GitHub workflow until this bootstrap is complete and a future version is prepared.

After the first publication, configure Trusted Publisher individually for all three packages in npm → Package → Settings → Trusted Publisher:

- GitHub owner: `ipondnakab`
- Repository: `speckub`
- Workflow filename: `npm-publish.yml`
- GitHub environment: `npm-release` (must match exactly)
- Allow direct `npm publish` if using this workflow.

npm requires a successful first OIDC publish within two days of configuring each trust relationship. Prepare the next version and its review before enabling trust. The workflow installs an OIDC-capable npm CLI and publishes previously inspected tarballs using `npm publish`. Keep the protected GitHub environment and require reviewers.

**Do not attempt to republish version 0.1.0.** npm versions are immutable once published. Bump all package versions, update the lockfile and confirmation gate, and run a new dry-run before a subsequent OIDC release.

Reference: https://docs.npmjs.com/trusted-publishers/

## First release: preflight (safe; does not publish)

Run on a trusted local computer with Node.js 22 and pnpm 9, from a fresh clone of `main` **after** the release-readiness PR is merged:

```sh
node --version
npm --version
npm whoami
npm org ls speckub
git status --short
pnpm install --frozen-lockfile
pnpm lint && pnpm typecheck && pnpm test && pnpm build
bash .github/scripts/verify-packages.sh
npm view @speckub/schema@0.1.0 version
npm view @speckub/core@0.1.0 version
npm view @speckub/cli@0.1.0 version
```

The `npm view` commands are **read-only**. A 404 for a new package/version is expected; any existing version must be investigated before release. Confirm the tarballs contain no secrets or unintended files and the CLI starts correctly when installed from the tarball. The `npm org ls` command verifies team membership, not necessarily publish rights; check your owner/team permissions in the npm website.

**STOP after the preflight.** Record the three tarball names, test results and scope permissions, then obtain explicit approval before any `npm publish` action. Do not store npm tokens in GitHub or share credentials in chat.

### Manual first-publication handoff (do not run during preflight)

Once the owner explicitly authorizes a real public release, use an authenticated npm CLI session with 2FA to publish the three *inspected tarballs*, in dependency order (schema → core → CLI), from a trusted local machine. Do not rely on the GitHub OIDC workflow for brand-new packages without first verifying that npm supports the chosen bootstrap path. Verify each package on the registry after publication and never attempt to reuse an already-published version.

**Release gate:** The workflow confirmation string is not a substitute for human approval. Keep `npm-release` protected with required reviewers before enabling the workflow's publish path.
