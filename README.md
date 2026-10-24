# SpecKub

**Your code. Your specs. Every branch.**

SpecKub is a Git-based API specification toolkit that helps your coding agent
discover APIs, map service relationships, and maintain detailed Markdown contracts.
It is designed for repositories across languages and frameworks: the agent reads
the implementation, while the CLI handles setup, spec discovery, and deterministic
structure/source-reference checks. Unresolved routing is reported as a coverage gap.

## Start in your project

Requires Node.js 22 or newer to run the CLI. The target project can use another
language; SpecKub does not require adding JavaScript application code.

```sh
npm install --save-dev @speckub/cli@0.1.2
npx speckub init --agent codex
```

For Yarn projects:

```sh
yarn add --dev @speckub/cli@0.1.2 --registry https://registry.npmjs.org
yarn speckub init --agent codex
```

Choose `--agent claude`, `--agent cursor`, or `--agent all` for other integrations.
Open your agent in the same project directory where SpecKub installed its skills.

## Agent workflow

The following are agent-chat invocations, not shell commands:

| Step                       | Codex                         | Claude / Cursor command files | Result                                   |
| -------------------------- | ----------------------------- | ----------------------------- | ---------------------------------------- |
| Design template (optional) | `$speckub-template`           | `/speckub.template`           | Editable layout and illustrative example |
| Scan                       | `$speckub-scan api/`          | `/speckub.scan api/`          | API inventory with evidence and gaps     |
| Relations                  | `$speckub-relations`          | `/speckub.relations`          | API/service relationship map             |
| Create                     | `$speckub-create`             | `/speckub.create`             | Markdown endpoint specs                  |
| AI review (optional)       | `$speckub-validate`           | `/speckub.validate`           | Findings against source                  |
| Clarify/correct (optional) | `$speckub-clarify <feedback>` | `/speckub.clarify <feedback>` | Targeted corrections                     |

Pass a prompt, HTTP route prefix, service directory, or specific file as scope.
Review each output before continuing. Command discovery depends on the host agent;
if necessary, explicitly ask it to read the installed `SKILL.md`.

**Using a nested service?** Installing into `portfolio-api/` does not make its
skills discoverable from an agent working in the parent folder. Follow the
[nested-project walkthrough and troubleshooting](docs/user-story.md#nested-api-project).

## What gets created

- `.agents/skills/` — six portable skills and supporting references.
- Agent instruction files and selected Claude/Cursor command entrypoints.
- `.speckub/templates/api.md` and `.speckub/examples/api.md` — editable layout and example.
- `.speckub/scan.md` — inventory produced by the scan skill.
- `.speckub/relations.md` — source-backed mapping produced by relations.
- `docs/api/**/*.md` — endpoint contracts produced by create.
- `.speckub/validation.md` — optional AI review findings.

Initialization installs scaffolding; it does not scan source or generate endpoint
specs. Existing files are preserved. The terminal `speckub scan` command prepares
skills and prints an agent handoff prompt; it does not invoke a model.

Generated specs cover requests, responses, authentication, errors, behavior,
relationships, sequence diagrams, examples, limits, evidence, and uncertainties.
Custom templates change layout; they do not authorize invented implementation details.

## Inspect and check specs

```sh
npx speckub list
npx speckub inspect <endpoint-id>
npx speckub validate --id <endpoint-id> --json
```

Terminal validation checks frontmatter and source references. Its semantic check
remains `skipped`; optional AI review, Mermaid rendering, and runtime testing are
separate. SpecKub does not guarantee universal endpoint coverage or runtime correctness.

## Read specs in a standalone website

Version `0.1.2` adds the `ui` command to export a local reader from your project:

```sh
npx speckub ui --serve
```

Search and filter endpoints, read detailed Markdown, and view Mermaid diagrams.
The generated `.speckub/site/` directory is a portable static snapshot with bundled
assets; no source files are copied or automatically published. A private repo's
access controls do not apply to a separately hosted export—configure access on
your chosen host. See the [reader guide](packages/cli/README.md#standalone-web-reader).

## Documentation

- [Detailed user story, acceptance criteria, and troubleshooting](docs/user-story.md)
- [CLI reference and custom templates](packages/cli/README.md)
- [Agent integrations](packages/agent-adapters/README.md)
- [Runnable Node API playground](examples/node-api/README.md)
- [API document standard](packages/cli/templates/skills/speckub-create/references/api-document.md)
- [Release preparation](docs/npm-release.md)

## Development

Requires Node.js 22 or newer and pnpm 9.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

The workspace contains `@speckub/schema`, `@speckub/core`, `@speckub/cli`, and agent
instruction templates. The managed branch-aware documentation viewer remains planned.
For source-checkout commands, use `node packages/cli/dist/bin.js` after building.

## License

Apache-2.0. See [LICENSE](LICENSE).
