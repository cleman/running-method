// L0 (gap/oracle.md §7): the oracle's hand transcription of parameters (src/params.ts) against the
// generated registry spec/parameters.json. A difference is a FINDING for the owner, never a silent fix:
// it is written to reports/params-diff.json and printed. The test fails only if the registry cannot be read.
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { P } from '../src/params.js';
import { REPORTS_DIR, SPEC_DIR } from '../src/paths.js';

describe('parameters: oracle transcription vs spec/parameters.json', () => {
  it('compares every scalar parameter that has the same id in the registry', () => {
    const reg = JSON.parse(fs.readFileSync(path.join(SPEC_DIR, 'parameters.json'), 'utf8'));
    const byId = new Map<string, any>(reg.parameters.map((p: any) => [p.id, p]));
    const findings: { id: string; oracle: unknown; registry: unknown }[] = [];
    let compared = 0;
    for (const [id, v] of Object.entries(P)) {
      const r = byId.get(id);
      if (!r || typeof v === 'object') continue;
      compared++;
      const d = r.default;
      const same = typeof v === 'number' && typeof d === 'number' ? Math.abs(v - d) < 1e-9 : JSON.stringify(v) === JSON.stringify(d);
      if (!same) findings.push({ id, oracle: v, registry: d });
    }
    // maps checked by hand-picked keys
    const map = (id: string) => byId.get(id)?.default;
    const pairs: [string, unknown, unknown][] = [
      ['taper.weeks', P['taper.weeks'], map('taper.weeks')],
      ['taper.cut_profile', P['taper.cut_profile'], map('taper.cut_profile')],
      ['minor.max_race_km.recommended', P['minor.max_race_km.recommended'], map('minor.max_race_km.recommended')],
      ['race.recovery_days', P['race.recovery_days'], map('race.recovery_days')],
    ];
    for (const [id, o, r] of pairs) {
      if (r === undefined) { findings.push({ id, oracle: o, registry: 'absent' }); continue; }
      compared++;
      const norm = (x: unknown) => JSON.stringify(x, Object.keys(x as object).sort());
      if (norm(o) !== norm(r)) findings.push({ id, oracle: o, registry: r });
    }
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
    fs.writeFileSync(path.join(REPORTS_DIR, 'params-diff.json'), JSON.stringify({ compared, findings }, null, 1));
    if (findings.length) console.log('PARAMETER FINDINGS (oracle transcription ≠ registry):', JSON.stringify(findings, null, 1));
    expect(compared).toBeGreaterThan(50);
  });
});
