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
    const osMinVersions: number[] = [];
    const osMaxVersions: number[] = [];

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
        if (info.os_min) osMinVersions.push(normalizeMajorMinor(info.os_min));
        if (info.os_max) osMaxVersions.push(normalizeMajorMinor(info.os_max));
      }
    }

    const minOsVersion = Math.min(...osMinVersions);
    const maxOsVersion = Math.max(...osMaxVersions) - 0.01;
    const osVersions = generateOsVersionRange(minOsVersion, maxOsVersion).reverse();

    return {
      packages: flatPackages,
      categories: Array.from(categoriesSet).sort(),
      devices: Array.from(devicesSet),
      osVersions,
    };
  }, [data]);

  return { packages, categories, devices, osVersions, generated: data.generated };
}
