import { describe, expect, it } from 'vitest';
import { normalizeSafeHref } from '../src/shared/lib/errorPage';

describe('errorPage', () => {
  const BASE = 'https://jadualkelas.zis3c.dev';

  it('returns the path for a valid same-origin URL', () => {
    expect(normalizeSafeHref('/app', BASE)).toBe('/app');
    expect(normalizeSafeHref('/app?foo=bar', BASE)).toBe('/app?foo=bar');
    expect(normalizeSafeHref('/app#section', BASE)).toBe('/app#section');
  });

  it('returns null for cross-origin URLs', () => {
    expect(normalizeSafeHref('https://evil.com/path', BASE)).toBeNull();
    expect(normalizeSafeHref('https://jadualkelas.zis3c.dev.evil.com', BASE)).toBeNull();
  });

  it('returns null for non-http protocols', () => {
    expect(normalizeSafeHref('javascript:alert(1)', BASE)).toBeNull();
    expect(normalizeSafeHref('data:text/html,<h1>x</h1>', BASE)).toBeNull();
    expect(normalizeSafeHref('file:///etc/passwd', BASE)).toBeNull();
  });

  it('returns null for empty or invalid input', () => {
    expect(normalizeSafeHref('', BASE)).toBeNull();
    expect(normalizeSafeHref('   ', BASE)).toBeNull();
  });

  it('handles relative paths', () => {
    expect(normalizeSafeHref('app', BASE)).toBe('/app');
    expect(normalizeSafeHref('./app', BASE)).toBe('/app');
  });

  it('preserves query strings and hashes', () => {
    expect(normalizeSafeHref('/app?x=1&y=2#top', BASE)).toBe('/app?x=1&y=2#top');
  });
});
