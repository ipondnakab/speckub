# SpecKub

**Your code. Your specs. Every branch.**

Language-agnostic, Markdown-first API specification tooling designed to work with existing AI coding agents.

## Status

Early development — Sprint 1 foundation. The CLI, schema and public viewer are planned, not yet published.

## Workspace

- `packages/schema` — versioned API specification contract (Issue #2)
- `packages/core` — parser and deterministic validator (Issue #3)
- `packages/cli` — CLI interface
- `packages/agent-adapters` — Codex, Claude Code, Cursor templates (Issue #4)
- `apps/web` — future Next.js viewer

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

## License

Apache-2.0. See [LICENSE](LICENSE).
