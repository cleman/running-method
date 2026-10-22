// Parameter registry: spec/parameters.json (12 §3.11). p(id) = registry default → preset override → ContextModifier override,
// combined by limit_direction (upper → MIN, lower → MAX, none → last writer).
import { Err, type Value } from '../expr/eval.ts';

export interface ParamEntry {
  id: string; type: string; unit?: string; default: unknown; keys?: string; limit_direction: 'upper' | 'lower' | 'none';
  owner?: string; family?: string; grade?: string; basis?: string;
}
export interface ParamFile { version: string; parameters: ParamEntry[] }

export class Registry {
  readonly byId = new Map<string, ParamEntry>();
  private readonly templates: { re: RegExp; entry: ParamEntry }[] = [];
  constructor(file: ParamFile) {
    for (const p of file.parameters) {
      this.byId.set(p.id, p);
      if (p.id.includes('<')) {
        const re = new RegExp('^' + p.id.split(/<[^>]+>/).map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('([^.]+)') + '$');
        this.templates.push({ re, entry: p });
      }
    }
  }
  entry(id: string): ParamEntry | undefined {
    return this.byId.get(id) ?? this.templates.find(t => t.re.test(id))?.entry;
  }
  /** Raw registry default, descending into map defaults for template ids (e.g. lr.abs_cap_km.method_default). */
  base(id: string): Value {
    const e = this.byId.get(id);
    if (e) return e.default as Value;
    for (const t of this.templates) {
      const m = t.re.exec(id);
      if (!m) continue;
      let v: any = t.entry.default;
      for (const key of m.slice(1)) {
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          if (key in v) v = v[key];
          else return new Err(`parameter ${id}: no value for '${key}'`);
        }
      }
      return v as Value;
    }
    // prefix family: p('x.y') where only x.y.<k> rows exist → map of them
    const kids = [...this.byId.values()].filter(p => p.id.startsWith(id + '.'));
    if (kids.length) {
      const o: Record<string, Value> = {};
      for (const k of kids) o[k.id.slice(id.length + 1)] = k.default as Value;
      return o;
    }
    return new Err(`unknown parameter '${id}' (INV-12)`);
  }
}

/** Resolver with per-runner overrides (ContextModifier output, preset values). */
export function makeParam(reg: Registry, overrides: Record<string, unknown> = {}): (id: string) => Value {
  return (id: string) => {
    const base = reg.base(id);
    if (!(id in overrides)) return base;
    const o = overrides[id] as Value;
    const dir = reg.entry(id)?.limit_direction ?? 'none';
    if (typeof base === 'number' && typeof o === 'number') {
      if (dir === 'upper') return Math.min(base, o);
      if (dir === 'lower') return Math.max(base, o);
    }
    // SPEC-QUESTION Q-E2: parameters.json marks deload.every 'none'; an override of a cadence is applied as MIN (a shorter cadence
    // is the cautious direction: CTX-001…004, PHS-005 "deload.every = min(deload.every, deload.every_ctx)").
    if (id === 'deload.every' && typeof base === 'number' && typeof o === 'number') return Math.min(base, o);
    return o;
  };
}
