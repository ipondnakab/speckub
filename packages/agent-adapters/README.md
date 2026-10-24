# AI-agent onboarding

SpecKub works with existing coding agents through portable skills, editable instructions, and host-specific command entrypoints. The CLI installs project-local files; it does not invoke a model.

| Agent       | Template                             | Target in your repository   |
| ----------- | ------------------------------------ | --------------------------- |
| Codex       | [AGENTS.md](templates/AGENTS.md)     | `AGENTS.md`                 |
| Claude Code | [CLAUDE.md](templates/CLAUDE.md)     | `CLAUDE.md`                 |
| Cursor      | [speckub.mdc](templates/speckub.mdc) | `.cursor/rules/speckub.mdc` |

## Installation

1. Install `@speckub/cli` as a development dependency in the project.
2. Run `npx speckub init --agent codex|claude|cursor|all`, choosing one value.
3. Open the initialized project folder in your agent and verify skill discovery.
4. In Codex select `$speckub-scan`; Claude/Cursor command entrypoints use `/speckub.scan`.
5. Review scan output, map relations, then create docs. AI review and correction are optional.

Existing instructions and skills are preserved. Merge updates manually when a file
is skipped. Manual template copying remains possible, but does not install the
workflow skills by itself. See the [user story and nested-project troubleshooting](../../docs/user-story.md).

## AI documentation skills

`init --agent ...` installs the six portable skills in `.agents/skills/`, plus
slash-command files for the selected Claude/Cursor integrations. Existing files
are preserved. For agents without discovery, explicitly read the skill file.

| Workflow                             | Skill                                                                   | Responsibility                                 |
| ------------------------------------ | ----------------------------------------------------------------------- | ---------------------------------------------- |
| `/speckub.template [design request]` | [speckub-template](../cli/templates/skills/speckub-template/SKILL.md)   | Design project-local templates and examples    |
| `/speckub.scan [scope]`              | [speckub-scan](../cli/templates/skills/speckub-scan/SKILL.md)           | Source-backed API inventory only               |
| `/speckub.relations [scope]`         | [speckub-relations](../cli/templates/skills/speckub-relations/SKILL.md) | API/service relationship mapping before create |
| `/speckub.create [scope]`            | [speckub-create](../cli/templates/skills/speckub-create/SKILL.md)       | Create/update API documents                    |
| `/speckub.validate [scope]`          | [speckub-validate](../cli/templates/skills/speckub-validate/SKILL.md)   | Optional AI source review                      |
| `/speckub.clarify [correction]`      | [speckub-clarify](../cli/templates/skills/speckub-clarify/SKILL.md)     | Optional user-directed corrections             |

Scope may be a prompt, route prefix, service directory, or specific file. Skills
adapt to the repository's framework/language and report uncertain discovery.
Codex skill invocation uses `$speckub-template`, `$speckub-scan`, `$speckub-relations`, `$speckub-create`, `$speckub-validate`,
and `$speckub-clarify`. Slash command availability depends on the host agent.
Terminal `speckub scan` prepares skills and prints a handoff prompt; AI runs in
the user's agent. See the [CLI workflow guide](../cli/README.md).

## Boundaries

The templates provide workflow instructions only. They do not connect to a remote model API, modify agent settings automatically, or guarantee that code matches its specification. Semantic checks remain unimplemented.
