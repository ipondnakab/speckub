import { discoverEndpoints, validateEndpoint } from '@speckub/core';

export interface CliIO {
  stdout: (message: string) => void;
  stderr: (message: string) => void;
}

const usage = `SpecKub CLI
Usage:
  speckub list [--root DIR] [--docs-dir DIR] [--json]
  speckub inspect ID [--root DIR] [--docs-dir DIR] [--json]
  speckub validate --id ID [--root DIR] [--docs-dir DIR] [--json]
  speckub --help
`;

type Options = {
  command: string;
  id?: string;
  root: string;
  docsDir: string;
  json: boolean;
};

function parseArgs(args: string[], cwd: string): Options {
  const [command = '--help', ...rest] = args;
  const options: Options = { command, root: cwd, docsDir: 'docs/api', json: false };
  let positional: string | undefined;
  for (let i = 0; i < rest.length; i++) {
    const argument = rest[i];
    if (argument === '--json') options.json = true;
    else if (argument === '--id' || argument === '--root' || argument === '--docs-dir') {
      const value = rest[++i];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${argument}`);
      if (argument === '--id') options.id = value;
      if (argument === '--root') options.root = value;
      if (argument === '--docs-dir') options.docsDir = value;
    } else if (!argument.startsWith('-') && !positional) positional = argument;
    else throw new Error(`Unexpected argument: ${argument}`);
  }
  if (command === 'inspect') {
    if (options.id && positional) throw new Error('Provide the endpoint ID only once');
    options.id = options.id ?? positional;
  } else if (positional) throw new Error(`Unexpected argument: ${positional}`);
  return options;
}

export async function runCli(args: string[], io: CliIO, cwd = process.cwd()): Promise<number> {
  let options: Options;
  try {
    options = parseArgs(args, cwd);
  } catch (error) {
    io.stderr(error instanceof Error ? error.message : String(error));
    io.stderr(usage);
    return 2;
  }

  if (options.command === '--help' || options.command === 'help' || options.command === '-h') {
    io.stdout(usage);
    return 0;
  }
  if (!['list', 'inspect', 'validate'].includes(options.command)) {
    io.stderr(`Unknown command: ${options.command}`);
    io.stderr(usage);
    return 2;
  }
  if ((options.command === 'inspect' || options.command === 'validate') && !options.id) {
    io.stderr('An endpoint ID is required');
    io.stderr(usage);
    return 2;
  }
  if (options.command === 'list' && options.id) {
    io.stderr('The list command does not accept --id');
    return 2;
  }

  try {
    if (options.command === 'validate') {
      const report = await validateEndpoint(options.root, options.id!, options.docsDir);
      if (options.json) io.stdout(JSON.stringify(report, null, 2));
      else {
        io.stdout(`${report.status.toUpperCase()} ${options.id} (${report.summary.errors} errors, ${report.summary.warnings} warnings)`);
        for (const issue of report.issues) io.stdout(`[${issue.code}] ${issue.file ?? ''} ${issue.message}`);
      }
      return report.status === 'passed' ? 0 : 1;
    }

    const discovery = await discoverEndpoints(options.root, options.docsDir);
    if (options.command === 'list') {
      if (options.json) io.stdout(JSON.stringify(discovery, null, 2));
      else {
        for (const endpoint of discovery.endpoints) {
          io.stdout(`${endpoint.spec.id}\t${endpoint.spec.method}\t${endpoint.spec.path}\t${endpoint.file}`);
        }
        for (const issue of discovery.issues) io.stderr(`[${issue.code}] ${issue.file ?? ''} ${issue.message}`);
      }
      return discovery.issues.length ? 1 : 0;
    }

    const match = discovery.endpoints.find((entry) => entry.spec.id === options.id);
    if (!match || discovery.issues.length) {
      for (const issue of discovery.issues) io.stderr(`[${issue.code}] ${issue.file ?? ''} ${issue.message}`);
      if (!match) io.stderr(`Endpoint not found: ${options.id}`);
      return 1;
    }
    if (options.json) io.stdout(JSON.stringify(match, null, 2));
    else io.stdout(`${match.spec.method} ${match.spec.path}\nID: ${match.spec.id}\nSummary: ${match.spec.summary}\nFile: ${match.file}`);
    return 0;
  } catch (error) {
    io.stderr(error instanceof Error ? error.message : String(error));
    return 1;
  }
}
