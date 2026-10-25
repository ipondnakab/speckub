---
speckub: true
specVersion: 1
id: users.get-by-id
kind: http
method: GET
path: /api/users/{id}
summary: Get an example user by ID
source:
  - server.mjs
  - server.test.mjs
---

# Get an example user by ID

## Overview

Find the user by exact ID in the in-process users Map.

## Contract

| Property            | Value                                  |
| ------------------- | -------------------------------------- |
| Method and route    | `GET /api/users/{id}`                  |
| Local base URL      | `http://127.0.0.1:3100` (default port) |
| Request media type  | No request body                        |
| Response media type | `application/json`                     |
| Version             | No API version negotiation             |

## Authentication and authorization

No authentication or authorization middleware is implemented. Parent IDs scope
lookup; they are not a substitute for permission checks in a real application.
The server is loopback-only and includes no production gateway.

## Request

| Field | Location | Type   | Required / nullable | Constraints / default            | Meaning |
| ----- | -------- | ------ | ------------------- | -------------------------------- | ------- |
| id    | Path     | string | Required, non-null  | One nonempty segment; no default | User ID |

Query parameters are ignored. Paths match exactly; trailing slashes and extra
segments do not match. Path segments are compared without explicit percent-decoding.

No request body. The handler does not parse a body or require a content type.

## Responses

| Status | Condition                                                    | Body              |
| ------ | ------------------------------------------------------------ | ----------------- |
| 200    | Matched request with valid fields and existing parent/record | JSON result below |
| 404    | User not found                                               | JSON error object |

| Field | Type   | Required / nullable | Meaning             |
| ----- | ------ | ------------------- | ------------------- |
| id    | string | Present, non-null   | Resource identifier |
| name  | string | Present, non-null   | Display name        |

JSON responses use `Content-Type: application/json`.

## Errors

| Status | Message        | Trigger                          | Caller action                               |
| ------ | -------------- | -------------------------------- | ------------------------------------------- |
| 404    | User not found | Selected parent/record is absent | Use IDs from the matching parent collection |
| 404    | Not found      | Unmatched method/path            | Correct the route and HTTP method           |

Errors have the shape `{ "error": "message" }`; no separate machine code is
provided. Unsupported method/path combinations use fallback 404, not 405.

## Behavior

Find the user by exact ID in the in-process users Map.

The seed contains user 1 (Ada). CRUD operations can change or delete users during this process.
This operation does not mutate state. Results can change when other CRUD requests
modify the same server process.

## Relationships

No database, external service, event bus, or upstream application caller is
defined by this standalone playground. All storage is local to this server process.

The endpoint uses the shared in-process users Map.

## Request flow

```mermaid
sequenceDiagram
    actor Client
    participant API as Playground handler (in-memory state)
    Client->>API: GET /api/users/{id}
    API->>API: Resolve scope and validate request fields
    alt Valid request and known parents or record
        API->>API: Read user
        API-->>Client: 200 JSON result
    else Missing resource or invalid request
        API-->>Client: Documented JSON error
    end
```

## Examples

Start `node examples/node-api/server.mjs` from the repository root. These
examples assume fresh seeded state and the default port; earlier mutations can
change the result.

```sh
curl -i http://127.0.0.1:3100/api/users/1
```

Expected status: 200.

```json
{
  "id": "1",
  "name": "Ada"
}
```

Missing-resource example:

```sh
curl -i http://127.0.0.1:3100/api/users/missing
```

Expected status: 404.

```json
{
  "error": "User not found"
}
```

## Limits and operations

The server binds to `127.0.0.1`; `PORT` overrides the default 3100. Data resets
when the process restarts. There is no persistence, authentication middleware,
rate limit, application timeout, or performance guarantee. Runtime HTTP defaults
are not specified here. This is a local test fixture, not a production service.

## Evidence and verification

- `server.mjs`: `createExampleServer`, the `GET` registration for `/api/users/{id}`,
  its handler, scoped lookup helpers, `send`, and the in-memory seed.
- `server.test.mjs`: local HTTP integration checks exercise user CRUD, nested task
  CRUD/comments, missing parents, validation, content type, body size, and health.
- These checks cover this playground locally; no deployment behavior is claimed.
- CLI structural/reference checks are separate; CLI semantic checks remain `skipped`.
- The success/error HTTP examples were exercised against fresh local servers.
- The sequence diagram rendered successfully in the local reader during development.
