import { defaultUrlTransform } from 'react-markdown';

export function resolveMarkdownUrl(src: string, documentUrl: string): string {
  if (src.startsWith('data:')) return src;
  if (src.startsWith('#') || /^[a-z][a-z\d+.-]*:/i.test(src)) return defaultUrlTransform(src);
  const base = documentUrl.substring(0, documentUrl.lastIndexOf('/') + 1);
  return base + src;
}
