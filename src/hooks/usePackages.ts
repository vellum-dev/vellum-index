import { useMemo, useState, useEffect } from 'react';
import type { PackagesMetadata, FlatPackage, PackageVersion } from '@/types/packages';

const METADATA_URLS = {
  stable: 'https://packages.vellum.delivery/packages-metadata.json',
  testing: 'https://packages.vellum.delivery/testing/packages-metadata.json',
} as const;

export type RepoType = keyof typeof METADATA_URLS;

const SUFFIX_WEIGHTS: Record<string, number> = {
  alpha: -4,
  beta: -3,
  pre: -2,
  rc: -1,
  cvs: 1,
  svn: 2,
  git: 3,
  hg: 4,
  p: 5,
};

interface ParsedVersion {
  base: number[];
  suffix: string | null;
  suffixNum: number;
  revision: number;
}

function parseVersion(version: string): ParsedVersion {
  let remaining = version;
  let revision = 0;

  const revMatch = remaining.match(/-r(\d+)$/);
  if (revMatch) {
    revision = parseInt(revMatch[1]);
    remaining = remaining.slice(0, -revMatch[0].length);
  }

  let suffix: string | null = null;
  let suffixNum = 0;

  const suffixMatch = remaining.match(/_([a-z]+)(\d*)$/);
  if (suffixMatch) {
    suffix = suffixMatch[1];
    suffixNum = suffixMatch[2] ? parseInt(suffixMatch[2]) : 0;
    remaining = remaining.slice(0, -suffixMatch[0].length);
  }

  const base = remaining.split('.').map((p) => parseInt(p) || 0);

  return { base, suffix, suffixNum, revision };
}

function normalizeMajorMinor(version: string): number {
  const parts = version.split('.');
  return parseFloat(`${parts[0]}.${parts[1]}`);
}

function generateOsVersionRange(minVersion: number, maxVersion: number): string[] {
  const versions: string[] = [];
  for (let v = minVersion; v <= maxVersion; v = Math.round((v + 0.01) * 100) / 100) {
    versions.push(v.toFixed(2));
  }
  return versions;
}

function isVersionCompatible(pkg: PackageVersion, osVersion: number): boolean {
  if (pkg.os_min && parseFloat(pkg.os_min) > osVersion) return false;
  if (pkg.os_max && parseFloat(pkg.os_max) <= osVersion) return false;
  return true;
}

export function isInstallableOnOs(
  packageName: string,
  osVersion: number,
  registry: PackagesMetadata['packages'],
  visited: Set<string> = new Set()
): boolean {
  if (visited.has(packageName)) return true;
  visited.add(packageName);

  const versions = registry[packageName];
  if (!versions) return true;

  const compatibleVersions = Object.values(versions).filter((v) =>
    isVersionCompatible(v, osVersion)
  );

  if (compatibleVersions.length === 0) return false;

  for (const version of compatibleVersions) {
    const allDepsInstallable = version.depends.every((dep) =>
      isInstallableOnOs(dep, osVersion, registry, new Set(visited))
    );
    if (allDepsInstallable) return true;
  }
  return false;
}

export function compareVersions(a: string, b: string): number {
  const parsedA = parseVersion(a);
  const parsedB = parseVersion(b);

  const maxBase = Math.max(parsedA.base.length, parsedB.base.length);
  for (let i = 0; i < maxBase; i++) {
    const diff = (parsedA.base[i] || 0) - (parsedB.base[i] || 0);
    if (diff !== 0) return diff;
  }

  const weightA = parsedA.suffix ? (SUFFIX_WEIGHTS[parsedA.suffix] ?? 0) : 0;
  const weightB = parsedB.suffix ? (SUFFIX_WEIGHTS[parsedB.suffix] ?? 0) : 0;
  if (weightA !== weightB) return weightA - weightB;

  if (parsedA.suffixNum !== parsedB.suffixNum) {
    return parsedA.suffixNum - parsedB.suffixNum;
  }

  return parsedA.revision - parsedB.revision;
}

export function usePackages(repo: RepoType = 'stable') {
  const [data, setData] = useState<PackagesMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(METADATA_URLS[repo])
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setData(json as PackagesMetadata);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [repo]);

  const { packages, categories, devices, osVersions } = useMemo(() => {
    if (!data) {
      return { packages: [], categories: [], devices: [], osVersions: [] };
    }

    const flatPackages: FlatPackage[] = [];
    const categoriesSet = new Set<string>();
    const devicesSet = new Set<string>();
    const osMinVersions: number[] = [];
    const osMaxVersions: number[] = [];

    for (const [name, versions] of Object.entries(data.packages)) {
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
        flatPackages.push({
          name,
          version,
          latestVersion,
          ...info,
        });

        info.categories.forEach((cat) => categoriesSet.add(cat));
        info.devices.forEach((d) => devicesSet.add(d));
        if (info.os_min) osMinVersions.push(normalizeMajorMinor(info.os_min));
        if (info.os_max) osMaxVersions.push(normalizeMajorMinor(info.os_max));
      }
    }

    const minOsVersion = osMinVersions.length > 0 ? Math.min(...osMinVersions) : 0;
    const maxOsVersion = osMaxVersions.length > 0 ? Math.max(...osMaxVersions) - 0.01 : 0;
    const osVersions = minOsVersion && maxOsVersion
      ? generateOsVersionRange(minOsVersion, maxOsVersion).reverse()
      : [];

    return {
      packages: flatPackages,
      categories: Array.from(categoriesSet).sort(),
      devices: Array.from(devicesSet),
      osVersions,
    };
  }, [data]);

  return {
    packages,
    categories,
    devices,
    osVersions,
    generated: data?.generated ?? null,
    registry: data?.packages ?? {},
    loading,
    error,
  };
}
