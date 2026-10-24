import { realpath } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureSafePath, installWorkflowSkills } from './init.js';

/** Prepare the agent skill; repository analysis is performed by the coding agent. */
export async function prepareScan(
  rootDir: string,
  docsDir = 'docs/api',
  dryRun = false,
) {
  const root = await realpath(rootDir);
  const docs = resolve(root, docsDir);
  const rel = relative(root, docs);
  if (!rel || rel === '..' || rel.startsWith('..' + sep) || isAbsolute(rel)) {
    throw new Error('Documentation directory must be inside the project');
  }
  await ensureSafePath(root, resolve(docs, '.speckub-path-check'));
  const skills = await installWorkflowSkills(root, dryRun);
  const skill = skills[0];
  const cli = `${JSON.stringify(process.execPath)} ${JSON.stringify(fileURLToPath(new URL('./bin.js', import.meta.url)))}`;
  return {
    mode: 'agent-skill' as const,
    root,
    docsDir: resolve(root, docsDir),
    skill: skill.path,
    skills,
    status: skill.status,
    prompt: `Read ${JSON.stringify(resolve(root, skill.path))} and use the speckub-scan skill to scan ${JSON.stringify(root)} and prepare an API inventory at .speckub/scan.md for later documentation in ${JSON.stringify(resolve(root, docsDir))}. Discover the language and framework from this repository. Do not create or update endpoint documentation during scan. Preserve existing endpoint IDs and handwritten documentation. Use this CLI invocation for list and validate: ${cli}. Pass --root ${JSON.stringify(root)} --docs-dir ${JSON.stringify(docs)}. Report coverage and uncertainties. Next use speckub-relations to map API/service interactions at .speckub/relations.md before creating docs. Creating docs is a separate speckub-create skill; AI review and corrections are optional speckub-validate and speckub-clarify skills.`,
  };
}
