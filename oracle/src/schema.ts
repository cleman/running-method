// Contract check (TST-130): every fixture and every generator result is parsed only through the JSON
// Schemas of spec/schema (draft 2020-12). The oracle reads no field the schema does not declare.
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import fs from 'node:fs';
import path from 'node:path';
import { SCHEMA_DIR } from './paths.js';

const FILES = ['common.schema.json', 'input-profile.schema.json', 'result.schema.json', 'fixture-input.schema.json'];

let ajv: InstanceType<typeof Ajv2020> | null = null;

function load(): InstanceType<typeof Ajv2020> {
  if (ajv) return ajv;
  const a = new Ajv2020({ allErrors: true, strict: false });
  (addFormats as unknown as (x: unknown) => void)(a);
  for (const f of FILES) {
    const s = JSON.parse(fs.readFileSync(path.join(SCHEMA_DIR, f), 'utf8'));
    a.addSchema(s, f);
  }
  ajv = a;
  return a;
}

export interface SchemaCheck { ok: boolean; errors: string[] }

function check(id: string, data: unknown): SchemaCheck {
  const a = load();
  const v = a.getSchema(id);
  if (!v) throw new Error(`schema ${id} not loaded`);
  const ok = v(data) as boolean;
  return { ok, errors: ok ? [] : (v.errors ?? []).map((e) => `${e.instancePath || '/'} ${e.message} ${JSON.stringify(e.params)}`) };
}

export const validateFixture = (d: unknown) => check('fixture-input.schema.json', d);
export const validateInput = (d: unknown) => check('input-profile.schema.json', d);
export const validateResult = (d: unknown) => check('result.schema.json', d);
