# @speckub/cli

**Your code. Your specs. Every branch.**

SpecKub helps your coding agent discover HTTP APIs, map service relationships,
and maintain detailed Markdown contracts. The CLI installs the workflow and
provides deterministic discovery and structure/source-reference checks. The agent
reads your implementation across languages and frameworks and reports coverage gaps.

## Version availability

| Capability                                      | `0.1.1`      | `0.1.2`   |
| ----------------------------------------------- | ------------ | --------- |
| `init`, `scan`, `list`, `inspect`, `validate`   | Available    | Available |
| Six documentation skills and editable templates | Available    | Available |
| `ui` standalone website export/preview          | Not included | Available |

Version `0.1.2` adds the standalone reader, updated installation and workflow
documentation, and explicit package descriptions. Upgrade the CLI to use `ui`.

## Install in your project

Requires Node.js 22 or newer. Your application can use another language; installing
the CLI does not require changing it to JavaScript. Run from the project root:

```sh
npm install --save-dev @speckub/cli@0.1.2
npx speckub init --agent codex
```

For Yarn projects:

```sh
yarn add --dev @speckub/cli@0.1.2 --registry https://registry.npmjs.org
yarn speckub init --agent codex
```

Core and schema are included as dependencies. Installing `@speckub/schema` alone
does not install the CLI. `npm run @speckub` is not a package-execution command.

For a global installation instead:

```sh
npm install --global @speckub/cli@0.1.2
speckub init --agent codex
```

Or initialize without adding a project dependency:

```sh
npx @speckub/cli@0.1.2 init --agent codex
```

Choose `--agent claude`, `--agent cursor`, or `--agent all` for other integrations.
Open your coding agent in the directory where the files were initialized.
Initialization creates scaffolding; it does not scan your source or create specs.
Existing instructions, skills, command files, templates, and examples are preserved.
Without `--agent`, init creates the docs directory and editable template/example.

## Run the agent workflow

Run these **in your agent chat**, one at a time, reviewing each result:

| Step                 | Codex                         | Claude / Cursor entrypoint    | Output                                                     |
| -------------------- | ----------------------------- | ----------------------------- | ---------------------------------------------------------- |
| Template (optional)  | `$speckub-template`           | `/speckub.template`           | `.speckub/templates/api.md` and `.speckub/examples/api.md` |
| Scan                 | `$speckub-scan api/`          | `/speckub.scan api/`          | `.speckub/scan.md` inventory; no endpoint docs             |
| Relations            | `$speckub-relations`          | `/speckub.relations`          | `.speckub/relations.md` with evidence and diagram          |
| Create               | `$speckub-create`             | `/speckub.create`             | `docs/api/**/*.md` endpoint contracts                      |
| AI review (optional) | `$speckub-validate`           | `/speckub.validate`           | `.speckub/validation.md` findings                          |
| Clarify (optional)   | `$speckub-clarify <feedback>` | `/speckub.clarify <feedback>` | Targeted corrections and explicit unknowns                 |

Supply a natural-language prompt, HTTP prefix, source/service directory, or file
as scope. With no scope, scan inspects the selected root and later skills consult
its inventory; confirm the scope before changing services. Clarify can correct
inventory or relationships before docs exist, as well as documents afterward.

SpecKub installs portable skills under `.agents/skills/`, plus command entrypoints
under `.claude/commands/` and `.cursor/commands/` for selected agents. Command
availability depends on your host. In Codex, use the `$speckub-*` skill names;
Cursor command files do not register `/speckub.scan` as a Codex slash command.
If discovery fails, verify the agent's working directory and restart it if needed,
or explicitly ask it to read `.agents/skills/speckub-scan/SKILL.md`.

The terminal command below only prepares skills/templates and prints a prompt to
send to your agent. It does not invoke a model or generate endpoint docs:

```sh
npx speckub scan --root /path/to/project
```

`scan --dry-run` previews installation without writing; `--json` returns the
installation results and handoff prompt. Free-text scope belongs in agent chat,
not as an unsupported terminal positional argument.

## Customize your documents

Edit `.speckub/templates/api.md` and `.speckub/examples/api.md` directly, or use:

```text
$speckub-template Use concise docs with detailed errors and sequence diagrams
$speckub-template Follow the style in docs/reference-api.md
```

Claude/Cursor use `/speckub.template`. Explicit user instructions take precedence
over the project layout, which takes precedence over bundled defaults. Required
HTTP frontmatter and source-evidence rules stay in effect. `{{...}}` placeholders
are instructions for the agent, not an executable template language.

The template/example live outside endpoint discovery. Examples illustrate style,
not actual repository behavior. Template changes do not rewrite existing specs;
use create/clarify for selected docs. Reinitialization preserves customizations,
so merge updated skill guidance manually when an existing file is skipped.

Detailed specs cover requests, responses, authentication, errors, business rules,
relationships, source-backed Mermaid sequence diagrams, examples, limits, evidence,
and uncertainties. The agent reviews completeness; the CLI does not enforce every
Markdown section or prove the diagram matches runtime behavior.

## Inspect and validate in your terminal

```sh
npx speckub list
npx speckub inspect <endpoint-id>
npx speckub validate --id <endpoint-id> --json
```

Replace `<endpoint-id>` with an ID returned by `list`. Yarn users can replace
`npx speckub` with `yarn speckub`. A bare `speckub` shell command requires a global
installation or a package-manager script environment that resolves the local bin.

Common options: `--root DIR`, `--docs-dir DIR` (default `docs/api`), and `--json`.
Exit codes: 0 success, 1 validation/runtime error, 2 usage error. `validate` needs
`--id`; it is separate from the optional AI review skill. Its semantic check stays
`skipped`. CLI structure/reference checks, AI review, runtime tests, and Mermaid
rendering should be reported separately.

## Nested API projects

If the CLI is installed in a parent repository and the API is under `portfolio-api/`:

```sh
yarn speckub init --root portfolio-api --agent all
code -n portfolio-api
```

Start the agent inside that initialized service, then use its skill names. Merely
opening a child source file in the parent workspace does not change the agent's
root. Alternatively, explicitly load the child skill file and specify its root.

Run terminal checks from the parent:

```sh
yarn speckub list --root portfolio-api
yarn speckub validate --root portfolio-api --id <endpoint-id>
```

The [nested-project guide](https://github.com/ipondnakab/speckub/blob/c16ca5f2792623bcf0d667a22aa965dc2b4c2e78/docs/user-story.md#nested-api-project)
explains the complete workflow and fallback invocation.

## Standalone web reader

From your initialized project, with CLI `0.1.2` or newer installed:

```sh
npx speckub ui --serve
```

For your private repository:

```sh
npx speckub ui --root /path/to/project --out .speckub/site --serve --port 4173
```

Open the printed loopback URL. Without `--serve`, open the generated `index.html`
or serve the entire output directory on a host you control. The reader includes
endpoint/content search, method filters, section navigation, tables, code, and
bundled Mermaid Tiny diagrams with a source fallback. Invalid/duplicate specs
fail export; an empty docs directory yields an empty-state page.

`--docs-dir DIR` changes the input. `--out DIR` must be a dedicated directory
inside the project without docs overlap or symlinked output paths. Nonempty
unowned directories are refused; rebuilding an owned reader replaces generated
assets. `--port 0` chooses a free loopback port and requires `--serve`. `--json`
returns output details. Stop preview with Ctrl+C. Rebuild after spec changes;
the site is a snapshot, not a watcher or an interactive API client.

### Private repository access

Generation does not publish, deploy, or call an AI service. Assets are bundled
without a CDN or analytics. Source files and environment files are not copied;
spec bodies and source-reference paths are included. Add the output directory
to your project's ignore rules if exports should not be committed.

The preview binds to `127.0.0.1` and serves generated assets only. The export has
no built-in authentication: configure access controls on your chosen host. A
private repo does not make a separately hosted export private. All selected specs
are included, even those hidden by search filters; filtering is not authorization.

Raw HTML is escaped, remote Markdown images are not loaded, and unexported local
file links are disabled. Mermaid uses strict mode; Tiny omits some specialized
diagram/layout types. Export tests do not prove browser rendering or API behavior.

## Guides and examples

- [Project and user-story guide](https://github.com/ipondnakab/speckub/blob/c16ca5f2792623bcf0d667a22aa965dc2b4c2e78/docs/user-story.md)
- [Agent integrations](https://github.com/ipondnakab/speckub/blob/c16ca5f2792623bcf0d667a22aa965dc2b4c2e78/packages/agent-adapters/README.md)
- [API document standard](https://github.com/ipondnakab/speckub/blob/c16ca5f2792623bcf0d667a22aa965dc2b4c2e78/packages/cli/templates/skills/speckub-create/references/api-document.md)
- [Sequence diagram guidance](https://github.com/ipondnakab/speckub/blob/c16ca5f2792623bcf0d667a22aa965dc2b4c2e78/packages/cli/templates/skills/speckub-create/references/sequence-diagrams.md)
- [Runnable API playground](https://github.com/ipondnakab/speckub/tree/c16ca5f2792623bcf0d667a22aa965dc2b4c2e78/examples/node-api)
- [Release guide](https://github.com/ipondnakab/speckub/blob/c16ca5f2792623bcf0d667a22aa965dc2b4c2e78/docs/npm-release.md)

## License

Apache-2.0. See the license included in the package.
