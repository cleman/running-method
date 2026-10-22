// Public API of the engine (pure functions; no network, no database, no UI; runs in Node and in a browser).
export { loadSpec, type Spec } from './context.ts';
export { generate, type Result, type ResultKind } from './generate.ts';
export { validate, type ValidationReport, type Violation } from './validate/validator.ts';
export { parse } from './expr/parser.ts';
export { evalExpr, U, isU, isE, type Value, type EvalContext } from './expr/eval.ts';
export { RuleSet, evaluateRecord, composeTarget, runRecords } from './rules/engine.ts';
export { Registry, makeParam } from './rules/params.ts';
export { canonical } from './util/canonical.ts';
export type * from './model/types.ts';
