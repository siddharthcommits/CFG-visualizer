import React from 'react';
import { Info, CheckCircle2, Zap, Trash2, Link, Sigma } from 'lucide-react';

const STEP_ICONS = {
  original: Sigma,
  useless: Trash2,
  null: Zap,
  unit: Link,
  final: CheckCircle2,
};

const STEP_COLORS = {
  original: 'text-gray-600 dark:text-gray-400',
  useless:  'text-danger-600 dark:text-danger-400',
  null:     'text-warning-600 dark:text-warning-400',
  unit:     'text-primary-600 dark:text-primary-400',
  final:    'text-accent-600 dark:text-accent-400',
};

const STEP_BG = {
  original: 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700',
  useless:  'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800',
  null:     'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800',
  unit:     'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800',
  final:    'bg-accent-50 dark:bg-accent-900/20 border-accent-200 dark:border-accent-800',
};

export default function ExplanationPanel({ step }) {
  if (!step) {
    return (
      <div className="panel p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
        <Info className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-sm text-gray-400 dark:text-gray-600">Run the simplification to see explanations here.</p>
      </div>
    );
  }

  const Icon = STEP_ICONS[step.id] || Info;
  const colorClass = STEP_COLORS[step.id] || STEP_COLORS.original;
  const bgClass = STEP_BG[step.id] || STEP_BG.original;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Main explanation */}
      <div className={`panel p-5 border ${bgClass}`}>
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bgClass} border`}>
            <Icon className={`w-5 h-5 ${colorClass}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={`font-bold text-base ${colorClass}`}>{step.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">{step.description}</p>
          </div>
        </div>

        {step.detail && (
          <div className="mt-4 pt-4 border-t border-current border-opacity-10">
            <MarkdownLike text={step.detail} />
          </div>
        )}
      </div>

      {/* Nullable set info */}
      {step.nullableSet && step.nullableSet.length > 0 && (
        <div className="panel p-4 border border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-900/20">
          <p className="section-title text-warning-600 dark:text-warning-500">Nullable Symbols Found</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {step.nullableSet.map(sym => (
              <span
                key={sym}
                className={`tag font-mono text-sm px-3 py-1 transition-all duration-300 ${
                  step.nullHighlight === sym
                    ? 'bg-warning-500 text-white ring-2 ring-warning-400 ring-offset-1 scale-110 font-bold'
                    : 'bg-warning-100 dark:bg-warning-900/40 text-warning-700 dark:text-warning-400'
                }`}
              >
                {sym}
                {step.nullHighlight === sym && ' ← processing'}
              </span>
            ))}
          </div>
          <p className="text-xs text-warning-600 dark:text-warning-500 mt-2">
            {step.nullHighlight
              ? `Currently substituting ε for "${step.nullHighlight}" in all productions.`
              : 'These non-terminals can derive the empty string (ε).'}
          </p>
        </div>
      )}

      {/* Changes summary */}
      {step.changes && (
        <div className="panel p-4 space-y-3">
          <p className="section-title">Changes in This Step</p>

          {step.changes.removed?.length > 0 && (
            <ChangeGroup
              label="Removed"
              items={step.changes.removed}
              iconClass="text-danger-500"
              bgClass="bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800"
              textClass="text-danger-700 dark:text-danger-400"
              dot="bg-danger-500"
            />
          )}

          {step.changes.modified?.length > 0 && (
            <ChangeGroup
              label="Modified"
              items={step.changes.modified}
              iconClass="text-warning-500"
              bgClass="bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800"
              textClass="text-warning-700 dark:text-warning-400"
              dot="bg-warning-500"
            />
          )}

          {step.changes.added?.length > 0 && (
            <ChangeGroup
              label="Added"
              items={step.changes.added}
              iconClass="text-accent-500"
              bgClass="bg-accent-50 dark:bg-accent-900/20 border-accent-200 dark:border-accent-800"
              textClass="text-accent-700 dark:text-accent-400"
              dot="bg-accent-500"
            />
          )}

          {!step.changes.removed?.length && !step.changes.modified?.length && !step.changes.added?.length && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <CheckCircle2 className="w-4 h-4 text-accent-500" />
              No changes — grammar was already simplified at this stage.
            </div>
          )}
        </div>
      )}

      {/* Substeps log */}
      {step.substeps?.length > 0 && (
        <div className="panel p-4">
          <p className="section-title">Algorithm Trace</p>
          <div className="space-y-2">
            {step.substeps.map((sub, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChangeGroup({ label, items, bgClass, textClass, dot }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`w-2 h-2 rounded-full ${dot}`}></span>
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{label}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span key={i} className={`font-mono text-xs px-2.5 py-1 rounded-lg border ${bgClass} ${textClass}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// Simple markdown-like renderer for bold text
function MarkdownLike({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
        }
        return part;
      })}
    </p>
  );
}
