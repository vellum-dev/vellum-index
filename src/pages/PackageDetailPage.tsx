import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { usePackages } from '@/hooks/usePackages';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { DeviceBadge } from '@/components/packages/DeviceBadge';
import type { FlatPackage } from '@/types/packages';

function parseDepName(dep: string): string {
  return dep.split(/[<>=]/)[0];
}

function DownloadButton({ name, currentPkg }: { name: string; currentPkg: FlatPackage }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const downloadArchs = useMemo(() => {
    const nonNoarch = currentPkg.arch.filter((a) => a !== 'noarch');
    if (nonNoarch.length === 0) return ['aarch64'] as const;
    return nonNoarch;
  }, [currentPkg.arch]);

  const buildUrl = (arch: string) =>
    `https://packages.vellum.delivery/${arch}/${name}-${currentPkg.version}.apk`;

  if (downloadArchs.length === 1) {
    return (
      <a
        href={buildUrl(downloadArchs[0])}
        className="text-sm text-primary hover:underline"
      >
        {downloadArchs[0]}
      </a>
    );
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        Download
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 bg-popover border rounded-md shadow-md z-10 py-1 min-w-[140px]">
          {downloadArchs.map((arch) => (
            <a
              key={arch}
              href={buildUrl(arch)}
              className="block px-3 py-1.5 text-sm text-primary hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              {arch}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function PackageActions({ name, currentPkg }: { name: string; currentPkg: FlatPackage }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-2">Package Actions</h3>
      <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
        <a
          href={`https://github.com/vellum-dev/vellum/tree/main/packages/${name}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline"
        >
          Source Files
        </a>
        <a
          href={`https://github.com/vellum-dev/vellum/issues/new?title=${encodeURIComponent(`[${name}] - Bug Report`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline"
        >
          Report a Bug
        </a>
        <a
          href={`https://github.com/vellum-dev/vellum/issues/new?title=${encodeURIComponent(`[${name}] - Out of Date`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline"
        >
          Flag Package Out-of-Date
        </a>
        <DownloadButton name={name} currentPkg={currentPkg} />
      </div>
    </div>
  );
}

export function PackageDetailPage() {
  const { name } = useParams<{ name: string }>();
  const [searchParams] = useSearchParams();
  const { packages } = usePackages();
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  const packageVersions = packages.filter((p) => p.name === name);
  const latest = packageVersions.find((p) => p.version === p.latestVersion);

  if (!latest) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-2">Package not found</h1>
        <p className="text-muted-foreground mb-4">
          The package "{name}" does not exist.
        </p>
        <Link to="/" className="text-primary hover:underline">
          Back to packages
        </Link>
      </div>
    );
  }

  const currentPkg = selectedVersion
    ? packageVersions.find((p) => p.version === selectedVersion) ?? latest
    : latest;

  const filteredDepends = currentPkg.depends.filter((dep) => dep !== '/bin/sh');

  return (
    <div>
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={searchParams.size > 0 ? `/?${searchParams}` : '/'}>Packages</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{name}</CardTitle>
          <p className="text-muted-foreground">{currentPkg.pkgdesc}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="order-1">
              <dt className="text-sm font-medium text-muted-foreground">Version</dt>
              <dd>
                {packageVersions.length > 1 ? (
                  <Select
                    value={selectedVersion ?? currentPkg.version}
                    onValueChange={setSelectedVersion}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {packageVersions.map((p) => (
                        <SelectItem key={p.version} value={p.version}>
                          {p.version}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-sm">{currentPkg.version}</span>
                )}
              </dd>
            </div>
            <div className="order-2">
              <dt className="text-sm font-medium text-muted-foreground">Author</dt>
              <dd>
                <Link
                  to={`/author/${encodeURIComponent(currentPkg.upstream_author)}`}
                  className="text-primary hover:underline"
                >
                  {currentPkg.upstream_author}
                </Link>
              </dd>
            </div>
            <div className="order-3 sm:order-4">
              <dt className="text-sm font-medium text-muted-foreground">Package Maintainer</dt>
              <dd>{currentPkg.maintainer.replace(/<[^>]+>/g, '').trim()}</dd>
            </div>
            <div className="order-4 sm:order-3">
              <dt className="text-sm font-medium text-muted-foreground">License</dt>
              <dd>
                {currentPkg.license.split(/\s+(OR|AND)\s+/).map((part, i) =>
                  part === 'OR' || part === 'AND' ? (
                    <span key={i}> {part} </span>
                  ) : (
                    <a
                      key={i}
                      href={`https://spdx.org/licenses/${part}.html`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {part}
                    </a>
                  )
                )}
              </dd>
            </div>
            <div className="order-5">
              <dt className="text-sm font-medium text-muted-foreground">
                {currentPkg.categories.length > 1 ? 'Categories' : 'Category'}
              </dt>
              <dd className="flex gap-1 flex-wrap">
                {[...currentPkg.categories].sort().map((cat) => (
                  <Badge key={cat} variant="outline">{cat}</Badge>
                ))}
              </dd>
            </div>
            <div className="order-6">
              <dt className="text-sm font-medium text-muted-foreground">Architectures</dt>
              <dd>{currentPkg.arch.join(', ')}</dd>
            </div>
            <div className="order-7">
              <dt className="text-sm font-medium text-muted-foreground">Devices</dt>
              <dd className="flex gap-1 flex-wrap">
                {currentPkg.devices.map((d) => (
                  <DeviceBadge key={d} device={d} />
                ))}
              </dd>
            </div>
            <div className="order-8">
              <dt className="text-sm font-medium text-muted-foreground">
                OS Compatibility
              </dt>
              <dd>
                {(() => {
                  if (currentPkg.os_constraints && currentPkg.os_constraints.length > 0) {
                    const minC = currentPkg.os_constraints.find(c => c.operator === '>=');
                    const maxC = currentPkg.os_constraints.find(c => c.operator === '<');
                    const exactC = currentPkg.os_constraints.find(c => c.operator === '=');

                    if (exactC) return exactC.version;

                    if (minC && maxC) {
                      const maxInclusive = (parseFloat(maxC.version) - 0.01).toFixed(2);
                      return minC.version === maxInclusive
                        ? minC.version
                        : `${minC.version} – ${maxInclusive}`;
                    }

                    if (minC) return `${minC.version}+`;
                    if (maxC) {
                      const maxInclusive = (parseFloat(maxC.version) - 0.01).toFixed(2);
                      return `≤ ${maxInclusive}`;
                    }
                  }

                  if (currentPkg.os_min && currentPkg.os_max) {
                    const maxInclusive = (parseFloat(currentPkg.os_max) - 0.01).toFixed(2);
                    return currentPkg.os_min === maxInclusive
                      ? currentPkg.os_min
                      : `${currentPkg.os_min} – ${maxInclusive}`;
                  }
                  if (currentPkg.os_min) return `${currentPkg.os_min}+`;
                  if (currentPkg.os_max) {
                    const maxInclusive = (parseFloat(currentPkg.os_max) - 0.01).toFixed(2);
                    return `≤ ${maxInclusive}`;
                  }
                  return 'All versions';
                })()}
              </dd>
            </div>
            <div className="order-10 sm:col-span-2">
              <dt className="text-sm font-medium text-muted-foreground">Project</dt>
              <dd>
                <a
                  href={currentPkg.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline break-all"
                >
                  {currentPkg.url}
                </a>
              </dd>
            </div>
            {filteredDepends.length > 0 && (
              <div className="order-11">
                <dt className="text-sm font-medium text-muted-foreground">Dependencies</dt>
                <dd>
                  <ul className="list-disc list-inside">
                    {filteredDepends.map((dep) => {
                      const depName = parseDepName(dep);
                      const depPkg = packages.find((p) => p.name === depName);
                      return (
                        <li key={dep}>
                          {depPkg ? (
                            <Link to={`/package/${depName}`} className="text-primary hover:underline">
                              {dep}
                            </Link>
                          ) : (
                            dep
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </dd>
              </div>
            )}
            {currentPkg.conflicts.length > 0 && (
              <div className="order-12">
                <dt className="text-sm font-medium text-muted-foreground">Conflicts</dt>
                <dd>
                  <ul className="list-disc list-inside">
                    {currentPkg.conflicts.map((conflict) => {
                      const conflictName = parseDepName(conflict);
                      const conflictPkg = packages.find((p) => p.name === conflictName);
                      return (
                        <li key={conflict}>
                          {conflictPkg ? (
                            <Link to={`/package/${conflictName}`} className="text-primary hover:underline">
                              {conflict}
                            </Link>
                          ) : (
                            conflict
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </dd>
              </div>
            )}
            {currentPkg.provides?.length > 0 && (
              <div className="order-13">
                <dt className="text-sm font-medium text-muted-foreground">Provides</dt>
                <dd>
                  <ul className="list-disc list-inside">
                    {currentPkg.provides.map((provided) => {
                      const providedName = parseDepName(provided);
                      const providedPkg = packages.find((p) => p.name === providedName);
                      return (
                        <li key={provided}>
                          {providedPkg ? (
                            <Link to={`/package/${providedName}`} className="text-primary hover:underline">
                              {provided}
                            </Link>
                          ) : (
                            provided
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </dd>
              </div>
            )}
          </dl>

          <PackageActions name={name!} currentPkg={currentPkg} />

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Installation</h3>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto">
              <code>vellum install {name}</code>
            </pre>
            <p className="text-sm text-muted-foreground mt-2">
              Requires{" "}
              <a
                href="https://github.com/vellum-dev/vellum-cli"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Vellum package manager
              </a>
            </p>
            {currentPkg.modifies_system && (
              <p className="text-sm text-muted-foreground mt-2">
                This package modifies system files and requires running <code>vellum reenable</code> after reMarkable updates.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
