import { useMemo } from 'react';
import { usePackages, compareVersions, type RepoType } from '@/hooks/usePackages';
import { useFilters } from '@/hooks/useFilters';
import { PackageFilters } from '@/components/packages/PackageFilters';
import { PackageTable } from '@/components/packages/PackageTable';
import type { FlatPackage } from '@/types/packages';

export function PackageListPage({ repo = 'stable' }: { repo?: RepoType }) {
  const { packages, categories, devices, osVersions, registry, loading, error } = usePackages(repo);
  const basePath = repo === 'testing' ? '/testing' : '';
  const { filters, setFilter, filteredPackages } = useFilters(packages, registry);

  const latestPackages = useMemo(() => {
    const byName = new Map<string, FlatPackage>();
    const sorted = [...filteredPackages].sort((a, b) => {
      if (a.name !== b.name) return a.name.localeCompare(b.name);
      return compareVersions(b.version, a.version);
    });
    for (const pkg of sorted) {
      if (!byName.has(pkg.name)) {
        byName.set(pkg.name, pkg);
      }
    }
    return Array.from(byName.values());
  }, [filteredPackages]);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading packages...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-destructive">Error: {error}</div>;
  }

  return (
    <div>
      <PackageFilters
        filters={filters}
        onFilterChange={setFilter}
        categories={categories}
        devices={devices}
        osVersions={osVersions}
      />

      <p className="text-sm text-muted-foreground mb-4">
        {latestPackages.length} packages found
      </p>

      <PackageTable packages={latestPackages} basePath={basePath} />
    </div>
  );
}
