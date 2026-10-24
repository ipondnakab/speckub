import matter from 'gray-matter';
import { z } from 'zod';

export const SPEC_VERSION = 1 as const;

const httpMethodSchema = z.enum([
  'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS',
]);

const endpointIdSchema = z.string().regex(
  /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/,
  'Endpoint ID must use lowercase alphanumeric segments separated by dots or hyphens',
);

const sourcePathSchema = z.string().min(1).refine(
  (value) =>
    !value.startsWith('/') &&
    !value.includes('\\') &&
    !value.split('/').some((segment) => segment === '..' || segment === '.'),
  'Source paths must be repository-relative and must not traverse directories',
);

export const endpointSchema = z.object({
  speckub: z.literal(true).optional(),
  specVersion: z.literal(SPEC_VERSION),
  id: endpointIdSchema,
  kind: z.literal('http'),
  method: httpMethodSchema,
  path: z.string().startsWith('/').min(1),
  summary: z.string().trim().min(1),
  source: z.array(sourcePathSchema).optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
}).superRefine((value, ctx) => {
  const pathParameters = [...value.path.matchAll(/\{([^{}]+)\}/g)].map((match) => match[1]);
  if (pathParameters.some((name) => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name))) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['path'], message: 'Invalid path parameter name' });
  }
  if (new Set(pathParameters).size !== pathParameters.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['path'], message: 'Duplicate path parameter' });
  }
});

export type EndpointSpec = z.infer<typeof endpointSchema>;
export type EndpointIdentity = Pick<EndpointSpec, 'id' | 'method' | 'path'>;

export function isEndpointId(value: string): boolean {
  return endpointIdSchema.safeParse(value).success;
}

export type ParseResult =
  | { success: true; data: EndpointSpec; body: string }
  | { success: false; issues: Array<{ path: string; message: string }> };

export function parseEndpointMarkdown(markdown: string): ParseResult {
  if (!/^---\r?\n/.test(markdown)) {
    return { success: false, issues: [{ path: 'frontmatter', message: 'Missing YAML frontmatter' }] };
  }

  let parsed: matter.GrayMatterFile<string>;
  try {
    // Disable the global cache: failed YAML parses must not become cached empty data.
    parsed = matter(markdown, {});
  } catch (error) {
    return {
      success: false,
      issues: [{ path: 'frontmatter', message: error instanceof Error ? error.message : 'Invalid YAML frontmatter' }],
    };
  }

  const result = endpointSchema.safeParse(parsed.data);
  if (!result.success) {
    return {
      success: false,
      issues: result.error.issues.map((issue) => ({
        path: issue.path.join('.') || 'frontmatter',
        message: issue.message,
      })),
    };
  }
  return { success: true, data: result.data, body: parsed.content };
}

/** Classify Markdown without treating unrelated documentation as an invalid spec.
 * Explicit false opts out (for templates/examples). Legacy valid v1 specs remain
 * discoverable; invalid legacy candidates retain actionable validation errors.
 */
export function discoverEndpointMarkdown(markdown: string): ParseResult | undefined {
  if (!/^---\r?\n/.test(markdown)) return undefined;
  let data: Record<string, unknown>;
  try {
    data = matter(markdown, {}).data;
  } catch {
    // Malformed YAML cannot be classified structurally. Only inspect its header,
    // never fenced examples or prose in the document body.
    const header = markdown.slice(markdown.indexOf('\n') + 1).split(/^---\s*$/m, 1)[0];
    if (!/^(?:speckub|["']speckub["'])\s*:/m.test(header) &&
        !(/^specVersion\s*:/m.test(header) && /^kind\s*:\s*http\s*$/m.test(header))) return undefined;
    return parseEndpointMarkdown(markdown);
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return undefined;
  if (data.speckub === false) return undefined;
  if (Object.hasOwn(data, 'speckub') ||
      (Object.hasOwn(data, 'specVersion') && data.kind === 'http')) {
    return parseEndpointMarkdown(markdown);
  }
  return undefined;
}
