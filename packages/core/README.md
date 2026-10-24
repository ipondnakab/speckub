# @speckub/core

**Discover API docs across a repository and check their contracts and references.**

SpecKub keeps API documentation as Git-versioned Markdown. Your coding agent
reads source code to discover endpoints, map relationships, and create detailed
specs. Core provides deterministic filesystem discovery and validation for the
CLI and integrations.

## Start with the complete workflow

**User story:** “Each service owns its API docs. I want one API inventory and a
reader for the whole repository, while keeping docs beside each service.”

Install [@speckub/cli](https://www.npmjs.com/package/@speckub/cli), which includes
core and schema. Requires Node.js 22+:

```sh
npm install --save-dev @speckub/cli@0.1.3
npx speckub init --agent codex
```

In your coding agent's chat, run one step at a time and review the output:

```text
$speckub-scan Discover the HTTP APIs in this repository.
$speckub-relations Map API and service interactions from source evidence.
$speckub-create Write detailed contracts using our project template.
```

Then return to the terminal:

```sh
npx speckub list
npx speckub ui --serve
```

Version `0.1.3` finds specs across the selected root, including documents outside
`docs/api`. Open the printed reader URL. For Claude/Cursor, initialize with their
agent name and use `/speckub.scan`, `/speckub.relations`, and `/speckub.create`.
The agent performs source discovery and writing; terminal `scan` only prepares
skills and a handoff prompt.

## Use cases for the core library

| Situation                                           | Core provides                                        |
| --------------------------------------------------- | ---------------------------------------------------- |
| Build an API catalog from distributed Markdown docs | Endpoint metadata and repository-relative file paths |
| Add structural checks to a CI script                | Structured reports and deterministic error counts    |
| Catch conflicting endpoint IDs across services      | Duplicate-ID discovery issues                        |
| Check cited implementation files after a refactor   | Missing/outside-root source-reference errors         |
| Limit checks to one service                         | An optional document-directory argument              |

Core does not execute application code or contact API endpoints. It does not
provide an executable by itself; use the CLI for terminal commands.

## Install and use programmatically

```sh
npm install @speckub/core@0.1.3
```

Run this as an ES module in a repository containing SpecKub docs:

```js
import { discoverEndpoints, validateEndpoint } from '@speckub/core';

const discovery = await discoverEndpoints(process.cwd());
console.log(
  discovery.endpoints.map(({ file, spec }) => ({
    id: spec.id,
    method: spec.method,
    path: spec.path,
    file,
  })),
);
console.error(discovery.issues);

const first = discovery.endpoints[0];
if (first) {
  const report = await validateEndpoint(process.cwd(), first.spec.id);
  console.log(JSON.stringify(report, null, 2));
  if (report.status === 'failed') process.exitCode = 1;
}
if (discovery.issues.length) process.exitCode = 1;
```

An empty inventory is not proof of complete API coverage; source discovery is the
agent's job. A validation report distinguishes structural checks from source
references and always reports semantic checking as `skipped`.

## Discovery rules in 0.1.3

- The default search root is the repository; the optional second argument narrows
  it, for example `discoverEndpoints(root, 'services/payments')`.
- New endpoint documents use YAML `speckub: true`, `specVersion: 1`, and the HTTP
  contract fields. Valid legacy unmarked specs remain supported.
- Unrelated Markdown and `speckub: false` templates/examples are skipped.
- Invalid candidates and duplicate IDs are returned as issues with file paths.
- Missing explicit search directories throw errors; no specs yields an empty list.
- Symlinks are skipped; search directories and source references must stay within
  the selected root. Source references stay root-relative regardless of doc location.

The walker skips dependency/build/tooling directories: `.git`, `node_modules`,
`.pnpm-store`, `dist`, `build`, `coverage`, `.next`, `.nuxt`, `.turbo`, `.cache`,
`vendor`, `.venv`, `venv`, `.speckub`, `.agents`, `.claude`, `.cursor`, and `.codex`.
An explicit directory can select one of these as the search root. `.gitignore` is
not interpreted. `discoverEndpoints(root, '.', { excludeDirs: ['reader'] })`
adds repository-relative exclusions, such as a generated reader directory.

Use service-qualified IDs when two services would otherwise share one ID. For
independent nested projects with their own source-relative paths, select each
project's root with `--root` in the CLI or the first library argument.

## Custom templates and review

Teams can customize `.speckub/templates/api.md` or use the template skill. The
Markdown body can use team-specific headings, field tables, and Mermaid diagrams;
the required HTTP frontmatter contract remains stable. Core checks metadata and
references, not section names or prose completeness. For source-to-document
review, use the optional AI validate skill and your application's tests.

## Learn more

- [CLI walkthrough, use cases, and local reader](https://www.npmjs.com/package/@speckub/cli)
- [Schema and Markdown format](https://www.npmjs.com/package/@speckub/schema)
- [User-story guide](https://github.com/ipondnakab/speckub/blob/main/docs/user-story.md)

Apache-2.0.
