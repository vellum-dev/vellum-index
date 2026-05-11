import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, Loader2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface ReadmeSectionProps {
  url: string | null;
}

function resolveUrl(src: string, baseUrl: string): string {
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
    return src;
  }
  const base = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
  return base + src;
}

function stripHtmlComments(text: string): string {
  return text.replace(/<!--[\s\S]*?-->/g, '');
}

function stripVellumBadges(text: string): string {
  return text.replace(/\[!\[vellum\]\([^)]*\)\]\(https?:\/\/vellum\.delivery[^)]*\)\n?/g, '');
}

function textContent(node: ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textContent).join('');
  if (node && typeof node === 'object' && 'props' in node) return textContent((node as { props: { children?: ReactNode } }).props.children);
  return '';
}

function githubSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

function trimToAnchor(markdown: string, anchor: string): string {
  const lines = markdown.split('\n');
  const headingPattern = /^(#{1,6})\s+(.+)$/;
  let startIdx = -1;
  let startLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(headingPattern);
    if (match && githubSlug(match[2]) === anchor) {
      startIdx = i;
      startLevel = match[1].length;
      break;
    }
  }

  if (startIdx === -1) return markdown;

  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    const match = lines[i].match(headingPattern);
    if (match && match[1].length <= startLevel) {
      endIdx = i;
      break;
    }
  }

  return lines.slice(startIdx + 1, endIdx).join('\n');
}

export function ReadmeSection({ url }: ReadmeSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [rawContent, setRawContent] = useState<string | null>(null);
  const [cachedUrl, setCachedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  const fetchUrl = url?.split('#')[0] || null;
  const initialAnchor = url?.includes('#') ? url.split('#')[1] : null;
  const baseUrl = fetchUrl || '';
  const slugCounts = useRef<Record<string, number>>({});
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!expanded || !fetchUrl) return;
    slugCounts.current = {};

    if (cachedUrl === fetchUrl && rawContent) return;

    setRawContent(null);
    setLoading(true);
    setError(null);
    fetch(fetchUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        setRawContent(text);
        setCachedUrl(fetchUrl);
      })
      .catch(() => setError('Failed to load readme'))
      .finally(() => setLoading(false));
  }, [expanded, fetchUrl]);

  const content = useMemo(() => {
    if (!rawContent) return null;
    const cleaned = stripHtmlComments(rawContent);
    if (initialAnchor) {
      return stripVellumBadges(trimToAnchor(cleaned, initialAnchor));
    }
    return cleaned;
  }, [rawContent, initialAnchor]);

  const getSlug = useCallback((children: ReactNode) => {
    const raw = githubSlug(textContent(children));
    const count = slugCounts.current[raw] || 0;
    slugCounts.current[raw] = count + 1;
    return count === 0 ? raw : `${raw}-${count}`;
  }, []);

  if (!url) return null;

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer"
      >
        <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? '' : '-rotate-90'}`} />
        Readme
      </button>
      {expanded && (
        <div className="mt-3 relative" ref={contentRef}>
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {error && <p className="text-destructive text-sm">{error}</p>}
          {content && (
            <div className="readme-content text-sm border rounded-md p-4 bg-card">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                urlTransform={(src) => resolveUrl(src, baseUrl)}
                components={{
                  h1: ({ children }) => <h1 id={getSlug(children)} className="text-2xl font-bold mt-6 mb-3 pb-2 border-b first:mt-0">{children}</h1>,
                  h2: ({ children }) => <h2 id={getSlug(children)} className="text-xl font-semibold mt-5 mb-2 pb-1 border-b">{children}</h2>,
                  h3: ({ children }) => <h3 id={getSlug(children)} className="text-lg font-semibold mt-4 mb-2">{children}</h3>,
                  h4: ({ children }) => <h4 id={getSlug(children)} className="text-base font-semibold mt-3 mb-1">{children}</h4>,
                  p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="my-2 ml-6 list-disc space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="my-2 ml-6 list-decimal space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  a: ({ href, children }) => {
                    if (href?.startsWith('#')) {
                      return (
                        <button
                          className="text-primary hover:underline"
                          onClick={() => {
                            const el = contentRef.current?.querySelector(`#${CSS.escape(href.slice(1))}`);
                            el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }}
                        >
                          {children}
                        </button>
                      );
                    }
                    return (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {children}
                      </a>
                    );
                  },
                  code: ({ className, children }) => {
                    const isBlock = className?.includes('language-');
                    if (isBlock) {
                      return (
                        <pre className="my-3 p-3 bg-muted rounded-md overflow-x-auto">
                          <code className="text-xs">{children}</code>
                        </pre>
                      );
                    }
                    return <code className="px-1 py-0.5 bg-muted rounded text-xs">{children}</code>;
                  },
                  pre: ({ children }) => <>{children}</>,
                  blockquote: ({ children }) => (
                    <blockquote className="my-3 pl-4 border-l-4 border-muted-foreground/30 text-muted-foreground italic">
                      {children}
                    </blockquote>
                  ),
                  table: ({ children }) => (
                    <div className="my-3 overflow-x-auto">
                      <table className="w-full border-collapse text-sm">{children}</table>
                    </div>
                  ),
                  th: ({ children }) => <th className="border px-3 py-1.5 bg-muted text-left font-semibold">{children}</th>,
                  td: ({ children }) => <td className="border px-3 py-1.5">{children}</td>,
                  img: ({ src, alt, height, width }) => (
                    <img
                      src={src}
                      alt={alt || ''}
                      style={{
                        ...(height ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
                        ...(width ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
                      }}
                      className="max-w-full my-2 rounded cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => src && setEnlargedImage(src)}
                    />
                  ),
                  hr: () => <hr className="my-4 border-t" />,
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
          {enlargedImage && (
            <div
              className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center cursor-pointer"
              onClick={() => setEnlargedImage(null)}
            >
              <img
                src={enlargedImage}
                alt=""
                className="max-w-[95%] max-h-[90%] object-contain rounded"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={() => setEnlargedImage(null)}
                className="absolute top-3 right-3 text-white opacity-70 hover:opacity-100 transition-opacity"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
