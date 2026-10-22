// RuleExpr parser (spec 12 §3.2): a strict CEL subset.
// Literals: numbers, strings ('…'), true, false, null, lists [..], maps {k: v}; paths a.b.c; index a[x];
// calls f(...); unary ! and -; binary * / + - < <= > >= == != in && ||; ternary ?:.

export type Node =
  | { t: 'num'; v: number }
  | { t: 'str'; v: string }
  | { t: 'bool'; v: boolean }
  | { t: 'null' }
  | { t: 'ident'; name: string }
  | { t: 'member'; obj: Node; name: string }
  | { t: 'index'; obj: Node; key: Node }
  | { t: 'call'; fn: string; args: Node[]; target?: Node }
  | { t: 'list'; items: Node[] }
  | { t: 'map'; entries: [Node, Node][] }
  | { t: 'unary'; op: '!' | '-'; arg: Node }
  | { t: 'bin'; op: string; l: Node; r: Node }
  | { t: 'cond'; c: Node; a: Node; b: Node };

type Tok = { k: 'num' | 'str' | 'id' | 'op' | 'eof'; v: string; pos: number };

export class ParseError extends Error {}

function lex(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  const ops = ['==', '!=', '<=', '>=', '&&', '||', '<', '>', '+', '-', '*', '/', '!', '?', ':', '(', ')', '[', ']', '{', '}', ',', '.'];
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      out.push({ k: 'num', v: src.slice(i, j), pos: i }); i = j; continue;
    }
    if (c === "'" || c === '"') {
      let j = i + 1;
      while (j < src.length && src[j] !== c) j++;
      if (j >= src.length) throw new ParseError(`unterminated string at ${i} in: ${src}`);
      out.push({ k: 'str', v: src.slice(i + 1, j), pos: i }); i = j + 1; continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
      out.push({ k: 'id', v: src.slice(i, j), pos: i }); i = j; continue;
    }
    const op = ops.find(o => src.startsWith(o, i));
    if (!op) throw new ParseError(`unexpected '${c}' at ${i} in: ${src}`);
    out.push({ k: 'op', v: op, pos: i }); i += op.length;
  }
  out.push({ k: 'eof', v: '', pos: src.length });
  return out;
}

const BIN: Record<string, number> = { '||': 1, '&&': 2, '==': 3, '!=': 3, '<': 4, '<=': 4, '>': 4, '>=': 4, 'in': 4, '+': 5, '-': 5, '*': 6, '/': 6 };

export function parse(src: string): Node {
  const toks = lex(src);
  let p = 0;
  const peek = () => toks[p];
  const next = () => toks[p++];
  const expect = (v: string) => {
    const t = next();
    if (t.v !== v) throw new ParseError(`expected '${v}' at ${t.pos}, got '${t.v}' in: ${src}`);
  };
  const isBinOp = (t: Tok) => (t.k === 'op' && t.v in BIN && t.v !== 'in') || (t.k === 'id' && t.v === 'in');

  function expr(): Node {
    const c = binary(1);
    if (peek().k === 'op' && peek().v === '?') {
      next();
      const a = expr();
      expect(':');
      const b = expr();
      return { t: 'cond', c, a, b };
    }
    return c;
  }
  function binary(minPrec: number): Node {
    let l = unary();
    for (;;) {
      const t = peek();
      if (!isBinOp(t)) break;
      const prec = BIN[t.v];
      if (prec < minPrec) break;
      next();
      const r = binary(prec + 1);
      l = { t: 'bin', op: t.v, l, r };
    }
    return l;
  }
  function unary(): Node {
    const t = peek();
    if (t.k === 'op' && (t.v === '!' || t.v === '-')) { next(); return { t: 'unary', op: t.v as '!' | '-', arg: unary() }; }
    return postfix(primary());
  }
  function postfix(n: Node): Node {
    for (;;) {
      const t = peek();
      if (t.k === 'op' && t.v === '.') {
        next();
        const id = next();
        if (id.k !== 'id') throw new ParseError(`field name expected at ${id.pos} in: ${src}`);
        if (peek().k === 'op' && peek().v === '(') {
          next();
          const args = argList(')');
          n = { t: 'call', fn: id.v, args, target: n };
        } else n = { t: 'member', obj: n, name: id.v };
      } else if (t.k === 'op' && t.v === '[') {
        next();
        if (peek().k === 'op' && peek().v === ']') { next(); n = { t: 'index', obj: n, key: { t: 'str', v: '*' } }; continue; }
        const key = expr();
        expect(']');
        n = { t: 'index', obj: n, key };
      } else return n;
    }
  }
  function argList(close: string): Node[] {
    const args: Node[] = [];
    if (peek().k === 'op' && peek().v === close) { next(); return args; }
    for (;;) {
      args.push(expr());
      const t = next();
      if (t.v === close) return args;
      if (t.v !== ',') throw new ParseError(`expected ',' or '${close}' at ${t.pos} in: ${src}`);
    }
  }
  function primary(): Node {
    const t = next();
    if (t.k === 'num') return { t: 'num', v: Number(t.v) };
    if (t.k === 'str') return { t: 'str', v: t.v };
    if (t.k === 'id') {
      if (t.v === 'true' || t.v === 'false') return { t: 'bool', v: t.v === 'true' };
      if (t.v === 'null') return { t: 'null' };
      if (peek().k === 'op' && peek().v === '(') { next(); return { t: 'call', fn: t.v, args: argList(')') }; }
      return { t: 'ident', name: t.v };
    }
    if (t.k === 'op' && t.v === '(') { const e = expr(); expect(')'); return e; }
    if (t.k === 'op' && t.v === '[') return { t: 'list', items: argList(']') };
    if (t.k === 'op' && t.v === '{') {
      const entries: [Node, Node][] = [];
      if (peek().v === '}') { next(); return { t: 'map', entries }; }
      for (;;) {
        const k = expr(); expect(':'); const v = expr();
        entries.push([k, v]);
        const s = next();
        if (s.v === '}') break;
        if (s.v !== ',') throw new ParseError(`expected ',' or '}' at ${s.pos} in: ${src}`);
      }
      return { t: 'map', entries };
    }
    throw new ParseError(`unexpected '${t.v}' at ${t.pos} in: ${src}`);
  }
  const n = expr();
  if (peek().k !== 'eof') throw new ParseError(`trailing input at ${peek().pos} in: ${src}`);
  return n;
}

const cache = new Map<string, Node>();
export function parseCached(src: string): Node {
  let n = cache.get(src);
  if (!n) { n = parse(src); cache.set(src, n); }
  return n;
}

/** Path text of a member/ident chain (a.b.c), or null when the node is not a plain path. */
export function pathOf(n: Node): string | null {
  if (n.t === 'ident') return n.name;
  if (n.t === 'member') { const b = pathOf(n.obj); return b === null ? null : b + '.' + n.name; }
  return null;
}
