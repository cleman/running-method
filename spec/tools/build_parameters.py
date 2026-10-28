"""Build parameters.json from parameters.md (v5.2, 12 §3.11).

Usage: python3 -I tools/build_parameters.py .   (run inside spec/)
Joins every table row of parameters.md (human register: grade, basis, range, presets, source) with its line in the
```param block (machine form: type, typed default, keys, limit_direction). Exit 1 on a row without a machine line,
a machine line without a row, an unknown type or limit direction, or a duplicate id.
"""
import re, json, sys, os
os.chdir(sys.argv[1])
P = open("parameters.md", encoding="utf-8").read()
errors = []
TYPES = {"number", "int", "bool", "enum", "set", "map", "list", "text", "segments"}

def ids_of(cell):
    parts = [x.strip() for x in cell.split("/")]
    base = parts[0]; out = [base]
    for alt in parts[1:]:
        if alt.startswith("."): out.append(base.rsplit(".", 1)[0] + alt)
        elif re.match(r"^[a-z][\w.]*$", alt): out.append(alt if "." in alt else base.rsplit(".", 1)[0] + "." + alt)
    return out

table = {}
for line in P.split("```param", 1)[0].splitlines():
    m = re.match(r"^\|\s*([a-z][a-z0-9_]*\.[^|]*?)\s*\|", line)
    if not m:
        continue
    cells = [c.strip() for c in line.strip().strip("|").split("|")]
    if len(cells) == 8:   # 11 §10-style tables without a Presets column
        cells = cells[:4] + ["—"] + cells[4:]
    for i in ids_of(cells[0]):
        if i in table: errors.append("duplicate table id " + i)
        table[i] = {"default_text": cells[1], "unit": cells[2], "range": cells[3], "presets": cells[4], "grade": cells[5],
                    "basis": cells[6], "source": cells[7] if len(cells) > 7 else "", "row": cells[0]}
machine = {}
blk = P.split("```param", 1)[1].split("```", 1)[0] if "```param" in P else ""
for line in blk.strip().splitlines():
    o = json.loads(line)
    if o["id"] in machine: errors.append("duplicate machine id " + o["id"])
    if o["type"] not in TYPES: errors.append("unknown type %s for %s" % (o["type"], o["id"]))
    if o["limit_direction"] not in ("upper", "lower", "none"): errors.append("bad limit_direction for " + o["id"])
    machine[o["id"]] = o
out = []
for i, o in machine.items():
    row = table.get(o.get("family", i))
    if not row:
        errors.append("machine line without a table row: " + i); continue
    out.append({**o, **{k: row[k] for k in ("grade", "basis", "range", "presets", "source")}, "default_text": row["default_text"]})
fams = {o.get("family") for o in machine.values()}
for i in table:
    if i not in machine and i not in fams:
        errors.append("table row without a machine line: " + i)
json.dump({"version": "v5.3", "source": "parameters.md (tables + ```param block); built by tools/build_parameters.py",
           "count": len(out), "parameters": sorted(out, key=lambda o: o["id"])},
          open("parameters.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(json.dumps({"parameters": len(out), "table_rows": len(table)}))
if errors:
    print("BUILD ERRORS (%d):" % len(errors)); print("\n".join(errors)); sys.exit(1)
print("build OK")
