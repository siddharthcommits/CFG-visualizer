import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Play, Pause, SkipBack, SkipForward,
  ArrowRight, Columns
} from 'lucide-react';
import GrammarDisplay from './GrammarDisplay';
import ExplanationPanel from './ExplanationPanel';

const AUTO_PLAY_INTERVAL = 2500;

export default function VisualizationPanel({ steps, activeStep, onStepChange }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDiff, setShowDiff] = useState(true);
  const intervalRef = useRef(null);
  const latestStepRef = useRef(null);

  const step = steps[activeStep];

  const goNext = useCallback(() => {
    onStepChange(prev => {
      if (prev >= steps.length - 1) {
        setIsPlaying(false);
        return prev;
      }
      return prev + 1;
    });
  }, [steps.length, onStepChange]);

  const goPrev = useCallback(() => {
    onStepChange(prev => Math.max(0, prev - 1));
  }, [onStepChange]);

  // Auto-play
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(goNext, AUTO_PLAY_INTERVAL);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, goNext]);

  // Stop playing at end
  useEffect(() => {
    if (activeStep >= steps.length - 1) {
      setIsPlaying(false);
    }
  }, [activeStep, steps.length]);

  // Auto-scroll to the latest step when activeStep changes
  useEffect(() => {
    if (latestStepRef.current) {
      latestStepRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeStep]);

  // Keyboard left/right arrow navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);

  const hasPrev = activeStep > 0;
  const hasNext = activeStep < steps.length - 1;
  const progress = ((activeStep) / (steps.length - 1)) * 100;

  const STEP_COLORS = {
    original: 'from-gray-500 to-gray-600',
    useless:  'from-red-500 to-rose-600',
    null:     'from-amber-500 to-yellow-600',
    unit:     'from-indigo-500 to-violet-600',
    final:    'from-emerald-500 to-teal-600',
  };

  // Collect all steps up to (and including) the current step for persistent display
  const visibleSteps = steps.slice(0, activeStep + 1);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Progress bar */}
      <div className="panel px-5 py-3">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Step {activeStep + 1} of {steps.length}
            </span>
            <span className={`tag bg-gradient-to-r ${STEP_COLORS[step?.id] || STEP_COLORS.original} text-white`}>
              {step?.id}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowDiff(!showDiff)}
              className={`btn-ghost text-xs py-1 px-2.5 ${showDiff ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30' : ''}`}
              title="Toggle diff view"
            >
              <Columns className="w-3.5 h-3.5" />
              Diff
            </button>
          </div>
        </div>

        <div className="relative h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${STEP_COLORS[step?.id] || STEP_COLORS.original} transition-all duration-500`}
            style={{ width: `${progress}%` }}
          />
          {/* Step markers */}
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => onStepChange(i)}
              className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 transition-all duration-200
                ${i <= activeStep ? `bg-gradient-to-r ${STEP_COLORS[steps[i].id]}` : 'bg-gray-300 dark:bg-gray-600'}
              `}
              style={{ left: `calc(${(i / (steps.length - 1)) * 100}% - 6px)` }}
              title={steps[i].title}
            />
          ))}
        </div>
      </div>

      {/* Controls — moved to top, above steps */}
      <div className="panel px-5 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onStepChange(0)}
            disabled={!hasPrev}
            className="btn-ghost py-2 px-2.5 disabled:opacity-30 disabled:cursor-not-allowed"
            title="First step"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={goPrev}
            disabled={!hasPrev}
            className="btn-ghost py-2 px-3 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>
        </div>

        {/* Play/Pause */}
        <button
          onClick={() => {
            if (activeStep >= steps.length - 1) onStepChange(0);
            setIsPlaying(!isPlaying);
          }}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl font-semibold text-sm transition-all duration-200
            ${isPlaying
              ? 'bg-warning-500 hover:bg-warning-600 text-white shadow-lg shadow-warning-500/30'
              : 'btn-primary'
            }
          `}
        >
          {isPlaying ? (
            <><Pause className="w-4 h-4" /> Pause</>
          ) : (
            <><Play className="w-4 h-4" /> {activeStep >= steps.length - 1 ? 'Replay' : 'Auto-Play'}</>
          )}
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={goNext}
            disabled={!hasNext}
            className="btn-ghost py-2 px-3 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onStepChange(steps.length - 1)}
            disabled={!hasNext}
            className="btn-ghost py-2 px-2.5 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Last step"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main content — shows ALL steps up to current, with dividers */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-4 min-h-0">
        {/* Left: Grammar visualization — scrollable list of all visible steps */}
        <div className="panel p-5 overflow-auto flex flex-col gap-0 min-h-0">
          {visibleSteps.map((s, idx) => {
            const isLatest = idx === visibleSteps.length - 1;
            const prev = idx > 0 ? steps[idx - 1] : null;
            const stepColor = STEP_COLORS[s?.id] || STEP_COLORS.original;

            return (
              <div key={s.id + '-' + idx} ref={isLatest ? latestStepRef : null}>
                {/* Divider between steps */}
                {idx > 0 && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex-shrink-0">
                      Step {idx + 1}
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
                  </div>
                )}

                {/* Step content */}
                <div className={`transition-all duration-300 ${!isLatest ? 'opacity-60' : 'opacity-100'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-block w-2 h-2 rounded-full bg-gradient-to-r ${stepColor}`}></span>
                    <h3 className={`text-sm font-bold ${isLatest ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                      {s.title}
                    </h3>
                    <span className={`tag text-[10px] bg-gradient-to-r ${stepColor} text-white`}>
                      {s.id}
                    </span>
                  </div>

                  {showDiff && prev ? (
                    <>
                      {/* Diff view */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                            <p className="section-title mb-0">Before</p>
                          </div>
                          <GrammarDisplay
                            key={`prev-${prev.id}-${idx}`}
                            grammar={prev.grammar}
                            compact={true}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                            <p className="section-title mb-0">After</p>
                          </div>
                          <GrammarDisplay
                            key={`curr-${s.id}-${idx}`}
                            grammar={s.grammar}
                            prevGrammar={prev.grammar}
                            changes={s.changes}
                            animated={isLatest}
                            compact={true}
                          />
                        </div>
                      </div>

                      {/* Arrow separator */}
                      <div className="flex items-center justify-center mt-3">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800">
                          <ArrowRight className="w-4 h-4 text-primary-500" />
                          <span className="text-xs font-semibold text-primary-700 dark:text-primary-300">
                            {getTransformSummary(s)}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Full view */
                    <GrammarDisplay
                      key={`full-${s.id}-${idx}`}
                      grammar={s.grammar}
                      prevGrammar={prev?.grammar}
                      changes={s.changes}
                      animated={isLatest}
                    />
                  )}

                  {/* Grammar stats — only on the latest step */}
                  {isLatest && (
                    <div className="mt-3">
                      <GrammarStats grammar={s?.grammar} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Explanation — sticky */}
        <div className="overflow-y-auto min-h-0 xl:sticky xl:top-20 xl:self-start" style={{ maxHeight: 'calc(100vh - 7rem)' }}>
          <ExplanationPanel step={step} />
        </div>
      </div>
    </div>
  );
}

function getTransformSummary(step) {
  const removed = step.changes?.removed?.length || 0;
  const modified = step.changes?.modified?.length || 0;
  const added = step.changes?.added?.length || 0;
  const parts = [];
  if (removed) parts.push(`${removed} removed`);
  if (modified) parts.push(`${modified} modified`);
  if (added) parts.push(`${added} added`);
  return parts.length > 0 ? parts.join(', ') : 'No changes';
}

function GrammarStats({ grammar }) {
  if (!grammar?.productions) return null;

  const ntCount = Object.keys(grammar.productions).length;
  const ruleCount = Object.values(grammar.productions).reduce((s, r) => s + r.length, 0);
  const tCount = grammar.terminals?.size || 0;

  return (
    <div className="flex gap-3 flex-wrap">
      <StatBadge label="Non-terminals" value={ntCount} />
      <StatBadge label="Terminals" value={tCount} />
      <StatBadge label="Productions" value={ruleCount} />
    </div>
  );
}

function StatBadge({ label, value }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <span className="text-lg font-bold text-primary-600 dark:text-primary-400 leading-none">{value}</span>
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
    </div>
  );
}
