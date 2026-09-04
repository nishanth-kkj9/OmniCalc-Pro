import React from 'react';
import { Plus, Sparkles, HelpCircle } from 'lucide-react';
import { GraphExpression } from '../../types';
import { ExpressionRow } from './ExpressionRow';
import { MAX_GRAPH_EXPRESSIONS } from '../../constants/limits';

export interface ExpressionListProps {
  expressions: GraphExpression[];
  activeExpressionId: string;
  onSelectExpression: (id: string) => void;
  onAddExpression: (initialExpr?: string) => void;
  onUpdateExpression: (id: string, updated: Partial<GraphExpression>) => void;
  onDuplicateExpression: (id: string) => void;
  onDeleteExpression: (id: string) => void;
  onAnalyzeExpression: (id: string) => void;
  validExpressionIds: Set<string>;
  theme: 'dark' | 'light' | 'oled';
}

const QUICK_TEMPLATES = [
  { label: 'x²', expr: 'x^2' },
  { label: 'sin(x)', expr: 'sin(x)' },
  { label: '1/x', expr: '1/x' },
  { label: '√x', expr: 'sqrt(x)' },
  { label: 'eˣ', expr: 'e^x' },
  { label: 'ln(x)', expr: 'ln(x)' },
  { label: '|x|', expr: 'abs(x)' },
];

export const ExpressionList: React.FC<ExpressionListProps> = ({
  expressions,
  activeExpressionId,
  onSelectExpression,
  onAddExpression,
  onUpdateExpression,
  onDuplicateExpression,
  onDeleteExpression,
  onAnalyzeExpression,
  validExpressionIds,
  theme,
}) => {
  const isLight = theme === 'light';

  const canAdd = expressions.length < MAX_GRAPH_EXPRESSIONS;

  return (
    <div className="w-full flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Expressions ({expressions.length}/{MAX_GRAPH_EXPRESSIONS})
          </span>
        </div>

        <button
          onClick={() => onAddExpression()}
          disabled={!canAdd}
          className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            canAdd
              ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-xs active:scale-95'
              : 'opacity-40 cursor-not-allowed bg-slate-700 text-slate-400'
          }`}
          title="Add a new mathematical expression"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Function</span>
        </button>
      </div>

      {/* Quick Starter Templates */}
      <div className="px-3 py-2 border-b border-slate-700/40 flex items-center gap-1.5 overflow-x-auto select-none flex-shrink-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">Quick:</span>
        {QUICK_TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.expr}
            onClick={() => onAddExpression(tmpl.expr)}
            disabled={!canAdd}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-semibold whitespace-nowrap transition-colors ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {tmpl.label}
          </button>
        ))}
      </div>

      {/* Expressions Scrollable List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {expressions.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center p-4 border border-dashed rounded-2xl border-slate-700/60">
            <Sparkles className="w-8 h-8 text-sky-400 mb-2 opacity-60" />
            <p className="text-xs font-semibold text-slate-300 mb-1">No expressions plotted</p>
            <p className="text-[11px] text-slate-400 max-w-xs mb-3">
              Add a function like <code className="text-sky-400 font-mono">y = x^2 - 4</code> or click a quick template above.
            </p>
            <button
              onClick={() => onAddExpression('x^2 - 4')}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white shadow-xs"
            >
              Add Parabola
            </button>
          </div>
        ) : (
          expressions.map((expr) => (
            <ExpressionRow
              key={expr.id}
              expression={expr}
              isActive={expr.id === activeExpressionId}
              onSelect={() => onSelectExpression(expr.id)}
              onUpdate={(updated) => onUpdateExpression(expr.id, updated)}
              onDuplicate={() => onDuplicateExpression(expr.id)}
              onDelete={() => onDeleteExpression(expr.id)}
              onAnalyze={() => onAnalyzeExpression(expr.id)}
              isValid={validExpressionIds.has(expr.id)}
              theme={theme}
            />
          ))
        )}
      </div>

      {/* Syntax Tip Footer */}
      <div className="p-2.5 border-t border-slate-700/40 text-[10px] text-slate-400 flex items-center justify-between flex-shrink-0 bg-slate-900/30">
        <div className="flex items-center gap-1.5 truncate">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="truncate">Supports <code className="font-mono text-sky-400">sin, cos, tan, sqrt, ln, e^x, abs, pi</code></span>
        </div>
      </div>
    </div>
  );
};
