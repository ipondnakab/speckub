# npm release preparation

## Current registry state

Version `0.1.3` is the last verified public release of schema, core, and CLI.
Version `0.1.4` is a candidate until publication and registry verification finish.
Never republish an accepted version.

## Candidate 0.1.4

The maintainer approved publicly publishing `@speckub/schema`, `@speckub/core`,
and `@speckub/cli` version `0.1.4`. This release includes the merged CLI reader
list/tree navigation, configurable tree layers, transparent logo and favicon,
dropdown spacing, and JSON request template improvements. The separate
`speckub-web` application is deployed independently and is not an npm package.

Manifests, archive checks, and the workflow confirmation use `0.1.4`.
Review and merge the release PR before publishing; do not merge automatically.
Publication approval is recorded, but npm browser authentication may still be
required. Regenerate existing reader exports after upgrading.

## Released 0.1.2

The approved release updated `@speckub/schema`, `@speckub/core`, and
`@speckub/cli` together to `0.1.2`. It includes the standalone `ui` reader,
renderer dependencies, npm-facing READMEs, and explicit package descriptions.
That release used `0.1.2` manifests and archives.
Downloaded registry archives matched the inspected release files by SHA-256.
A fresh npm installation verified all three versions plus CLI help, initialization,
listing, inspection, validation, and reader export. The published source is
commit `7370fbf3d3a28c13c2537cea30321bdc853e888b` in
[PR #16](https://github.com/ipondnakab/speckub/pull/16).

The maintainer explicitly requested a version bump and public npm publication.
Publication used the existing maintainer login and inspected local archives;
it did not trigger the production Actions workflow or merge a pull request.
PR #16 has since been merged into `main`. The next candidate uses the
`publish-0.1.4` gate; no production workflow has been dispatched for this candidate.

Changing a local README or `description` does not update the npm page. The reviewed
README and metadata must be included in a new approved package publication. Do not
create a token or attempt to overwrite an existing version to update documentation.

## Prepare later candidates

1. Review desired code/documentation through a pull request; never merge automatically.
2. Select a fresh version. Update each package being released, internal dependency
   expectations, archive checks, workflow tarball paths, and confirmation string.
3. Check registry availability for the exact candidate versions before publishing.
4. Build and inspect archives from the exact reviewed revision. Actions checks out
   `main`, so its source changes must be merged by the maintainer before that path.
5. Verify the intended npm publisher or per-package Trusted Publishing configuration.
6. Obtain explicit approval for the named packages and candidate versions.

The private workspace root stays at `0.0.0` and is not published. Internal
`workspace:^` dependencies pack as semver ranges derived from workspace package
versions. A version-only bump does not change the lockfile's linked workspace
entries, but dependency changes (including the reader renderers) require a matching
lockfile. Validate with a frozen-lockfile installation.

## Local checks and archive inspection

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
bash .github/scripts/verify-packages.sh
```

The script generates candidate archives labeled `0.1.4`. The workflow uses those same
archive names. Publish only the exact inspected archives after approval, and
never replace a package version already accepted by npm.

Inspect packed manifests for versions, explicit descriptions, repository metadata,
public access, license, engines, CLI bin, and converted internal dependency ranges.
Verify READMEs use npm installation commands and absolute repository links that
exist on the referenced revision. Clearly identify the version required for each
feature: `ui` requires `0.1.2` or newer; repository-wide default discovery
requires `0.1.3`.

The CLI archive should include:

- `dist/bin.js`, `dist/init.js`, `dist/scan.js`, and the new `dist/ui.js`.
- All six skills, document/diagram references, and editable template/example.
- Reader HTML, JavaScript, CSS, and redistribution notices.
- Runtime dependencies on core, Markdown-it, and Mermaid Tiny in its manifest.

Smoke-test a packed CLI in a temporary project, including initialization and reader
export. Confirm the reader is offline/self-contained and source files are not copied.
Record browser visual/diagram checks separately; a structural test does not prove
browser rendering. No packages should be published as part of these checks.

## GitHub release protection

Before a real Actions release, verify the `npm-release` environment allows only
branch `main`, requires the intended reviewer, and disables administrator bypass.
Keep self-review allowed if the sole reviewer also starts the workflow. Check that
the workflow identity and checked-out revision match the reviewed release source.
Do not create/merge a release or trigger production publishing as a documentation task.

## Trusted Publishing for subsequent releases

All three packages now exist, so configure trust individually for the next release.
The current trust settings have not been verified by this documentation check.

In each package's npm Settings → Trusted Publisher, use:

- GitHub owner: `ipondnakab`
- Repository: `speckub`
- Workflow filename: `npm-publish.yml` (filename only)
- GitHub environment: `npm-release`
- Direct `npm publish` allowed if retaining the repository's current publish commands

Use GitHub-hosted runners with npm CLI 11.5.1 or newer and Node 22.14.0 or newer.
Configure trust when the approved next release is ready: a new trust relationship
must complete its first successful publication within two days. Recreate expired
trust rather than assuming an old setup remains valid. See
[npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/).

If trust is not ready, an explicitly approved maintainer publication can use the
reviewed archives and interactive npm authentication/2FA. Publish schema, core,
then CLI, checking dependency availability before consumer installation. Do not
print or share authentication links, passwords, tokens, or 2FA codes.

## Post-publication verification

For each exact released version, confirm registry metadata and the intended tag,
then install the CLI in a fresh project and run `--help` and `init`. For a release
that includes `ui`, verify export and local preview as well. Do not infer completion
from a GitHub merge, successful CI, or only the npm website's cached listing.

An accepted publish may still be processing before it is installable. Recheck the
exact version with `npm view ... --prefer-online`; do not republish an accepted
version merely because an immediate lookup returns 404. Investigate prolonged
delays through npm's package/account notices and support.
