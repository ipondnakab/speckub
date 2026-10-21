/** Version of the first SpecKub Markdown frontmatter contract. */
export const SPEC_VERSION = 1 as const;

/** Identifies a single endpoint independently of its implementation language. */
export interface EndpointIdentity {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  path: string;
}

export function isEndpointId(value: string): boolean {
  return /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(value);
}
