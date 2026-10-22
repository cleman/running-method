"""v5 implementation-readiness checker (TST-121), extended in v5.2 (engine glue, shared contract).

Usage: python3 -I design/v5/tools/check_rules_v5.py design/v5
Read-only. Prints every finding; exit code 1 if any check marked FAIL is non-empty.
Declared roots, paths, helper functions and procedures are read from 12 §2b; the action schema
from 12 §3.3; parameter ids from parameters.md; message ids from messages.md.
"""
import json, re, sys, os, collections

V = sys.argv[1]
rules = json.load(open(os.path.join(V, "rules.json"), encoding="utf-8"))
recs = rules["records"]
P = open(os.path.join(V, "parameters.md"), encoding="utf-8").read()
M12 = open(os.path.join(V, "12-data-model-and-rule-format.md"), encoding="utf-8").read()
MSG = open(os.path.join(V, "messages.md"), encoding="utf-8").read()
out, fails = [], []

def say(*a): out.append(" ".join(str(x) for x in a))
def check(name, value, fail=True):
    ok = not value
    say(("PASS " if ok else ("FAIL " if fail else "INFO ")) + name + ":", value if value else "none")
    if fail and not ok: fails.append(name)

R = [r for r in recs if r["kind"] == "rule"]
I = [r for r in recs if r["kind"] == "invariant"]
say("records", len(recs), "rules", len(R), "invariants", len(I), "counts", rules["counts"])
say("rules by tier/status", sorted(collections.Counter((r["tier"], r["expression_status"]) for r in R).items()))
say("invariants by status", dict(collections.Counter(r["expression_status"] for r in I)), "check kinds", dict(collections.Counter(r["check_kind"] for r in I)))

# 1. release coverage
check("MVP records that are text_only", [r["id"] for r in recs if r.get("release") == "MVP" and r["expression_status"] == "text_only"])
check("T0-T2 rules that are text_only", [r["id"] for r in R if r["tier"] in ("T0", "T1", "T2") and r["expression_status"] == "text_only"])

# 2. uniqueness
ids = collections.Counter(r["id"] for r in recs)
check("duplicate ids", [k for k, v in ids.items() if v > 1])
keys = collections.Counter((r["tier"], r["priority"]) for r in R)
check("duplicate (tier, nnn)", [k for k, v in keys.items() if v > 1])

# 3. declared context from 12 §2b
sec = M12.split("## 2b.", 1)[1].split("\n## 3.", 1)[0]
roots = set(re.findall(r"^\| `([a-z_]+)` \|", sec.split("### 2b.2", 1)[0], re.M)) | {"today", "now"}
LOOP = {"s", "x", "w", "a", "b", "e", "f", "o", "d", "lr", "q", "t", "i"}
paths_decl = set(re.findall(r"^\| `[a-z_]+` \| `([^`]+)` \|", sec, re.M))
helpers = set(re.findall(r"`([a-z_0-9]+)\(", sec.split("### 2b.3", 1)[1].split("### 2b.4", 1)[0]))
procs = set(re.findall(r"^\| `([a-z_0-9]+)\(", sec.split("### 2b.4", 1)[1], re.M))
CEL = {"has", "size"}
say("declared roots", len(roots), "paths", len(paths_decl), "helpers", len(helpers), "procedures", len(procs))

def walk(a):
    yield a
    for t in a.get("then", []) or []:
        yield from walk(t)
    if isinstance(a.get("otherwise"), dict):
        yield from walk(a["otherwise"])

NONEXPR = {"op", "msg", "then", "otherwise", "kind", "subkind", "outcome", "phase", "to", "code", "field", "fields", "questions",
           "what", "order", "exclude_from", "from_stage", "attach_to", "before", "once", "max_asks", "max_offers", "on_no_answer", "repair", "args",
           "rank", "fixes", "method", "place", "replaces", "placeholders", "counted_from"}
exprs = []
for r in recs:
    if r["expression_status"] == "text_only":
        continue
    if r["kind"] == "rule":
        exprs.append((r["id"], r["condition"]))
        for a in walk(r["action"]):
            for k, v in a.items():
                if k not in NONEXPR and isinstance(v, str) and not v.startswith(("static", "lint:", "test:", "dataflow", "validator:")):
                    exprs.append((r["id"], v))
            if isinstance(a.get("args"), dict):
                exprs += [(r["id"], v) for v in a["args"].values()]
    elif not r["assert"].startswith(("static", "flag_only")):
        exprs.append((r["id"], r["assert"]))

fn_bad, root_bad, path_bad, lit_bad, pids = collections.defaultdict(set), collections.defaultdict(set), collections.defaultdict(set), collections.defaultdict(set), collections.defaultdict(set)
for rid, e in exprs:
    s = re.sub(r"'[^']*'", "''", e)
    for f in re.findall(r"([A-Za-z_][\w\.]*)\s*\(", s):
        if f not in helpers and f not in procs and f not in CEL:
            fn_bad[f].add(rid)
    for m in re.finditer(r"(?<![\w\.'])([a-z_]+)((?:\.[A-Za-z_0-9]+)+)", s):
        root = m.group(1)
        if root in LOOP or root == "p":
            continue
        if root not in roots:
            root_bad[root].add(rid)
        elif m.group(0) not in paths_decl and root not in ("unit", "override"):
            path_bad[m.group(0)].add(rid)
    for n in re.findall(r"(?<![\w\.'\[])(\d+(?:\.\d+)?)(?![\w'])", s):
        if n not in ("0", "1"):
            lit_bad[n].add(rid)
    for pid in re.findall(r"p\('([^']+)'\)", e):
        pids[pid].add(rid)
    for pid in re.findall(r"p\('([^']+)'\s*\+", e):
        pids[pid.rstrip(".") + ".*"].add(rid)
check("functions not declared in 12 §2b.3/2b.4", {k: sorted(v) for k, v in fn_bad.items()})
check("roots not declared in 12 §2b.1", {k: sorted(v) for k, v in root_bad.items()})
check("paths not declared in 12 §2b.2", {k: sorted(v) for k, v in path_bad.items()})
check("numeric literals other than 0/1", {k: sorted(v) for k, v in lit_bad.items()})
check("rule('X') references", [rid for rid, e in exprs if "rule('" in e])
check("effort compared as strings", sorted({rid for rid, e in exprs if re.search(r"[<>]=?\s*'E\d'", e)}))

# parameters
reg = set()
for line in P.splitlines():
    m = re.match(r"^\|\s*([a-z][a-z0-9_]*\.[^|]*?)\s*\|", line)
    if not m:
        continue
    cell = m.group(1)
    parts = [x.strip() for x in cell.split("/")]
    base = parts[0]
    reg.add(base)
    for alt in parts[1:]:
        if alt.startswith("."):
            reg.add(base.rsplit(".", 1)[0] + alt)
        elif re.match(r"^[a-z][\w\.]*$", alt):
            reg.add(alt if "." in alt else base.rsplit(".", 1)[0] + "." + alt)
def known(pid):
    if pid.endswith(".*"):
        return any(r.startswith(pid[:-1]) for r in reg)
    if pid in reg:
        return True
    return any(re.fullmatch(re.sub(r"\\<[a-z_]+\\>", r"[^.]+", re.escape(r)), pid) for r in reg if "<" in r) or any(r.startswith(pid + ".") for r in reg)
check("p() ids missing from parameters.md", {k: sorted(v) for k, v in pids.items() if not known(k)})
say("p() ids used:", len(pids))

# grades on parameters
ungraded = []
GR = re.compile(r"VERIFIED|CORROBORATED|CREDIBLE|ALLEGED|CONTRADICTED|UNKNOWN")
for line in P.splitlines():
    m = re.match(r"^\|\s*([a-z][a-z0-9_]*\.[^|]*?)\s*\|", line)
    if m:
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) >= 7 and not GR.search(cells[5]) and cells[6] != "eng":
            ungraded.append(m.group(1))
check("parameters without grade and not basis eng", ungraded)

# 4. on_unknown policy
RESTRICT = {"gate", "raise_flag", "block_sessions", "cap", "insert_phase", "require_attestation", "require_rescreen", "freeze",
            "suppress", "flag_entry", "reject_input", "ask_confirm", "hold_step", "set_rung", "route", "fail_closed", "move_session"}
bad = [(r["id"], r["action"]["op"]) for r in R if r["expression_status"] != "text_only" and r["tier"] in ("T0", "T1", "T2")
       and r["action"]["op"] in RESTRICT and r["on_unknown"] == "skip" and not (r["action"]["op"] == "gate" and r["action"].get("outcome") == "proceed")]
check("restrictive T0-T2 records with on_unknown=skip", bad)
check("text_only records whose on_unknown is not null", [r["id"] for r in R if r["expression_status"] == "text_only" and r["on_unknown"] is not None])
say("on_unknown (evaluated rules):", dict(collections.Counter(r["on_unknown"] for r in R if r["expression_status"] != "text_only")))
check("'true' conditions on non-static records", [r["id"] for r in R if r.get("condition") == "true" and r["expression_status"] != "static"])
ev_only = [r["id"] for r in R if r.get("condition") and re.fullmatch(r"event\.type == '[a-z_]+'", r["condition"]) and r["expression_status"] == "formal"]
say("INFO event-type conditions whose logic is in the action expression (allowed):", len(ev_only), ev_only)

# 5. action payloads
ops = collections.Counter(a["op"] for r in R if r["action"] for a in walk(r["action"]))
say("action ops used:", len(ops), dict(ops))
check("actions with 'see then_text' detail", [r["id"] for r in R if r["action"] and "see then_text" in json.dumps(r["action"])])

# 6. messages
msg_ids = set(re.findall(r"^\|\s*(MSG-[A-Z0-9-]*[A-Z0-9])\s*\|", MSG, re.M)) | set(re.findall(r"^#+\s*(MSG-[A-Z0-9-]*[A-Z0-9])", MSG, re.M))
used = collections.defaultdict(set)
for r in recs:
    if r.get("explain"):
        used[r["explain"]["runner"]].add(r["id"])
    for a in (walk(r["action"]) if r.get("action") else []):
        if "msg" in a:
            used[a["msg"]].add(r["id"])
    for m in re.findall(r"MSG-[A-Z0-9]+(?:-[A-Z0-9]+)*", r.get("then_text", "") or ""):
        used[m].add(r["id"])
check("message ids used by rules but not defined in messages.md", {k: sorted(v) for k, v in used.items() if k not in msg_ids})
say("message ids defined:", len(msg_ids), "used:", len(used))

# 7. evidence
check("rules without grade", [r["id"] for r in R if not r["evidence"]["grades"]])
check("invariants without grade", [r["id"] for r in I if not r["evidence"]["grades"]])
say("basis values:", dict(collections.Counter(r["evidence"]["basis"] for r in R)))
check("basis eng with a physiological grade only", [r["id"] for r in R if r["evidence"]["basis"] == "eng" and "N/A" not in r["evidence"]["grades"]], fail=False)
RANK = {"VERIFIED": 5, "CORROBORATED": 4, "CREDIBLE": 3, "ALLEGED": 2, "CONTRADICTED": 1, "UNKNOWN": 0, "N/A": -1}
check("two-source rule: basis=evidence needs >= CORROBORATED (post-audit)", [r["id"] for r in R if r["evidence"]["basis"] == "evidence" and max([RANK.get(g, -1) for g in r["evidence"]["grades"]] or [-1]) < 4])
check("VERIFIED used anywhere (search summaries only; ceiling is CORROBORATED)", [r["id"] for r in recs if "VERIFIED" in r["evidence"].get("grades", [])])
check("default=yes but basis != design_default", [r["id"] for r in R if r["default"] and r["evidence"]["basis"] != "design_default"])
# 8. v5.2 extensions (engine glue Q1, Q8, Q12; shared contract)
SEC22 = sec.split("### 2b.2", 1)[1].split("### 2b.3", 1)[0]
path_types = dict(re.findall(r"^\| `[a-z_]+` \| `([^`]+)` \| ([^|]+) \|", SEC22.split("### 2b.2b", 1)[0], re.M))
check("paths without a type (12 §2b.2, Q12)", sorted(p for p, t in path_types.items() if t.strip() in ("", "?")))
EV = [r for r in R if r["expression_status"] != "text_only"]
check("evaluated records without stage or scope (12 §3.5)", [r["id"] for r in EV if not r.get("stage") or not r.get("scope")])
STAGES = {"S0", "S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S8r", "S9", "S10", "on_entry", "on_event", "static"} | {"S7.%d" % i for i in range(1, 9)}
check("records with an unknown stage", [(r["id"], r.get("stage")) for r in EV if r.get("stage") not in STAGES])
say("INFO stages:", dict(collections.Counter(r.get("stage") for r in EV)), "scopes:", dict(collections.Counter(r.get("scope") for r in EV)))

# element fields of comprehension variables (12 §2b.2b + spec/schema)
SCH = {}
try:
    rs = json.load(open(os.path.join(V, "schema", "result.schema.json"), encoding="utf-8"))
    ins = json.load(open(os.path.join(V, "schema", "input-profile.schema.json"), encoding="utf-8"))
    SCH["Session"] = set(rs["$defs"]["session"]["properties"]); SCH["Week"] = set(rs["$defs"]["week"]["properties"])
    SCH["ActivityRecord"] = set(ins["properties"]["log"]["items"]["properties"])
    SCH["RiskFlag"] = set(ins["properties"]["flags"]["items"]["properties"])
    SCH["PerformanceAnchor"] = set(ins["properties"]["anchors"]["items"]["properties"])
    SCH["GoalEditAttempt"] = set(ins["properties"]["goal_edits"]["items"]["properties"]) | {"feasibility_rerun"}
    SCH["AdaptationEvent"] = set(ins["properties"]["events"]["items"]["properties"])
except Exception as ex:
    say("FAIL schema files unreadable:", ex); fails.append("schema files unreadable")
ELEM = collections.defaultdict(set)
for el, flds in re.findall(r"^\| (\w+|`[^`]+`) \| ((?:`[a-z_0-9]+`(?:, )?)+) \|", SEC22.split("### 2b.2b", 1)[1] if "### 2b.2b" in SEC22 else "", re.M):
    ELEM[el.strip("`")] |= set(re.findall(r"`([a-z_0-9]+)`", flds))
for el in list(SCH):
    SCH[el] |= ELEM.get(el, set())
SCH["Input"] = {"confidence", "field", "value", "source"}
COMP = re.compile(r"\b(all|exists|count|sum|max_or_zero|first|sort_by)\(([a-z_][\w.]*(?:\([^()]*\))?(?:\[[^\]]*\])*),\s*([a-z]+),")
bad_fields, unresolved = collections.defaultdict(set), collections.defaultdict(set)
for rid, e in exprs:
    t = re.sub(r"'[^']*'", "''", e)
    for m in COMP.finditer(t):
        lst, var = m.group(2), m.group(3)
        typ = path_types.get(lst, "")
        mm = re.match(r"list<(\w+)>", typ.strip())
        if lst.startswith("plan.sessions") or lst in ("plan.long_runs", "plan.over_guard_runs", "week.sessions"):
            ent = "Session"
        elif mm and mm.group(1) in SCH:
            ent = mm.group(1)
        else:
            unresolved[lst].add(rid); continue
        for fld in set(re.findall(r"(?<![\w.])" + var + r"\.([a-z_][a-z_0-9]*)", t[m.end():])):
            if fld not in SCH[ent]:
                bad_fields[ent + "." + fld].add(rid)
check("comprehension fields not in the element schema (12 §2b.2b)", {k: sorted(v) for k, v in bad_fields.items()})
say("INFO comprehension lists with an untyped element (not checked):", len(unresolved))

# bare identifiers (no root, no call, not a bound variable)
KEYW = {"true", "false", "null", "in"}
bare = collections.defaultdict(set)
for rid, e in exprs:
    t = re.sub(r"'[^']*'", "''", e)
    bound = set(re.findall(r"\b(?:all|exists|count|sum|max_or_zero|first|sort_by)\([^,]+,\s*([a-z]+),", t)) | set(re.findall(r"pairs\([^)]*\),\s*([a-z]+),\s*([a-z]+)", t) and sum(re.findall(r"pairs\([^)]*\),\s*([a-z]+),\s*([a-z]+)", t), ()))
    for m in re.finditer(r"(?<![\w.'])([a-z_][a-z0-9_]*)(?![\w(.'])", t):
        w = m.group(1)
        if w in KEYW or w in bound or w in LOOP or w in roots or w == "never":
            continue
        bare[w].add(rid)
check("bare identifiers (undeclared names, Q12)", {k: sorted(v) for k, v in bare.items()})

# parameter registry (Q8): parameters.json up to date and every p() id has a machine line
import subprocess
pb = subprocess.run([sys.executable, "-I", os.path.join(V, "tools", "build_parameters.py"), V], capture_output=True, text=True)
check("parameters.json build (tools/build_parameters.py)", [] if pb.returncode == 0 else pb.stdout.strip().splitlines()[-5:])
PJ = json.load(open(os.path.join(V, "parameters.json"), encoding="utf-8"))["parameters"]
mids = {p_["id"] for p_ in PJ} | {p_.get("family") for p_ in PJ if p_.get("family")}
def has_machine(pid):
    if pid.endswith(".*"):
        return any(m_.startswith(pid[:-1]) for m_ in mids if m_)
    return pid in mids or any(m_ and "<" in m_ and re.fullmatch(re.sub(r"\\<[^>]+\\>", r"[^.]+", re.escape(m_)), pid) for m_ in mids) or any(m_ and m_.startswith(pid + ".") for m_ in mids)
check("p() ids without a machine registry line (parameters.md ```param)", sorted(k for k in pids if not has_machine(k)))

# shared contract: schemas valid, fixtures valid, invariant reads declared
try:
    from jsonschema import Draft202012Validator
    from referencing import Registry, Resource
    import glob as _g
    reg, schemas = Registry(), {}
    for sf in _g.glob(os.path.join(V, "schema", "*.schema.json")):
        sj = json.load(open(sf, encoding="utf-8")); schemas[os.path.basename(sf)] = sj
        Draft202012Validator.check_schema(sj)
        res = Resource.from_contents(sj); reg = reg.with_resource(sj["$id"], res).with_resource(os.path.basename(sf), res)
    val = Draft202012Validator(schemas["fixture-input.schema.json"], registry=reg)
    bad = []
    fx = sorted(_g.glob(os.path.join(V, "fixtures-input", "*.json")))
    for ff in fx:
        errs = list(val.iter_errors(json.load(open(ff, encoding="utf-8"))))
        if errs: bad.append((os.path.basename(ff), errs[0].message[:120]))
    check("persona input fixtures invalid against spec/schema", bad)
    say("INFO persona input fixtures:", len(fx))
except ImportError:
    say("INFO jsonschema not installed: schema and fixture checks skipped"); 
inv_reads = collections.defaultdict(set)
for r in I:
    a = r["assert"]
    if a.startswith(("static", "flag_only")): continue
    a = re.sub(r"'[^']*'", "''", a)
    for v_, fld in re.findall(r"(?<![\w.])(s|lr|w)\.([a-z_0-9]+)", a):
        ent = "Week" if v_ == "w" else "Session"
        if fld not in SCH.get(ent, set()):
            inv_reads[ent + "." + fld].add(r["id"])
    for fld in re.findall(r"(?<![\w.])plan\.([a-z_A-Z0-9]+)", a):
        if fld not in set(rs["$defs"]["plan"]["properties"]) and "plan." + fld not in path_types:
            inv_reads["plan." + fld].add(r["id"])
check("fields read by invariants but not declared in result.schema.json", {k: sorted(v) for k, v in inv_reads.items()})

# dose tables of the MVP modules (06 §2c)
M06 = open(os.path.join(V, "06-session-library.md"), encoding="utf-8").read()
mvp_mods = re.findall(r"^\| (SES-M-\d{3}) [^|]*\|", M06.split("### 2c.", 1)[1].split("\n## ", 1)[0], re.M) if "### 2c." in M06 else []
check("MVP dose-table modules without ses.dose.<id>.steps (06 §2c)", [m_ for m_ in mvp_mods if "ses.dose.%s.steps" % m_ not in mids])
say("INFO dose-table modules:", len(mvp_mods))

# unguarded nullable reads (12 §3.9 item 6) — reported, not failing
NULLABLE = ["distance_m", "pain_0_10", "planned_distance_m", "gi_score_0_10", "carb_g_per_h", "target_time_s", "race_date", "last_reds_screen", "last_field_test_date", "cutoff_h", "rpe_0_10"]
ung = collections.defaultdict(set)
for rid, e in exprs:
    for fld in NULLABLE:
        for m in re.finditer(r"([a-z_.]+)\." + fld + r"\b", e):
            full = m.group(0)
            if "has(" + full + ")" not in e and full + " == null" not in e and full + " != null" not in e:
                ung[full].add(rid)
check("unguarded reads of nullable fields (12 §3.9; null compares false)", {k: sorted(v) for k, v in ung.items()}, fail=False)

print("\n".join(out))
print("\nRESULT:", "FAIL " + ", ".join(fails) if fails else "ALL CHECKS PASS")
sys.exit(1 if fails else 0)
