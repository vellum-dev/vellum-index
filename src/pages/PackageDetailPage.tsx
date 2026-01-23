import { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
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
              <dd>{currentPkg.license}</dd>
            </div>
            <div className="order-5">
              <dt className="text-sm font-medium text-muted-foreground">
                {currentPkg.categories.length > 1 ? 'Categories' : 'Category'}
              </dt>
              <dd className="flex gap-1 flex-wrap">
                {currentPkg.categories.map((cat) => (
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
                {currentPkg.os_min && `>= ${currentPkg.os_min}`}
                {currentPkg.os_min && currentPkg.os_max && ' '}
                {currentPkg.os_max && `< ${currentPkg.os_max}`}
                {!currentPkg.os_min && !currentPkg.os_max && 'All versions'}
              </dd>
            </div>
            <div className="order-10 sm:col-span-2">
              <dt className="text-sm font-medium text-muted-foreground">Source</dt>
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
                      const depPkg = packages.find((p) => p.name === dep);
                      return (
                        <li key={dep}>
                          {depPkg ? (
                            <Link to={`/package/${dep}`} className="text-primary hover:underline">
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
                      const conflictPkg = packages.find((p) => p.name === conflict);
                      return (
                        <li key={conflict}>
                          {conflictPkg ? (
                            <Link to={`/package/${conflict}`} className="text-primary hover:underline">
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
                      const providedPkg = packages.find((p) => p.name === provided);
                      return (
                        <li key={provided}>
                          {providedPkg ? (
                            <Link to={`/package/${provided}`} className="text-primary hover:underline">
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
