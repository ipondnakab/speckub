import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { initProject } from './init.js';
import { runCli } from './cli.js';

const dirs: string[] = [];
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'speckub-init-'));
  dirs.push(root);
  return root;
}
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('speckub init', () => {
  it('creates docs directory and requested agent templates', async () => {
    const root = await fixture();
    const result = await initProject(root, 'docs/api', ['codex', 'claude', 'cursor']);
    expect(result.created).toContain('AGENTS.md');
    expect(result.created).toContain('CLAUDE.md');
    expect(result.created).toContain('.cursor/rules/speckub.mdc');
    expect((await readFile(join(root, 'AGENTS.md'), 'utf8'))).toContain('SpecKub');
  });
  it('does not overwrite existing instructions', async () => {
    const root = await fixture();
    await writeFile(join(root, 'AGENTS.md'), 'My own instructions');
    const result = await initProject(root, 'docs/api', ['codex']);
    expect(result.skipped).toContain('AGENTS.md');
    expect(await readFile(join(root, 'AGENTS.md'), 'utf8')).toBe('My own instructions');
  });
  it('rejects documentation paths outside project', async () => {
    const root = await fixture();
    await expect(initProject(root, '../escape')).rejects.toThrow();
  });
  it('rejects symlinked documentation parent directories', async () => {
    const root = await fixture();
    const external = await fixture();
    const { symlink } = await import('node:fs/promises');
    await symlink(external, join(root, 'docs'));
    await expect(initProject(root, 'docs/api')).rejects.toThrow();
  });
  it('supports JSON output and reports invalid agent selection', async () => {
    const root = await fixture();
    const output: string[] = [];
    const errors: string[] = [];
    const io = { stdout: (value: string) => output.push(value), stderr: (value: string) => errors.push(value) };
    expect(await runCli(['init', '--agent', 'codex', '--json'], io, root)).toBe(0);
    expect(JSON.parse(output[0]).created).toContain('AGENTS.md');
    expect(await runCli(['init', '--agent', 'invalid'], io, root)).toBe(2);
    expect(errors.join(' ')).toContain('Expected --agent');
  });
  it('initializes an existing docs directory without deleting files', async () => {
    const root = await fixture();
    await mkdir(join(root, 'docs/api'), { recursive: true });
    await writeFile(join(root, 'docs/api/keep.md'), 'keep');
    await initProject(root);
    expect(await readFile(join(root, 'docs/api/keep.md'), 'utf8')).toBe('keep');
  });
});
