# Node API playground

A dependency-free, loopback-only API with **17 source-backed SpecKub specs**:
user CRUD, task CRUD, and nested organization/project/task/comment paths. Requires
Node.js 22 or newer. Run these commands from the SpecKub repository root.

## Explore the endpoint tree

```text
/health                                              GET
/api
  /users                                             GET, POST
    /{id}                                            GET, PUT, PATCH, DELETE
  /organizations
    /{organizationId}
      /projects                                      GET
        /{projectId}                                 GET
          /tasks                                     GET, POST
            /{taskId}                                GET, PATCH, DELETE
              /comments                              GET, POST
                /{commentId}                         GET
```

The deepest route is:

```text
/api/organizations/{organizationId}/projects/{projectId}/tasks/{taskId}/comments/{commentId}
```

This exercises shared prefixes, parent endpoints with nested endpoints, several
methods on one path, parameters, and deeply nested groups in the reader.

## Build and inspect the docs

```sh
pnpm install --frozen-lockfile
pnpm build
node packages/cli/dist/bin.js list --root examples/node-api
node packages/cli/dist/bin.js inspect users.create --root examples/node-api --json
node packages/cli/dist/bin.js inspect comments.get --root examples/node-api --json
node packages/cli/dist/bin.js validate --id tasks.create --root examples/node-api --json
```

`list` shows 17 endpoints. Specs contain request field tables, JSON bodies for
write operations, cURL examples, responses, errors, source references, and Mermaid
sequence diagrams. Bodyless endpoints say so explicitly. Existing IDs
`health.get` and `users.get-by-id` are preserved.

CLI structural/reference checks should pass; semantic checks remain `skipped`.
They do not execute the server. Run the integration tests to exercise behavior:

```sh
pnpm test:examples
```

## Run the API

```sh
node examples/node-api/server.mjs
```

The server listens on `http://127.0.0.1:3100`. Use
`PORT=3200 node examples/node-api/server.mjs` if port 3100 is occupied. Stop with
Ctrl+C. Every new server starts with user `1` (Ada), organization `1`, project `1`,
task `1`, and comment `1`. IDs for newly created records start at `2`.

There is no database or external service. All data changes stay in memory and
reset on restart. The seed organization and project are read-only containers.

## Try user CRUD

Run these in another terminal, in order, against a fresh server:

```sh
# Read the collection and seeded user — 200
curl -i http://127.0.0.1:3100/api/users
curl -i http://127.0.0.1:3100/api/users/1

# Create user 2 — 201
curl -i -X POST http://127.0.0.1:3100/api/users \
  -H 'Content-Type: application/json' \
  --data '{"name":"Grace"}'

# Replace the writable representation — 200
curl -i -X PUT http://127.0.0.1:3100/api/users/2 \
  -H 'Content-Type: application/json' \
  --data '{"name":"Grace Hopper"}'

# Update the name — 200
curl -i -X PATCH http://127.0.0.1:3100/api/users/2 \
  -H 'Content-Type: application/json' \
  --data '{"name":"Rear Admiral Hopper"}'

# Delete — 204 with no body; the next lookup returns 404
curl -i -X DELETE http://127.0.0.1:3100/api/users/2
curl -i http://127.0.0.1:3100/api/users/2
```

User JSON accepts only a nonempty string `name`; surrounding whitespace is
trimmed. Unknown fields, nulls, and empty patches are rejected. JSON writes require
`Content-Type: application/json`; bodies are limited to 16 KiB.

## Try deep paths and JSON defaults

The following commands assume the seeded project and no prior task/comment
creation in this process:

```sh
# Read parent resources — 200
curl -i http://127.0.0.1:3100/api/organizations/1/projects
curl -i http://127.0.0.1:3100/api/organizations/1/projects/1

# Read seeded task and deepest seeded comment — 200
curl -i http://127.0.0.1:3100/api/organizations/1/projects/1/tasks/1
curl -i http://127.0.0.1:3100/api/organizations/1/projects/1/tasks/1/comments/1

# Create task 2 — 201. Omitted completed defaults to false.
curl -i -X POST http://127.0.0.1:3100/api/organizations/1/projects/1/tasks \
  -H 'Content-Type: application/json' \
  --data '{"title":"Test nested routes"}'

# Patch task 2 — 200. Omitted title stays unchanged.
curl -i -X PATCH http://127.0.0.1:3100/api/organizations/1/projects/1/tasks/2 \
  -H 'Content-Type: application/json' \
  --data '{"completed":true}'

# Create comment 2 inside task 2 — 201
curl -i -X POST http://127.0.0.1:3100/api/organizations/1/projects/1/tasks/2/comments \
  -H 'Content-Type: application/json' \
  --data '{"text":"Looks good"}'

# Read that task's comments and the created comment — 200
curl -i http://127.0.0.1:3100/api/organizations/1/projects/1/tasks/2/comments
curl -i http://127.0.0.1:3100/api/organizations/1/projects/1/tasks/2/comments/2

# Delete task 2 and its comments — 204
curl -i -X DELETE http://127.0.0.1:3100/api/organizations/1/projects/1/tasks/2
```

Parents are resolved in order. An unknown organization, project, task, or comment
returns its specific 404 error. A comment ID under another task does not match.
Repeated POST requests create additional records; this demo has no idempotency
key or retry policy.

## View the specs

```sh
node packages/cli/dist/bin.js ui --root examples/node-api --serve
```

Open `http://127.0.0.1:4173`. Browse the path hierarchy, filter by method, search
for `comments`, and inspect JSON examples and diagrams. The API server need not
be running to read its specs. The path-tree layout requires the reader changes
in PR #18; an older reader still lists and renders all the specs.

The generated files remain in `examples/node-api/.speckub/site/`. The export is
local; publishing it is a separate action. Once these examples are merged, the
public SpecKub website can read them from `ipondnakab/speckub`. Before merge, select
branch `feat/crud-deep-path-playground`. Repository-wide discovery may also show
other example projects and report their duplicate IDs; selecting this example
with the local CLI isolates its 17 specs.

## Try initialization and validation errors

```sh
node packages/cli/dist/bin.js init --root examples/node-api --agent codex
node packages/cli/dist/bin.js validate --id missing.endpoint --root examples/node-api --json
```

Initialization preserves the existing docs and custom instructions. It does not
scan source or generate specs. The second command returns `ENDPOINT_NOT_FOUND`
and exit code 1. Running `validate` without an ID returns usage exit code 2.
