# Node API playground

A dependency-free API with two SpecKub specifications and real source references.
Requires Node.js 22 or newer. Run the commands below from the SpecKub repository root.

## Build and check the CLI

```sh
pnpm install --frozen-lockfile
pnpm build
node packages/cli/dist/bin.js list --root examples/node-api
node packages/cli/dist/bin.js inspect users.get-by-id --root examples/node-api --json
node packages/cli/dist/bin.js validate --id health.get --root examples/node-api --json
node packages/cli/dist/bin.js validate --id users.get-by-id --root examples/node-api --json
```

`list` should show `health.get` and `users.get-by-id`. Both validation reports
should have status `passed`, structural and reference checks `passed`, and
semantic checks `skipped`. Validation does not execute or prove the API behavior.

## Run the API

```sh
node examples/node-api/server.mjs
```

In another terminal:

```sh
curl http://127.0.0.1:3100/health
curl http://127.0.0.1:3100/api/users/1
curl -i http://127.0.0.1:3100/api/users/unknown
```

Expected status codes: 200, 200, and 404. Stop the server with Ctrl+C.
Use `PORT=3200 node examples/node-api/server.mjs` if port 3100 is occupied.

## Try initialization

```sh
node packages/cli/dist/bin.js init --root examples/node-api --agent codex
```

This creates `AGENTS.md` and preserves the existing docs. Repeating it skips
existing files. Review the generated instructions before committing them.
`init` does not scan source or generate endpoint documentation; the two specs
in this example were authored alongside the implementation.

## Try a failure

```sh
node packages/cli/dist/bin.js validate --id missing.endpoint --root examples/node-api --json
```

Expect `ENDPOINT_NOT_FOUND` and exit code 1. Running `validate` without an ID
returns exit code 2 for a usage error.

## Read the specs in a website

From the SpecKub repository root after building the checkout:

```sh
node packages/cli/dist/bin.js ui --root examples/node-api --serve
```

Open `http://127.0.0.1:4173`. The reader has endpoint navigation, search, method
filters, detailed tables, and sequence diagrams. It does not need the example API
server to be running. Stop preview with Ctrl+C. The static files remain in
`examples/node-api/.speckub/site/`; no hosting or publication happens automatically.
