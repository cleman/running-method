// A small JSON Schema (draft 2020-12 subset) checker for the contract test (TST-130). Test-only code; covers the keywords
// spec/schema uses: $ref (local and cross-file), type, enum, const, required, properties, additionalProperties,
// propertyNames, items, minItems, uniqueItems, oneOf, anyOf, allOf, if/then, pattern, minimum, maximum.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SPEC_DIR } from './helpers.ts';

type S = Record<string, any>;
const files = new Map<string, S>();
function load(name: string): S {
  if (!files.has(name)) files.set(name, JSON.parse(readFileSync(resolve(SPEC_DIR, 'schema', name), 'utf8')));
  return files.get(name)!;
}
function deref(ref: string, file: string): [S, string] {
  const [f, frag] = ref.split('#');
  const fileName = f || file;
  let node: any = load(fileName);
  for (const part of (frag ?? '').split('/').filter(Boolean)) node = node[part];
  return [node, fileName];
}
const typeOf = (v: unknown) => (v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v);
const isType = (v: unknown, t: string) => t === typeOf(v) || (t === 'number' && typeof v === 'number');

export function check(v: unknown, schema: S, file: string, path: string, errs: string[]): void {
  if (errs.length > 20) return;
  if (schema.$ref) { const [s, f] = deref(schema.$ref, file); check(v, s, f, path, errs); }
  if (schema.type) { const ts = Array.isArray(schema.type) ? schema.type : [schema.type]; if (!ts.some((t: string) => isType(v, t))) { errs.push(`${path}: type ${typeOf(v)} not in ${ts}`); return; } }
  if (schema.enum && !schema.enum.some((e: unknown) => JSON.stringify(e) === JSON.stringify(v))) errs.push(`${path}: ${JSON.stringify(v)} not in enum`);
  if ('const' in schema && JSON.stringify(schema.const) !== JSON.stringify(v)) errs.push(`${path}: const`);
  if (typeof v === 'string' && schema.pattern && !new RegExp(schema.pattern).test(v)) errs.push(`${path}: '${v}' !~ ${schema.pattern}`);
  if (typeof v === 'number') {
    if (schema.minimum !== undefined && v < schema.minimum) errs.push(`${path}: ${v} < ${schema.minimum}`);
    if (schema.maximum !== undefined && v > schema.maximum) errs.push(`${path}: ${v} > ${schema.maximum}`);
  }
  if (Array.isArray(v)) {
    if (schema.minItems !== undefined && v.length < schema.minItems) errs.push(`${path}: fewer than ${schema.minItems} items`);
    if (schema.uniqueItems && new Set(v.map(x => JSON.stringify(x))).size !== v.length) errs.push(`${path}: items not unique`);
    if (schema.items) v.forEach((x, i) => check(x, schema.items, file, `${path}[${i}]`, errs));
  }
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    for (const r of schema.required ?? []) if (!(r in o)) errs.push(`${path}: missing ${r}`);
    const props = schema.properties ?? {};
    for (const [k, x] of Object.entries(o)) {
      if (k in props) check(x, props[k], file, `${path}.${k}`, errs);
      else if (schema.additionalProperties === false) errs.push(`${path}: unexpected property ${k}`);
      else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') check(x, schema.additionalProperties, file, `${path}.${k}`, errs);
      if (schema.propertyNames) check(k, schema.propertyNames, file, `${path}{${k}}`, errs);
    }
  }
  for (const s of schema.allOf ?? []) check(v, s, file, path, errs);
  if (schema.anyOf && !schema.anyOf.some((s: S) => { const e: string[] = []; check(v, s, file, path, e); return !e.length; })) errs.push(`${path}: anyOf`);
  if (schema.oneOf) {
    const n = schema.oneOf.filter((s: S) => { const e: string[] = []; check(v, s, file, path, e); return !e.length; }).length;
    if (n !== 1) errs.push(`${path}: oneOf matched ${n}`);
  }
  if (schema.if) {
    const e: string[] = []; check(v, schema.if, file, path, e);
    if (!e.length && schema.then) check(v, schema.then, file, path, errs);
    if (e.length && schema.else) check(v, schema.else, file, path, errs);
  }
}

export function validateResult(result: unknown): string[] {
  const errs: string[] = [];
  check(result, load('result.schema.json'), 'result.schema.json', '$', errs);
  return errs;
}
export function validateInput(input: unknown): string[] {
  const errs: string[] = [];
  check(input, load('input-profile.schema.json'), 'input-profile.schema.json', '$', errs);
  return errs;
}
