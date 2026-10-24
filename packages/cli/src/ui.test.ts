import { afterEach, describe, expect, it } from 'vitest';
import {
  access,
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { request, type Server } from 'node:http';
import { buildReader, serveReader } from './ui.js';
import { runCli } from './cli.js';

const directories: string[] = [];
const servers: Server[] = [];
const spec = (body = '') =>
  `---\nspecVersion: 1\nid: users.get\nkind: http\nmethod: GET\npath: /users\nsummary: List users\nsource:\n  - secret-source.ts\n---\n${body}`;
async function setup(body = '## Overview\nList users.') {
  const root = await mkdtemp(join(tmpdir(), 'speckub-ui-'));
  directories.push(root);
  await mkdir(join(root, 'docs/api'), { recursive: true });
  await writeFile(join(root, 'docs/api/users.md'), spec(body));
  await writeFile(
    join(root, 'secret-source.ts'),
    'PRIVATE_SOURCE_NOT_FOR_EXPORT',
  );
  await writeFile(join(root, '.env'), 'SECRET_NOT_FOR_EXPORT');
  return root;
}
afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (s) =>
        new Promise<void>((resolve, reject) => {
          s.close((e) => (e ? reject(e) : resolve()));
          s.closeAllConnections();
        }),
    ),
  );
  await Promise.all(
    directories
      .splice(0)
      .map((dir) => rm(dir, { recursive: true, force: true })),
  );
});
function embedded(html: string) {
  const text = html.match(
    /<script id="spec-data" type="application\/json">([\s\S]*?)<\/script>/,
  )?.[1];
  return JSON.parse(text!);
}

describe('standalone spec reader', () => {
  it('renders tables, diagrams, and spec links with offline assets without copying source', async () => {
    const root = await setup(
      '## Request flow\n\n```mermaid\nsequenceDiagram\nA->>B: Hello\n```\n\n| Field | Type |\n| --- | --- |\n| id | string |\n\n[Self](users.md#request-flow)',
    );
    const result = await buildReader(root);
    const html = await readFile(result.entry, 'utf8');
    const endpoint = embedded(html).endpoints[0];
    expect(endpoint.html).toContain('<table>');
    expect(endpoint.html).toContain('class="mermaid"');
    expect(endpoint.html).toContain('href="#users.get/request-flow"');
    expect(endpoint.source).toEqual(['secret-source.ts']);
    expect(html).not.toContain('PRIVATE_SOURCE_NOT_FOR_EXPORT');
    expect(html).not.toContain('SECRET_NOT_FOR_EXPORT');
    expect(html).not.toContain('cdn.');
    expect(
      (await readFile(join(result.output, 'mermaid.min.js'), 'utf8')).length,
    ).toBeGreaterThan(100000);
    await expect(access(join(result.output, '.env'))).rejects.toThrow();
    await expect(
      access(join(result.output, 'secret-source.ts')),
    ).rejects.toThrow();
  });
  it('escapes raw HTML, JSON script breakouts, tracking images, and unsafe links', async () => {
    const root = await setup(
      '<script>alert(1)</script>\n\n</script><img src=x onerror=alert(1)>\n\n[bad](javascript:alert(1))\n\n![tracking](https://example.invalid/track)',
    );
    const result = await buildReader(root);
    const html = await readFile(result.entry, 'utf8');
    const body = embedded(html).endpoints[0].html;
    expect(body).not.toContain('<script>');
    expect(body).not.toContain('<img');
    expect(body).not.toContain('href="javascript:');
    expect(html).not.toContain('</script><img');
    expect(body).toContain('&lt;script&gt;');
  });
  it('regenerates owned output but refuses unowned directories, overlaps, and symlink targets', async () => {
    const root = await setup();
    const result = await buildReader(root);
    await writeFile(
      join(root, 'docs/api/users.md'),
      spec('Updated description'),
    );
    await buildReader(root);
    expect(await readFile(result.entry, 'utf8')).toContain(
      'Updated description',
    );
    await expect(buildReader(root, 'docs/api', '.')).rejects.toThrow();
    await expect(buildReader(root, 'docs/api', 'docs')).rejects.toThrow();
    await expect(buildReader(root, 'docs/api', '../escape')).rejects.toThrow();
    await symlink(join(root, 'docs/api'), join(root, 'docs-alias'));
    await expect(
      buildReader(root, 'docs/api', 'docs-alias/site'),
    ).rejects.toThrow('symlinks');
    await mkdir(join(root, 'existing'));
    await writeFile(join(root, 'existing/index.html'), 'keep');
    await expect(buildReader(root, 'docs/api', 'existing')).rejects.toThrow();
    expect(await readFile(join(root, 'existing/index.html'), 'utf8')).toBe(
      'keep',
    );
    await rm(join(result.output, 'index.html'));
    await symlink(
      join(root, 'secret-source.ts'),
      join(result.output, 'index.html'),
    );
    await expect(buildReader(root)).rejects.toThrow('regular file');
    expect(await readFile(join(root, 'secret-source.ts'), 'utf8')).toBe(
      'PRIVATE_SOURCE_NOT_FOR_EXPORT',
    );
  });
  it('rejects invalid specs before writing and supports an empty reader', async () => {
    const root = await setup();
    await writeFile(join(root, 'docs/api/bad.md'), 'no frontmatter');
    await expect(buildReader(root)).rejects.toThrow('frontmatter');
    await expect(access(join(root, '.speckub/site'))).rejects.toThrow();
    await rm(join(root, 'docs/api/bad.md'));
    await rm(join(root, 'docs/api/users.md'));
    expect((await buildReader(root)).endpoints).toBe(0);
  });
  it('serves only generated assets on loopback and rejects arbitrary files and methods', async () => {
    const root = await setup();
    const result = await buildReader(root);
    await writeFile(join(result.output, 'private.txt'), 'NOT_PUBLIC');
    const server = await serveReader(result.output, 0);
    servers.push(server);
    const address = server.address();
    if (!address || typeof address === 'string')
      throw new Error('No TCP address');
    expect(address.address).toBe('127.0.0.1');
    const url = `http://127.0.0.1:${address.port}`;
    const page = await fetch(url);
    expect(page.status).toBe(200);
    expect(page.headers.get('content-type')).toContain('text/html');
    expect((await fetch(url, { method: 'HEAD' })).status).toBe(200);
    for (const path of [
      '/private.txt',
      '/.env',
      '/secret-source.ts',
      '/%2e%2e/.env',
      '/.speckub-site.json',
    ])
      expect((await fetch(url + path)).status).toBe(404);
    expect((await fetch(url, { method: 'POST' })).status).toBe(405);
    const forbiddenHost = await new Promise<number>((resolve, reject) => {
      const req = request(
        url,
        { headers: { Host: 'untrusted.invalid' } },
        (res) => {
          res.resume();
          resolve(res.statusCode!);
        },
      );
      req.on('error', reject);
      req.end();
    });
    expect(forbiddenHost).toBe(403);
  });
  it('supports CLI JSON output and validates UI-only arguments', async () => {
    const root = await setup();
    const output: string[] = [];
    const io = { stdout: (s: string) => output.push(s), stderr: () => {} };
    expect(await runCli(['ui', '--out', 'reader', '--json'], io, root)).toBe(0);
    expect(JSON.parse(output[0]).endpoints).toBe(1);
    for (const args of [
      ['list', '--serve'],
      ['ui', '--port', '4173'],
      ['ui', '--serve', '--port', '-1'],
      ['ui', '--serve', '--port', '65536'],
      ['ui', '--id', 'users.get'],
    ])
      expect(await runCli(args, io, root)).toBe(2);
  });
});
