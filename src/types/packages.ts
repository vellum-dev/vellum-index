export type Device = 'rm1' | 'rm2' | 'rmpp' | 'rmppm';
export type Architecture = 'aarch64' | 'armv7' | 'noarch';

export interface PackageVersion {
  pkgdesc: string;
  upstream_author: string;
  maintainer: string;
  categories: string[];
  license: string;
  url: string;
  os_min: string | null;
  os_max: string | null;
  devices: Device[];
  depends: string[];
  conflicts: string[];
  provides: string[];
  arch: Architecture[];
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
