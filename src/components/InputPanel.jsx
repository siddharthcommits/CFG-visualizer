import React, { useState } from 'react';
import { Play, RotateCcw, Lightbulb, ChevronDown, ChevronUp, AlertCircle, Save, Upload, BookOpen } from 'lucide-react';
import { EXAMPLE_GRAMMARS } from '../utils/examples';

export default function InputPanel({ onSimplify, onReset, isSimplified, error, text, onTextChange }) {
  const [showExamples, setShowExamples] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleSimplify = () => {
    onSimplify();
  };

  const loadExample = (example) => {
    onTextChange(example.text);
    setShowExamples(false);
  };

  const handleSave = () => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grammar.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoad = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onTextChange(ev.target.result);
    reader.readAsText(file);
    e.target.value = '';
  };

  const insertText = (insertStr) => {
    const textarea = document.getElementById('grammar-input');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = text.substring(0, start) + insertStr + text.substring(end);
    
    onTextChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + insertStr.length, start + insertStr.length);
    }, 0);
  };


  return (
    <div className="panel p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Grammar Input</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Enter production rules below</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleSave}
            className="btn-ghost text-xs py-1.5 px-2.5"
            title="Save grammar"
          >
            <Save className="w-4 h-4" />
          </button>
          {/* <label className="btn-ghost text-xs py-1.5 px-2.5 cursor-pointer" title="Load grammar">
            <Upload className="w-4 h-4" />
            <input type="file" accept=".txt" onChange={handleLoad} className="hidden" />
          </label> */}
        </div>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          id="grammar-input"
          value={text}
          onChange={e => {
            onTextChange(e.target.value);
          }}
          className={`input-field min-h-[180px] resize-y leading-relaxed ${error ? 'ring-2 ring-danger-500 ring-opacity-50' : ''}`}
          placeholder={`S -> aA | B\nA -> a | ε\nB -> b`}
          spellCheck={false}
        />
        {/* Line numbers overlay hint */}
        <div className="absolute top-3 right-3">
          <span className="text-[10px] text-gray-400 dark:text-gray-600 font-mono select-none">
            {text.split('\n').length} line{text.split('\n').length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Quick Insert Buttons */}
      <div className="flex items-center gap-2 -mt-2">
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium ml-1">Insert:</span>
        <button
          onClick={() => insertText('ε')}
          className="px-2.5 py-1 text-xs font-mono bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-700 transition-colors"
          title="Insert Epsilon"
        >
          ε
        </button>
        <button
          onClick={() => insertText('-> ')}
          className="px-2.5 py-1 text-xs font-mono bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-700 transition-colors"
          title="Insert Arrow"
        >
          -&gt;
        </button>
        <button
          onClick={() => insertText(' | ')}
          className="px-2.5 py-1 text-xs font-mono bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-700 transition-colors"
          title="Insert Pipe"
        >
          |
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-danger-500/10 border border-danger-300 dark:border-danger-800 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-danger-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-danger-600 dark:text-danger-400 leading-relaxed">{error}</p>
        </div>
      )}

      {/* Syntax help */}
      <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-left bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Lightbulb className="w-4 h-4 text-warning-500 flex-shrink-0" />
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex-1">Syntax Guide</span>
          {showHelp ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        {showHelp && (
          <div className="px-4 py-3 bg-white dark:bg-gray-900 space-y-2 animate-fade-in">
            <SyntaxRow label="Non-terminal" example="S, A, B" note="Single uppercase letter (A-Z)" />
            <SyntaxRow label="Terminal" example="a, b, c, +, 0" note="Lowercase / symbols" />
            <SyntaxRow label="Epsilon" example="ε, eps, epsilon" note="Empty string" />
            <SyntaxRow label="Separator" example="|" note="Alternative productions" />
            <SyntaxRow label="Arrow" example="->" note="Production rule" />
            <SyntaxRow label="Example" example="S -> aA | b" note="S derives aA or b" />
          </div>
        )}
      </div>

      {/* Example grammars */}
      <div>
        <button
          onClick={() => setShowExamples(!showExamples)}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors border border-primary-100 dark:border-primary-800"
        >
          <BookOpen className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <span className="text-xs font-semibold text-primary-700 dark:text-primary-300 flex-1 text-left">Load Example Grammar</span>
          {showExamples ? <ChevronUp className="w-4 h-4 text-primary-400" /> : <ChevronDown className="w-4 h-4 text-primary-400" />}
        </button>
        {showExamples && (
          <div className="mt-2 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800 animate-fade-in">
            {EXAMPLE_GRAMMARS.map((ex, i) => (
              <button
                key={i}
                onClick={() => loadExample(ex)}
                className="w-full text-left px-4 py-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors group"
              >
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-primary-700 dark:group-hover:text-primary-300">
                  {ex.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{ex.description}</p>
                <p className="text-xs font-mono text-gray-400 dark:text-gray-600 mt-1 truncate">{ex.text.split('\n')[0]}…</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {isSimplified ? (
          <button onClick={onReset} className="btn-secondary flex-1 justify-center">
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        ) : (
          <button onClick={handleSimplify} className="btn-primary flex-1 justify-center text-sm">
            <Play className="w-4 h-4" />
            Simplify Grammar
          </button>
        )}
      </div>
    </div>
  );
}

function SyntaxRow({ label, example, note }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">{label}</span>
      <code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-primary-700 dark:text-primary-300">{example}</code>
      <span className="text-xs text-gray-400">{note}</span>
    </div>
  );
}
