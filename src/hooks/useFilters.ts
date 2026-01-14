import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback } from 'react';
import type { FlatPackage, Device } from '@/types/packages';

interface FilterState {
  search: string;
  category: string;
  device: string;
  osVersion: string;
}

export function useFilters(packages: FlatPackage[]) {
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

      if (filters.device !== 'all' && !pkg.devices.includes(filters.device as Device)) {
        return false;
      }

      if (filters.osVersion !== 'all') {
        const version = parseFloat(filters.osVersion);
        if (pkg.os_min && parseFloat(pkg.os_min) > version) return false;
        if (pkg.os_max && parseFloat(pkg.os_max) <= version) return false;
      }

      return true;
    });
  }, [packages, filters]);

  return { filters, setFilter, filteredPackages };
}
