export type Device = 'rm1' | 'rm2' | 'rmpp' | 'rmppmove' | 'rmppure';

export const DEVICE_LABELS: Record<Device, string> = {
  rm1: 'RM1',
  rm2: 'RM2',
  rmpp: 'RMPP',
  rmppmove: 'RMPPMove',
  rmppure: 'RMPPure',
};

const DEVICE_ALIASES: Record<string, Device> = {
  rmppm: 'rmppmove',
};

export function normalizeDevice(device: string): Device {
  return DEVICE_ALIASES[device] ?? device as Device;
}
export type Architecture = 'aarch64' | 'armv7' | 'noarch';

export interface OSConstraint {
  version: string;
  operator: '>=' | '<' | '>' | '<=' | '=';
}

export interface PackageVersion {
  pkgdesc: string;
  upstream_author: string;
  maintainer: string;
  categories: string[];
  license: string;
  url: string;
  os_min: string | null;
  os_max: string | null;
  os_constraints: OSConstraint[] | null;
  devices: Device[];
  depends: string[];
  conflicts: string[];
  provides: string[];
  arch: Architecture[];
  modifies_system: boolean;
  auto_install: boolean;
  status: string;
  readmeurl: string | null;
  donateurl: string | null;
}

export interface PackagesMetadata {
  packages: {
    [packageName: string]: {
      [version: string]: PackageVersion;
    };
  };
  generated: string;
}

export interface FlatPackage extends PackageVersion {
  name: string;
  version: string;
  latestVersion: string;
}
