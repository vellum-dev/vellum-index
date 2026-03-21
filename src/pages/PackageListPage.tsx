import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { usePackages, compareVersions } from '@/hooks/usePackages';
import { useFilters } from '@/hooks/useFilters';
import { PackageFilters } from '@/components/packages/PackageFilters';
import { PackageTable } from '@/components/packages/PackageTable';
import type { FlatPackage } from '@/types/packages';

export function PackageListPage() {
  const { packages, categories, devices, osVersions, registry } = usePackages();
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

  return (
    <div>
      <PackageFilters
        filters={filters}
        onFilterChange={setFilter}
        categories={categories}
        devices={devices}
        osVersions={osVersions}
      />

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {latestPackages.length} packages found
        </p>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/stats" className="inline-flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <BarChart3 className="h-5 w-5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>Statistics</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <PackageTable packages={latestPackages} />
    </div>
  );
}
