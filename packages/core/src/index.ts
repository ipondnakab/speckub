import { readFile, readdir, realpath, stat } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { discoverEndpointMarkdown, type EndpointSpec } from '@speckub/schema';

export interface ValidationIssue {
  code: string;
  severity: 'error' | 'warning';
  message: string;
  file?: string;
  path?: string;
}

export interface DiscoveredEndpoint {
  file: string;
  spec: EndpointSpec;
}

export interface ValidationReport {
  reportVersion: 1;
  tool: 'speckub';
  status: 'passed' | 'failed';
  endpoint?: Pick<EndpointSpec, 'id' | 'method' | 'path'> & { specFile: string };
  checks: {
    structural: 'passed' | 'failed';
    references: 'passed' | 'failed' | 'skipped';
    semantic: 'skipped';
  };
  summary: { errors: number; warnings: number };
  issues: ValidationIssue[];
  generatedAt: string;
}

export interface DiscoveryResult {
  endpoints: DiscoveredEndpoint[];
  issues: ValidationIssue[];
}

function inside(root: string, candidate: string): boolean {
  const rel = relative(root, candidate);
  return rel === '' || (rel !== '..' && !rel.startsWith('..' + sep) && !isAbsolute(rel));
}

const excludedDirectories = new Set([
  '.git', 'node_modules', '.pnpm-store', 'dist', 'build', 'coverage',
  '.next', '.nuxt', '.turbo', '.cache', 'vendor', '.venv', 'venv',
  '.speckub', '.agents', '.claude', '.cursor', '.codex',
]);

export interface DiscoveryOptions {
  /** Additional repository-relative directories to omit, such as reader output. */
  excludeDirs?: string[];
}

async function walk(current: string, output: string[], excluded: string[]): Promise<void> {
  for (const entry of await readdir(current, { withFileTypes: true })) {
    const absolute = join(current, entry.name);
    if (entry.isSymbolicLink() || excluded.some((dir) => inside(dir, absolute))) continue;
    if (entry.isDirectory()) {
      if (!excludedDirectories.has(entry.name)) await walk(absolute, output, excluded);
    } else if (entry.isFile() && /\.md$/i.test(entry.name)) output.push(absolute);
  }
}

/** Discover marked and legacy specs across the repository, without following symlinks. */
export async function discoverEndpoints(
  repositoryRoot: string,
  docsDir = '.',
  options: DiscoveryOptions = {},
): Promise<DiscoveryResult> {
  const root = await realpath(repositoryRoot);
  const directory = resolve(root, docsDir);
  if (!inside(root, directory)) throw new Error('Documentation directory escapes repository root');
  const docsRoot = await realpath(directory);
  if (!inside(root, docsRoot)) throw new Error('Documentation directory resolves outside repository root');

  const files: string[] = [];
  const excluded = (options.excludeDirs ?? []).map((dir) => resolve(root, dir));
  await walk(docsRoot, files, excluded);
  files.sort();
  const endpoints: DiscoveredEndpoint[] = [];
  const issues: ValidationIssue[] = [];
  const ids = new Map<string, string>();

  for (const file of files) {
    const relativeFile = relative(root, file).split(sep).join('/');
    const source = await readFile(file, 'utf8');
    const result = discoverEndpointMarkdown(source);
    if (!result) continue;
    if (!result.success) {
      issues.push(...result.issues.map((issue) => ({
        code: 'INVALID_SPEC',
        severity: 'error' as const,
        message: issue.message,
        file: relativeFile,
        path: issue.path,
      })));
      continue;
    }
    const previous = ids.get(result.data.id);
    if (previous) {
      issues.push({
        code: 'DUPLICATE_ENDPOINT_ID',
        severity: 'error',
        message: `Endpoint ID ${result.data.id} already exists in ${previous}`,
        file: relativeFile,
      });
      continue;
    }
    ids.set(result.data.id, relativeFile);
    endpoints.push({ file: relativeFile, spec: result.data });
  }
  return { endpoints, issues };
}

/** Structural validation is deterministic and does not claim AI verification. */
export async function validateEndpoint(
  repositoryRoot: string,
  id: string,
  docsDir = '.',
): Promise<ValidationReport> {
  const root = await realpath(repositoryRoot);
  const discovery = await discoverEndpoints(root, docsDir);
  const match = discovery.endpoints.find((entry) => entry.spec.id === id);
  const issues = [...discovery.issues];
  if (!match) {
    issues.push({ code: 'ENDPOINT_NOT_FOUND', severity: 'error', message: `Endpoint not found: ${id}` });
  }

  let references: 'passed' | 'failed' | 'skipped' = 'skipped';
  if (match && match.spec.source?.length) {
    references = 'passed';
    for (const source of match.spec.source) {
      const file = resolve(root, source);
      if (!inside(root, file)) {
        issues.push({ code: 'INVALID_SOURCE_PATH', severity: 'error', message: `Source path escapes repository: ${source}`, file: match.file });
        references = 'failed';
        continue;
      }
      try {
        const actual = await realpath(file);
        if (!inside(root, actual) || !(await stat(actual)).isFile()) throw new Error('Invalid file');
      } catch {
        issues.push({ code: 'SOURCE_NOT_FOUND', severity: 'error', message: `Source reference is unavailable: ${source}`, file: match.file });
        references = 'failed';
      }
    }
  }

  const errors = issues.filter((issue) => issue.severity === 'error').length;
  const warnings = issues.filter((issue) => issue.severity === 'warning').length;
  return {
    reportVersion: 1,
    tool: 'speckub',
    status: errors ? 'failed' : 'passed',
    ...(match ? { endpoint: { id: match.spec.id, method: match.spec.method, path: match.spec.path, specFile: match.file } } : {}),
    checks: {
      structural: discovery.issues.length || !match ? 'failed' : 'passed',
      references,
      semantic: 'skipped',
    },
    summary: { errors, warnings },
    issues,
    generatedAt: new Date().toISOString(),
  };
}
