# Using SpecKub in an existing project

> As a developer joining or maintaining an existing repository, I want my coding
> agent to discover APIs, map their relationships, and generate detailed Markdown
> contracts so my team can understand and maintain behavior with source evidence.

The target repository can use different languages and frameworks. Node.js 22 or
newer runs the CLI; the coding agent interprets application source. There is no
fixed parser allowlist, and unresolved routes remain explicit coverage gaps.
This version's structured contract is for HTTP endpoints, not arbitrary feature,
UI, event, or architecture specification types.

## Install in the project

Run from the directory that should own `.agents/`, `.speckub/`, and `docs/api/`:

```sh
npm install --save-dev @speckub/cli@0.1.4
npx speckub init --agent codex
```

Or use Yarn consistently with an existing Yarn project:

```sh
yarn add --dev @speckub/cli@0.1.4 --registry https://registry.npmjs.org
yarn speckub init --agent codex
```

The CLI brings core and schema dependencies; installing `@speckub/schema` alone
does not install the `speckub` command. Use `--agent all` to install the supported
integrations together. Initialization creates editable files and a docs directory,
not endpoint documentation. Repeating initialization preserves existing files,
including customized instructions, skills, commands, templates, and examples.

## Open the agent in the initialized directory

Open that directory as the workspace and start an agent session there. The
examples below use **Codex skill names**. Claude/Cursor command entrypoints use
`/speckub.scan` instead of `$speckub-scan`, with the equivalent names for other
skills. These are agent-chat invocations, not terminal commands.

For Codex, type `$` or use `/skills` to select an available skill. Repository
skill discovery searches `.agents/skills` from the agent's working directory
upward to the repository root; it does not discover every nested service below
the parent workspace. If a newly installed skill is missing, verify its location
and restart Codex if necessary. See the
[official OpenAI skill documentation](https://learn.chatgpt.com/docs/build-skills).

If automatic discovery remains unavailable, explicitly load the file:

```text
Read .agents/skills/speckub-scan/SKILL.md and follow it to scan this project.
Prepare the inventory only; do not create endpoint specs yet.
```

## 1. Design the template — optional

```text
$speckub-template Use detailed request and response tables, explicit error
conditions, API/service relationships, and Mermaid sequence diagrams.
```

Review `.speckub/templates/api.md` and `.speckub/examples/api.md`. The template
contains intentional placeholders and is not itself a valid endpoint document.
The example is illustrative, not evidence of your implementation. Neither lives
in the real spec discovery directory. Template design does not rewrite existing
endpoint specs; use a later create/clarify task for selected documentation changes.

## 2. Scan source into an inventory

```text
$speckub-scan api/
```

The agent follows routing and implementation evidence and writes
`.speckub/scan.md`. Review service identities, method/path pairs, source references,
existing spec IDs, and unresolved candidates. There should be no endpoint-doc
changes during scan. With no explicit scope, the skill inspects the selected root.

For an inventory question before creation:

```text
$speckub-clarify Check whether the contact endpoint handles OPTIONS through
shared middleware and correct the inventory using source evidence.
```

## 3. Map API and service relationships

```text
$speckub-relations
```

Review `.speckub/relations.md`: nodes, directed edges, source evidence, confidence,
conditions, and a Mermaid map. Internal modules, deployed services, external APIs,
and asynchronous events should remain distinguishable. No confirmed relationship
is a valid result for a simple endpoint. Inferred or unresolved edges must not
become confirmed connections merely to complete a diagram.

## 4. Create detailed specifications

```text
$speckub-create
```

Creation uses the confirmed inventory, relationship map, source, and project
layout. Confirm the agent is using the intended root and docs directory rather
than assuming omitted scope guarantees a particular service selection. For a
bounded task, pass a route prefix or source path explicitly.

Review the discovered endpoint files (new docs default to `docs/api/`) for contracts, fields, auth, success/error responses,
business behavior, relationships, sequence diagrams, examples, limits, and evidence.
Unknown details should stay explicit. Existing IDs and useful handwritten sections
should survive. Creation runs available deterministic CLI checks for changed IDs;
it reports unavailable tooling instead of claiming checks passed.

## 5. Review and correct — optional

```text
$speckub-validate docs/api/
```

Read `.speckub/validation.md` for source discrepancies and uncertainties. Review
reports findings; it does not automatically edit endpoint docs.

```text
$speckub-clarify Check the missing 429 response against the implementation.
Update the affected error table, example, and sequence diagram if supported.
```

Corrections can target inventory, relationships, or specs. If requested behavior
conflicts with code, document the distinction and resolve intent rather than
silently editing the application. AI review and clarification are optional steps.

## 6. Inspect and check through the CLI

In the initialized project, using its installed package:

```sh
npx speckub list
npx speckub inspect <endpoint-id>
npx speckub validate --id <endpoint-id> --json
```

Yarn users can replace `npx speckub` with `yarn speckub`. Obtain the ID from `list`;
`validate` requires `--id` in this version. CLI validation checks structure and
source references; semantic checks remain `skipped`. AI source review, Mermaid
rendering, and runtime tests are distinct activities with separate results.

Review the diff and commit selected specs, project templates, inventories, and
agent files according to your team's conventions. A documentation task does not
implicitly authorize application changes, deployment, or package publication.

## Read and share a private spec snapshot

After creating docs, developers can generate a local web reader using the `ui`
command included in CLI version `0.1.2`:

```sh
npx speckub ui --serve
```

Read the printed loopback URL. Search endpoint IDs, routes or body text, filter
by HTTP method, and open sections and sequence diagrams. No requests are made to
the application's APIs. Stop preview with Ctrl+C; `.speckub/site/` remains usable
as a static export. Rebuild to refresh it after documentation changes.

For a shared internal reader, host the entire generated directory behind your
organization's access controls. SpecKub does not deploy it or add authentication.
Source files are not copied, but spec bodies and source-reference paths are part
of the export; protect them as you would the documents in the private repository.
Local CLI export/server checks and browser-level rendering checks are distinct.

## Nested API project

For this layout:

```text
website/
  package.json
  node_modules/
  portfolio-api/
    api/
    package.json
```

If the CLI is installed in `website/`, initialize the service from that parent:

```sh
yarn speckub init --root portfolio-api --agent all
code -n portfolio-api
```

Start a new agent session in the `portfolio-api` workspace, then use
`$speckub-scan api/` in Codex. Merely selecting a child file in the parent window
is not the same as changing the agent's working directory. Running `cd` in an
existing terminal also does not establish the existing agent session's root.

For terminal checks from the parent folder:

```sh
yarn speckub list --root portfolio-api
yarn speckub validate --root portfolio-api --id <endpoint-id>
```

If the child agent cannot locate the parent-installed CLI, supply the local
invocation explicitly: `../node_modules/.bin/speckub`, with `--root .` when working
inside the service. Do not assume an unrelated global package is installed.

To stay in the parent agent workspace instead, explicitly ask it to read
`portfolio-api/.agents/skills/speckub-scan/SKILL.md`, select `portfolio-api` as the
root, and keep outputs there. This is a manual file-based invocation, not a claim
that the nested skill was automatically registered in that session.

## Updating docs after a code change

Run scan and relations for the affected scope, then create/clarify the selected
specs. Preserve unchanged IDs and unrelated content. Review potentially removed
endpoints before deleting documents; an unmatched spec is not proof of removal.
Do not assume implicit scope carry-over is deterministic application state:
inspect the inventory and pass scope explicitly when switching services/tasks.

## Acceptance criteria

- Setup works through the installed package without an absolute development path.
- Instructions distinguish terminal CLI commands from each agent's skill syntax.
- Skills are installed in the intended root; nested-workspace discovery is explained.
- Init preserves custom files; the template/example stay outside endpoint discovery.
- Scan creates only inventory; relations maps evidence before create writes specs.
- Generated contracts include relevant details and source-backed diagrams, with gaps visible.
- Review and corrections remain optional; changes preserve stable IDs and handwritten details.
- Repeated scoped runs do not imply permission to overwrite unrelated docs or application code.
- Reports distinguish structural checks, AI review, Mermaid rendering, and runtime tests.

## Troubleshooting

| Symptom                                 | Check / next action                                                                                                                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Agent says `/speckub.scan` is undefined | In Codex select `$speckub-scan`; inspect installed skill location and the agent's working directory. Cursor command files do not register a Codex slash command.                           |
| Skill missing in the parent workspace   | Open the initialized child project or explicitly load its skill by path.                                                                                                                   |
| `speckub` is not found in the shell     | Use `npx speckub` or `yarn speckub` from the package installation directory. Schema alone has no CLI.                                                                                      |
| `list` returns no endpoints             | Init and scan do not create specs. Run relations/create and check root/docs-directory selection.                                                                                           |
| Validation says endpoint not found      | Use the `id` from frontmatter/`list`, not a filename guessed as an ID.                                                                                                                     |
| Init skips files                        | Expected preservation behavior. Review and merge updated guidance manually; reinstalling does not replace custom files.                                                                    |
| npm reports 404 after a publication     | Package availability is not guaranteed immediately. Confirm the exact version/registry and accepted publish result; do not republish an accepted version just because a lookup is delayed. |

## Repository-wide reader workflow in 0.1.3

With version `0.1.3`, a team
can keep `services/users/contracts/get.md` beside its service and
`docs/payments/create.md` with shared docs. Each new endpoint has `speckub: true`
and the normal HTTP frontmatter. `speckub list` and `speckub ui --serve` find both;
`--docs-dir services/users` restricts the result. Existing valid unmarked specs
are still found. README files are ignored, and templates/examples use
`speckub: false` in the excluded `.speckub/` directory.

Create checks existing IDs throughout the root before writing new docs, retaining
existing locations. Invalid marked files and duplicate IDs block export with
file-specific errors. The full directory exclusions and upgrade guidance are in
[the CLI guide](../packages/cli/README.md#repository-wide-discovery-in-013).
Upgrade from `0.1.2` to use repository-wide default discovery.
