import { useMemo } from 'react';
import { usePackages, compareVersions } from '@/hooks/usePackages';
import { useFilters } from '@/hooks/useFilters';
import { PackageFilters } from '@/components/packages/PackageFilters';
import { PackageTable } from '@/components/packages/PackageTable';
import type { FlatPackage } from '@/types/packages';

export function PackageListPage() {
  const { packages, categories, devices, osVersions } = usePackages();
  const { filters, setFilter, filteredPackages } = useFilters(packages);

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

      <PackageTable packages={latestPackages} />
    </div>
  );
}
