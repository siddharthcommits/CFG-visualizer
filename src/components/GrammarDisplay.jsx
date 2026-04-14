import React, { useState, useEffect } from 'react';
import { EPSILON } from '../utils/cfgParser';

/**
 * GrammarDisplay – renders a grammar with diff highlighting.
 * props:
 *   grammar       – { productions } object
 *   prevGrammar   – previous grammar for diff comparison (optional)
 *   changes       – { removed, modified, added } arrays of NT names
 *   animated      – boolean, trigger entry animation
 *   title         – section title string
 *   compact       – boolean
 */
export default function GrammarDisplay({ grammar, prevGrammar, changes = {}, animated = false, title, compact = false }) {
  const [visible, setVisible] = useState(!animated);

  useEffect(() => {
    if (animated) {
      setVisible(false);
      const t = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t);
    }
  }, [grammar, animated]);

  if (!grammar?.productions) {
    return (
      <div className="text-xs text-gray-400 italic text-center py-8">No grammar to display</div>
    );
  }

  const entries = Object.entries(grammar.productions);
  if (entries.length === 0) {
    return (
      <div className="text-xs text-gray-400 italic text-center py-8">Grammar has no productions</div>
    );
  }

  return (
    <div className={`space-y-1 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      {title && <p className="section-title">{title}</p>}
      {entries.map(([nt, rules]) => {
        const isRemoved = changes.removed?.some(r => r.startsWith(nt));
        const isModified = changes.modified?.includes(nt);
        const isAdded = changes.added?.some(r => r.startsWith(nt));

        return (
          <ProductionRule
            key={nt}
            nt={nt}
            rules={rules}
            prevRules={prevGrammar?.productions?.[nt]}
            isRemoved={isRemoved}
            isModified={isModified}
            isAdded={isAdded}
            compact={compact}
          />
        );
      })}
    </div>
  );
}

function ProductionRule({ nt, rules, prevRules, isRemoved, isModified, isAdded, compact }) {
  const cardClass = isRemoved
    ? 'rule-card-removed'
    : isAdded
    ? 'rule-card-new animate-fade-in'
    : isModified
    ? 'rule-card-modified'
    : 'rule-card-normal';

  return (
    <div className={`${cardClass} ${compact ? 'px-3 py-2' : ''}`}>
      <div className="flex items-start gap-2 flex-wrap">
        {/* LHS */}
        <span className={`font-semibold ${compact ? 'text-xs' : 'text-sm'} ${
          isRemoved ? 'text-danger-600 dark:text-danger-400 line-through' :
          isAdded ? 'text-accent-600 dark:text-accent-400' :
          isModified ? 'text-warning-600 dark:text-warning-400' :
          'text-primary-700 dark:text-primary-300'
        }`}>
          {nt}
        </span>
        <span className={`text-gray-400 ${compact ? 'text-xs' : 'text-sm'}`}>→</span>

        {/* RHS alternatives */}
        <div className="flex flex-wrap gap-1 flex-1">
          {rules.map((rule, i) => {
            const ruleStr = rule.join(' ');
            const wasPresent = prevRules?.some(r => r.join(' ') === ruleStr);
            const isNewRule = prevRules && !wasPresent && !isRemoved;

            return (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-gray-400 dark:text-gray-600 text-xs self-center px-0.5">|</span>}
                <RuleBody rule={rule} isNew={isNewRule} compact={compact} />
              </React.Fragment>
            );
          })}
        </div>

        {/* Status badge */}
        {isRemoved && (
          <span className="tag bg-danger-100 dark:bg-danger-900/40 text-danger-600 dark:text-danger-400 self-start">removed</span>
        )}
        {isAdded && (
          <span className="tag bg-accent-100 dark:bg-accent-900/40 text-accent-600 dark:text-accent-400 self-start">new</span>
        )}
        {isModified && !isRemoved && !isAdded && (
          <span className="tag bg-warning-100 dark:bg-warning-900/40 text-warning-600 dark:text-warning-400 self-start">modified</span>
        )}
      </div>
    </div>
  );
}

function RuleBody({ rule, isNew, compact }) {
  return (
    <span className={`inline-flex items-center gap-0.5 font-mono ${compact ? 'text-xs' : 'text-sm'}
      ${isNew ? 'text-accent-600 dark:text-accent-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}
    >
      {rule.map((sym, i) => (
        <SymbolToken key={i} sym={sym} compact={compact} />
      ))}
    </span>
  );
}

function SymbolToken({ sym, compact }) {
  if (sym === EPSILON) {
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-900/30 font-bold ${compact ? 'text-xs' : 'text-sm'}`}>
        ε
      </span>
    );
  }

  // Is uppercase NT?
  const isNT = /^[A-Z][A-Z0-9']*$/.test(sym);

  if (isNT) {
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold ${compact ? 'text-xs' : 'text-sm'}`}>
        {sym}
      </span>
    );
  }

  return (
    <span className={`text-gray-600 dark:text-gray-400 ${compact ? 'text-xs' : 'text-sm'}`}>
      {sym}
    </span>
  );
}
