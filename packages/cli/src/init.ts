import { lstat, mkdir, readFile, realpath, stat, writeFile } from 'node:fs/promises';
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

export async function ensureSafePath(root: string, destination: string): Promise<void> {
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

export const workflowSkills = ['scan', 'relations', 'create', 'validate', 'clarify', 'template'] as const;
export type InstalledSkill = { path: string; status: 'created' | 'skipped' | 'would-create' };

async function installFile(root: string, path: string, content: string, dryRun: boolean): Promise<InstalledSkill> {
  const target = join(root, path);
  await ensureSafePath(root, target);
  try {
    const info = await lstat(target);
    if (!info.isFile()) throw new Error(`Installation target is not a regular file: ${path}`);
    return { path, status: 'skipped' };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  if (dryRun) return { path, status: 'would-create' };
  await mkdir(dirname(target), { recursive: true });
  try {
    await writeFile(target, content, { flag: 'wx' });
    return { path, status: 'created' };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    return { path, status: 'skipped' };
  }
}

export async function installWorkflowSkills(rootDir: string, dryRun = false, agents: Agent[] = []): Promise<InstalledSkill[]> {
  const root = await realpath(rootDir);
  const installed: InstalledSkill[] = [];
  for (const action of workflowSkills) {
    const path = `.agents/skills/speckub-${action}/SKILL.md`;
    const content = await readFile(new URL(`../templates/skills/speckub-${action}/SKILL.md`, import.meta.url), 'utf8');
    installed.push(await installFile(root, path, content, dryRun));
    if (action === 'create') {
      for (const name of ['api-document.md', 'sequence-diagrams.md']) {
        const resource = `skills/speckub-create/references/${name}`;
        const reference = await readFile(new URL(`../templates/${resource}`, import.meta.url), 'utf8');
        installed.push(await installFile(root, `.agents/${resource}`, reference, dryRun));
      }
    }
    for (const agent of [...new Set(agents)]) {
      if (agent === 'codex') continue;
      const commandPath = `.${agent === 'claude' ? 'claude' : 'cursor'}/commands/speckub.${action}.md`;
      const argumentsText = agent === 'claude' ? '$ARGUMENTS' : 'Use the prompt, route prefix, or source path supplied after this command.';
      const command = `Read ${path} and follow its workflow in this repository.\n\nUser scope/corrections: ${argumentsText}\n`;
      installed.push(await installFile(root, commandPath, command, dryRun));
    }
  }
  installed.push(...await installDocumentTemplates(root, dryRun));
  return installed;
}

async function installDocumentTemplates(root: string, dryRun = false): Promise<InstalledSkill[]> {
  const files = [
    { source: 'api-template.md', destination: '.speckub/templates/api.md' },
    { source: 'api-example.md', destination: '.speckub/examples/api.md' },
  ];
  const installed: InstalledSkill[] = [];
  for (const file of files) {
    const content = await readFile(new URL(`../templates/documents/${file.source}`, import.meta.url), 'utf8');
    installed.push(await installFile(root, file.destination, content, dryRun));
  }
  return installed;
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
  if (agents.length) {
    for (const skill of await installWorkflowSkills(root, false, agents)) {
      (skill.status === 'created' ? created : skipped).push(skill.path);
    }
  } else {
    for (const file of await installDocumentTemplates(root)) {
      (file.status === 'created' ? created : skipped).push(file.path);
    }
  }
  return { created, skipped };
}
