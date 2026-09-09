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

export type ConstraintOperator = '>=' | '<=' | '>' | '<' | '=';

export interface ParsedDependency {
  name: string;
  operator: ConstraintOperator | null;
  version: string | null;
}

const DEPENDENCY_CONSTRAINT = /^([^<>=]+)(>=|<=|>|<|=)(.+)$/;

export function parseDependency(dependency: string): ParsedDependency {
  const match = dependency.match(DEPENDENCY_CONSTRAINT);
  if (!match) return { name: dependency, operator: null, version: null };
  return {
    name: match[1],
    operator: match[2] as ConstraintOperator,
    version: match[3],
  };
}

export function satisfiesConstraint(version: string, dependency: ParsedDependency): boolean {
  if (!dependency.operator || !dependency.version) return true;

  const comparison = compareVersions(version, dependency.version);
  switch (dependency.operator) {
    case '>=':
      return comparison >= 0;
    case '>':
      return comparison > 0;
    case '<=':
      return comparison <= 0;
    case '<':
      return comparison < 0;
    case '=':
      return comparison === 0;
  }
}
