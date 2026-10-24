# npm release preparation

This repository contains three public npm packages at version `0.1.1`:

1. `@speckub/schema`
2. `@speckub/core` (depends on schema)
3. `@speckub/cli` (depends on core)

## Prerequisites

- Confirm the `@speckub` npm organization/scope is available and the publisher has permission to publish packages in that scope.
- Configure npm trusted publishing for each package to authorize GitHub repository `ipondnakab/speckub` and workflow `npm-publish.yml`. Trusted publishing must be supported by the npm/pnpm versions in the runner; otherwise revise the workflow to use a secure supported authentication method.
- Create a protected GitHub Actions environment named `npm-release` and require manual approval.
- Review versions and changelog before publishing. The workflow currently targets `0.1.1`; bump versions and the confirmation string together for future releases.

## Dry-run

Run **Actions → Publish npm packages → Run workflow** with the default `dry-run` confirmation. It runs frozen-lockfile installation, lint, typecheck, tests, build and package archive inspection without publishing.

## Publish

After reviewing the dry-run and package archives, invoke the workflow with `publish-0.1.1`. It publishes schema, core and CLI in dependency order. **This is a real external release**; do not invoke without approval.

## Local package smoke test

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm --filter @speckub/cli pack
```

Check that the CLI tarball includes `dist/bin.js`, `dist/init.js`, `dist/scan.js`, all six workflow skills, their references, and the editable document template/example. Run `bash .github/scripts/verify-packages.sh` after building to inspect all three archives. Workspace protocol dependencies are converted to semver ranges in packed manifests.

This PR prepares publishing; no packages have been published by this change.

## First publication and Trusted Publishing

**Important:** Verify each package exists on npm before relying on Trusted Publishing. If a package still requires its first publication, use an authorized npm maintainer with 2FA to publish the reviewed release candidate after explicit approval. Configure its Trusted Publisher only after bootstrap. Do **not** trigger `publish-0.1.1` until all three packages have the required trust configuration and the release has been explicitly approved.

After the first publication, configure Trusted Publisher individually for all three packages in npm → Package → Settings → Trusted Publisher:

- GitHub owner: `ipondnakab`
- Repository: `speckub`
- Workflow filename: `npm-publish.yml`
- GitHub environment: `npm-release` (must match exactly)
- Allow direct `npm publish` if using this workflow.

npm requires a successful first OIDC publish within two days of configuring each trust relationship. Prepare the next version and its review before enabling trust. The workflow installs an OIDC-capable npm CLI and publishes previously inspected tarballs using `npm publish`. Keep the protected GitHub environment and require reviewers.

**Do not attempt to republish version 0.1.0.** npm versions are immutable once published. Bump all package versions, update the lockfile and confirmation gate, and run a new dry-run before a subsequent OIDC release.

Reference: https://docs.npmjs.com/trusted-publishers/

## Version 0.1.1

All three packages release together at `0.1.1`. The root workspace remains private
at `0.0.0`; it is not published. Internal `workspace:^` dependencies pack as
`^0.1.1`. Package version numbers are not recorded in the lockfile for linked
workspace dependencies, so this version-only change does not require lockfile edits.

The release adds the agent workflow (scan, relations, create, optional validate
and clarify), a template-design skill, editable project templates/examples,
detailed API document guidance, and Mermaid sequence-diagram guidance. Existing
project customizations are preserved. Agent work runs in the user's coding agent;
the terminal scan command prepares the handoff. Structural validation remains
separate from AI review and Mermaid rendering.

The publish confirmation is `publish-0.1.1`, and inspected archives must be named
`speckub-schema-0.1.1.tgz`, `speckub-core-0.1.1.tgz`, and
`speckub-cli-0.1.1.tgz`. Preparing this version does not authorize publishing it.
