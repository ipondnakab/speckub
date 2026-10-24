import { describe, expect, it } from 'vitest';
import { discoverEndpointMarkdown, endpointSchema, isEndpointId, parseEndpointMarkdown, SPEC_VERSION } from './index.js';

const valid = `---
specVersion: 1
id: users.get-by-id
kind: http
method: GET
path: /api/users/{id}
summary: Get user by ID
source:
  - src/controllers/UserController.java
---
# Get user by ID

Returns a user.
`;

describe('SpecKub schema v1', () => {
  it('defines version 1 and stable IDs', () => {
    expect(SPEC_VERSION).toBe(1);
    expect(isEndpointId('users.get-by-id')).toBe(true);
    expect(isEndpointId('../secrets')).toBe(false);
  });

  it('parses valid Markdown and preserves the body', () => {
    const result = parseEndpointMarkdown(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('users.get-by-id');
      expect(result.body).toContain('Returns a user.');
    }
  });

  it('rejects missing frontmatter', () => {
    expect(parseEndpointMarkdown('# Hello').success).toBe(false);
  });

  it('rejects malformed YAML', () => {
    expect(parseEndpointMarkdown('---\nsummary: [unterminated\n---\n').success).toBe(false);
  });

  it('rejects unsupported spec versions', () => {
    expect(parseEndpointMarkdown(valid.replace('specVersion: 1', 'specVersion: 2')).success).toBe(false);
  });

  it('rejects invalid HTTP methods and paths', () => {
    expect(endpointSchema.safeParse({
      specVersion: 1, id: 'users.get', kind: 'http', method: 'FETCH',
      path: 'users', summary: 'Bad',
    }).success).toBe(false);
  });

  it('rejects source directory traversal', () => {
    expect(parseEndpointMarkdown(valid.replace('src/controllers/UserController.java', '../secret.env')).success).toBe(false);
  });

  it('rejects duplicate path parameters', () => {
    expect(parseEndpointMarkdown(valid.replace('/api/users/{id}', '/api/users/{id}/{id}')).success).toBe(false);
  });

  it('requires a non-empty summary', () => {
    expect(parseEndpointMarkdown(valid.replace('summary: Get user by ID', 'summary: "  "')).success).toBe(false);
  });
});


describe('Markdown discovery identity', () => {
  it('recognizes explicit and legacy specs and preserves tags', () => {
    expect(discoverEndpointMarkdown(valid)?.success).toBe(true);
    const result = discoverEndpointMarkdown(valid.replace('specVersion: 1', 'speckub: true\nspecVersion: 1\ntags: [users]'));
    expect(result?.success).toBe(true);
    if (result?.success) expect(result.data).toMatchObject({ speckub: true, tags: ['users'] });
  });
  it('ignores ordinary Markdown, unrelated YAML, fenced examples, and opted-out specs', () => {
    for (const text of ['# Hello', '---\nnull\n---', '---\n- item\n---', '---\ntitle: Guide\n---\nText', '---\ntitle: [broken\n---',
      '# Example\n```yaml\n' + valid + '\n```', valid.replace('specVersion: 1', 'speckub: false\nspecVersion: 1')]) {
      expect(discoverEndpointMarkdown(text)).toBeUndefined();
    }
  });
  it('reports malformed, incomplete, and unsupported explicitly marked specs', () => {
    for (const text of ['---\nspeckub: true\nsummary: [broken\n---', '---\nspeckub: true\n---',
      valid.replace('specVersion: 1', 'speckub: true\nspecVersion: 99'),
      valid.replace('specVersion: 1', 'speckub: "true"\nspecVersion: 1')]) {
      expect(discoverEndpointMarkdown(text)?.success).toBe(false);
    }
  });
});
