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

## Install and use

Requires Node.js 22 or newer.

```sh
npm install @speckub/schema@0.1.2
```

```js
import { readFileSync } from 'node:fs';
import { parseEndpointMarkdown } from '@speckub/schema';

const result = parseEndpointMarkdown(readFileSync('docs/api/users.md', 'utf8'));
if (result.success) console.log(result.data);
else console.error(result.issues);
```

This package has no executable. For `init`, agent workflows, and terminal
validation, install [@speckub/cli](https://www.npmjs.com/package/@speckub/cli).
