# @speckub/cli

Local CLI for inspecting and validating Git-backed Markdown API specifications.

```sh
pnpm install
pnpm build
node packages/cli/dist/bin.js list --root examples/spring-boot
node packages/cli/dist/bin.js inspect users.get-by-id --root examples/spring-boot
node packages/cli/dist/bin.js validate --id users.get-by-id --root examples/spring-boot --json
```

Options: `--root DIR` (defaults to current working directory), `--docs-dir DIR` (defaults to `docs/api`), `--json`.

Exit codes: `0` success, `1` validation/runtime error, `2` usage error. `validate` reports semantic verification as `skipped`, not `passed`.

**Note:** The example specification includes a source reference that may not exist; validation correctly fails until the referenced source file exists.

## Initialize a project

```sh
node packages/cli/dist/bin.js init --root /path/to/project --agent all
```

`init` creates `docs/api/` and installs editable agent instruction templates for Codex (`AGENTS.md`), Claude Code (`CLAUDE.md`), and Cursor (`.cursor/rules/speckub.mdc`). Choose a single agent with `--agent codex`, `--agent claude`, or `--agent cursor`. Without `--agent`, only the documentation directory is created. Existing instruction files are **never overwritten**; review and merge them manually. `--json` produces a machine-readable list of created/skipped files.

The CLI currently runs from a built checkout and is not published to npm.
