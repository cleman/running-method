// The loaded rule base and parameter registry, and the evaluation contexts the stages bind (12 §3.5).
import type { EvalContext, Helper, Value } from './expr/eval.ts';
import { RuleSet, type RulesFile } from './rules/engine.ts';
import { Registry, makeParam, type ParamFile } from './rules/params.ts';
import { baseHelpers } from './rules/helpers.ts';

export interface Spec { rules: RuleSet; reg: Registry; rulesVersion: string; registryVersion: string }

/** Build the spec bundle from the parsed spec/rules.json and spec/parameters.json (no file access: works in a browser). */
export function loadSpec(rulesJson: unknown, paramsJson: unknown): Spec {
  const rf = rulesJson as RulesFile;
  const pf = paramsJson as ParamFile;
  return { rules: new RuleSet(rf), reg: new Registry(pf), rulesVersion: rf.version, registryVersion: pf.version };
}

export const UNIT = { min_s: 60, h_s: 3600, km_m: 1000, week_d: 7, pct: 100 };

/**
 * An open record: a field it does not hold reads as null ("not asked"), never as an absent-path error.
 * SPEC-QUESTION Q-E6: 12 §2b says an absent path is E. The engine reads the `event` root (and `rule_ctx`) as open records,
 * so a rule about an event kind that is not in this call (e.g. event.gap_cause on a first generation) is silent, not E.
 */
export function openRecord(fields: Record<string, Value>): Record<string, Value> {
  return new Proxy(fields, {
    has: () => true,
    get: (t, k) => (typeof k === 'string' && k in t ? t[k] : null),
  });
}

export function evalContext(spec: Spec, roots: Record<string, Value>, overrides: Record<string, unknown>, helpers: Record<string, Helper> = {}): EvalContext {
  return {
    roots: { unit: UNIT, ...roots },
    helpers: { ...baseHelpers(), ...helpers },
    param: makeParam(spec.reg, overrides),
  };
}

/** Numeric parameter, throwing when the registry has no number (a build defect, INV-12). */
export function pnum(spec: Spec, id: string, overrides: Record<string, unknown> = {}): number {
  const v = makeParam(spec.reg, overrides)(id);
  if (typeof v !== 'number') throw new Error(`parameter ${id} is not a number`);
  return v;
}
export function pval<T = unknown>(spec: Spec, id: string, overrides: Record<string, unknown> = {}): T {
  const v = makeParam(spec.reg, overrides)(id);
  if (v && typeof v === 'object' && (v as { kind?: string }).kind === 'E') throw new Error(`parameter ${id}: ${(v as { why: string }).why}`);
  return v as T;
}

export const roundDown = (x: number, step: number) => Math.floor(x / step + 1e-9) * step;
export const roundUp = (x: number, step: number) => Math.ceil(x / step - 1e-9) * step;
