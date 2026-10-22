# NOT FOR THE ORACLE SESSION: this script encodes the Engine session reading of the spec (gap/oracle.md §7).
"""Recompute 13 §3 (P3 Ana) under v5.2: 04 §3 allocation, 05 curve, S7 order (07 §2b) with the v5.2 defaults.
Hand-check script (not engine code). floor() on every cap, minutes."""
import math

W, T = 18, 3
V_HOLD, L0 = 210, 85            # claims: 210 min/week; L30_eff = 0.9 × 95 = 85.5 → 85
V_PEAK, L_TARGET = 360, 180
DELOAD_EVERY, DELOAD_CUT = 4, 0.25
ONBOARD = 2
PROB_WEEKS = 3                  # slow profile weeks 1–3 (13 convention: standard from week 4)
CONFIRM_WEEKS = 6               # LOD-008: confirmed after 6 logged weeks → from week 7
SPECIFIC_TARGET, SPECIFIC_MIN, BUILD_MIN, BUILD_MAX = 8, 4, 1, 8
f = math.floor

def phases(base_needed):
    R = W - T - 0
    S = min(SPECIFIC_TARGET, max(SPECIFIC_MIN, R - base_needed - BUILD_MIN))
    B = max(base_needed, ONBOARD - 0)
    U = R - B - S
    out = ["ONBOARD"] * ONBOARD + ["BASE"] * (B - ONBOARD) + ["BUILD"] * U + ["SPECIFIC"] * S + ["TAPER"] * T
    return out, (B, U, S)

def deloads(ph):
    d, last = [], 0
    w = DELOAD_EVERY
    while w <= W:
        if ph[w - 1] == "TAPER" or (W - T + 1) - w < 2:     # PHS-002 (taper or < 2 weeks before taper)
            break
        # PHS-004: weeks_to_phase_boundary <= 1 → last week of phase
        end = max(i for i in range(W) if ph[i] == ph[w - 1] and i >= w - 1 and all(ph[j] == ph[w - 1] for j in range(w - 1, i + 1))) + 1
        wtpb = end - w
        pos = end if wtpb <= 1 else w
        if pos - last - 1 < 2:                                # PHS-006
            pos = w
        d.append(pos); last = pos
        w = pos + DELOAD_EVERY
    return d

def curve(ph, dl):
    V, LR, prof = {}, {}, {}
    lr_hist = {0: L0}   # long run dated on Sunday of week w; claim treated as dated day 0 (week 0)
    for w in range(1, W - T + 1):
        standard = w > PROB_WEEKS
        prof[w] = "standard" if standard else "slow"
        nd = [x for x in range(1, w) if x not in dl]
        if w in dl:
            base = V[nd[-1]] if nd else V_HOLD
            V[w] = f((1 - DELOAD_CUT) * base)
            LR[w] = f((1 - DELOAD_CUT) * LR[nd[-1]])
            continue
        wk, w2 = (0.15, 0.30) if standard else (0.10, 0.20)
        base = V[nd[-1]] if nd else V_HOLD
        two_before = V[nd[-2]] if len(nd) >= 2 else V_HOLD
        cap = min((1 + wk) * base, (1 + w2) * two_before)
        if w <= CONFIRM_WEEKS:                        # LOD-007 while unconfirmed
            prev = [V[x] for x in range(max(1, w - 4), w)] or [V_HOLD]
            cap = min(cap, 1.10 * max(prev))
        V[w] = min(V_PEAK, f(cap))
        # L30_eff at Sunday of week w: long runs of the previous 4 Sundays (28 days; the claim counts until day 30)
        window = [LR[x] for x in range(max(1, w - 4), w)] + ([L0] if w <= 4 else [])
        LR[w] = min(f(1.10 * max(window)), L_TARGET, max(f(0.50 * V[w]), L0))
    # taper
    pre = [x for x in range(1, W - T + 1) if x not in dl][-1]
    for k, cut in enumerate([0.4 * 0.5, 0.7 * 0.5, 1.0 * 0.5], start=1):
        w = W - T + k
        V[w] = f(V[pre] * (1 - cut)); LR[w] = 0 if k == T else f(LR[pre] * (1 - cut))
        prof[w] = "—"
    return V, LR, prof

def growth_week(LR, dl):
    for w in sorted(LR):
        if LR[w] >= L_TARGET - 1 and w not in dl:   # within load.round_down_s
            return w

# --- 03 §4 dry-run iteration (12 §2b.4 dry_run_weeks_needed): closed form first, then S4 ↔ G at most 3 times
nL = math.ceil(math.log(L_TARGET / L0) / math.log(1.10)); nV = math.ceil(math.log(V_PEAK / V_HOLD) / math.log(1.10))
G = max(nL, nV) + max(nL, nV) // (DELOAD_EVERY - 1)
hist = []
for it in range(3):
    base_needed = max(0, G - BUILD_MIN - SPECIFIC_MIN)
    ph, (B, U, S) = phases(base_needed)
    dl = deloads(ph)
    V, LR, prof = curve(ph, dl)
    G2 = growth_week(LR, dl)
    hist.append((G, base_needed, (B, U, S), dl, G2))
    if G2 == G: break
    G = max(G, G2)
slack = W - (0 + max(base_needed, ONBOARD - 0) + BUILD_MIN + SPECIFIC_MIN + T)
print("closed form nL nV:", nL, nV, "iterations:", hist)
print("G", G, "base_needed", base_needed, "slack", slack, "phases B/U/S", (B, U, S), "deloads", dl)
for w in range(1, W + 1):
    print(w, ph[w - 1], prof[w], V[w], LR[w], "deload" if w in dl else "", round(LR[w] / V[w], 2) if LR[w] else "")

# ---------------- key sessions (07 §2b with the v5.2 defaults; derivation in the CHANGELOG) ----------------
WU, CD = 10, 5
def thr(reps, mins, rec=2): return dict(mod="SES-M-008", e3=reps * mins, e2=0, dur=WU + reps * mins + (reps - 1) * rec + CD, txt=f"THR intervals {reps} × {mins} min")
def prog(m): return dict(mod="SES-M-012", e3=f(0.15 * m), e2=f(0.15 * m), dur=m, txt=f"progression run {m} min")
EXP = 318   # expected race duration, min: slow edge of the information band (HM 2:08 recalled ×2.19 ×0.98 ×(1+0.07×1.5×1.5))
def msp(share, max_rep=20, rec=2):
    work = share * EXP; reps = math.ceil(work / max_rep); rep = math.floor(work / reps * 2) / 2
    return dict(mod="SES-M-011", e3=0, e2=reps * rep, dur=f(WU + reps * rep + (reps - 1) * rec + CD), txt=f"race-effort intervals {reps} × {rep:g} min E2")
STRIDES = dict(mod="SES-M-006", e3=0, e2=0, dur=None, txt="strides on an easy run")
keys = {1: [], 2: [], 3: [STRIDES], 4: [STRIDES], 5: [STRIDES], 6: [STRIDES], 7: [thr(3, 5), prog(40)], 8: [thr(3, 5)],
        9: [thr(3, 6), STRIDES], 10: [thr(3, 7), STRIDES], 11: [dict(thr(2, 8), txt="THR L1 test 2 × 8 min"), STRIDES],
        12: [msp(0.10)], 13: [msp(0.15), thr(3, 8)], 14: [msp(0.20), thr(4, 8)], 15: [msp(0.20), thr(4, 8)],
        16: [dict(mod="SES-M-024", e3=10, e2=0, dur=None, txt="sharpener 2 × 5 min E3 in an easy run")],
        17: [dict(mod="SES-M-024", e3=10, e2=0, dur=None, txt="sharpener 2 × 5 min E3 in an easy run")], 18: [STRIDES]}
print("\nweek  keys | E3 min ≤ 0.10 V | E2 min ≤ 0.20 V")
for w in range(1, W + 1):
    e3 = sum(k["e3"] for k in keys[w]); e2 = sum(k["e2"] for k in keys[w])
    print(w, "; ".join(k["txt"] + (f" ({k['dur']} min)" if k["dur"] else "") for k in keys[w]), "|", e3, "≤", f(0.10 * V[w]), e3 <= 0.10 * V[w], "|", e2, "≤", f(0.20 * V[w]), e2 <= 0.20 * V[w])
# step check for wk15: step 3 (0.25) does not fit the E2 budget
print("wk15 step3 0.25:", msp(0.25), "budget", f(0.20 * 360))
# ---------------- week 6 card: water fill ----------------
w = 6; lr = LR[w]; l30_sat = LR[5]
sat = min(f(0.5 * lr), f(1.6 * l30_sat - lr))
rest = V[w] - lr - sat
print("\nweek 6: Sun", lr, "Sat cap", sat, "Tue/Thu", rest / 2, "sum", lr + sat + 2 * f(rest / 2))
# paces from FT-1 3 km 16:30
t = 990; e = 1.06
t10 = t * (10000 / 3000) ** e
em = max(1.06, math.log(2.19) / math.log(2)); tm = t * (42195 / 3000) ** em
vm = 42195 / tm
print("10K-eq", t10, "M-eq", tm / 3600, "E1 pace s/km", 1000 / (0.92 * vm), 1000 / (0.72 * vm), "CS", 10000 / t10)
