import React from 'react';
import { CheckCircle2, Circle, ArrowRight, Trash2, Sigma, Link, Zap } from 'lucide-react';

const STEP_META = {
  original:  { icon: Sigma,    color: 'text-gray-500',    bg: 'bg-gray-100 dark:bg-gray-800',             ring: 'ring-gray-300 dark:ring-gray-600' },
  useless:   { icon: Trash2,   color: 'text-danger-500',  bg: 'bg-danger-50 dark:bg-danger-900/30',       ring: 'ring-danger-300 dark:ring-danger-700' },
  null:      { icon: Zap,      color: 'text-warning-500', bg: 'bg-warning-50 dark:bg-warning-900/30',     ring: 'ring-warning-300 dark:ring-warning-700' },
  unit:      { icon: Link,     color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/30',     ring: 'ring-primary-300 dark:ring-primary-700' },
  final:     { icon: CheckCircle2, color: 'text-accent-500', bg: 'bg-accent-50 dark:bg-accent-900/30',   ring: 'ring-accent-300 dark:ring-accent-700' },
};

export default function StepProgress({ steps, currentStep, onStepSelect }) {
  return (
    <div className="panel p-4">
      <p className="section-title">Simplification Pipeline</p>
      <div className="space-y-1">
        {steps.map((step, idx) => {
          const meta = STEP_META[step.id] || STEP_META.original;
          const Icon = meta.icon;
          const isActive = idx === currentStep;
          const isDone = idx < currentStep;
          const isPending = idx > currentStep;

          return (
            <button
              key={`${step.id}-${idx}`}
              onClick={() => onStepSelect(idx)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group
                ${isActive
                  ? 'bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 shadow-sm'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }
              `}
            >
              {/* Step indicator */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200
                ${isActive ? `ring-2 ${meta.ring} ${meta.bg}` : ''}
                ${isDone ? 'bg-accent-100 dark:bg-accent-900/40' : ''}
                ${isPending ? 'bg-gray-100 dark:bg-gray-800' : ''}
              `}>
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-accent-500" />
                ) : isPending ? (
                  <Circle className="w-4 h-4 text-gray-400" />
                ) : (
                  <Icon className={`w-4 h-4 ${meta.color}`} />
                )}
              </div>

              {/* Label */}
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold leading-tight truncate transition-colors
                  ${isActive ? 'text-primary-700 dark:text-primary-300' : ''}
                  ${isDone ? 'text-gray-600 dark:text-gray-400' : ''}
                  ${isPending ? 'text-gray-400 dark:text-gray-600' : ''}
                `}>
                  {step.title}
                </p>
                {isActive && (
                  <p className="text-xs text-primary-500 dark:text-primary-400 mt-0.5 leading-tight line-clamp-2">
                    {step.description}
                  </p>
                )}
              </div>

              {/* Arrow for active */}
              {isActive && (
                <ArrowRight className="w-4 h-4 text-primary-400 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
