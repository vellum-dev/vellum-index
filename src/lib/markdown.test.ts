import { describe, it, expect } from 'vitest';
import { resolveMarkdownUrl } from '@/lib/markdown';

const README = 'https://raw.githubusercontent.com/owner/repo/main/docs/README.md';

describe('resolveMarkdownUrl', () => {
  it('resolves relative paths against the document folder', () => {
    expect(resolveMarkdownUrl('img/shot.png', README)).toBe(
      'https://raw.githubusercontent.com/owner/repo/main/docs/img/shot.png'
    );
  });

  it('keeps in-page anchors intact', () => {
    expect(resolveMarkdownUrl('#installation', README)).toBe('#installation');
  });

  it('keeps absolute and mailto URLs intact', () => {
    expect(resolveMarkdownUrl('https://example.com/a', README)).toBe('https://example.com/a');
    expect(resolveMarkdownUrl('mailto:dev@example.com', README)).toBe('mailto:dev@example.com');
  });

  it('drops javascript URLs', () => {
    expect(resolveMarkdownUrl('javascript:alert(1)', README)).toBe('');
  });
});
