# @speckub/core

Deterministic discovery and validation of Markdown API specifications.

Requires Node.js 22 or newer.

```sh
npm install @speckub/core@0.1.2
```

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
- Reports semantic validation as `skipped`; optional agent review runs outside this library.
- Missing documentation directories currently throw an error.

For project setup and terminal commands, install [@speckub/cli](https://www.npmjs.com/package/@speckub/cli). This package exposes the library API and does not provide a shell command.
