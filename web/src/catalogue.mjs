// Build-time parsers: spec/messages.md and spec/06-session-library.md → the catalogue the page reads.
// messages.md governs every text the runner sees (its header says so); nothing here rewrites a message.
// messages.md → { id: { text, why, layer } }, reason codes, headlines and option texts (spec/messages.md governs)
function cells(line) { return line.split('|').slice(1, -1).map(c => c.trim()); }
function unquote(s) { return s.replace(/\s*\*\*[A-Z]+\*\*\s*$/, '').replace(/^"(.*)"$/s, '$1').replace(/^"|"$/g, ''); }
export function parseMessages(md) {
  const msgs = {}, reasons = {}, options = {}, headlines = {};
  let section = '';
  for (const line of md.split('\n')) {
    if (line.startsWith('## ')) section = line.slice(3).trim();
    if (!line.startsWith('|') || line.startsWith('|---')) continue;
    const c = cells(line);
    if (/^MSG-[A-Z0-9-]+$/.test(c[0]) && c.length >= 4) {
      msgs[c[0]] = { layer: c[1], text: unquote(c[2]), why: c[3] === '"—"' || c[3] === '—' ? '' : unquote(c[3]).replace(/\s*\(v5[^)]*\)\s*$/, '').replace(/\s*\(The clause[^)]*\)\s*$/, '') };
    } else if (section.startsWith('2. Reason codes') && /^[A-Z_]+$/.test(c[0])) {
      reasons[c[0]] = { text: unquote(c[1]), why: unquote(c[2]) };
    } else if (section.startsWith('5. Repair options') && /^[a-z_+ ]+$/.test(c[0].replace(/\s*\(.*\)\s*$/, ''))) {
      const k = c[0].replace(/\s*\(.*\)\s*$/, '').replace(/\s+/g, '');
      options[k] = unquote(c[1].replace(/\s*\((never|offered)[^)]*\)\s*$/, ''));
    } else if (section.startsWith('1. Verdict headlines') && c[0] !== 'Verdict / headline') {
      const key = c[0].replace(/\*\*/g, '').replace(/^stretch: /, '');
      headlines[key] = unquote(c[1]);
    }
  }
  return { msgs, reasons, options, headlines };
}

// ---- 06 §1 module table → { SES-M-xxx: name }
export function parseModules(md) {
  const out = {};
  for (const line of md.split('\n')) {
    const c = line.startsWith('| SES-M-') ? cells(line) : null;
    if (c && /^SES-M-\d{3}$/.test(c[0]) && !out[c[0]]) out[c[0]] = c[1];
  }
  out['SES-M-026'] ??= 'Race';
  return out;
}


// The few parameter defaults the page itself needs (dates of attestations, age prompts, display).
export function paramDefaults(params) {
  const want = ['flag.clearance_min_delay_days', 'deload.every_ctx', 'minor.adult_age', 'minor.min_age', 'masters.vigorous_assessment_age', 'log.contemporaneous_window_h', 'pp.min_weeks'];
  return Object.fromEntries(params.parameters.filter(p => want.includes(p.id)).map(p => [p.id, p.default]));
}
