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
