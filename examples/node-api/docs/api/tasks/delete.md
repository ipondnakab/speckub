---
speckub: true
specVersion: 1
id: tasks.delete
kind: http
method: DELETE
path: /api/organizations/{organizationId}/projects/{projectId}/tasks/{taskId}
summary: Delete a project task
source:
  - server.mjs
  - server.test.mjs
---

# Delete a project task

## Overview

Find the scoped task and remove it from its project tasks Map, including its embedded comments.

## Contract

| Property            | Value                                                                            |
| ------------------- | -------------------------------------------------------------------------------- |
| Method and route    | `DELETE /api/organizations/{organizationId}/projects/{projectId}/tasks/{taskId}` |
| Local base URL      | `http://127.0.0.1:3100` (default port)                                           |
| Request media type  | No request body                                                                  |
| Response media type | No body on success; JSON for errors                                              |
| Version             | No API version negotiation                                                       |

## Authentication and authorization

No authentication or authorization middleware is implemented. Parent IDs scope
lookup; they are not a substitute for permission checks in a real application.
The server is loopback-only and includes no production gateway.

## Request

| Field          | Location | Type   | Required / nullable | Constraints / default            | Meaning                       |
| -------------- | -------- | ------ | ------------------- | -------------------------------- | ----------------------------- |
| organizationId | Path     | string | Required, non-null  | One nonempty segment; no default | Exact ID scoped to its parent |
| projectId      | Path     | string | Required, non-null  | One nonempty segment; no default | Exact ID scoped to its parent |
| taskId         | Path     | string | Required, non-null  | One nonempty segment; no default | Exact ID scoped to its parent |

Query parameters are ignored. Paths match exactly; trailing slashes and extra
segments do not match. Path segments are compared without explicit percent-decoding.

No request body. The handler does not parse a body or require a content type.

## Responses

| Status | Condition                                                    | Body              |
| ------ | ------------------------------------------------------------ | ----------------- |
| 204    | Matched request with valid fields and existing parent/record | No body           |
| 404    | Organization not found                                       | JSON error object |
| 404    | Project not found                                            | JSON error object |
| 404    | Task not found                                               | JSON error object |

A 204 response contains no body and no Content-Type header.

## Errors

| Status | Message                | Trigger                          | Caller action                               |
| ------ | ---------------------- | -------------------------------- | ------------------------------------------- |
| 404    | Organization not found | Selected parent/record is absent | Use IDs from the matching parent collection |
| 404    | Project not found      | Selected parent/record is absent | Use IDs from the matching parent collection |
| 404    | Task not found         | Selected parent/record is absent | Use IDs from the matching parent collection |
| 404    | Not found              | Unmatched method/path            | Correct the route and HTTP method           |

Errors have the shape `{ "error": "message" }`; no separate machine code is
provided. Unsupported method/path combinations use fallback 404, not 405.

## Behavior

Find the scoped task and remove it from its project tasks Map, including its embedded comments.

This removes access to all comments on that task. A repeated delete returns 404. The response has no body.

## Relationships

No database, external service, event bus, or upstream application caller is
defined by this standalone playground. All storage is local to this server process.

The URL encodes parent ownership: organization → project → task → comment.
Only the ancestors present in this route are resolved, in that order; a missing
ancestor stops lookup with the corresponding 404.

## Request flow

```mermaid
sequenceDiagram
    actor Client
    participant API as Playground handler (in-memory state)
    Client->>API: DELETE /api/organizations/{organizationId}/projects/{projectId}/tasks/{taskId}
    API->>API: Resolve scope and validate request fields
    alt Valid request and known parents or record
        API->>API: Remove task and its comments
        API-->>Client: 204 no body
    else Missing resource or invalid request
        API-->>Client: Documented JSON error
    end
```

## Examples

Start `node examples/node-api/server.mjs` from the repository root. These
examples assume fresh seeded state and the default port; earlier mutations can
change the result.

```sh
curl -i -X DELETE http://127.0.0.1:3100/api/organizations/1/projects/1/tasks/1
```

Expected status: 204.

The response body is empty.

Missing-resource example:

```sh
curl -i -X DELETE http://127.0.0.1:3100/api/organizations/1/projects/1/tasks/missing
```

Expected status: 404.

```json
{
  "error": "Task not found"
}
```

## Limits and operations

The server binds to `127.0.0.1`; `PORT` overrides the default 3100. Data resets
when the process restarts. There is no persistence, authentication middleware,
rate limit, application timeout, or performance guarantee. Runtime HTTP defaults
are not specified here. This is a local test fixture, not a production service.

## Evidence and verification

- `server.mjs`: `createExampleServer`, the `DELETE` registration for `/api/organizations/{organizationId}/projects/{projectId}/tasks/{taskId}`,
  its handler, scoped lookup helpers, `send`, and the in-memory seed.
- `server.test.mjs`: local HTTP integration checks exercise user CRUD, nested task
  CRUD/comments, missing parents, validation, content type, body size, and health.
- These checks cover this playground locally; no deployment behavior is claimed.
- CLI structural/reference checks are separate; CLI semantic checks remain `skipped`.
- The success/error HTTP examples were exercised against fresh local servers.
- The sequence diagram rendered successfully in the local reader during development.
