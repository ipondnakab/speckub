import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runCli } from './cli.js';

const directories: string[] = [];
async function setup() {
  const root = await mkdtemp(join(tmpdir(), 'speckub-cli-'));
  directories.push(root);
  await mkdir(join(root, 'docs/api'), { recursive: true });
  await writeFile(join(root, 'docs/api/user.md'), `---
specVersion: 1
id: users.get-by-id
kind: http
method: GET
path: /users/{id}
summary: Get user
---
# User
`);
  return root;
}
afterEach(async () => Promise.all(directories.splice(0).map((dir) => rm(dir, { recursive: true, force: true }))));
async function execute(args: string[], root: string) {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const code = await runCli(args, { stdout: (line) => stdout.push(line), stderr: (line) => stderr.push(line) }, root);
  return { code, stdout: stdout.join('\n'), stderr: stderr.join('\n') };
}
describe('speckub CLI', () => {
  it('lists endpoints', async () => {
    const root = await setup();
    const result = await execute(['list'], root);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('users.get-by-id');
  });
  it('inspects endpoints as JSON', async () => {
    const root = await setup();
    const result = await execute(['inspect', 'users.get-by-id', '--json'], root);
    expect(result.code).toBe(0);
    expect(JSON.parse(result.stdout).spec.method).toBe('GET');
  });
  it('validates endpoint with no source references', async () => {
    const root = await setup();
    const result = await execute(['validate', '--id', 'users.get-by-id', '--json'], root);
    expect(result.code).toBe(0);
    expect(JSON.parse(result.stdout).checks.semantic).toBe('skipped');
  });
  it('returns exit 1 for a missing endpoint', async () => {
    const root = await setup();
    expect((await execute(['validate', '--id', 'missing'], root)).code).toBe(1);
  });
  it('returns exit 2 for bad arguments', async () => {
    const root = await setup();
    expect((await execute(['validate'], root)).code).toBe(2);
    expect((await execute(['list', '--unknown'], root)).code).toBe(2);
  });
  it('returns exit 1 for missing documentation directory', async () => {
    const root = await setup();
    expect((await execute(['list', '--docs-dir', 'missing'], root)).code).toBe(1);
  });
});
