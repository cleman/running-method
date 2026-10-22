"""Build spec/rules.json from the module texts (the only source). v5.2.

Usage: python3 -I design/v5/tools/build_rules.py design/v5

Sources read:
  * every `RULE ... | basis X | default? yes/no` line in 01-11 (human-readable record, 12 §3.1);
  * every ```rulexpr block (machine records: condition, on_unknown, typed action, status);
  * the INV table of 07 §5 and its ```rulexpr-inv block (assertions);
  * 12 §2b (declared roots, helper functions, procedures) and §3.3 (action schema) for the build checks.
Nothing is held in this script except the parsing logic and the build checks.
Exit code 1 on any build error (unknown op, missing required action field, record without RULE line,
T0-T2 RULE line or invariant without a record, duplicate id or (tier, nnn)).
"""
import re, json, glob, os, sys, collections

V = sys.argv[1]
os.chdir(V)
errors = []
warnings = []  # MVP-tagged rules still text_only (release blocker B-4); TST-121 fails on them

def err(*a):
    errors.append(" ".join(str(x) for x in a))

GR = r"VERIFIED|CORROBORATED|CREDIBLE|ALLEGED|CONTRADICTED|UNKNOWN|N/A"
rx = re.compile(r"^RULE ([A-Z]+-\d+) \| priority (T\d)\.(\d+) \| when (.*?) \| then (.*?) \| because (.*?) \| evidence (.*?) \| basis (evidence|convention|design_default|eng) \| default\? (yes|no)\s*$")
inv_rx = re.compile(r"^\| (INV-\d+) \| (T\d) \| (.*?) \| (.*?) \| (.*?) \|\s*$")
block_rx = re.compile(r"```(rulexpr|rulexpr-inv)\n(.*?)```", re.S)

# ---- 12: action schema and procedures (the document is the source of truth) ----
m12 = open("12-data-model-and-rule-format.md", encoding="utf-8").read()
sec33 = m12.split("### 3.3", 1)[1].split("\n### ", 1)[0]
OPS = {}
for line in sec33.splitlines():
    m = re.match(r"^\| `([a-z_]+)` \| ([^|]*) \|", line)
    if m:
        OPS[m.group(1)] = [x.strip(" `") for x in m.group(2).split(",") if x.strip(" `—-")]
sec2b = m12.split("### 2b.4", 1)[1].split("\n### ", 1)[0] if "### 2b.4" in m12 else ""
PROCEDURES = set(re.findall(r"^\| `([a-z_0-9]+)\(", sec2b, re.M))
# v5.2: optional action fields (12 §3.3b) and the event-type catalogue (12 §3.5)
sec33b = m12.split("### 3.3b", 1)[1].split("\n### ", 1)[0] if "### 3.3b" in m12 else ""
COMMON = {"op", "then", "msg", "when", "otherwise", "until", "unless"}
OPTIONAL = {}
for line in sec33b.splitlines():
    m = re.match(r"^\| ((?:`[a-z_]+`(?:, )?)+) \| ([^|]*) \|", line)
    if m:
        opt = [x.strip(" `") for x in m.group(2).split(",") if x.strip(" `") and not x.strip().startswith("(")]
        for op in re.findall(r"`([a-z_]+)`", m.group(1)):
            OPTIONAL[op] = set(opt)
sec35 = m12.split("### 3.5", 1)[1].split("\n### ", 1)[0] if "### 3.5" in m12 else ""
EVENT_STAGE = {}
for line in sec35.splitlines():
    m = re.match(r"^\| ([a-z0-9_, ]+) \| [^|]* \| ([A-Za-z0-9_.]+) \|", line)
    if m:
        for ev in [x.strip() for x in m.group(1).split(",")]:
            EVENT_STAGE[ev] = m.group(2)
MODULE_STAGE = {"INP": "S0", "SCR": "S1", "CTX": "S1", "CMP": "S2", "FEA": "S3", "PHS": "S4", "LOD": "S6", "SES": "S7",
                "DST": "S7", "NUT": "S7", "ADP": "on_event", "SAF": "S1", "REP": "S8r", "GEN": "S2"}
GEN_STAGE = {"GEN-001": "S1", "GEN-002": "S1", "GEN-003": "S9", "GEN-004": "S10", "GEN-005": "S7.3", "GEN-030": "on_event",
             "GEN-031": "S3", "GEN-032": "S3"}

def derive_stage(rid, tier, cond, rec):
    if rec.get("stage"):
        return rec["stage"]
    evs = re.findall(r"event\.type == '([a-z_]+)'", cond or "")
    if evs:
        return EVENT_STAGE.get(evs[0], "UNKNOWN_EVENT:" + evs[0])
    if tier in ("T0", "T1"):
        return "S1"
    if rid in GEN_STAGE:
        return GEN_STAGE[rid]
    return MODULE_STAGE.get(rid[:3], "S7")

def derive_scope(cond, action):
    txt = (cond or "") + " " + json.dumps(action or {})
    for root, scope in (("session", "per_session"), ("slot", "per_candidate"), ("m", "per_candidate"), ("entry", "per_entry"),
                        ("week", "per_week"), ("next_week", "per_week"), ("node", "per_node"), ("flag", "per_flag"),
                        ("option", "per_option"), ("violation", "per_violation")):
        if re.search(r"(?<![\w.'])" + root + r"\.", txt):
            return scope
    return "global"
if not OPS:
    err("12 §3.3 action table not found")

# ---- RULE lines and machine records ----
rules, recs_by_id, inv_rows, inv_asserts = {}, {}, {}, {}
for f in sorted(glob.glob("[0-9][0-9]-*.md")):
    mod = f[:2]
    txt = open(f, encoding="utf-8").read()
    for line in txt.splitlines():
        s = line.strip()
        if s.startswith("RULE ") and not s.startswith("RULE <ID>"):
            m = rx.match(s)
            if not m:
                err("unparsable RULE line in", f, ":", s[:90]); continue
            rid, tier, pri, when, then, because, ev, basis, dflt = m.groups()
            if rid in rules: err("duplicate rule id", rid)
            rules[rid] = dict(id=rid, module=mod, tier=tier, priority=int(pri), when_text=when, then_text=then,
                              because=because, ev=ev, basis=basis, default=(dflt == "yes"))
        if f.startswith("07"):
            m = inv_rx.match(s)
            if m:
                inv_rows[m.group(1)] = m.groups()
    for kind, body in block_rx.findall(txt):
        for line in body.strip().splitlines():
            o = json.loads(line)
            if kind == "rulexpr":
                if o["id"] in recs_by_id: err("duplicate machine record", o["id"])
                o["_file"] = f
                recs_by_id[o["id"]] = o
            else:
                inv_asserts[o["id"]] = o

def walk_actions(a):
    yield a
    for t in a.get("then", []):
        yield from walk_actions(t)
    if isinstance(a.get("otherwise"), dict):
        yield from walk_actions(a["otherwise"])

def exprs_of(a):
    out = []
    for x in walk_actions(a):
        for k, v in x.items():
            if k in ("op", "msg", "then", "otherwise", "kind", "subkind", "outcome", "phase", "to", "code", "field",
                     "fields", "questions", "what", "order", "exclude_from", "from_stage", "attach_to", "before", "once", "max_asks", "max_offers", "on_no_answer", "repair", "args",
                     "rank", "fixes", "method", "place", "replaces", "placeholders", "counted_from"):
                continue
            if isinstance(v, str):
                out.append(v)
    return out

def msgs_of(a):
    return [x["msg"] for x in walk_actions(a) if "msg" in x]

PREFIX_WHY = {"INP": "MSG-WHY-INP", "SCR": "MSG-WHY-SCR", "CTX": "MSG-WHY-CTX", "CMP": "MSG-WHY-CMP", "FEA": "MSG-WHY-FEA",
              "PHS": "MSG-WHY-PHS", "LOD": "MSG-WHY-LOD", "SES": "MSG-WHY-SES", "GEN": "MSG-WHY-GEN", "ADP": "MSG-WHY-ADP",
              "DST": "MSG-WHY-DST", "SAF": "MSG-WHY-SAF", "NUT": "MSG-WHY-NUT", "REP": "MSG-WHY-GEN"}
MVP_EXTRA = set("""REP-001 REP-002 REP-003 REP-004 REP-005 REP-006 SES-024 SES-025
DST-017 DST-018 SES-020 SES-021 SES-022 NUT-021 NUT-030 NUT-040 FEA-026
INP-007 FEA-030 FEA-031 LOD-030 SES-005 SES-008 ADP-024 ADP-070 ADP-071 ADP-073
FEA-001 FEA-003 FEA-004 FEA-010 FEA-013 FEA-014 FEA-020 FEA-021 FEA-022 FEA-023 FEA-032 FEA-033 FEA-034 FEA-035 FEA-036 FEA-040 FEA-041 FEA-043
LOD-001 LOD-002 LOD-003 LOD-004 LOD-005 LOD-006 LOD-016 LOD-020 LOD-031 LOD-033 PHS-001 PHS-002 PHS-003 PHS-004 PHS-006 PHS-010 PHS-011
ADP-001 ADP-002 ADP-010 ADP-012 ADP-014 ADP-021 ADP-022 ADP-033 ADP-051 ADP-055 ADP-062 ADP-064 ADP-066
GEN-003 GEN-004 GEN-005 GEN-014 GEN-023 SES-001 SES-014 SAF-082 SAF-084 FEA-044
INP-008 CMP-001 CMP-002 CMP-003 CMP-004 CMP-006 FEA-006 FEA-011 FEA-037 FEA-038 FEA-042 FEA-050 FEA-051 FEA-052 LOD-014 LOD-034 LOD-040 LOD-050 LOD-051 LOD-052 LOD-054 LOD-055 LOD-056
SES-003 SES-009 ADP-013 ADP-023 ADP-054 ADP-056 ADP-058 ADP-061 ADP-063 ADP-065 ADP-080 GEN-030 GEN-031 SAF-061 SAF-085
CMP-007 CMP-008 SES-004 SES-005 SES-006 SES-007 SES-008 SES-009 SES-010 SES-011 SES-012 SES-013 SES-014 SES-015 SES-016 SES-017 SES-018
DST-001 DST-002 DST-004 DST-005 DST-006 PHS-013 PHS-014 NUT-010 NUT-011 NUT-012 NUT-013
ADP-067""".split())  # v5.1: ADP-067 (formal) is on the MVP pace path; LOD-007/008 are T2, hence MVP by tier
# v5.2 (gap/prose-rules.md §4.9): PHS-015 (ultra), DST-007 (marathon) and SES-019 (norwegian_elite) are not reachable in the
# MVP profile and are no longer tagged MVP; DST-017/018, SES-020/021/022, NUT-021/030/040 and FEA-026 are reachable and now are;
# the REP records (07 §6.1) and SES-024 are new MVP rules.
# Post-audit (audit-final fix 8): the B-4 rules reachable by MVP code paths are tagged MVP even while text_only,
# so TST-121 fails until they are formalised. This failure is the honest state of v5.

records = []
for rid, r in rules.items():
    grades = sorted(set(re.findall(GR, r["ev"])))
    if not grades: err("rule without grade", rid)
    rec = {"id": rid, "module": r["module"], "kind": "rule", "tier": r["tier"], "priority": r["priority"],
           "hit_policy": {"T0": "COLLECT", "T1": "COLLECT", "T2": "ALL", "T3": "ALL"}.get(r["tier"], "PRIORITY"),
           "when_text": r["when_text"], "then_text": r["then_text"], "because": r["because"],
           "evidence": {"text": r["ev"], "grades": grades, "basis": r["basis"]}, "default": r["default"],
           "release": "MVP" if (r["tier"] in ("T0", "T1", "T2") or rid in MVP_EXTRA) else "spec"}
    m = recs_by_id.get(rid)
    if m:
        a = m["action"]
        for x in walk_actions(a):
            if x["op"] not in OPS:
                err("unknown op", x["op"], "in", rid); continue
            for req in OPS[x["op"]]:
                if req not in x: err("op", x["op"], "in", rid, "lacks required field", req)
            extra = set(x) - COMMON - set(OPS[x["op"]]) - OPTIONAL.get(x["op"], set())
            if extra: err("op", x["op"], "in", rid, "has fields outside 12 §3.3/§3.3b:", sorted(extra))
        status = m.get("status", "formal")
        used = " ".join([m["condition"]] + exprs_of(a))
        if status == "formal" and any(re.search(r"\b" + p + r"\(", used) for p in PROCEDURES):
            status = "procedure"
        if status == "formal" and m["condition"].strip() == "true":
            err("condition 'true' on a formal record", rid)
        if status == "formal" and re.fullmatch(r"event\.type == '[a-z_]+'", m["condition"]) and not exprs_of(a) and a["op"] not in ("regenerate", "emit_message", "record_event"):
            err("event-only condition with no action expression", rid)
        msgs = msgs_of(a) or re.findall(r"MSG-[A-Z0-9]+(?:-[A-Z0-9]+)*", r["then_text"])
        stage = derive_stage(rid, r["tier"], m["condition"], m)
        if stage.startswith("UNKNOWN_EVENT"): err("event.type not in the 12 §3.5 catalogue:", stage.split(":")[1], "in", rid)
        rec.update({"stage": stage, "scope": derive_scope(m["condition"], a)})
        rec.update({"condition": m["condition"], "on_unknown": m["on_unknown"], "action": a, "expression_status": status,
                    "explain": {"runner": msgs[0] if msgs else PREFIX_WHY[rid[:3]], "coach": "because: " + r["because"]}})
    else:
        if r["tier"] in ("T0", "T1", "T2"): err("T0-T2 rule without machine record", rid)
        if rid in MVP_EXTRA: warnings.append(rid)
        msgs = re.findall(r"MSG-[A-Z0-9]+(?:-[A-Z0-9]+)*", r["then_text"])
        rec.update({"condition": None, "on_unknown": None, "action": None, "expression_status": "text_only",
                    "explain": {"runner": msgs[0] if msgs else PREFIX_WHY[rid[:3]], "coach": "because: " + r["because"]}})
    rec["tests"] = {"fires": f"T-{rid}-fires", "silent": f"T-{rid}-silent"}
    records.append(rec)
for rid in recs_by_id:
    if rid not in rules: err("machine record without RULE line", rid)

for iid, row in inv_rows.items():
    _, tier, text, sev, ev = row
    a = inv_asserts.get(iid)
    if not a:
        err("invariant without assertion", iid); continue
    grades = sorted(set(re.findall(GR, ev)))
    if not grades: err("invariant without grade", iid)
    st = "static" if a["assert"].startswith(("static", "flag_only")) else ("procedure" if any(re.search(r"\b" + p + r"\(", a["assert"]) for p in PROCEDURES) else "formal")
    records.append({"id": iid, "module": "07", "kind": "invariant", "tier": tier, "severity": sev, "text": text, "stage": "S8", "scope": "per_plan",
                    "assert": a["assert"], "check_kind": a["check"], "on_unknown": "fire",
                    "evidence": {"text": ev, "grades": grades}, "expression_status": st, "release": "MVP",
                    "explain": {"runner": "MSG-ADP-CHANGED", "coach": text},
                    "tests": {"fires": f"T-{iid}-fires", "silent": f"T-{iid}-silent"}})
for iid in inv_asserts:
    if iid not in inv_rows: err("assertion without INV row", iid)

# uniqueness of (tier, nnn) and block ranges (CONTRACTS §1)
keys = collections.Counter((r["tier"], r["priority"]) for r in records if r["kind"] == "rule")
for k, v in keys.items():
    if v > 1: err("duplicate (tier, nnn)", k)
for r in records:
    if r["kind"] == "rule":
        lo = int(r["module"]) * 50
        if not (lo <= r["priority"] <= lo + 49): err("priority outside module block", r["id"], r["priority"])

R = [r for r in records if r["kind"] == "rule"]
cnt = collections.Counter(r["expression_status"] for r in R)
out = {"grammar": "RuleExpr: CEL subset with CEL's four-valued evaluation (true, false, error, unknown); unknown only for declared attributes; absent undeclared values are errors (12 §3.2)",
       "version": "v5.2", "source": "module texts 01-11 (RULE lines + rulexpr blocks); built by design/v5/tools/build_rules.py",
       "counts": {"rules": len(R), "formal": cnt["formal"], "procedure": cnt["procedure"], "static": cnt["static"],
                  "text_only": cnt["text_only"], "invariants": sum(1 for r in records if r["kind"] == "invariant"),
                  "mvp_rules": sum(1 for r in R if r["release"] == "MVP")},
       "records": records}
json.dump(out, open("rules.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(json.dumps(out["counts"]))
if warnings:
    print("WARNING: %d MVP-tagged rules are text_only (release blocker B-4; check_rules_v5.py fails on them):" % len(warnings), " ".join(warnings))
if errors:
    print("BUILD ERRORS (%d):" % len(errors)); print("\n".join(errors)); sys.exit(1)
print("build OK")
