# AI-agent onboarding

SpecKub works with existing coding agents through editable instruction templates. These are **templates**, not automatically installed integrations.

| Agent | Template | Target in your repository |
| --- | --- | --- |
| Codex | [AGENTS.md](templates/AGENTS.md) | `AGENTS.md` |
| Claude Code | [CLAUDE.md](templates/CLAUDE.md) | `CLAUDE.md` |
| Cursor | [speckub.mdc](templates/speckub.mdc) | `.cursor/rules/speckub.mdc` |

## Installation

1. Copy the relevant template into your project at the target path above.
2. If the target file exists, **merge instructions manually**; do not overwrite it.
3. Adjust `docs/api` if your project stores specs elsewhere.
4. Install/build the SpecKub CLI and verify `speckub list` works in your project.
5. Ask the agent to inspect and update a real endpoint, then run `speckub validate --id <id>`.

## Boundaries

The templates provide workflow instructions only. They do not connect to a remote model API, modify agent settings automatically, or guarantee that code matches its specification. Semantic checks remain unimplemented.
