/**
 * CFG Simplification - Teacher's Strict Rule
 * "Remove ALL epsilon productions. Language can change - that's OK!"
 * 
 * Pipeline: Useless → Null → Unit → Final Cleanup
 */

import { isNonTerminal, toDisplayGrammar, cloneInternalGrammar } from './cfgParser';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeChanges(before, after) {
  const removed = [];
  const modified = [];
  const added = [];

  for (const nt in before) {
    if (!(nt in after)) {
      removed.push(nt);
    } else {
      const bs = new Set(before[nt]);
      const as = new Set(after[nt]);
      if (bs.size !== as.size || [...bs].some(p => !as.has(p))) {
        modified.push(nt);
      }
    }
  }
  for (const nt in after) {
    if (!(nt in before)) {
      added.push(nt);
    }
  }
  return { removed, modified, added };
}

// ─── Step 1 & 4: Remove Useless Symbols ─────────────────────────────────────

function removeUselessSymbols(grammar, startSymbol) {
  const g = cloneInternalGrammar(grammar);
  const substeps = [];

  // Phase A: Find generating symbols
  const generating = new Set();
  let changed = true;

  while (changed) {
    changed = false;
    for (const v in g) {
      if (generating.has(v)) continue;
      for (const prod of g[v]) {
        // '' (epsilon) → Array.from('') = [] → [].every() = true → generating
        const isGen = Array.from(prod).every(ch =>
          !isNonTerminal(ch) || generating.has(ch)
        );
        if (isGen) {
          generating.add(v);
          changed = true;
          break;
        }
      }
    }
  }

  const nonGen = Object.keys(g).filter(v => !generating.has(v));
  if (nonGen.length > 0) {
    substeps.push(`Non-generating symbols found: {${nonGen.join(', ')}} — these can never derive a string of terminals.`);
  } else {
    substeps.push('All non-terminals are generating (can derive terminal strings).');
  }

  // Remove non-generating variables and productions referencing them
  const g2 = {};
  for (const v in g) {
    if (!generating.has(v)) continue;
    const validProds = g[v].filter(prod =>
      Array.from(prod).every(ch => !isNonTerminal(ch) || generating.has(ch))
    );
    if (validProds.length > 0) g2[v] = validProds;
  }

  // Phase B: Find reachable symbols (BFS from start)
  const reachable = new Set();
  if (g2[startSymbol]) {
    reachable.add(startSymbol);
    const queue = [startSymbol];
    while (queue.length > 0) {
      const v = queue.shift();
      if (!g2[v]) continue;
      for (const prod of g2[v]) {
        for (const ch of prod) {
          if (isNonTerminal(ch) && g2[ch] && !reachable.has(ch)) {
            reachable.add(ch);
            queue.push(ch);
          }
        }
      }
    }
  }

  const unreachable = Object.keys(g2).filter(v => !reachable.has(v));
  if (unreachable.length > 0) {
    substeps.push(`Unreachable symbols found: {${unreachable.join(', ')}} — cannot be reached from start symbol "${startSymbol}".`);
  } else {
    substeps.push(`All remaining non-terminals are reachable from "${startSymbol}".`);
  }

  const result = {};
  for (const v in g2) {
    if (reachable.has(v)) result[v] = g2[v];
  }

  if (nonGen.length === 0 && unreachable.length === 0) {
    substeps.push('No useless symbols found — grammar unchanged.');
  }

  return {
    grammar: result,
    substeps,
    removedInfo: {
      nonGenerating: nonGen,
      unreachable
    }
  };
}

// ─── Step 2: Remove Null Productions (Step-wise) ────────────────────────────

/**
 * Generate all combinations by optionally removing nullable symbols.
 * E.g., for "AB" with A,B nullable → ["AB", "B", "A"]
 */
function generateNullableCombinations(prod, nullableSet) {
  const results = [''];

  for (const char of prod) {
    const count = results.length;
    for (let i = 0; i < count; i++) {
      const current = results[i];
      // Always append the character
      results[i] = current + char;
      // If character is nullable, also keep version without it
      if (nullableSet.has(char)) {
        results.push(current);
      }
    }
  }

  return [...new Set(results)];
}

/**
 * Apply nullable substitution for a SINGLE nullable symbol on a grammar.
 * Returns a new grammar with that symbol optionally omitted everywhere,
 * but does NOT yet remove ε-productions for other symbols.
 */
function applyOneNullableSymbol(grammar, sym) {
  const result = {};
  const singleSet = new Set([sym]);

  for (const v in grammar) {
    const newProds = new Set();

    for (const prod of grammar[v]) {
      if (prod === '') {
        // Keep ε for now — we strip all ε at the very end
        newProds.add('');
        continue;
      }

      // Generate combinations only for this one nullable symbol
      const combos = generateNullableCombinations(prod, singleSet);
      combos.forEach(p => {
        // Don't turn a non-ε production into ε just by removing one symbol
        // unless the original was already ε (handled above)
        if (p !== '') {
          newProds.add(p);
        }
      });
    }

    if (newProds.size > 0) {
      result[v] = Array.from(newProds);
    }
  }

  return result;
}

/**
 * Remove null productions step-by-step.
 * Returns an array of intermediate step objects, one per nullable symbol,
 * plus a final "remove all ε" step.
 */
function removeNullProductionsStepwise(grammar, startSymbol) {
  const g = cloneInternalGrammar(grammar);

  // Find nullable variables
  const nullable = new Set();
  let changed = true;

  while (changed) {
    changed = false;
    for (const v in g) {
      if (nullable.has(v)) continue;
      for (const prod of g[v]) {
        if (prod === '' || Array.from(prod).every(ch => nullable.has(ch))) {
          nullable.add(v);
          changed = true;
          break;
        }
      }
    }
  }

  // If no nullable symbols, return a single step indicating nothing to do
  if (nullable.size === 0) {
    return {
      intermediateSteps: [],
      finalGrammar: g,
      nullableSet: nullable,
    };
  }

  const nullableList = [...nullable];
  const intermediateSteps = [];
  let current = cloneInternalGrammar(g);

  // For each nullable symbol, generate a sub-step
  for (let i = 0; i < nullableList.length; i++) {
    const sym = nullableList[i];
    const beforeGrammar = cloneInternalGrammar(current);
    const afterGrammar = applyOneNullableSymbol(current, sym);

    // Figure out what was added in each NT
    const addedDetails = [];
    for (const v in afterGrammar) {
      const beforeSet = new Set(beforeGrammar[v] || []);
      const newProds = afterGrammar[v].filter(p => !beforeSet.has(p) && p !== '');
      if (newProds.length > 0) {
        addedDetails.push(`${v}: new productions → {${newProds.join(', ')}}`);
      }
    }

    intermediateSteps.push({
      symbol: sym,
      beforeGrammar: beforeGrammar,
      afterGrammar: afterGrammar,
      addedDetails,
    });

    current = afterGrammar;
  }

  // Final step: remove ALL ε-productions from the accumulated grammar
  const finalGrammar = {};
  for (const v in current) {
    const nonEps = current[v].filter(p => p !== '');
    if (nonEps.length > 0) {
      // deduplicate
      finalGrammar[v] = [...new Set(nonEps)];
    }
  }

  return {
    intermediateSteps,
    finalGrammar,
    nullableSet: nullable,
    beforeFinal: cloneInternalGrammar(current),
  };
}

// ─── Step 3: Remove Unit Productions (Step-wise) ─────────────────────────────

function removeUnitProductionsStepwise(grammar) {
  const g = cloneInternalGrammar(grammar);
  const variables = new Set(Object.keys(g));

  for (const v in g) {
    for (const prod of g[v]) {
      for (const ch of prod) {
        if (isNonTerminal(ch)) variables.add(ch);
      }
    }
  }

  const unitClosures = {};
  variables.forEach(v => { unitClosures[v] = new Set([v]); });

  let changed = true;
  while (changed) {
    changed = false;
    for (const v in g) {
      if (!g[v]) continue;
      for (const prod of g[v]) {
        if (prod.length === 1 && isNonTerminal(prod) && unitClosures[prod]) {
          const target = prod;
          const oldSize = unitClosures[v].size;
          unitClosures[target].forEach(u => unitClosures[v].add(u));
          if (unitClosures[v].size > oldSize) changed = true;
        }
      }
    }
  }

  // Find symbols that have unit productions
  let hasUnitRule = false;
  for (const v in g) {
    if (g[v].some(p => p.length === 1 && isNonTerminal(p))) {
      hasUnitRule = true;
      break;
    }
  }

  const nonTrivialSymbols = Object.keys(unitClosures).filter(v => unitClosures[v].size > 1 && g[v]);

  // If no unit productions, return empty steps
  if (!hasUnitRule && nonTrivialSymbols.length === 0) {
    return {
      intermediateSteps: [],
      finalGrammar: g,
      unitClosures,
      hasUnitRule: false
    };
  }

  const intermediateSteps = [];
  let current = cloneInternalGrammar(g);

  // Process each symbol with a non-trivial closure
  for (const sym of nonTrivialSymbols) {
    const beforeGrammar = cloneInternalGrammar(current);
    const afterGrammar = cloneInternalGrammar(current);
    
    const newProds = new Set();
    unitClosures[sym].forEach(u => {
      if (g[u]) {
        g[u].forEach(prod => {
          const isUnit = prod.length === 1 && isNonTerminal(prod);
          if (!isUnit) newProds.add(prod);
        });
      }
    });
    
    if (newProds.size > 0) {
      afterGrammar[sym] = Array.from(newProds);
    } else {
      delete afterGrammar[sym]; // or keep it empty
    }
    
    // figure out added details
    const beforeSet = new Set(beforeGrammar[sym] || []);
    const newProdsArr = (afterGrammar[sym] || []).filter(p => !beforeSet.has(p));
    let details = [];
    if (newProdsArr.length > 0) {
      details.push(`Added non-unit productions: {${newProdsArr.join(', ')}}`);
    } else {
      details.push(`Unit productions removed.`);
    }

    intermediateSteps.push({
      symbol: sym,
      beforeGrammar: beforeGrammar,
      afterGrammar: afterGrammar,
      closure: Array.from(unitClosures[sym]),
      details,
    });
    
    current = afterGrammar;
  }

  // A final cleanup sweep to strip any remaining unit productions (e.g. A->A)
  const finalGrammar = {};
  for (const v in current) {
    if (current[v]) {
      const nonUnit = current[v].filter(p => !(p.length === 1 && isNonTerminal(p)));
      if (nonUnit.length > 0) finalGrammar[v] = nonUnit;
    }
  }

  return {
    intermediateSteps,
    finalGrammar,
    unitClosures,
    hasUnitRule: true
  };
}

// ─── Main Simplification Pipeline ────────────────────────────────────────────

export function runSimplification(parsedInput) {
  const { grammar: inputGrammar, startSymbol } = parsedInput;
  const steps = [];

  // Step 0: Original
  steps.push({
    id: 'original',
    title: 'Original Grammar',
    description: 'The input grammar before any simplification.',
    detail: 'This is the grammar as you provided it. We will simplify it in four stages: remove useless symbols, eliminate null (ε) productions, remove unit productions, and a final cleanup pass.',
    grammar: toDisplayGrammar(inputGrammar, startSymbol),
    changes: { removed: [], modified: [], added: [] },
    substeps: ['Grammar accepted as input.'],
    tag: 'original',
  });

  let current = cloneInternalGrammar(inputGrammar);

  // Step 1: Remove Useless Symbols
  const r1 = removeUselessSymbols(current, startSymbol);
  const c1raw = computeChanges(current, r1.grammar);
  const c1 = {
    removed: [
      ...r1.removedInfo.nonGenerating.map(nt => `${nt} (non-generating)`),
      ...r1.removedInfo.unreachable.map(nt => `${nt} (unreachable)`),
    ],
    modified: c1raw.modified,
    added: c1raw.added,
  };
  steps.push({
    id: 'useless',
    title: 'Remove Useless Symbols',
    description: 'Eliminate non-generating and unreachable symbols.',
    detail: 'A symbol is **non-generating** if it can never derive a string of terminals. A symbol is **unreachable** if it cannot be reached from the start symbol. We first find all generating symbols, then all reachable symbols, and remove anything that fails either test.',
    grammar: toDisplayGrammar(r1.grammar, startSymbol),
    changes: c1,
    substeps: r1.substeps,
    tag: 'useless',
  });
  current = r1.grammar;

  // Step 2: Remove Null Productions (Step-wise)
  const r2 = removeNullProductionsStepwise(current, startSymbol);
  const nullableList = [...r2.nullableSet];

  if (nullableList.length === 0) {
    // No nullable symbols — single step saying nothing to do
    steps.push({
      id: 'null',
      title: 'Eliminate Null Productions',
      description: 'No ε-productions found — nothing to do.',
      detail: 'No non-terminal in this grammar can derive ε. This step requires no changes.',
      grammar: toDisplayGrammar(current, startSymbol),
      changes: { removed: [], modified: [], added: [] },
      substeps: ['No nullable symbols found — grammar has no ε-productions.'],
      nullableSet: [],
      tag: 'null',
    });
  } else {
    // Step 2a: Identify nullable symbols
    steps.push({
      id: 'null',
      title: 'Identify Nullable Symbols',
      description: `Found nullable symbols: {${nullableList.join(', ')}}`,
      detail: `A **nullable** non-terminal can derive ε (the empty string). We found that **{${nullableList.join(', ')}}** are nullable. We will now substitute ε for each nullable symbol one-by-one across all productions.`,
      grammar: toDisplayGrammar(current, startSymbol),
      changes: { removed: [], modified: [], added: [] },
      substeps: [
        `Nullable symbols: {${nullableList.join(', ')}}`,
        `We will process each nullable symbol one at a time.`,
      ],
      nullableSet: nullableList,
      tag: 'null',
    });

    // Step 2b..2n: One step per nullable symbol
    let prevGrammar = current;
    for (let i = 0; i < r2.intermediateSteps.length; i++) {
      const sub = r2.intermediateSteps[i];
      const c = computeChanges(prevGrammar, sub.afterGrammar);
      const substepMessages = [
        `Put ${sub.symbol} = ε in all productions.`,
        `For every production that contains "${sub.symbol}", create new versions with "${sub.symbol}" removed.`,
      ];
      if (sub.addedDetails.length > 0) {
        sub.addedDetails.forEach(d => substepMessages.push(d));
      } else {
        substepMessages.push(`No new productions were generated at this step.`);
      }

      steps.push({
        id: 'null',
        title: `Put ${sub.symbol} = ε`,
        description: `Substitute ε for "${sub.symbol}" in all productions — add new variants without "${sub.symbol}".`,
        detail: `We take nullable symbol **${sub.symbol}** and look at every production containing it. For each such production, we add a new version with **${sub.symbol}** removed. This is step **${i + 1} of ${r2.intermediateSteps.length}** of nullable symbol processing.`,
        grammar: toDisplayGrammar(sub.afterGrammar, startSymbol),
        changes: c,
        substeps: substepMessages,
        nullableSet: nullableList,
        nullHighlight: sub.symbol,
        tag: 'null',
      });

      prevGrammar = sub.afterGrammar;
    }

    // Step 2-final: Remove all ε-productions
    const cFinal = computeChanges(prevGrammar, r2.finalGrammar);
    steps.push({
      id: 'null',
      title: 'Remove All ε-Productions',
      description: 'Delete every remaining ε-production from the grammar.',
      detail: 'Now that all nullable substitutions are done, we **remove every ε-production** from the grammar. The language may lose the empty string — this is acceptable per the teacher\'s rule.',
      grammar: toDisplayGrammar(r2.finalGrammar, startSymbol),
      changes: cFinal,
      substeps: [
        'All ε-productions removed.',
        'Language may have changed.',
      ],
      nullableSet: nullableList,
      tag: 'null',
    });

    current = r2.finalGrammar;
  }

  // Step 3: Remove Unit Productions (Step-wise)
  const r3 = removeUnitProductionsStepwise(current);
  
  if (!r3.hasUnitRule) {
    steps.push({
      id: 'unit',
      title: 'Remove Unit Productions',
      description: 'No unit productions found — nothing to do.',
      detail: 'No rule of the form A → B exists. This step requires no changes.',
      grammar: toDisplayGrammar(current, startSymbol),
      changes: { removed: [], modified: [], added: [] },
      substeps: ['No unit productions found — grammar unchanged.'],
      tag: 'unit',
    });
  } else {
    // Step 3a: Identify unit closures
    const closuresStr = Object.entries(r3.unitClosures)
      .filter(([_, set]) => set.size > 1)
      .map(([k, set]) => `${k}: {${[...set].join(', ')}}`);
      
    steps.push({
      id: 'unit',
      title: 'Identify Unit Closures',
      description: closuresStr.length > 0 ? `Found non-trivial unit closures.` : `No non-trivial closures.`,
      detail: `A **unit production** is a rule A → B where B is a single non-terminal. We first compute the unit closure of each non-terminal (all NTs reachable through chains of unit rules). Then we will resolve them.`,
      grammar: toDisplayGrammar(current, startSymbol),
      changes: { removed: [], modified: [], added: [] },
      substeps: closuresStr.length > 0 
        ? ["Unit closures computed:", ...closuresStr] 
        : ["No non-trivial unit closures, but unit rules like A → A will be removed."],
      tag: 'unit',
    });

    // Step 3b..3n: One step per symbol with non-trivial closure
    let prevGrammarU = current;
    for (let i = 0; i < r3.intermediateSteps.length; i++) {
      const sub = r3.intermediateSteps[i];
      const c = computeChanges(prevGrammarU, sub.afterGrammar);
      const substepMessages = [
        `Resolve unit productions for ${sub.symbol}.`,
        `Unit closure is {${sub.closure.join(', ')}}.`,
      ];
      if (sub.details.length > 0) {
        sub.details.forEach(d => substepMessages.push(d));
      }

      steps.push({
        id: 'unit',
        title: `Resolve ${sub.symbol}`,
        description: `Replace unit rules for "${sub.symbol}" using its closure {${sub.closure.join(', ')}}.`,
        detail: `We take the non-terminal **${sub.symbol}** and replace all of its unit productions with the non-unit productions from every symbol in its unit closure.`,
        grammar: toDisplayGrammar(sub.afterGrammar, startSymbol),
        changes: c,
        substeps: substepMessages,
        tag: 'unit',
      });

      prevGrammarU = sub.afterGrammar;
    }

    // Step 3-final: Remove any remaining unit rules and set final grammar state
    const cFinalU = computeChanges(prevGrammarU, r3.finalGrammar);
    steps.push({
      id: 'unit',
      title: 'Remove Remaining Unit Productions',
      description: 'Delete any remaining unit productions (e.g., A → A).',
      detail: 'Now that all unit closures have been resolved by substituting non-unit productions, we simply delete any rule that is a pure unit production.',
      grammar: toDisplayGrammar(r3.finalGrammar, startSymbol),
      changes: cFinalU,
      substeps: ['All unit productions have been completely removed from the grammar.'],
      tag: 'unit',
    });

    current = r3.finalGrammar;
  }

  // Step 4: Final Cleanup (remove useless symbols again)
  const r4 = removeUselessSymbols(current, startSymbol);
  const c4raw = computeChanges(current, r4.grammar);
  const c4 = {
    removed: [
      ...r4.removedInfo.nonGenerating.map(nt => `${nt} (non-generating)`),
      ...r4.removedInfo.unreachable.map(nt => `${nt} (unreachable)`),
    ],
    modified: c4raw.modified,
    added: c4raw.added,
  };
  const hasChanges = c4.removed.length > 0 || c4raw.modified.length > 0;
  steps.push({
    id: 'final',
    title: 'Final Grammar',
    description: 'The simplified grammar after all transformations.',
    detail: 'A second pass of useless symbol removal cleans up any symbols that became useless after null/unit production removal. The resulting grammar is fully simplified.',
    grammar: toDisplayGrammar(r4.grammar, startSymbol),
    changes: c4,
    substeps: hasChanges ? r4.substeps : ['Grammar is fully simplified — no further changes needed.'],
    tag: 'final',
  });

  return steps;
}
