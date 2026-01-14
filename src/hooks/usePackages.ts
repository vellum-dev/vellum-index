import { useMemo } from 'react';
import packagesData from '@/data/packages-metadata.json';
import type { PackagesMetadata, FlatPackage } from '@/types/packages';

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

export function usePackages() {
  const data = packagesData as PackagesMetadata;

  const { packages, categories, devices, osVersions } = useMemo(() => {
    const flatPackages: FlatPackage[] = [];
    const categoriesSet = new Set<string>();
    const devicesSet = new Set<string>();
    const osVersionsSet = new Set<string>();

    for (const [name, versions] of Object.entries(data.packages)) {
      const versionKeys = Object.keys(versions).sort(compareVersions).reverse();
      const latestVersion = versionKeys[0];

      for (const [version, info] of Object.entries(versions)) {
        flatPackages.push({
          name,
          version,
          latestVersion,
          ...info,
        });

        info.categories.forEach((cat) => categoriesSet.add(cat));
        info.devices.forEach((d) => devicesSet.add(d));
        if (info.os_min) osVersionsSet.add(info.os_min);
        if (info.os_max) osVersionsSet.add(info.os_max);
      }
    }

    return {
      packages: flatPackages,
      categories: Array.from(categoriesSet).sort(),
      devices: Array.from(devicesSet),
      osVersions: Array.from(osVersionsSet).sort(),
    };
  }, [data]);

  return { packages, categories, devices, osVersions, generated: data.generated };
}
