# @speckub/cli

## AI documentation workflow

Initialize the integration for your agent:

```sh
speckub init --root /path/to/project --agent all
```

The agent workflow has six steps. The optional text can be a natural-language
request, HTTP route prefix, service/source directory, or a specific source/spec file.
With no scope, scan covers the selected repository; create uses confirmed inventory
entries, and validate reviews existing specs. Clearlify asks for feedback when none
was supplied.

| Agent command                                     | Purpose                                           | Output                                                     |
| ------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------- |
| `/speckub.template [design request or reference]` | Design a custom document template and example     | `.speckub/templates/api.md` and `.speckub/examples/api.md` |
| `/speckub.scan [scope or prompt]`                 | Discover APIs with AI across languages/frameworks | `.speckub/scan.md` inventory; no endpoint docs             |
| `/speckub.relations [scope or prompt]`            | Map API/service interactions before writing specs | `.speckub/relations.md` with edge table and Mermaid graph  |
| `/speckub.create [scope or prompt]`               | Create/update docs from inventory and source      | `docs/api/**/*.md`                                         |
| `/speckub.validate [scope or prompt]`             | Optional AI review against source                 | `.speckub/validation.md` findings                          |
| `/speckub.clarify [scope or correction]`          | Optional corrections after user review            | Targeted spec edits and unresolved questions               |

Examples in your agent chat:

```text
/speckub.scan api/
/speckub.relations
/speckub.create /api/chat
/speckub.validate docs/api/
/speckub.clarify /api/chat document the missing 429 response
```

Each skill adapts to the repository; unresolved routes and deployment behavior are reported
as coverage gaps, not guarantees of universal discovery.

`init --agent ...` installs all six portable skills under `.agents/skills/`.
Claude and Cursor integrations also install command entrypoints under
`.claude/commands/` and `.cursor/commands/`. Actual command discovery depends on
agent support; start a fresh session if needed. In Codex, invoke the skills as
`$speckub-scan`, `$speckub-relations`, `$speckub-create`, `$speckub-validate`, and `$speckub-clarify`.
Any agent can explicitly read the corresponding installed `SKILL.md` instead.
Existing skills, commands, and agent instructions are never overwritten.

For a terminal handoff without installing agent command entrypoints:

```sh
speckub scan --root /path/to/project
```

This prepares all six portable skills and prints a scan task prompt. It does not
invoke a model or generate docs. `--docs-dir DIR` selects the later documentation
directory; `--dry-run` previews skill installation without writing; `--json` returns
installation details and the prompt. The agent accepts the scope/prompt in chat,
not as terminal positional arguments.

Creation runs structural/reference checks with the CLI when available. Optional
AI `/speckub.validate` reviews source semantics separately from deterministic
terminal `speckub validate --id ID`; the latter still reports semantic checks as
`skipped`. Review does not edit specs automatically; clarify handles corrections.

Generated docs follow the [API document standard](templates/skills/speckub-create/references/api-document.md):
overview, contract, auth, request/response field tables, errors, behavior,
relationships, sequence diagram, examples, limits, and evidence/verification.
The standard includes a shared quality checklist for create, validate, and clarify.
Unknown details stay explicit rather than being guessed. These Markdown quality
criteria are reviewed by the agent; they are not new deterministic CLI checks.

Generated endpoint docs include a Mermaid `Request flow` sequence diagram when
source supports its ordering and participants. Creation uses the relationship map
for identities and source call sites for call order; AI validation reviews branches,
responses, and dependencies, and clarification keeps diagrams synchronized with
corrections. The CLI does not parse Mermaid. See the
[sequence diagram guidance](templates/skills/speckub-create/references/sequence-diagrams.md).

From a source checkout, build with `pnpm build` and replace `speckub` with
`node /absolute/path/to/speckub/packages/cli/dist/bin.js`.

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

## Customize the document layout

`init` seeds `.speckub/templates/api.md` and `.speckub/examples/api.md`, even without
an agent selection. Edit them directly or run this in your agent after installing
its integration:

```text
/speckub.template Use concise endpoint docs, detailed error tables, and sequence diagrams
/speckub.template Follow the style in docs/reference-api.md
```

Codex uses `$speckub-template`. The skill changes the template and illustrative
example, not existing endpoint specs. Then use `/speckub.create [scope]` to write
or update selected docs. Explicit user instructions take precedence over the
project template, which takes precedence over bundled layout defaults. Required
HTTP frontmatter and source-evidence rules remain unchanged. The `{{...}}` markers
are instructions for the agent, not a built-in executable rendering engine.
Examples remain outside the discovery directory and are not treated as real APIs.
Reinitialization preserves customized templates, examples, skills and commands;
existing installed skills may need manual merging to adopt new guidance.

## Initialize a project

```sh
node packages/cli/dist/bin.js init --root /path/to/project --agent all
```

`init` creates `docs/api/` and installs editable agent instruction templates for Codex (`AGENTS.md`), Claude Code (`CLAUDE.md`), and Cursor (`.cursor/rules/speckub.mdc`). Choose a single agent with `--agent codex`, `--agent claude`, or `--agent cursor`. Without `--agent`, the documentation directory and editable template/example files are created. Existing instruction files are **never overwritten**; review and merge them manually. `--json` produces a machine-readable list of created/skipped files.

This checkout prepares CLI version `0.1.1`. Use the built checkout to try these changes before an explicitly approved npm release.
