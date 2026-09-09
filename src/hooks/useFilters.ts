import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback } from 'react';
import type { FlatPackage, Device, PackagesMetadata } from '@/types/packages';
import { isVersionInstallable, type ProviderIndex, type ResolutionTarget } from '@/lib/resolution';

interface FilterState {
  search: string;
  category: string;
  device: string;
  osVersion: string;
}

export function useFilters(
  packages: FlatPackage[],
  registry: PackagesMetadata['packages'],
  providers: ProviderIndex
) {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: FilterState = {
    search: searchParams.get('q') || '',
    category: searchParams.get('category') || 'all',
    device: searchParams.get('device') || 'all',
    osVersion: searchParams.get('os') || 'all',
  };

  const setFilter = useCallback(
    (key: keyof FilterState, value: string) => {
      const newParams = new URLSearchParams(searchParams);
      const urlKey = key === 'search' ? 'q' : key === 'osVersion' ? 'os' : key;
      if (value === '' || value === 'all') {
        newParams.delete(urlKey);
      } else {
        newParams.set(urlKey, value);
      }
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          pkg.name.toLowerCase().includes(searchLower) ||
          pkg.pkgdesc.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (filters.category !== 'all' && !pkg.categories.includes(filters.category)) {
        return false;
      }

      const target: ResolutionTarget = {
        osSeries: filters.osVersion === 'all' ? null : filters.osVersion,
        device: filters.device === 'all' ? null : (filters.device as Device),
      };

      if (target.osSeries !== null || target.device !== null) {
        if (!isVersionInstallable(pkg.name, pkg.version, target, registry, providers)) return false;
      }

      return true;
    });
  }, [packages, filters, registry, providers]);

  return { filters, setFilter, filteredPackages };
}
