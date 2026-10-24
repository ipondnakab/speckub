import { createServer, type Server } from 'node:http';
import { createRequire } from 'node:module';
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  writeFile,
} from 'node:fs/promises';
import {
  basename,
  isAbsolute,
  join,
  posix,
  relative,
  resolve,
  sep,
} from 'node:path';
import MarkdownIt from 'markdown-it';
import { discoverEndpoints } from '@speckub/core';
import { ensureSafePath } from './init.js';

const require = createRequire(import.meta.url);
const marker = '.speckub-site.json';
const assetNames = [
  'index.html',
  'reader.js',
  'styles.css',
  'mermaid.min.js',
  'NOTICE.txt',
] as const;
const assetTypes: Record<string, string> = {
  'index.html': 'text/html; charset=utf-8',
  'reader.js': 'text/javascript; charset=utf-8',
  'styles.css': 'text/css; charset=utf-8',
  'mermaid.min.js': 'text/javascript; charset=utf-8',
  'NOTICE.txt': 'text/plain; charset=utf-8',
};
const inside = (root: string, path: string) => {
  const rel = relative(root, path);
  return !isAbsolute(rel) && rel !== '..' && !rel.startsWith('..' + sep);
};
const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'section';

export async function buildReader(
  rootDir: string,
  docsDir = '.',
  outDir = '.speckub/site',
) {
  const root = await realpath(rootDir);
  const docs = resolve(root, docsDir);
  const output = resolve(root, outDir);
  if (output === root || !inside(root, output))
    throw new Error(
      'UI output must be a dedicated directory inside the project',
    );
  if (docs !== root && (inside(docs, output) || inside(output, docs)))
    throw new Error('UI output must not overlap the documentation directory');
  for (let parent = output; parent !== root; parent = resolve(parent, '..')) {
    const info = await lstat(parent).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return undefined;
      throw error;
    });
    if (info?.isSymbolicLink())
      throw new Error('UI output parents must not be symlinks');
  }
  await ensureSafePath(root, join(output, 'index.html'));
  try {
    if ((await lstat(output)).isSymbolicLink())
      throw new Error('UI output must not be a symlink');
    if ((await readdir(output)).length) {
      const owned = join(output, marker);
      if (!(await lstat(owned)).isFile())
        throw new Error('UI output marker must be a regular file');
      const manifest = JSON.parse(await readFile(owned, 'utf8'));
      if (manifest.format !== 'speckub-reader-v1')
        throw new Error('UI output is not a SpecKub reader directory');
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // A missing output directory is fine; a nonempty unowned directory is not.
      const entries = await readdir(output).catch(
        (e: NodeJS.ErrnoException) => {
          if (e.code === 'ENOENT') return [];
          throw e;
        },
      );
      if (entries.length)
        throw new Error(
          'Refusing to overwrite a nonempty directory without a SpecKub reader marker',
        );
    } else throw error;
  }
  for (const name of [...assetNames, marker]) {
    const info = await lstat(join(output, name)).catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') return undefined;
        throw error;
      },
    );

    if (info && !info.isFile())
      throw new Error(`UI output asset is not a regular file: ${name}`);
  }
  const discovery = await discoverEndpoints(root, docsDir, { excludeDirs: [outDir] });
  if (discovery.issues.length)
    throw new Error(
      discovery.issues
        .map((issue) => `${issue.file}: ${issue.message}`)
        .join('\n'),
    );
  const idByFile = new Map(discovery.endpoints.map((e) => [e.file, e.spec.id]));
  const markdown = new MarkdownIt({
    html: false,
    linkify: false,
    typographer: false,
  });
  // Never embed remote images or source files into a private reader.
  markdown.renderer.rules.image = (tokens, index) =>
    `<span class="image-label">[Image: ${markdown.utils.escapeHtml(tokens[index].content)}]</span>`;
  const endpoints = [];
  for (const endpoint of discovery.endpoints) {
    const fullPath = await realpath(join(root, endpoint.file));
    if (!inside(root, fullPath))
      throw new Error('Spec source resolves outside the project');
    const raw = await readFile(fullPath, 'utf8');
    const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '');
    const tokens = markdown.parse(body, {});
    const headings = new Map<string, number>();
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.type === 'heading_open') {
        const base = slug(tokens[i + 1]?.content ?? 'section');
        const count = (headings.get(base) ?? 0) + 1;
        headings.set(base, count);
        const anchor = count === 1 ? base : `${base}-${count}`;
        token.attrSet('id', endpoint.spec.id + '--' + anchor);
        token.attrSet('data-anchor', anchor);
      }
      if (token.type === 'fence' && token.info.trim() === 'mermaid') {
        token.type = 'html_block';
        token.content = `<pre class="mermaid">${markdown.utils.escapeHtml(token.content)}</pre>`;
      }
      for (const child of token.children ?? []) {
        if (child.type !== 'link_open') continue;
        const href = child.attrGet('href') ?? '';
        if (/^https?:\/\//i.test(href) || /^mailto:/i.test(href)) {
          child.attrSet('rel', 'noreferrer noopener');
          continue;
        }
        const [path, fragment] = href.split('#', 2);
        let decoded: string;
        try {
          decoded = decodeURIComponent(path);
        } catch {
          decoded = '';
        }
        const id = !path
          ? endpoint.spec.id
          : idByFile.get(
              posix.normalize(
                posix.join(posix.dirname(endpoint.file), decoded),
              ),
            );
        if (id)
          child.attrSet(
            'href',
            '#' +
              encodeURIComponent(id) +
              (fragment ? '/' + encodeURIComponent(fragment) : ''),
          );
        else {
          child.attrs = child.attrs?.filter(([key]) => key !== 'href') ?? [];
          child.attrSet('title', 'This file is not included in the export');
        }
      }
    }
    endpoints.push({
      ...endpoint.spec,
      source: endpoint.spec.source ?? [],
      file: endpoint.file,
      html: markdown.renderer.render(tokens, markdown.options, {}),
      search:
        `${endpoint.spec.id} ${endpoint.spec.method} ${endpoint.spec.path} ${endpoint.spec.summary} ${body}`.toLowerCase(),
    });
  }
  const title = basename(root);
  // Escaping '<' prevents spec content from closing the JSON script element.
  const data = JSON.stringify({ title, endpoints })
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  const assets = new Map<string, string>();
  for (const name of ['index.html', 'reader.js', 'styles.css', 'NOTICE.txt']) {
    assets.set(
      name,
      await readFile(
        new URL(`../templates/reader/${name}`, import.meta.url),
        'utf8',
      ),
    );
  }
  assets.set(
    'index.html',
    assets.get('index.html')!.replace('__SPECKUB_DATA__', () => data),
  );
  assets.set(
    'mermaid.min.js',
    await readFile(require.resolve('@mermaid-js/tiny'), 'utf8'),
  );
  await mkdir(output, { recursive: true });
  for (const [name, content] of assets)
    await writeFile(join(output, name), content, { flag: 'w' });
  await writeFile(
    join(output, marker),
    JSON.stringify({ format: 'speckub-reader-v1' }) + '\n',
  );
  return {
    output,
    entry: join(output, 'index.html'),
    endpoints: endpoints.length,
    files: [...assetNames],
  };
}

/** Serve only generated assets, never arbitrary files from the private repository. */
export async function serveReader(
  directory: string,
  port = 4173,
): Promise<Server> {
  const root = await realpath(directory);
  const server = createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Cache-Control', 'no-store');
    const host = request.headers.host;
    if (host && !/^127\.0\.0\.1:\d+$/.test(host)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    const name =
      request.url?.split('?')[0] === '/'
        ? 'index.html'
        : request.url?.split('?')[0].slice(1);
    if (!name || !assetNames.includes(name as (typeof assetNames)[number])) {
      response.writeHead(404).end('Not found');
      return;
    }
    try {
      const path = join(root, name);
      if (!(await lstat(path)).isFile()) {
        response.writeHead(404).end('Not found');
        return;
      }
      const data = await readFile(path);
      response.writeHead(200, { 'Content-Type': assetTypes[name] });
      response.end(request.method === 'HEAD' ? undefined : data);
    } catch {
      response.writeHead(404).end('Not found');
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });
  return server;
}
