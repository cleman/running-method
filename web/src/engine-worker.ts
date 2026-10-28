// The engine as it runs in the page: loads spec/rules.json and spec/parameters.json once, then answers
// { id, input } messages with { id, result } (or { id, error }). The engine itself is unchanged (engine/src).
// Runs inside a Web Worker; if the browser refuses workers, the page loads this same script on the main thread
// and calls globalThis.__rmEngine.run directly.
import { loadSpec, generate, type Spec } from '../../engine/src/index.ts';
import rules from '../../spec/rules.json';
import params from '../../spec/parameters.json';

let spec: Spec | null = null;
function run(input: unknown): unknown {
  spec ??= loadSpec(rules, params);
  return generate(spec, input as Parameters<typeof generate>[1]);
}
(globalThis as Record<string, unknown>).__rmEngine = { run, version: (rules as { version: string }).version };

declare const WorkerGlobalScope: unknown;
if (typeof WorkerGlobalScope !== 'undefined') {
  (self as unknown as Worker).onmessage = (e: MessageEvent<{ id: number; input: unknown }>) => {
    const t0 = Date.now();
    try {
      const result = run(e.data.input);
      (self as unknown as Worker).postMessage({ id: e.data.id, result, ms: Date.now() - t0 });
    } catch (err) {
      (self as unknown as Worker).postMessage({ id: e.data.id, error: String((err as Error)?.stack ?? err) });
    }
  };
}
