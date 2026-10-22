// RuleExpr evaluation with CEL's four values: true, false, error (E), unknown (U) (spec 12 §3.2, §3.9).
//  - A declared unknown (runner left it blank / "I don't know", unanswered safety item) evaluates to U.
//  - An absent value that is not declared unknown is E; E never fires a rule and sends the call to safe state.
//  - null = "not asked / not applicable": == null is true; <, <=, >, >= with null are false; arithmetic gives null;
//    a member of null is null; has() is false.
//  - &&, || are commutative and absorbing: a definite false (&&) / true (||) wins over U and E; otherwise E dominates U.
import { type Node, parseCached, pathOf } from './parser.ts';

export class Unknown { readonly kind = 'U'; readonly why: string; constructor(why = '') { this.why = why; } }
export class Err { readonly kind = 'E'; readonly why: string; constructor(why: string) { this.why = why; } }
export const U = new Unknown();
export type Value = number | string | boolean | null | Value[] | { [k: string]: Value } | Unknown | Err | object;

export const isU = (v: unknown): v is Unknown => v instanceof Unknown;
export const isE = (v: unknown): v is Err => v instanceof Err;
export const isSpecial = (v: unknown): v is Unknown | Err => v instanceof Unknown || v instanceof Err;

/** Sentinel stored in data for a declared-unknown field. */
export const DECLARED_UNKNOWN = U;

export type Helper = (args: Value[], ctx: EvalContext) => Value;
export interface EvalContext {
  /** root name → value (objects may hold U for declared unknowns, null for not-applicable) */
  roots: Record<string, Value>;
  helpers: Record<string, Helper>;
  /** p(id) resolver */
  param: (id: string) => Value;
  /** comprehension variables currently bound */
  vars?: Record<string, Value>;
}

function child(ctx: EvalContext, name: string, v: Value): EvalContext {
  return { ...ctx, vars: { ...(ctx.vars ?? {}), [name]: v } };
}

function getField(obj: Value, name: string, path: string): Value {
  if (isSpecial(obj)) return obj;
  if (obj === null) return null;
  if (typeof obj !== 'object' || Array.isArray(obj)) return new Err(`field '${name}' of a non-object (${path})`);
  const o = obj as Record<string, Value>;
  if (!(name in o) || o[name] === undefined) return new Err(`absent: ${path}`);
  return o[name];
}

export function truthy(v: Value): boolean | Unknown | Err {
  if (isSpecial(v)) return v;
  if (v === null) return false; // SPEC-QUESTION Q-E1: null in a boolean position reads as false (12 §3.9: null compares false)
  if (typeof v === 'boolean') return v;
  return new Err(`non-boolean in boolean position: ${JSON.stringify(v)}`);
}

function eq(a: Value, b: Value): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => eq(x, b[i]));
  if (typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a as object), kb = Object.keys(b as object);
    return ka.length === kb.length && ka.every(k => eq((a as any)[k], (b as any)[k]));
  }
  return false;
}

function arith(op: string, a: Value, b: Value): Value {
  if (isE(a)) return a; if (isE(b)) return b;
  if (isU(a) || isU(b)) return U;
  if (a === null || b === null) return null;
  if (op === '+' && typeof a === 'string' && typeof b === 'string') return a + b;
  if (op === '+' && Array.isArray(a) && Array.isArray(b)) return [...a, ...b];
  if (typeof a !== 'number' || typeof b !== 'number') return new Err(`arithmetic '${op}' on ${typeof a}/${typeof b}`);
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/': return b === 0 ? new Err('division by zero') : a / b;
  }
  return new Err('op ' + op);
}

function compare(op: string, a: Value, b: Value): Value {
  if (op === '==' || op === '!=') {
    if (isE(a)) return a; if (isE(b)) return b;
    if (isU(a) || isU(b)) return U;
    const r = eq(a, b);
    return op === '==' ? r : !r;
  }
  if (isE(a)) return a; if (isE(b)) return b;
  if (isU(a) || isU(b)) return U;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b || (typeof a !== 'number' && typeof a !== 'string')) return new Err(`compare ${typeof a} ${op} ${typeof b}`);
  const x = a as number | string, y = b as number | string;
  switch (op) {
    case '<': return x < y;
    case '<=': return x <= y;
    case '>': return x > y;
    case '>=': return x >= y;
  }
  return new Err('op ' + op);
}

function andOr(op: '&&' | '||', a: Value, b: () => Value): Value {
  const ta = truthy(a);
  const absorb = op === '&&' ? false : true;
  if (ta === absorb) return absorb;
  const tb = truthy(b());
  if (tb === absorb) return absorb;
  if (isE(ta)) return ta; if (isE(tb)) return tb;
  if (isU(ta) || isU(tb)) return U;
  return !absorb;
}

const MACROS = new Set(['all', 'exists', 'count', 'sum', 'max_or_zero', 'first', 'sort_by', 'has', 'filter']);

function asList(v: Value): Value[] | Unknown | Err {
  if (isSpecial(v)) return v;
  if (v === null) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === 'object') return Object.values(v as object) as Value[];
  return new Err('not a list');
}

function macro(n: Extract<Node, { t: 'call' }>, ctx: EvalContext): Value {
  const { fn, args } = n;
  if (fn === 'has') {
    if (args.length !== 1) return new Err('has/1');
    const v = evaluate(args[0], ctx);
    return !(isSpecial(v) || v === null || v === undefined);
  }
  // pairs form: all(pairs(L), a, b, pred)
  if (fn === 'all' && args.length === 4) {
    const lst = asList(evaluate(args[0], ctx));
    if (isSpecial(lst)) return lst;
    const [va, vb] = [args[1], args[2]].map(a => (a.t === 'ident' ? a.name : ''));
    let res: Value = true;
    for (const pr of lst as Value[]) {
      const [x, y] = pr as Value[];
      const t = truthy(evaluate(args[3], child(child(ctx, va, x), vb, y)));
      if (t === false) return false;
      if (isE(t)) res = t; else if (isU(t) && !isE(res)) res = U;
    }
    return res;
  }
  if (args.length < 2) return new Err(`${fn}: needs a list and a variable`);
  const lst = asList(evaluate(args[0], ctx));
  if (isSpecial(lst)) return lst;
  const v = args[1].t === 'ident' ? args[1].name : '';
  const items = lst as Value[];
  const body = args[2];
  switch (fn) {
    case 'all':
    case 'exists': {
      const absorb = fn === 'exists';
      let res: Value = !absorb;
      for (const x of items) {
        const t = truthy(evaluate(body, child(ctx, v, x)));
        if (t === absorb) return absorb;
        if (isE(t)) res = t; else if (isU(t) && !isE(res)) res = U;
      }
      return res;
    }
    case 'count': {
      let c = 0; let special: Value = null;
      for (const x of items) {
        const t = truthy(evaluate(body, child(ctx, v, x)));
        if (t === true) c++; else if (isE(t)) special = t; else if (isU(t) && !isE(special)) special = U;
      }
      return special ?? c;
    }
    case 'sum':
    case 'max_or_zero': {
      let acc = 0; let first = true;
      for (const x of items) {
        const val = evaluate(body, child(ctx, v, x));
        if (isSpecial(val)) return val;
        if (val === null) continue;
        if (typeof val !== 'number') return new Err(`${fn}: non-number`);
        if (fn === 'sum') acc += val; else { acc = first ? Math.max(0, val) : Math.max(acc, val); first = false; }
      }
      return acc;
    }
    case 'first': {
      for (const x of items) {
        const t = truthy(evaluate(body, child(ctx, v, x)));
        if (t === true) return x;
        if (isSpecial(t)) return t;
      }
      return null; // v5.2 (12 §3.9): none → null
    }
    case 'filter': {
      const out: Value[] = [];
      for (const x of items) {
        const t = truthy(evaluate(body, child(ctx, v, x)));
        if (isSpecial(t)) return t;
        if (t) out.push(x);
      }
      return out;
    }
    case 'sort_by': {
      const keyed: { k: Value[]; x: Value }[] = [];
      for (const x of items) {
        const k = evaluate(body, child(ctx, v, x));
        if (isSpecial(k)) return k;
        keyed.push({ k: Array.isArray(k) ? (k as Value[]) : [k], x });
      }
      const cmp = (a: Value, b: Value) => (a === b ? 0 : (a as any) < (b as any) ? -1 : 1);
      keyed.sort((a, b) => { for (let i = 0; i < a.k.length; i++) { const c = cmp(a.k[i], b.k[i]); if (c) return c; } return 0; });
      return keyed.map(e => e.x);
    }
  }
  return new Err('macro ' + fn);
}

export function evaluate(n: Node, ctx: EvalContext): Value {
  switch (n.t) {
    case 'num': return n.v;
    case 'str': return n.v;
    case 'bool': return n.v;
    case 'null': return null;
    case 'ident': {
      if (ctx.vars && n.name in ctx.vars) return ctx.vars[n.name];
      if (n.name in ctx.roots) { const r = ctx.roots[n.name]; return r === undefined ? new Err('absent root ' + n.name) : r; }
      return new Err(`undeclared name '${n.name}'`);
    }
    case 'member': return getField(evaluate(n.obj, ctx), n.name, pathOf(n) ?? n.name);
    case 'index': {
      const o = evaluate(n.obj, ctx);
      const k = evaluate(n.key, ctx);
      if (isE(o)) return o; if (isE(k)) return k;
      if (isU(o) || isU(k)) return U;
      if (o === null || k === null) return null;
      if (Array.isArray(o)) {
        if (typeof k !== 'number') return new Err('list index not a number');
        return k >= 0 && k < o.length ? o[k] : new Err('index out of range');
      }
      if (typeof o === 'object') {
        const key = String(k);
        const m = o as Record<string, Value>;
        return key in m && m[key] !== undefined ? m[key] : new Err(`absent key '${key}'`);
      }
      return new Err('index on a scalar');
    }
    case 'list': return n.items.map(i => evaluate(i, ctx));
    case 'map': {
      const o: Record<string, Value> = {};
      for (const [k, v] of n.entries) {
        const kk = evaluate(k, ctx);
        if (isSpecial(kk)) return kk;
        o[String(kk)] = evaluate(v, ctx);
      }
      return o;
    }
    case 'unary': {
      const a = evaluate(n.arg, ctx);
      if (n.op === '-') return arith('-', 0, a);
      const t = truthy(a);
      return isSpecial(t) ? t : !t;
    }
    case 'bin': {
      if (n.op === '&&' || n.op === '||') return andOr(n.op, evaluate(n.l, ctx), () => evaluate(n.r, ctx));
      const a = evaluate(n.l, ctx);
      const b = evaluate(n.r, ctx);
      if (n.op === 'in') {
        if (isE(a)) return a; if (isE(b)) return b;
        if (isU(a) || isU(b)) return U;
        if (b === null) return false;
        if (Array.isArray(b)) { let u = false; for (const x of b) { if (isU(x)) u = true; else if (eq(a, x)) return true; } return u ? U : false; }
        if (typeof b === 'object') return a !== null && String(a) in (b as object);
        if (typeof b === 'string' && typeof a === 'string') return b.includes(a);
        return new Err("'in' on a scalar");
      }
      if (['+', '-', '*', '/'].includes(n.op)) return arith(n.op, a, b);
      return compare(n.op, a, b);
    }
    case 'cond': {
      const c = truthy(evaluate(n.c, ctx));
      if (isSpecial(c)) return c;
      return c ? evaluate(n.a, ctx) : evaluate(n.b, ctx);
    }
    case 'call': {
      if (n.target) return new Err('method call syntax is not part of RuleExpr');
      if (MACROS.has(n.fn)) return macro(n, ctx);
      if (n.fn === 'p') {
        const id = evaluate(n.args[0], ctx);
        if (isSpecial(id)) return id;
        return ctx.param(String(id));
      }
      if (n.fn === 'pairs') {
        const l = asList(evaluate(n.args[0], ctx));
        if (isSpecial(l)) return l;
        const out: Value[] = [];
        const items = l as any[];
        for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) out.push([items[i], items[j]]);
        return out;
      }
      const h = ctx.helpers[n.fn];
      if (!h) return new Err(`unknown function '${n.fn}'`);
      const args = n.args.map(a => evaluate(a, ctx));
      return h(args, ctx);
    }
  }
}

export function evalExpr(src: string, ctx: EvalContext): Value {
  try { return evaluate(parseCached(src), ctx); } catch (e) { return new Err('parse: ' + (e as Error).message); }
}
