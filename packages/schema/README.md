# @speckub/schema

Versioned, language-agnostic HTTP endpoint specification contract.

## Markdown example

```md
---
specVersion: 1
id: users.get-by-id
kind: http
method: GET
path: /api/users/{id}
summary: Get user by ID
source:
  - src/controllers/UserController.java
---
# Get user by ID

Returns a user.
```

Use `parseEndpointMarkdown(markdown)` to parse and validate. It returns a discriminated union with `success`, validated `data`, Markdown `body`, or structured `issues`.

The schema validates metadata and path parameter names. It **does not** prove that a route exists in source code; semantic and source-reference checks are separate tasks for `@speckub/core`.

IDs are stable across route renames. Source paths must be repository-relative.
