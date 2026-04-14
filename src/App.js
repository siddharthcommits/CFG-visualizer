import React, { useState, useCallback, useEffect } from 'react';
import { parseGrammar } from './utils/cfgParser';
import { runSimplification } from './utils/cfgSimplify';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import InputPanel from './components/InputPanel';
import StepProgress from './components/StepProgress';
import VisualizationPanel from './components/VisualizationPanel';
import { BookOpen, Sparkles } from 'lucide-react';

function AppContent() {
  const [steps, setSteps] = useState(null);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isSimplified, setIsSimplified] = useState(false);
  const [grammarText, setGrammarText] = useState(`S -> AB | a\nA -> aA | ε\nB -> bB | ε`);

  const handleSimplify = useCallback(() => {
    setError(null);
    try {
      const grammar = parseGrammar(grammarText);
      const result = runSimplification(grammar);
      setSteps(result);
      setActiveStep(0);
      setIsSimplified(true);
    } catch (e) {
      setError(e.message);
      setSteps(null);
      setIsSimplified(false);
    }
  }, [grammarText]);

  // Re-simplify live whenever grammarText changes and we're already simplified
  useEffect(() => {
    if (!isSimplified) return;
    try {
      const grammar = parseGrammar(grammarText);
      const result = runSimplification(grammar);
      setSteps(result);
      setError(null);
      setActiveStep(current => Math.min(current, result.length - 1));
    } catch (e) {
      setError(e.message);
    }
  }, [grammarText, isSimplified]);

  const handleReset = useCallback(() => {
    setSteps(null);
    setError(null);
    setActiveStep(0);
    setIsSimplified(false);
  }, []);

  return (
    <div className="min-h-screen bg-mesh flex flex-col">
      <Header />

      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-6">
        {!isSimplified ? (
          /* ── Welcome / Input view ── */
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Hero text */}
            <div className="flex-1 space-y-8">
              <div className="space-y-4 pt-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800">
                  <Sparkles className="w-4 h-4 text-primary-500" />
                  <span className="text-xs font-semibold text-primary-700 dark:text-primary-300">Interactive Educational Tool</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
                  Visualize{' '}
                  <span className="text-gradient">CFG Simplification</span>{' '}
                  Step by Step
                </h2>

                <p className="text-base text-gray-600 dark:text-gray-400 max-w-xl leading-relaxed">
                  Input any Context-Free Grammar and watch it transform through each simplification stage —
                  useless symbol removal, null production elimination, and unit production cleanup — with
                  clear visual diffs and explanations.
                </p>
              </div>

              {/* Feature cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { title: 'Useless Symbols', desc: 'Remove non-generating and unreachable non-terminals', color: 'text-danger-500', bg: 'bg-danger-50 dark:bg-danger-900/20' },
                  { title: 'Null Productions', desc: 'Remove all ε-productions — language may change.', color: 'text-warning-500', bg: 'bg-warning-50 dark:bg-warning-900/20' },
                  { title: 'Unit Productions', desc: 'Inline single-terminal chains like A → B → C', color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20' },
                ].map((f, i) => (
                  <div key={i} className={`panel p-4 ${f.bg} border-transparent`}>
                    <div className={`text-sm font-bold ${f.color} mb-1`}>{f.title}</div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>

              {/* How to use */}
              <div className="panel p-5 space-y-3">
                <p className="section-title flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> How to Use</p>
                {[
                  'Enter your grammar rules on the right — one rule per line',
                  'Use single uppercase letters for non-terminals (S, A, B)',
                  'Use ε or eps for epsilon (empty string)',
                  'Click "Simplify Grammar" — all ε-productions will be removed (language may change)',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Input panel */}
            <div className="w-full lg:w-96 flex-shrink-0">
              <InputPanel
                onSimplify={handleSimplify}
                onReset={handleReset}
                isSimplified={isSimplified}
                error={error}
                text={grammarText}
                onTextChange={setGrammarText}
              />
            </div>
          </div>
        ) : (
          /* ── Simplification view ── */
          <div className="flex flex-col xl:flex-row gap-4 flex-1 min-h-0">
            {/* Left sidebar — sticky */}
            <div className="xl:w-72 flex-shrink-0 xl:sticky xl:top-20 xl:self-start space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 7rem)' }}>
              <InputPanel
                onSimplify={handleSimplify}
                onReset={handleReset}
                isSimplified={isSimplified}
                error={error}
                text={grammarText}
                onTextChange={setGrammarText}
              />
              {steps && (
                <StepProgress
                  steps={steps}
                  currentStep={activeStep}
                  onStepSelect={setActiveStep}
                />
              )}
            </div>

            {/* Main visualization area */}
            <div className="flex-1 min-h-0 min-w-0">
              {steps && (
                <VisualizationPanel
                  steps={steps}
                  activeStep={activeStep}
                  onStepChange={setActiveStep}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-4 px-6 text-center">
        <p className="text-xs text-gray-400 dark:text-gray-600">
          CFG Simplifier : An educational tool for Theory of Computation.
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
