"""Render an engine result (JSON) as a readable week-by-week markdown table. v5.3, engine session.
Usage: python3 -I docs/scripts/plan_to_md.py result.json > plan.md   (prints the weeks only; no advice is added)"""
import json, sys
r = json.load(open(sys.argv[1]))
EFF = {'E1': 'easy', 'E2': 'steady', 'E3': 'threshold', 'E4': '5K effort', 'E5': 'strides'}
NAME = {'SES-M-001': 'Easy', 'SES-M-003': 'Long run', 'SES-M-004': 'Long run (fuelled)', 'SES-M-008': 'Threshold intervals', 'SES-M-009': 'Tempo',
        'SES-M-010': 'VO2 long reps', 'SES-M-011': 'Race pace', 'SES-M-019': 'Time trial 3 km', 'SES-M-024': 'Sharpener', 'SES-M-026': 'RACE',
        'SES-M-027': 'Short reps', 'SES-M-028': 'Hills', 'SES-M-029': 'Fartlek', 'SES-M-030': 'Threshold + VO2', 'SES-M-031': 'Long run, steady finish'}
def mmss(s): return f"{s // 60}:{s % 60:02d}"
def pace(p): return f"{mmss(p['fast_s_per_km'])}–{mmss(p['slow_s_per_km'])}/km" if p else ''
def dur(s):
    return f"{s // 60} min" if s % 60 == 0 else f"{s // 60}:{s % 60:02d}"
def work(s):
    out = []
    for g in s['segments']:
        if g.get('role') == 'work' or (g.get('role') == 'strides'):
            t = g.get('duration_s', 0)
            if g.get('role') == 'strides': out.append(f"+ {g['repeats']} strides"); continue
            if g.get('show_distance_m'):
                d = g['show_distance_m']; q = f"{d // 1000} km" if d >= 2000 and d % 1000 == 0 else f"{d} m"
            else: q = dur(t) + (f" (≈ {g['show_about_m']} m)" if g.get('show_about_m') else '')
            rep = f"{g['repeats']} × {q}" if g['repeats'] > 1 else q
            rec = ''
            if g.get('recovery') and g['repeats'] > 1:
                rc = g['recovery']; rec = f", {rc['show_distance_m']} m jog" if rc.get('show_distance_m') else f", {dur(rc['duration_s'])} jog"
            out.append(f"{rep} {EFF.get(g['effort'], g['effort'])}{rec}")
    return '; '.join(out)
p = r['plan']
print('| Wk | Phase | Total | Key sessions (day: session) | Long run |')
print('|---|---|---|---|---|')
for w in p['weeks']:
    ph = w['phase'] + (' (deload)' if w['is_deload'] else '') + (' (calibration)' if w.get('is_calibration') else '') + (f" form {w['long_run_form']}" if w.get('long_run_form') else '')
    keys = [s for s in w['sessions'] if s['is_key'] and not s['is_long_run'] and not s.get('is_goal_race')]
    ks = '<br>'.join(f"{s['weekday']}: **{NAME.get(s['module_id'], s['module_id'])}** {work(s)} ({dur(s['planned_duration_s'])} in all{', E3 ' + pace(s['pace_range']) if s.get('pace_range') and s['effort_target'] == 'E3' else ''}{', E4 ' + pace(s['pace_range']) if s.get('pace_range') and s['effort_target'] == 'E4' else ''})" for s in keys) or '—'
    lr = next((s for s in w['sessions'] if s['is_long_run']), None)
    race = next((s for s in w['sessions'] if s.get('is_goal_race')), None)
    lrt = (f"{lr['weekday']} {dur(lr['planned_duration_s'])}" + (f", last {dur(lr['segments'][-1]['duration_s'])} steady" if lr['module_id'] == 'SES-M-031' else '')) if lr else ''
    if race: lrt += f" RACE {race['weekday']} {race['date']}"
    easy = [s for s in w['sessions'] if s['is_run'] and not s['is_key'] and not s['is_long_run'] and not s.get('is_goal_race')]
    print(f"| {w['index']} | {ph} | {w['planned_time_s'] // 60} min, {len([s for s in w['sessions'] if s['is_run']])} runs | {ks} | {lrt} |")
