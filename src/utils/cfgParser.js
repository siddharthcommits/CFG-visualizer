/**
 * CFG Parser - Single uppercase letter = Non-terminal
 * Everything else (lowercase, digits, symbols) = Terminal
 * Empty string '' = Epsilon internally, displayed as 'ε'
 */

export const EPSILON = 'ε';

/** Check if a single character is a non-terminal (uppercase A-Z) */
export function isNonTerminal(char) {
  return /^[A-Z]$/.test(char);
}

/**
 * Parse grammar text into internal format.
 * Returns { grammar: { NT: [string, ...] }, startSymbol }
 * Each production body is a string where each char is a symbol.
 * Empty string '' represents epsilon.
 */
export function parseGrammar(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('//') && !l.startsWith('#'));

  if (lines.length === 0) throw new Error('Grammar is empty.');

  const grammar = {};
  let startSymbol = null;

  for (const line of lines) {
    const match = line.match(/^([A-Z])\s*(?:->|→)\s*(.+)$/);
    if (!match) {
      throw new Error(`Invalid production rule: "${line}"\nExpected format: A -> body1 | body2\nLeft side must be a single uppercase letter (A-Z).`);
    }

    const lhs = match[1];
    const rhsStr = match[2];

    if (!startSymbol) startSymbol = lhs;
    if (!grammar[lhs]) grammar[lhs] = [];

    const alternatives = rhsStr.split('|').map(alt => alt.trim()).filter(alt => alt.length > 0);

    for (const alt of alternatives) {
      if (alt === EPSILON || alt === 'ε' || alt === 'eps' || alt === 'epsilon' || alt === 'λ') {
        grammar[lhs].push(''); // empty string = epsilon
      } else {
        const body = alt.replace(/\s+/g, ''); // strip spaces within body
        if (body.length === 0) throw new Error(`Empty production body in: "${line}"`);
        grammar[lhs].push(body);
      }
    }
  }

  return { grammar, startSymbol };
}

/**
 * Convert internal grammar { NT: [string, ...] } to display format
 * { productions: { NT: [[char, ...], ...] }, startSymbol, terminals, nonterminals }
 */
export function toDisplayGrammar(grammar, startSymbol) {
  const productions = {};
  const nonterminals = new Set(Object.keys(grammar));
  const terminals = new Set();

  for (const nt in grammar) {
    productions[nt] = grammar[nt].map(prod => {
      if (prod === '') return [EPSILON];
      const symbols = Array.from(prod);
      symbols.forEach(s => {
        if (!isNonTerminal(s)) terminals.add(s);
      });
      return symbols;
    });
  }

  return { productions, startSymbol, terminals, nonterminals };
}

/** Deep clone an internal grammar object */
export function cloneInternalGrammar(grammar) {
  const r = {};
  for (const k in grammar) r[k] = [...grammar[k]];
  return r;
}

/** Format display grammar to text */
export function grammarToText(displayGrammar) {
  return Object.entries(displayGrammar.productions).map(([nt, rules]) => {
    const bodies = rules.map(r => r.join('')).map(s => s === EPSILON ? 'ε' : s);
    return `${nt} -> ${bodies.join(' | ')}`;
  }).join('\n');
}
