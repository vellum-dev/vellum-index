import { describe, it, expect } from 'vitest';
import type { Device, PackageVersion } from '@/types/packages';
import { parseDependency, satisfiesConstraint, compareVersions } from '@/lib/version';
import {
  buildProviderIndex,
  isPackageInstallable,
  isVersionInstallable,
  type PackageRegistry,
  type ResolutionTarget,
} from '@/lib/resolution';

function version(overrides: Partial<PackageVersion> = {}): PackageVersion {
  return {
    pkgdesc: '',
    upstream_author: '',
    maintainer: '',
    categories: [],
    license: '',
    url: '',
    os_min: null,
    os_max: null,
    os_constraints: null,
    devices: ['rm1', 'rm2', 'rmpp', 'rmppmove', 'rmppure'],
    depends: [],
    conflicts: [],
    provides: [],
    arch: ['aarch64'],
    modifies_system: false,
    auto_install: false,
    status: 'maintained',
    readmeurl: null,
    donateurl: null,
    ...overrides,
  };
}

function osRange(min: string, max: string): Partial<PackageVersion> {
  return {
    os_min: min,
    os_max: max,
    os_constraints: [
      { version: min, operator: '>=' },
      { version: max, operator: '<' },
    ],
  };
}

function resolve(registry: PackageRegistry, name: string, ver: string, target: ResolutionTarget) {
  return isVersionInstallable(name, ver, target, registry, buildProviderIndex(registry));
}

const onOs = (osSeries: string): ResolutionTarget => ({ osSeries, device: null });
const onDevice = (device: ResolutionTarget['device']): ResolutionTarget => ({
  osSeries: null,
  device,
});

describe('parseDependency', () => {
  it('splits every constraint operator from the package name', () => {
    expect(parseDependency('appload>=0.5.1')).toEqual({
      name: 'appload',
      operator: '>=',
      version: '0.5.1',
    });
    expect(parseDependency('framebuffer-spy<=17')).toEqual({
      name: 'framebuffer-spy',
      operator: '<=',
      version: '17',
    });
    expect(parseDependency('bettertoc<1.6.0')).toEqual({
      name: 'bettertoc',
      operator: '<',
      version: '1.6.0',
    });
    expect(parseDependency('qt-resource-rebuilder>17')).toEqual({
      name: 'qt-resource-rebuilder',
      operator: '>',
      version: '17',
    });
    expect(parseDependency('liboxide=3.1.2-r2')).toEqual({
      name: 'liboxide',
      operator: '=',
      version: '3.1.2-r2',
    });
  });

  it('leaves an unconstrained dependency alone', () => {
    expect(parseDependency('launcher')).toEqual({
      name: 'launcher',
      operator: null,
      version: null,
    });
  });
});

describe('satisfiesConstraint', () => {
  it('compares a published version against a bare constraint version', () => {
    const atLeast = parseDependency('appload>=0.5.1');
    expect(satisfiesConstraint('0.5.1-r1', atLeast)).toBe(true);
    expect(satisfiesConstraint('0.5.3-r3', atLeast)).toBe(true);
    expect(satisfiesConstraint('0.4.2-r1', atLeast)).toBe(false);
  });

  it('orders release revisions and prerelease suffixes', () => {
    expect(compareVersions('1.0.0-r2', '1.0.0-r10')).toBeLessThan(0);
    expect(compareVersions('2.0.0_beta1', '2.0.0')).toBeLessThan(0);
    expect(compareVersions('3.1', '3.1.0.0')).toBe(0);
    expect(satisfiesConstraint('1.0.0-r0', parseDependency('pkg=1.0.0'))).toBe(true);
  });

  it('accepts anything when the dependency carries no constraint', () => {
    expect(satisfiesConstraint('9.9.9', parseDependency('launcher'))).toBe(true);
  });
});

describe('isVersionInstallable', () => {
  it('hides a package whose dependency is out of range only under its pin', () => {
    const registry: PackageRegistry = {
      remarkdown: { '1.0.0-r0': version({ depends: ['appload>=0.5.1'] }) },
      appload: {
        '0.4.2-r1': version(osRange('3.22', '3.26')),
        '0.5.1-r1': version(osRange('3.26', '3.28')),
      },
    };

    expect(resolve(registry, 'remarkdown', '1.0.0-r0', onOs('3.26'))).toBe(true);
    expect(resolve(registry, 'remarkdown', '1.0.0-r0', onOs('3.22'))).toBe(false);
  });

  it('still resolves the dependency by name when no constraint is given', () => {
    const registry: PackageRegistry = {
      koreader: { '1.0.0-r0': version({ depends: ['appload'] }) },
      appload: { '0.4.2-r1': version(osRange('3.22', '3.26')) },
    };

    expect(resolve(registry, 'koreader', '1.0.0-r0', onOs('3.22'))).toBe(true);
    expect(resolve(registry, 'koreader', '1.0.0-r0', onOs('3.26'))).toBe(false);
  });

  it('checks the package version being displayed, not just the package', () => {
    const registry: PackageRegistry = {
      bettertoc: {
        '1.0.1-r0': version(osRange('3.20', '3.26')),
        '1.5.0-r0': version(osRange('3.26', '3.28')),
      },
    };

    expect(resolve(registry, 'bettertoc', '1.0.1-r0', onOs('3.22'))).toBe(true);
    expect(resolve(registry, 'bettertoc', '1.5.0-r0', onOs('3.22'))).toBe(false);
  });
});

describe('virtual providers', () => {
  const registry: PackageRegistry = {
    plato: { '1.0.0-r0': version({ depends: ['launcher'] }) },
    appload: { '0.5.3-r3': version({ ...osRange('3.26', '3.28'), provides: ['launcher'] }) },
    oxide: {
      '3.1.2-r2': version({ depends: ['oxide-display=3.1.2-r2'], provides: ['launcher'] }),
    },
    'oxide-display': { '3.1.2-r2': version(osRange('3.27', '3.28')) },
  };

  it('accepts a virtual dependency when any provider resolves', () => {
    expect(resolve(registry, 'plato', '1.0.0-r0', onOs('3.26'))).toBe(true);
    expect(resolve(registry, 'plato', '1.0.0-r0', onOs('3.27'))).toBe(true);
  });

  it('hides the dependent when no provider resolves', () => {
    expect(resolve(registry, 'plato', '1.0.0-r0', onOs('3.28'))).toBe(false);
  });
});

describe('gaps in the index', () => {
  it('hides a version whose pin no published version answers', () => {
    const registry: PackageRegistry = {
      oxide: {
        '3.1-r1': version({ depends: ['oxide-display=3.1-r1'] }),
        '3.1.2-r2': version({ depends: ['oxide-display=3.1.2-r2'] }),
      },
      'oxide-display': { '3.1.2-r2': version(osRange('3.27', '3.28')) },
    };

    expect(resolve(registry, 'oxide', '3.1-r1', onOs('3.22'))).toBe(false);
    expect(resolve(registry, 'oxide', '3.1.2-r2', onOs('3.27'))).toBe(true);
    expect(resolve(registry, 'oxide', '3.1.2-r2', onOs('3.28'))).toBe(false);
  });

  it('treats an unknown dependency name as satisfiable', () => {
    const registry: PackageRegistry = {
      'tailscale-tun': { '1.0.0-r0': version({ depends: ['tun'] }) },
    };

    expect(resolve(registry, 'tailscale-tun', '1.0.0-r0', onOs('3.22'))).toBe(true);
  });

  it('terminates on a dependency cycle', () => {
    const registry: PackageRegistry = {
      a: { '1.0.0-r0': version({ depends: ['b'] }) },
      b: { '1.0.0-r0': version({ depends: ['a'] }) },
    };

    expect(resolve(registry, 'a', '1.0.0-r0', onOs('3.22'))).toBe(true);
  });
});

describe('OS series matching', () => {
  it('keeps a package whose bound falls inside the selected series', () => {
    const registry: PackageRegistry = {
      'oxide-display': { '3.1.2-r2': version(osRange('3.27.1.0', '3.28')) },
    };

    expect(resolve(registry, 'oxide-display', '3.1.2-r2', onOs('3.27'))).toBe(true);
    expect(resolve(registry, 'oxide-display', '3.1.2-r2', onOs('3.26'))).toBe(false);
    expect(resolve(registry, 'oxide-display', '3.1.2-r2', onOs('3.28'))).toBe(false);
  });

  it('reads os_min and os_max when no constraints are given', () => {
    const registry: PackageRegistry = {
      pkg: { '1.0.0-r0': version({ os_min: '3.22', os_max: '3.26' }) },
    };

    expect(resolve(registry, 'pkg', '1.0.0-r0', onOs('3.22'))).toBe(true);
    expect(resolve(registry, 'pkg', '1.0.0-r0', onOs('3.25'))).toBe(true);
    expect(resolve(registry, 'pkg', '1.0.0-r0', onOs('3.26'))).toBe(false);
    expect(resolve(registry, 'pkg', '1.0.0-r0', onOs('3.21'))).toBe(false);
  });
});

describe('device targets', () => {
  const registry: PackageRegistry = {
    'quicksettings-bluetooth': {
      '1.0.1-r0': version({
        devices: ['rm1', 'rm2', 'rmpp'],
        depends: ['bluetooth-settings>=0.2.1'],
      }),
    },
    'bluetooth-settings': { '0.2.1-r0': version({ devices: ['rmpp'] }) },
  };

  it('hides a package whose dependency does not reach the selected device', () => {
    expect(resolve(registry, 'quicksettings-bluetooth', '1.0.1-r0', onDevice('rmpp'))).toBe(true);
    expect(resolve(registry, 'quicksettings-bluetooth', '1.0.1-r0', onDevice('rm2'))).toBe(false);
  });

  it('normalizes device aliases before matching', () => {
    const aliased: PackageRegistry = {
      pkg: { '1.0.0-r0': version({ devices: ['rmppm' as Device] }) },
    };

    expect(resolve(aliased, 'pkg', '1.0.0-r0', onDevice('rmppmove'))).toBe(true);
    expect(resolve(aliased, 'pkg', '1.0.0-r0', onDevice('rm1'))).toBe(false);
  });
});

describe('isPackageInstallable', () => {
  it('passes when any version of the package resolves', () => {
    const registry: PackageRegistry = {
      bettertoc: {
        '1.0.1-r0': version(osRange('3.20', '3.26')),
        '1.5.0-r0': version(osRange('3.26', '3.28')),
      },
    };

    const providers = buildProviderIndex(registry);
    expect(isPackageInstallable('bettertoc', onOs('3.22'), registry, providers)).toBe(true);
    expect(isPackageInstallable('bettertoc', onOs('3.29'), registry, providers)).toBe(false);
  });
});
