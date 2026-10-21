import { mkdir, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export type Agent = 'codex' | 'claude' | 'cursor';
export interface InitResult {
  created: string[];
  skipped: string[];
}

const templates: Record<Agent, { source: string; destination: string }> = {
  codex: { source: 'AGENTS.md', destination: 'AGENTS.md' },
  claude: { source: 'CLAUDE.md', destination: 'CLAUDE.md' },
  cursor: { source: 'speckub.mdc', destination: '.cursor/rules/speckub.mdc' },
};

function within(root: string, target: string): boolean {
  const path = relative(root, target);
  return path === '' || (path !== '..' && !path.startsWith('..' + sep) && !isAbsolute(path));
}

async function ensureSafePath(root: string, destination: string): Promise<void> {
  if (!within(root, destination)) throw new Error('Target escapes project root');
  let cursor = dirname(destination);
  while (within(root, cursor)) {
    try {
      const info = await stat(cursor);
      const resolved = await realpath(cursor);
      if (!info.isDirectory() || !within(root, resolved)) throw new Error('Target parent is not a safe directory');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    if (cursor === root) break;
    cursor = dirname(cursor);
  }
}

export async function initProject(
  rootDir: string,
  docsDir = 'docs/api',
  agents: Agent[] = [],
): Promise<InitResult> {
  const root = await realpath(rootDir);
  const docs = resolve(root, docsDir);
  if (!within(root, docs) || docs === root) throw new Error('Documentation directory must be inside the project');
  await ensureSafePath(root, docs);
  const created: string[] = [];
  const skipped: string[] = [];
  const docsAlreadyExists = await stat(docs).then((value) => value.isDirectory()).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return false;
    throw error;
  });
  await mkdir(docs, { recursive: true });
  (docsAlreadyExists ? skipped : created).push(relative(root, docs).split(sep).join('/') + '/');

  const templateRoot = fileURLToPath(new URL('../templates/', import.meta.url));
  for (const agent of [...new Set(agents)]) {
    const template = templates[agent];
    if (!template) throw new Error(`Unsupported agent: ${agent}`);
    const target = join(root, template.destination);
    await ensureSafePath(root, target);
    await mkdir(dirname(target), { recursive: true });
    const source = await readFile(join(templateRoot, template.source), 'utf8');
    try {
      await writeFile(target, source, { flag: 'wx' });
      created.push(template.destination);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      skipped.push(template.destination);
    }
  }
  return { created, skipped };
}
