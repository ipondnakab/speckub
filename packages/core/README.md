# @speckub/core

Deterministic discovery and validation of Markdown API specifications.

```ts
import { discoverEndpoints, validateEndpoint } from '@speckub/core';

const endpoints = await discoverEndpoints(process.cwd(), 'docs/api');
const report = await validateEndpoint(process.cwd(), 'users.get-by-id');
console.log(JSON.stringify(report, null, 2));
```

- Discovers Markdown files under a repository-relative docs directory.
- Parses frontmatter through `@speckub/schema`.
- Reports invalid specs, duplicate endpoint IDs and missing source files.
- Skips symlinks and rejects directory traversal.
- Reports semantic validation as `skipped` (AI verification is not implemented).
- Missing documentation directories currently throw an error.

This is a library API, **not yet a CLI**. The CLI is tracked separately.
