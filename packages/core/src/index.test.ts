import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
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


describe('repository-wide discovery', () => {
  it('discovers nested and root specs, skips unrelated files and tooling, and scopes explicitly', async () => {
    const root = await fixture();
    const original = await readFile(join(root, 'docs/api/user.md'), 'utf8');
    await mkdir(join(root, 'services/orders/contracts'), { recursive: true });
    await writeFile(join(root, 'services/orders/contracts/orders.MD'), original.replace('users.get-by-id', 'orders.get').replace('specVersion: 1', 'speckub: true\nspecVersion: 1'));
    await writeFile(join(root, 'root.md'), original.replace('users.get-by-id', 'root.get'));
    await writeFile(join(root, 'README.md'), '# Unrelated readme');
    await writeFile(join(root, 'docs/api/guide.md'), '---\ntitle: Guide\n---\nInstructions');
    await writeFile(join(root, 'example.md'), original.replace('specVersion: 1', 'speckub: false\nspecVersion: 1'));
    for (const dir of ['node_modules/pkg', '.git', '.speckub/examples', '.agents/skills/demo', 'dist']) {
      await mkdir(join(root, dir), { recursive: true });
      await writeFile(join(root, dir, 'duplicate.md'), original);
    }
    const result = await discoverEndpoints(root);
    expect(result.issues).toEqual([]);
    expect(result.endpoints.map((e) => e.file)).toEqual(['docs/api/user.md', 'root.md', 'services/orders/contracts/orders.MD']);
    expect((await discoverEndpoints(root, 'services')).endpoints.map((e) => e.spec.id)).toEqual(['orders.get']);
    expect((await validateEndpoint(root, 'orders.get')).status).toBe('passed');
  });
  it('reports marked invalid files and duplicate IDs across directories', async () => {
    const root = await fixture();
    await writeFile(join(root, 'broken.md'), '---\nspeckub: true\n---');
    await writeFile(join(root, 'duplicate.md'), await readFile(join(root, 'docs/api/user.md'), 'utf8'));
    expect((await discoverEndpoints(root)).issues.map((i) => i.code)).toContain('INVALID_SPEC');
    expect((await discoverEndpoints(root)).issues.map((i) => i.code)).toContain('DUPLICATE_ENDPOINT_ID');
  });
  it('works without docs/api and does not follow directory symlinks', async () => {
    const root = await fixture();
    const original = await readFile(join(root, 'docs/api/user.md'), 'utf8');
    await rm(join(root, 'docs'), { recursive: true });
    await writeFile(join(root, 'api.md'), original);
    await symlink(root, join(root, 'loop'));
    expect((await discoverEndpoints(root)).endpoints).toHaveLength(1);
  });
});
