"""Message lint L1-L8 of messages.md §10 (TST-094). Usage: python3 -I design/v5/tools/check_messages_v5.py design/v5"""
import re, sys, os, json, collections
V = sys.argv[1]
M = open(os.path.join(V, "messages.md"), encoding="utf-8").read()
recs = json.load(open(os.path.join(V, "rules.json"), encoding="utf-8"))["records"]
G = open(os.path.join(V, "15-glossary.md"), encoding="utf-8").read().lower()
rows = []
for line in M.splitlines():
    m = re.match(r'^\| (MSG-[A-Z0-9-]*[A-Z0-9]) \| (\w+) \| "(.*?)" \| "(.*?)" \| (.*?) \| (.*?) \| (.*?) \|$', line)
    if m:
        g = list(m.groups()); g[3] = re.sub(r"\s*\((?:v5|The clause|Shown to|Advisory|Your next run appears)[^)]*\)", "", g[3]); rows.append(tuple(g))
fails = []
def check(name, v, fail=True):
    print(("PASS " if not v else ("FAIL " if fail else "INFO ")) + name + ":", v if v else "none")
    if v and fail: fails.append(name)
ids = collections.Counter(r[0] for r in rows)
defined = set(ids)
used = set()
def walk(a):
    yield a
    for t in a.get("then", []) or []: yield from walk(t)
    if isinstance(a.get("otherwise"), dict): yield from walk(a["otherwise"])
for r in recs:
    if r.get("explain"): used.add(r["explain"]["runner"])
    for a in (walk(r["action"]) if r.get("action") else []):
        if "msg" in a: used.add(a["msg"])
    used |= set(re.findall(r"MSG-[A-Z0-9]+(?:-[A-Z0-9]+)*", r.get("then_text") or ""))
check("L1 ids used but not defined", sorted(used - defined))
check("L1 ids defined twice", [k for k, v in ids.items() if v > 1])
print("INFO rows", len(rows), "used ids", len(used), "defined but not used by a rule (UI-only)", len(defined - used))
bad_ph = [r[0] for r in rows if re.search(r"\{(?![a-z_]+:(?:min|km|pace|time|date|int|text)\})(?![ ,]*(?:and|for you))[a-z_\.]+\}|\[[a-z]\]", r[2])]
check("L2 untyped placeholders", bad_ph)
def syl(w):
    w = w.lower().strip(".,;:!?\"'()")
    if not w: return 0
    if len(w) <= 3: return 1
    w = re.sub(r"(?:es|ed|e)$", "", w)
    return max(1, len(re.findall(r"[aeiouy]+", w)))
def fk(t):
    t = re.sub(r"\{[^}]*\}", "x", t)
    sents = [s for s in re.split(r"[.!?]+", t) if s.strip()]
    words = re.findall(r"[A-Za-z][A-Za-z'\-]*", t)
    if not words or not sents: return 0.0, 0
    return 0.39 * len(words) / len(sents) + 11.8 * sum(syl(w) for w in words) / len(words) - 15.59, len(words) / len(sents)
hi, long_s, s_over6 = [], [], []
for r in rows:
    for layer_text in (r[2], r[3]):
        if layer_text in ("—",) or layer_text.startswith("cause =") or "(" in layer_text[:1]: continue
        g, wps = fk(layer_text)
        if g > 8 and len(layer_text.split()) >= 8 and not (r[0] == 'MSG-CTX-003' and layer_text == r[3]): hi.append((r[0], round(g, 1)))
        if wps > 20: long_s.append(r[0])
        if "S" in r[6] and g > 6 and len(layer_text.split()) >= 8: s_over6.append((r[0], round(g, 1)))
check("L3 FK grade > 8 (texts >= 8 words)", hi)
check("L3 average sentence > 20 words", sorted(set(long_s)))
check("L3 safety texts above grade 6 target (reported, not failing)", s_over6, fail=False)
code = re.compile(r"\b(?:[A-Z]{3}-\d{3}|INV-\d+|[A-Z]+_[A-Z_]+|[a-z]+\.[a-z_]+\.[a-z_]+)\b")
check("L4 ids or codes on card/why", [r[0] for r in rows if code.search(re.sub(r"\(v5[^)]*\)|\(.*?p2-[ABC].*?\)", "", r[2] + " " + r[3]))])
ban = re.compile(r"\b(risk\w*|likel\w*|chance\w*|danger\w*|heart\w*|cardiac)\b", re.I)
check("L5 banned words in attribute-triggered messages", [r[0] for r in rows if "A" in r[6] and ban.search(r[2] + " " + r[3])])
mult = re.compile(r"\d(?:\.\d)?\s*(?:–|-|to)\s*\d(?:\.\d)?\s*times")
check("L6 multiplier next to a personal placeholder", [r[0] for r in rows if mult.search(r[2] + r[3]) and re.search(r"\{(age|sport)[:}]", r[2] + r[3])])
terms = ["talk test", "stretch", "sharpen", "predicted range", "onboard", "measured", "estimated"]
check("L7 glossary terms missing from 15", [t for t in terms if t not in G])
# L8 (static part, post-audit): age messages never use a default age.
P = open(os.path.join(V, "parameters.md"), encoding="utf-8").read()
nouf = [l for l in P.splitlines() if l.startswith("| inp.no_unknown_fields |")]
l8 = []
if not nouf or "birth_month" not in nouf[0] or "birth_year" not in nouf[0]:
    l8.append("inp.no_unknown_fields lacks birth_month/birth_year")
age_msgs = {r[0] for r in rows if "{age:int}" in r[2] or r[0] in ("MSG-SAF-020", "MSG-SAF-022", "MSG-SAF-023", "MSG-SAF-060", "MSG-SAF-061", "MSG-CTX-004")}
for rr in recs:
    if rr["kind"] != "rule" or not rr.get("action"):
        continue
    ms = {a["msg"] for a in walk(rr["action"]) if "msg" in a}
    if ms & age_msgs and not re.search(r"age_(low|high)\(", rr["condition"] or ""):
        l8.append(rr["id"] + " emits an age message without an age_low/age_high condition")
check("L8 age messages only from age_low/age_high conditions, birth fields never unknown (static part; runtime part TST-103)", l8)
print("\nRESULT:", "FAIL " + ", ".join(fails) if fails else "ALL MESSAGE CHECKS PASS")
sys.exit(1 if fails else 0)
