import type { Device, PackagesMetadata, PackageVersion } from '@/types/packages';
import { normalizeDevice } from '@/types/packages';
import {
  compareVersions,
  parseDependency,
  satisfiesConstraint,
  type ParsedDependency,
} from '@/lib/version';

export type PackageRegistry = PackagesMetadata['packages'];
export type ProviderIndex = Map<string, string[]>;

export interface ResolutionTarget {
  /** An OS series such as '3.27', standing for every release from 3.27 up to 3.28. */
  osSeries: string | null;
  device: Device | null;
}

function endOfSeries(series: string): string {
  const [major, minor] = series.split('.');
  return `${major}.${Number(minor) + 1}`;
}

export function buildProviderIndex(registry: PackageRegistry): ProviderIndex {
  const index: ProviderIndex = new Map();
  for (const [name, versions] of Object.entries(registry)) {
    for (const info of Object.values(versions)) {
      for (const provided of info.provides ?? []) {
        const providers = index.get(provided);
        if (!providers) {
          index.set(provided, [name]);
        } else if (!providers.includes(name)) {
          providers.push(name);
        }
      }
    }
  }
  return index;
}

export function runsOnOs(info: PackageVersion, series: string | null): boolean {
  if (series === null) return true;

  // The dropdown selects a series, not a build, so a package belongs on the list
  // when any release within the series can carry it.
  const seriesEnd = endOfSeries(series);
  const constraints =
    info.os_constraints && info.os_constraints.length > 0
      ? info.os_constraints
      : [
          ...(info.os_min ? ([{ version: info.os_min, operator: '>=' }] as const) : []),
          ...(info.os_max ? ([{ version: info.os_max, operator: '<' }] as const) : []),
        ];

  for (const constraint of constraints) {
    switch (constraint.operator) {
      case '>=':
      case '>':
        if (compareVersions(constraint.version, seriesEnd) >= 0) return false;
        break;
      case '<':
        if (compareVersions(series, constraint.version) >= 0) return false;
        break;
      case '<=':
        if (compareVersions(series, constraint.version) > 0) return false;
        break;
      case '=':
        if (
          compareVersions(constraint.version, series) < 0 ||
          compareVersions(constraint.version, seriesEnd) >= 0
        ) {
          return false;
        }
        break;
    }
  }
  return true;
}

export function runsOnDevice(info: PackageVersion, device: Device | null): boolean {
  if (device === null) return true;
  return info.devices.some((d) => normalizeDevice(d) === device);
}

function isVersionResolvable(
  name: string,
  info: PackageVersion,
  target: ResolutionTarget,
  registry: PackageRegistry,
  providers: ProviderIndex,
  visited: Set<string>
): boolean {
  if (!runsOnOs(info, target.osSeries)) return false;
  if (!runsOnDevice(info, target.device)) return false;

  const withSelf = new Set(visited).add(name);
  return (info.depends ?? []).every((dependency) =>
    isDependencyResolvable(parseDependency(dependency), target, registry, providers, withSelf)
  );
}

function isDependencyResolvable(
  dependency: ParsedDependency,
  target: ResolutionTarget,
  registry: PackageRegistry,
  providers: ProviderIndex,
  visited: Set<string>
): boolean {
  if (visited.has(dependency.name)) return true;

  const versions = registry[dependency.name];
  if (!versions) {
    const virtualProviders = providers.get(dependency.name);
    if (!virtualProviders) return true;
    const withVirtual = new Set(visited).add(dependency.name);
    return virtualProviders.some((provider) =>
      isPackageInstallable(provider, target, registry, providers, withVirtual)
    );
  }

  // apk has nothing to select when the index carries no version answering the
  // constraint, so an unanswerable pin fails the install rather than the lookup.
  const candidates = Object.entries(versions).filter(([version]) =>
    satisfiesConstraint(version, dependency)
  );

  return candidates.some(([, info]) =>
    isVersionResolvable(dependency.name, info, target, registry, providers, visited)
  );
}

export function isVersionInstallable(
  name: string,
  version: string,
  target: ResolutionTarget,
  registry: PackageRegistry,
  providers: ProviderIndex,
  visited: Set<string> = new Set()
): boolean {
  const info = registry[name]?.[version];
  if (!info) return true;
  return isVersionResolvable(name, info, target, registry, providers, visited);
}

export function isPackageInstallable(
  name: string,
  target: ResolutionTarget,
  registry: PackageRegistry,
  providers: ProviderIndex,
  visited: Set<string> = new Set()
): boolean {
  const versions = registry[name];
  if (!versions) return true;
  return Object.entries(versions).some(([, info]) =>
    isVersionResolvable(name, info, target, registry, providers, visited)
  );
}
