import { day0, loadEngine } from '../src/engine.js';
import { fixture } from '../src/fixtures.js';
import { replay, type WeekCall } from '../src/harness.js';
import type { Result } from '../src/types.js';

const d0 = new Map<string, Promise<Result | null>>();
export function day0Of(id: string): Promise<Result | null> {
  if (!d0.has(id)) d0.set(id, day0(id, fixture(id).input));
  return d0.get(id)!;
}

const rp = new Map<string, Promise<WeekCall[] | null>>();
/** Weekly as_planned replay; needs a live engine (ORACLE_ENGINE). */
export function replayOf(id: string, maxWeeks?: number): Promise<WeekCall[] | null> {
  const key = `${id}#${maxWeeks ?? ''}`;
  if (!rp.has(key)) rp.set(key, (async () => {
    const g = await loadEngine();
    if (!g) return null;
    return (await replay(fixture(id), g, { maxWeeks })).calls;
  })());
  return rp.get(key)!;
}
export async function callOf(id: string, call: 'day0' | number): Promise<Result | null> {
  if (call === 'day0') return day0Of(id);
  const calls = await replayOf(id, call);
  return calls?.find((c) => c.week === call)?.result ?? null;
}
