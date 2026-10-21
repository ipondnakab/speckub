# SpecKub

**Your code. Your specs. Every branch.**

Language-agnostic, Markdown-first API specification tooling designed to work with existing AI coding agents.

## Available packages

- `packages/schema` — versioned API specification contract
- `packages/core` — deterministic endpoint discovery and validation
- `packages/cli` — `list`, `inspect`, `validate` commands
- `packages/agent-adapters` — editable Codex, Claude Code and Cursor instruction templates
- `apps/web` — future branch-aware documentation viewer

## Development

Requires Node.js 22 and pnpm 9.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Try the CLI

```sh
node packages/cli/dist/bin.js list --root examples/spring-boot
node packages/cli/dist/bin.js inspect users.get-by-id --root examples/spring-boot
node packages/cli/dist/bin.js validate --id users.get-by-id --root examples/spring-boot --json
```

The example spec may reference source files that do not exist; a failed reference check is expected until those files are supplied. Semantic AI validation is not implemented.

## AI coding agents

Use the templates in [packages/agent-adapters](packages/agent-adapters/README.md) to onboard Codex, Claude Code or Cursor. Review and merge instructions into existing agent files rather than overwriting them.

## Status

Early development. Packages are not yet published to npm; the public viewer is planned.

## License

Apache-2.0. See [LICENSE](LICENSE).
