import { useMemo } from 'react';
import packagesData from '@/data/packages-metadata.json';
import type { PackagesMetadata, FlatPackage } from '@/types/packages';
import { normalizeDevice } from '@/types/packages';
import { compareVersions } from '@/lib/version';
import { buildProviderIndex } from '@/lib/resolution';

function normalizeMajorMinor(version: string): number {
  const parts = version.split('.');
  return parseFloat(`${parts[0]}.${parts[1]}`);
}

function generateOsVersionRange(minVersion: number, maxVersion: number): string[] {
  const versions: string[] = [];
  for (let v = minVersion; v < maxVersion; v = Math.round((v + 0.01) * 100) / 100) {
    versions.push(v.toFixed(2));
  }
  return versions;
}

export function usePackages() {
  const data = packagesData as PackagesMetadata;

  const { packages, categories, devices, osVersions } = useMemo(() => {
    const flatPackages: FlatPackage[] = [];
    const categoriesSet = new Set<string>();
    const devicesSet = new Set<string>();
    const osMinVersions: number[] = [];
    const osMaxVersions: number[] = [];

    for (const [name, versions] of Object.entries(data.packages)) {
      // Skip packages where all versions are auto_install (subpackages)
      const nonAutoInstallVersions = Object.entries(versions).filter(
        ([, info]) => !info.auto_install
      );
      if (nonAutoInstallVersions.length === 0) continue;

      const versionKeys = nonAutoInstallVersions
        .map(([v]) => v)
        .sort(compareVersions)
        .reverse();
      const latestVersion = versionKeys[0];

      for (const [version, info] of nonAutoInstallVersions) {
        const devices = [...new Set(info.devices.map(normalizeDevice))];
        flatPackages.push({
          name,
          version,
          latestVersion,
          ...info,
          devices,
        });

        info.categories.forEach((cat) => categoriesSet.add(cat));
        devices.forEach((d) => devicesSet.add(d));
        if (info.os_min) osMinVersions.push(normalizeMajorMinor(info.os_min));
        if (info.os_max) osMaxVersions.push(normalizeMajorMinor(info.os_max));
      }
    }

    const minOsVersion = Math.min(...osMinVersions);
    const maxOsVersion = Math.max(...osMaxVersions);
    const osVersions = generateOsVersionRange(minOsVersion, maxOsVersion).reverse();

    return {
      packages: flatPackages,
      categories: Array.from(categoriesSet).sort(),
      devices: Array.from(devicesSet),
      osVersions,
    };
  }, [data]);

  const providers = useMemo(() => buildProviderIndex(data.packages), [data]);

  return {
    packages,
    categories,
    devices,
    osVersions,
    generated: data.generated,
    registry: data.packages,
    providers,
  };
}
