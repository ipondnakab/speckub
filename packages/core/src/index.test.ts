import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { discoverEndpoints, validateEndpoint } from './index.js';

const dirs: string[] = [];
async function fixture(source = 'src/user.ts') {
  const root = await mkdtemp(join(tmpdir(), 'speckub-'));
  dirs.push(root);
  await mkdir(join(root, 'docs/api'), { recursive: true });
  await mkdir(join(root, 'src'), { recursive: true });
  await writeFile(join(root, 'src/user.ts'), 'export const user = true;');
  await writeFile(join(root, 'docs/api/user.md'), `---
specVersion: 1
id: users.get-by-id
kind: http
method: GET
path: /users/{id}
summary: Get user
source:
  - ${source}
---
# User
`);
  return root;
}
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('core endpoint validation', () => {
  it('discovers and validates a single endpoint', async () => {
    const root = await fixture();
    const discovered = await discoverEndpoints(root);
    expect(discovered.endpoints).toHaveLength(1);
    const report = await validateEndpoint(root, 'users.get-by-id');
    expect(report.status).toBe('passed');
    expect(report.checks.semantic).toBe('skipped');
    expect(report.endpoint?.specFile).toBe('docs/api/user.md');
  });
  it('reports missing referenced files', async () => {
    const root = await fixture('src/missing.ts');
    const report = await validateEndpoint(root, 'users.get-by-id');
    expect(report.status).toBe('failed');
    expect(report.issues.some((issue) => issue.code === 'SOURCE_NOT_FOUND')).toBe(true);
  });
  it('reports missing endpoint IDs', async () => {
    const root = await fixture();
    expect((await validateEndpoint(root, 'missing.endpoint')).issues.some((issue) => issue.code === 'ENDPOINT_NOT_FOUND')).toBe(true);
  });
  it('detects duplicate endpoint IDs', async () => {
    const root = await fixture();
    const original = await import('node:fs/promises').then((fs) => fs.readFile(join(root, 'docs/api/user.md'), 'utf8'));
    await writeFile(join(root, 'docs/api/duplicate.md'), original);
    expect((await discoverEndpoints(root)).issues.some((issue) => issue.code === 'DUPLICATE_ENDPOINT_ID')).toBe(true);
  });
  it('ignores symlinked specs', async () => {
    const root = await fixture();
    await symlink(join(root, 'docs/api/user.md'), join(root, 'docs/api/linked.md'));
    expect((await discoverEndpoints(root)).endpoints).toHaveLength(1);
  });
  it('rejects docs directories outside the repository', async () => {
    const root = await fixture();
    await expect(discoverEndpoints(root, '../outside')).rejects.toThrow();
  });
});
