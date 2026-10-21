import { describe, expect, it } from 'vitest';
import { isEndpointId, SPEC_VERSION } from './index.js';

describe('SpecKub schema foundation', () => {
  it('defines version 1', () => {
    expect(SPEC_VERSION).toBe(1);
  });

  it('accepts stable endpoint IDs', () => {
    expect(isEndpointId('users.get-by-id')).toBe(true);
  });

  it('rejects unsafe or empty endpoint IDs', () => {
    expect(isEndpointId('../secrets')).toBe(false);
    expect(isEndpointId('')).toBe(false);
  });
});
