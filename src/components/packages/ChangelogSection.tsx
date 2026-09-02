import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Badge } from '@/components/ui/badge';
import { compareVersions } from '@/hooks/usePackages';
import type { FlatPackage } from '@/types/packages';

interface ChangelogSectionProps {
  versions: FlatPackage[];
}

interface ReleaseRow {
  pkgver: string;
  release: FlatPackage | null;
  previous: FlatPackage | null;
}

function pkgver(version: string): string {
  return version.replace(/-r\d+$/, '');
}

function formatDate(released: string | undefined): string | null {
  if (!released) return null;
  const date = new Date(released);
  return isNaN(date.getTime()) ? released : date.toLocaleDateString();
}

function inclusiveMax(version: string): string {
  return (parseFloat(version) - 0.01).toFixed(2);
}

function osRange(pkg: FlatPackage): string | null {
  const constraints = pkg.os_constraints ?? [];
  const exact = constraints.find((c) => c.operator === '=');
  if (exact) return exact.version;

  const min = constraints.find((c) => c.operator === '>=')?.version ?? pkg.os_min;
  const max = constraints.find((c) => c.operator === '<')?.version ?? pkg.os_max;

  if (min && max) {
    const maxInclusive = inclusiveMax(max);
    return min === maxInclusive ? min : `${min}–${maxInclusive}`;
  }
  if (min) return `${min}+`;
  if (max) return `≤ ${inclusiveMax(max)}`;
  return null;
}

function derivedChanges(release: FlatPackage, previous: FlatPackage | null): string[] {
  if (!previous) return ['First release in the index.'];

  const changes: string[] = [];

  const before = osRange(previous);
  const after = osRange(release);
  if (before !== after) {
    changes.push(
      after
        ? `OS support ${before ? `changed from ${before} to ${after}` : `set to ${after}`}.`
        : 'OS bounds removed.'
    );
  }

  const addedDepends = release.depends.filter((dep) => !previous.depends.includes(dep));
  const droppedDepends = previous.depends.filter((dep) => !release.depends.includes(dep));
  if (addedDepends.length) changes.push(`Now requires ${addedDepends.join(', ')}.`);
  if (droppedDepends.length) changes.push(`No longer requires ${droppedDepends.join(', ')}.`);

  const addedArch = release.arch.filter((arch) => !previous.arch.includes(arch));
  const droppedArch = previous.arch.filter((arch) => !release.arch.includes(arch));
  if (addedArch.length) changes.push(`Added ${addedArch.join(', ')} builds.`);
  if (droppedArch.length) changes.push(`Dropped ${droppedArch.join(', ')} builds.`);

  const addedDevices = release.devices.filter((device) => !previous.devices.includes(device));
  const droppedDevices = previous.devices.filter((device) => !release.devices.includes(device));
  if (addedDevices.length) changes.push(`Added support for ${addedDevices.join(', ')}.`);
  if (droppedDevices.length) changes.push(`Dropped support for ${droppedDevices.join(', ')}.`);

  if (release.status !== previous.status) changes.push(`Marked ${release.status}.`);
  if (release.license !== previous.license) changes.push(`License changed to ${release.license}.`);

  if (!changes.length) changes.push('No index metadata changed in this release.');
  return changes;
}

function sectionsByVersion(markdown: string): Map<string, string> {
  const sections = new Map<string, string>();
  let current: string | null = null;
  let body: string[] = [];

  const commit = () => {
    if (current && body.length) sections.set(current, body.join('\n').trim());
  };

  for (const line of markdown.split('\n')) {
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    const version = heading ? heading[2].match(/(\d+(?:\.\d+)+)/) : null;
    if (heading && version) {
      commit();
      current = version[1];
      body = [];
      continue;
    }
    if (current) body.push(line);
  }
  commit();
  return sections;
}

function releaseRows(versions: FlatPackage[]): ReleaseRow[] {
  const newestBuilds: FlatPackage[] = [];
  for (const version of [...versions].sort((a, b) => compareVersions(b.version, a.version))) {
    if (newestBuilds.some((build) => pkgver(build.version) === pkgver(version.version))) continue;
    newestBuilds.push(version);
  }
  return newestBuilds.map((release, i) => ({
    pkgver: pkgver(release.version),
    release,
    previous: newestBuilds[i + 1] ?? null,
  }));
}

const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => <h4 className="text-sm font-semibold mt-3 mb-1">{children}</h4>,
  h2: ({ children }: { children?: React.ReactNode }) => <h4 className="text-sm font-semibold mt-3 mb-1">{children}</h4>,
  h3: ({ children }: { children?: React.ReactNode }) => <h4 className="text-sm font-semibold mt-3 mb-1">{children}</h4>,
  p: ({ children }: { children?: React.ReactNode }) => <p className="my-1.5 leading-relaxed">{children}</p>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="my-1.5 ml-5 list-disc space-y-0.5">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="my-1.5 ml-5 list-decimal space-y-0.5">{children}</ol>,
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
      {children}
    </a>
  ),
  code: ({ className, children }: { className?: string; children?: React.ReactNode }) =>
    className?.includes('language-') ? (
      <pre className="my-2 p-3 bg-muted rounded-md overflow-x-auto">
        <code className="text-xs">{children}</code>
      </pre>
    ) : (
      <code className="px-1 py-0.5 bg-muted rounded text-xs">{children}</code>
    ),
  pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }: { children?: React.ReactNode }) => <th className="border px-3 py-1.5 bg-muted text-left font-semibold">{children}</th>,
  td: ({ children }: { children?: React.ReactNode }) => <td className="border px-3 py-1.5">{children}</td>,
};

export function ChangelogSection({ versions }: ChangelogSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const rows = useMemo(() => releaseRows(versions), [versions]);
  const changelogUrl = rows.find((row) => row.release?.changelogurl)?.release?.changelogurl ?? null;

  useEffect(() => {
    setNotes(null);
    if (!expanded || !changelogUrl) return;
    let cancelled = false;

    setLoading(true);
    fetch(changelogUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        if (!cancelled) setNotes(text);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [expanded, changelogUrl]);

  const sections = useMemo(
    () => (notes ? sectionsByVersion(notes) : new Map<string, string>()),
    [notes]
  );
  const alignsToReleases = sections.size > 0;

  // The index prunes old versions, so a changelog can document versions it no
  // longer carries.
  const railRows = useMemo(() => {
    const combined = [...rows];
    for (const version of sections.keys()) {
      if (!combined.some((row) => row.pkgver === version)) {
        combined.push({ pkgver: version, release: null, previous: null });
      }
    }
    return combined.sort((a, b) => compareVersions(b.pkgver, a.pkgver));
  }, [rows, sections]);

  if (rows.length === 0) return null;

  const latestPkgver = pkgver(versions[0].latestVersion);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer"
      >
        <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? '' : '-rotate-90'}`} />
        Changelog
      </button>
      {expanded && (
        <div className="mt-3 border rounded-md p-4 bg-card text-sm">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && (
            <>
              {notes && !alignsToReleases && (
                <>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {notes}
                  </ReactMarkdown>
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mt-6 mb-3">
                    Release history
                  </div>
                </>
              )}

              {!notes && (
                <p className="text-xs text-muted-foreground mb-4">
                  This package does not publish release notes. Below is what changed in the index
                  between releases.
                </p>
              )}

              <div>
                {railRows.map((row) => {
                  const date = formatDate(row.release?.released);
                  return (
                    <div
                      key={row.pkgver}
                      className="relative pl-[22px] pb-[18px] last:pb-0 before:absolute before:left-1 before:top-4 before:bottom-0 before:w-px before:bg-border last:before:hidden after:absolute after:left-0 after:top-1.5 after:h-[9px] after:w-[9px] after:rounded-full after:border after:border-border after:bg-background"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{row.pkgver}</span>
                        {row.pkgver === latestPkgver && <Badge variant="outline">Latest</Badge>}
                        {!row.release && (
                          <span className="text-xs text-muted-foreground">Not in the index</span>
                        )}
                      </div>
                      {date && <p className="text-xs text-muted-foreground mb-1.5">{date}</p>}
                      {alignsToReleases ? (
                        sections.has(row.pkgver) ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                            {sections.get(row.pkgver)!}
                          </ReactMarkdown>
                        ) : (
                          <p className="text-xs text-muted-foreground">No notes for this release.</p>
                        )
                      ) : !notes && row.release ? (
                        <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                          {derivedChanges(row.release, row.previous).map((change) => (
                            <li key={change}>{change}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
