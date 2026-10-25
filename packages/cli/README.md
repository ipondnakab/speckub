# @speckub/cli

**Your code. Your specs. Every branch.**

SpecKub helps your coding agent discover HTTP APIs, map service relationships,
and maintain detailed Markdown contracts. The CLI installs the workflow and
provides deterministic discovery and structure/source-reference checks. The agent
reads your implementation across languages and frameworks and reports coverage gaps.

## Who is SpecKub for?

| Your situation                             | What you do                                                         | What you get                                                      |
| ------------------------------------------ | ------------------------------------------------------------------- | ----------------------------------------------------------------- |
| An existing API has little documentation   | Scan source, map relations, then create docs with your coding agent | Endpoint contracts with evidence, examples, and explicit unknowns |
| A teammate needs to understand a service   | Open the reader and follow source links/relationship descriptions   | A searchable API list and request-flow diagrams                   |
| Your team has a documentation standard     | Customize the template before creating docs                         | Your headings, tables, and terminology in Git-reviewable Markdown |
| A monorepo stores docs beside each service | Run discovery from the shared root                                  | One API list across document locations, with duplicate-ID checks  |
| A private project needs a portable reader  | Export with `speckub ui`                                            | A local static website; you choose whether and where to host it   |
| An endpoint changes during development     | Update its spec, validate references, and review the Git diff       | Code and documentation changes reviewed together                  |

## User story: document an existing API

“I maintain a service with working endpoints. I want a new teammate to understand
requests, responses, errors, and service calls without reading every handler.”

You need Node.js 22+ for the CLI and a coding agent with access to the project.
Your API can be written in any language; discovery uses the agent's source
understanding and reports unresolved routing. No SpecKub-hosted AI account is needed;
your chosen coding agent's access and usage requirements still apply.

### 1. Install and initialize — terminal

Run in the API project's root:

```sh
npm install --save-dev @speckub/cli@0.1.4
npx speckub init --agent codex
```

This installs skills and an editable template. Existing project files are preserved.
Use `--agent claude`, `--agent cursor`, or `--agent all` for another integration.
For a project without an npm manifest, you can instead install the CLI globally
with `npm install --global @speckub/cli@0.1.4` and run `speckub init --agent codex`.

### 2. Discover your API — agent chat

Open the coding agent in the initialized project. Send:

```text
$speckub-scan Find the HTTP APIs in this project. Report uncertain routes separately.
```

Review `.speckub/scan.md`: it lists candidates, source references, and coverage gaps.
For a smaller task, say `Scan only services/payments/` in the prompt.

### 3. Map calls, then create documents — agent chat

Run these one at a time and review the result of each:

```text
$speckub-relations Map the confirmed APIs to their callers and downstream services.
```

```text
$speckub-create Document the confirmed endpoints with request/response examples, errors, and sequence diagrams.
```

Relations produces `.speckub/relations.md`. Create writes endpoint Markdown files
(default `docs/api/`), preserves existing IDs and locations, and uses real source
evidence. Unknown behavior stays labeled as unknown. For Claude/Cursor, use
`/speckub.scan`, `/speckub.relations`, and `/speckub.create` instead of `$speckub-*`.
These are agent-chat instructions, not terminal commands.

### 4. Check and read — terminal

```sh
npx speckub list
npx speckub ui --serve
```

Open the printed URL to search endpoints and read the generated docs. To check one
endpoint, copy its ID from `list` and replace `YOUR_ENDPOINT_ID` below:

```sh
npx speckub validate --id YOUR_ENDPOINT_ID --json
```

Validation checks the contract structure and cited source files. Its semantic
check remains `skipped`; it does not prove implementation behavior. For an optional
AI source review, send `$speckub-validate` in your agent chat. Use
`$speckub-clarify` with a correction to update a selected document.

### 5. Review and keep docs with your code

Review the Markdown and Git diff, resolve uncertain details, and include the docs
in your normal pull request. Rebuild the reader after edits. When an endpoint
changes later, update its existing document and preserve its stable ID.

## Version availability

| Capability                                      | `0.1.1` | `0.1.2` | `0.1.3` |
| ----------------------------------------------- | ------- | ------- | ------- |
| Agent skills and custom templates               | Yes     | Yes     | Yes     |
| Standalone `ui` reader                          | No      | Yes     | Yes     |
| Repository-wide default spec discovery          | No      | No      | Yes     |
| Explicit discovery markers and template opt-out | No      | No      | Yes     |

## Reader improvements in 0.1.4

The offline reader now defaults to a compact list. Switch to Tree and set the
maximum visible layers (1–12) to browse deeply nested API routes without losing
endpoints. Your view preferences are saved locally. Both the header logo and
favicon use a transparent lightning cutout, and dropdown arrows have inset spacing.
Newly initialized projects also receive JSON request examples in their editable
API template. Existing custom templates are preserved.

After upgrading, rerun `speckub ui` to regenerate existing reader exports.

## Repository-wide discovery in 0.1.3

Version `0.1.3` discovers specs anywhere under `--root` for `ui`, `list`,
`inspect`, and `validate`. Versions through `0.1.2` defaulted to `docs/api`.
New specs use `speckub: true` in YAML frontmatter; legacy HTTP specs with
`specVersion` and valid endpoint metadata remain supported. Unrelated Markdown
is ignored. Marked invalid specs and duplicate IDs produce errors before export.
Use `speckub: false` for illustrative examples/templates that must not be listed.
Optional `tags` is an array of nonempty strings.

`--docs-dir DIR` limits discovery to a directory. Without it, `.md` files
(case-insensitive) are searched throughout the root. `init` and `scan` still use
`docs/api` as the default authoring destination. Existing specs stay in place.

Discovery skips symlinks and dependency/build/tooling directories: `.git`,
`node_modules`, `.pnpm-store`, `dist`, `build`, `coverage`, `.next`, `.nuxt`,
`.turbo`, `.cache`, `vendor`, `.venv`, `venv`, `.speckub`, `.agents`, `.claude`,
`.cursor`, `.codex`. UI also excludes its selected output. These exclusions do
not interpret `.gitignore`; use a narrower root/directory for a limited export.
An explicit `--docs-dir` can select an otherwise excluded directory as the root.

When upgrading, `init` preserves existing skills/templates. Merge the new
`references/discovery.md` guidance into customized skills and add the marker to
new/edited specs; existing valid unmarked documents do not need migration.

## Install in your project

Requires Node.js 22 or newer. Your application can use another language; installing
the CLI does not require changing it to JavaScript. Run from the project root:

```sh
npm install --save-dev @speckub/cli@0.1.4
npx speckub init --agent codex
```

For Yarn projects:

```sh
yarn add --dev @speckub/cli@0.1.4 --registry https://registry.npmjs.org
yarn speckub init --agent codex
```

Core and schema are included as dependencies. Installing `@speckub/schema` alone
does not install the CLI. `npm run @speckub` is not a package-execution command.

For a global installation instead:

```sh
npm install --global @speckub/cli@0.1.4
speckub init --agent codex
```

Or initialize without adding a project dependency:

```sh
npx @speckub/cli@0.1.4 init --agent codex
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

Custom templates may use any Markdown
section names and order, tables, and Mermaid diagrams. The reader renders that
body directly; it does not require the bundled headings. Keep the required HTTP
frontmatter fields. Store templates/examples with `speckub: false`; create uses
`speckub: true` in real endpoint output. Older custom templates without a marker
are preserved and remain usable—the agent adds the marker to generated specs.
Initialization does not execute templates or generate API documents.

The default template includes a JSON request example. Create fills it with
synthetic values matching the endpoint's fields, nested types, and validation
rules, and documents server defaults separately. Endpoints with no body say
`No request body`; non-JSON endpoints show their actual encoding. Existing custom
templates are preserved by init; use `$speckub-template Add JSON request examples
and explain actual defaults` to update your project's layout.

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

Common options: `--root DIR`, `--docs-dir DIR`, and `--json`. In `0.1.3`, discovery
searches the project root by default; `--docs-dir` narrows that scope.
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

The [nested-project guide](https://github.com/ipondnakab/speckub/blob/main/docs/user-story.md#nested-api-project)
explains the complete workflow and fallback invocation.

## Standalone web reader

From your project, with CLI `0.1.3` installed:

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
fail export; no discovered endpoints yields an empty-state page.

Use **View** in the sidebar to switch between **List** (the default) and **Tree**.
Tree view starts with **2** folder layers; set **Max tree layers** to any integer
from **1–12**. Routes below that limit remain listed under the last visible group.
Long labels abbreviate middle path segments; the full route is available in the
endpoint document and label tooltip. Search and method filters apply in both views.
The reader remembers view/depth on this browser when storage is available; file
exports and browsers that deny storage still work with in-memory settings.

`--docs-dir DIR` limits the input to that directory. `--out DIR` must be a dedicated directory
inside the project, outside any explicitly selected docs directory, without
symlinked output paths. For a repository-wide search, the output is excluded. Nonempty
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

- [Project and user-story guide](https://github.com/ipondnakab/speckub/blob/main/docs/user-story.md)
- [Agent integrations](https://github.com/ipondnakab/speckub/blob/main/packages/agent-adapters/README.md)
- [API document standard](https://github.com/ipondnakab/speckub/blob/main/packages/cli/templates/skills/speckub-create/references/api-document.md)
- [Sequence diagram guidance](https://github.com/ipondnakab/speckub/blob/main/packages/cli/templates/skills/speckub-create/references/sequence-diagrams.md)
- [Runnable API playground](https://github.com/ipondnakab/speckub/tree/main/examples/node-api)
- [Release guide](https://github.com/ipondnakab/speckub/blob/main/docs/npm-release.md)

## License

Apache-2.0. See the license included in the package.
