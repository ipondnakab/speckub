import { afterEach, describe, expect, it } from 'vitest';
import {
  access,
  mkdtemp,
  mkdir,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareScan } from './scan.js';
import { initProject } from './init.js';
import { runCli } from './cli.js';

const roots: string[] = [];
async function setup() {
  const root = await mkdtemp(join(tmpdir(), 'speckub-scan-'));
  roots.push(root);
  return realpath(root);
}
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe('agent scan preparation', () => {
  it('installs the portable skill without generating docs or changing application code', async () => {
    const root = await setup();
    await writeFile(join(root, 'app.py'), 'original');
    const result = await prepareScan(root);
    expect(result.mode).toBe('agent-skill');
    expect(result.status).toBe('created');
    expect(result.skills).toHaveLength(10);
    expect(
      await readFile(
        join(root, '.agents/skills/speckub-create/references/api-document.md'),
        'utf8',
      ),
    ).toContain('API document standard');
    expect(
      await readFile(
        join(
          root,
          '.agents/skills/speckub-create/references/sequence-diagrams.md',
        ),
        'utf8',
      ),
    ).toContain('sequenceDiagram');
    expect(await readFile(join(root, 'app.py'), 'utf8')).toBe('original');
    expect(await readFile(join(root, result.skill), 'utf8')).toContain(
      'name: speckub-scan',
    );
    await expect(access(join(root, 'docs'))).rejects.toThrow();
  });
  it('preserves a customized installed skill on repeated runs and init', async () => {
    const root = await setup();
    const result = await prepareScan(root);
    await writeFile(join(root, result.skill), 'custom instructions');
    expect((await prepareScan(root)).status).toBe('skipped');
    await initProject(root, 'docs/api', ['codex']);
    expect(await readFile(join(root, result.skill), 'utf8')).toBe(
      'custom instructions',
    );
  });
  it('previews installation without writing and prints the selected root and docs in JSON', async () => {
    const root = await setup();
    const output: string[] = [];
    const code = await runCli(
      ['scan', '--docs-dir', 'contracts', '--dry-run', '--json'],
      {
        stdout: (s) => output.push(s),
        stderr: () => {},
      },
      root,
    );
    expect(code).toBe(0);
    const result = JSON.parse(output[0]);
    expect(result.status).toBe('would-create');
    expect(result.docsDir).toBe(join(root, 'contracts'));
    expect(result.prompt).toContain('contracts');
    await expect(access(join(root, '.agents'))).rejects.toThrow();
  });
  it('rejects a skill installation through an external symlink', async () => {
    const root = await setup();
    const outside = await setup();
    await symlink(outside, join(root, '.agents'));
    await expect(prepareScan(root)).rejects.toThrow();
  });
  it('init installs the skill even when AGENTS.md exists', async () => {
    const root = await setup();
    await writeFile(join(root, 'AGENTS.md'), 'preserve');
    const result = await initProject(root, 'docs/api', ['codex']);
    expect(result.created).toContain('.agents/skills/speckub-scan/SKILL.md');
    expect(await readFile(join(root, 'AGENTS.md'), 'utf8')).toBe('preserve');
  });
  it('installs scoped command entrypoints for selected agents and preserves custom commands', async () => {
    const root = await setup();
    await mkdir(join(root, '.claude/commands'), { recursive: true });
    const custom = join(root, '.claude/commands/speckub.create.md');
    await writeFile(custom, 'keep my custom create command');
    await initProject(root, 'docs/api', ['codex', 'claude', 'cursor']);
    expect(await readFile(custom, 'utf8')).toBe(
      'keep my custom create command',
    );
    for (const action of [
      'scan',
      'relations',
      'create',
      'validate',
      'clarify',
      'template',
    ]) {
      expect(
        await readFile(
          join(root, `.agents/skills/speckub-${action}/SKILL.md`),
          'utf8',
        ),
      ).toContain(`name: speckub-${action}`);
      const cursor = await readFile(
        join(root, `.cursor/commands/speckub.${action}.md`),
        'utf8',
      );
      expect(cursor).toContain(`.agents/skills/speckub-${action}/SKILL.md`);
    }
    expect(
      await readFile(join(root, '.claude/commands/speckub.scan.md'), 'utf8'),
    ).toContain('$ARGUMENTS');
  });
  it('rejects symlinked skill files rather than treating them as installed', async () => {
    const root = await setup();
    const outside = await setup();
    await writeFile(join(outside, 'custom.md'), 'outside');
    await mkdir(join(root, '.agents/skills/speckub-scan'), { recursive: true });
    await symlink(
      join(outside, 'custom.md'),
      join(root, '.agents/skills/speckub-scan/SKILL.md'),
    );
    await expect(prepareScan(root)).rejects.toThrow('not a regular file');
  });
  it('rejects escaping docs paths before installing anything', async () => {
    const root = await setup();
    await expect(prepareScan(root, '../outside')).rejects.toThrow();
    await expect(access(join(root, '.agents'))).rejects.toThrow();
    await mkdir(join(root, 'docs'));
  });
  it('initializes editable document assets without agents, preserves customization, and keeps examples out of discovery', async () => {
    const root = await setup();
    await initProject(root);
    const template = join(root, '.speckub/templates/api.md');
    const example = join(root, '.speckub/examples/api.md');
    expect(await readFile(template, 'utf8')).toContain('{{endpoint_id}}');
    const output: string[] = [];
    const io = { stdout: (s: string) => output.push(s), stderr: () => {} };
    expect(await runCli(['list', '--json'], io, root)).toBe(0);
    expect(JSON.parse(output.pop()!).endpoints).toEqual([]);
    expect(
      await runCli(
        ['list', '--docs-dir', '.speckub/examples', '--json'],
        io,
        root,
      ),
    ).toBe(0);
    expect(JSON.parse(output.pop()!).endpoints).toHaveLength(1);
    await writeFile(template, 'custom template');
    await writeFile(example, 'custom example');
    await initProject(root, 'docs/api', ['claude']);
    await prepareScan(root);
    expect(await readFile(template, 'utf8')).toBe('custom template');
    expect(await readFile(example, 'utf8')).toBe('custom example');
  });
  it('rejects external template destinations', async () => {
    const root = await setup();
    const outside = await setup();
    await symlink(outside, join(root, '.speckub'));
    await expect(initProject(root)).rejects.toThrow();
  });
});
