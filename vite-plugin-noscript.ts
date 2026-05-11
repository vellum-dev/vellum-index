import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { Plugin } from 'vite';

interface PackageVersion {
  pkgdesc?: string;
  upstream_author?: string;
  maintainer?: string;
  url?: string;
}

interface PackagesMetadata {
  packages: Record<string, Record<string, PackageVersion>>;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function generateNoscript(root: string): string {
  const raw = readFileSync(resolve(root, 'src/data/packages-metadata.json'), 'utf-8');
  const data: PackagesMetadata = JSON.parse(raw);
  const entries = Object.entries(data.packages).sort(([a], [b]) => a.localeCompare(b));

  const rows = entries.map(([name, versions]) => {
    const latest = Object.keys(versions).pop()!;
    const info = versions[latest];
    const desc = escapeHtml(info.pkgdesc ?? '');
    const author = escapeHtml(info.upstream_author || info.maintainer || '');
    const url = info.url ?? '';
    const link = url
      ? `<a href="${escapeHtml(url)}" class="font-medium text-primary underline">${escapeHtml(name)}</a>`
      : `<span class="font-medium">${escapeHtml(name)}</span>`;
    return `            <tr class="border-b"><td class="py-3 px-4">${link}<p class="text-sm text-muted-foreground mt-1">${desc}</p></td><td class="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">${author}</td></tr>`;
  });

  return `<noscript>
      <div class="min-h-screen flex flex-col bg-background text-foreground">
        <header class="border-b">
          <div class="w-full lg:max-w-[90%] mx-auto px-4 py-4 flex items-center gap-3">
            <img src="/vellum-logo.svg" alt="Vellum" class="h-12 w-12" />
            <span class="text-2xl font-bold">Vellum Package Index</span>
          </div>
        </header>
        <main class="flex-1 w-full lg:max-w-[90%] mx-auto px-4 py-6">
          <p class="text-sm text-muted-foreground mb-4">${entries.length} packages available. Enable JavaScript for search, filtering, and package details.</p>
          <div class="border rounded-lg overflow-hidden">
            <table class="w-full">
              <thead><tr class="border-b bg-muted/50"><th class="py-3 px-4 text-left text-sm font-medium">Package</th><th class="py-3 px-4 text-left text-sm font-medium">Author</th></tr></thead>
              <tbody>
${rows.join('\n')}
              </tbody>
            </table>
          </div>
        </main>
        <footer class="border-t">
          <div class="w-full lg:max-w-[90%] mx-auto px-4 py-4 flex items-center justify-between">
            <p class="text-sm text-muted-foreground">Vellum Package Index</p>
            <a href="https://github.com/vellum-dev" class="text-sm text-muted-foreground">GitHub</a>
          </div>
        </footer>
      </div>
    </noscript>`;
}

export default function noscriptPlugin(): Plugin {
  return {
    name: 'vite-plugin-noscript',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const root = ctx.server?.config.root ?? process.cwd();
        const noscript = generateNoscript(root);
        return html.replace('<!-- noscript-placeholder -->', noscript);
      },
    },
  };
}
