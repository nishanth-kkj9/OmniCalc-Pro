import React from 'react';
import { TrendingUp, Divide, ArrowRightLeft } from 'lucide-react';
import { TangentLineResult, DefiniteIntegralResult } from '../../utils/graphingEngine';

interface FunctionOption {
  id: string;
  name: string;
  expr: string;
  color: string;
}

interface GraphCalculusTabProps {
  functions: FunctionOption[];
  // Tangent Line Props
  tangentEnabled: boolean;
  onToggleTangent: (val: boolean) => void;
  tangentFnIndex: number;
  onChangeTangentFnIndex: (idx: number) => void;
  tangentX0: number;
  onChangeTangentX0: (x0: number) => void;
  tangentResult: TangentLineResult | null;
  xMin: number;
  xMax: number;
  // Definite Integral Props
  integralEnabled: boolean;
  onToggleIntegral: (val: boolean) => void;
  integralFnIndex: number;
  onChangeIntegralFnIndex: (idx: number) => void;
  integralA: number;
  onChangeIntegralA: (a: number) => void;
  integralB: number;
  onChangeIntegralB: (b: number) => void;
  integralResult: DefiniteIntegralResult | null;
  isLight?: boolean;
}

export const GraphCalculusTab: React.FC<GraphCalculusTabProps> = ({
  functions,
  tangentEnabled,
  onToggleTangent,
  tangentFnIndex,
  onChangeTangentFnIndex,
  tangentX0,
  onChangeTangentX0,
  tangentResult,
  xMin,
  xMax,
  integralEnabled,
  onToggleIntegral,
  integralFnIndex,
  onChangeIntegralFnIndex,
  integralA,
  onChangeIntegralA,
  integralB,
  onChangeIntegralB,
  integralResult,
  isLight = false,
}) => {
  const cardBg = isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700/70';
  const inputBg = isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-slate-100';

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Tangent Line Tool */}
      <div className={`p-4 rounded-2xl border flex flex-col gap-3 ${cardBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-100">Tangent Line & Derivative</h4>
              <span className="text-[10px] text-slate-400">Draws tangent at x = x₀ with live slope</span>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={tangentEnabled}
            aria-label="Toggle tangent line visualization"
            onClick={() => onToggleTangent(!tangentEnabled)}
            className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-all ${
              tangentEnabled ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white shadow-sm transition-transform" />
          </button>
        </div>

        {tangentEnabled && (
          <div className="flex flex-col gap-2.5 pt-2 border-t border-inherit animate-in fade-in duration-150">
            {/* Function selector */}
            <div className="flex items-center justify-between text-xs">
              <label className="text-slate-400">Target Function</label>
              <select
                value={tangentFnIndex}
                onChange={(e) => onChangeTangentFnIndex(Number(e.target.value))}
                className={`p-1.5 rounded-lg text-xs font-mono border focus:outline-none focus:border-amber-500 ${inputBg}`}
              >
                {functions.map((fn, idx) => (
                  <option key={fn.id} value={idx}>
                    f{idx + 1}(x) = {fn.expr || 'empty'}
                  </option>
                ))}
              </select>
            </div>

            {/* Slider and input for x0 */}
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Point x₀:</span>
                <span className="font-mono font-bold text-amber-400">{tangentX0.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={xMin}
                max={xMax}
                step={0.1}
                value={tangentX0}
                onChange={(e) => onChangeTangentX0(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
              />
            </div>

            {/* Real-time Tangent Output */}
            {tangentResult ? (
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-amber-500/30 flex flex-col gap-1 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Slope m = f'(x₀):</span>
                  <span className="font-bold text-amber-400">{tangentResult.slope}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Point (x₀, y₀):</span>
                  <span className="text-slate-200">({tangentResult.x0}, {tangentResult.y0})</span>
                </div>
                <div className="text-[11px] text-amber-300/90 pt-1 border-t border-slate-800">
                  Equation: <span className="font-bold">{tangentResult.equation}</span>
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 text-center py-1">
                Evaluation undefined at current x₀
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Definite Integral Tool */}
      <div className={`p-4 rounded-2xl border flex flex-col gap-3 ${cardBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Divide className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-100">Definite Integral (Area)</h4>
              <span className="text-[10px] text-slate-400">Shaded area under curve from a to b</span>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={integralEnabled}
            aria-label="Toggle definite integral visualization"
            onClick={() => onToggleIntegral(!integralEnabled)}
            className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-all ${
              integralEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white shadow-sm transition-transform" />
          </button>
        </div>

        {integralEnabled && (
          <div className="flex flex-col gap-2.5 pt-2 border-t border-inherit animate-in fade-in duration-150">
            {/* Function selector */}
            <div className="flex items-center justify-between text-xs">
              <label className="text-slate-400">Target Function</label>
              <select
                value={integralFnIndex}
                onChange={(e) => onChangeIntegralFnIndex(Number(e.target.value))}
                className={`p-1.5 rounded-lg text-xs font-mono border focus:outline-none focus:border-emerald-500 ${inputBg}`}
              >
                {functions.map((fn, idx) => (
                  <option key={fn.id} value={idx}>
                    f{idx + 1}(x) = {fn.expr || 'empty'}
                  </option>
                ))}
              </select>
            </div>

            {/* Bounds a and b */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-slate-400 block text-[10px] mb-1">Lower Bound (a)</label>
                <input
                  type="number"
                  step="0.5"
                  value={integralA}
                  onChange={(e) => onChangeIntegralA(parseFloat(e.target.value) || 0)}
                  className={`w-full p-1.5 rounded-lg font-mono border ${inputBg}`}
                />
              </div>
              <div>
                <label className="text-slate-400 block text-[10px] mb-1">Upper Bound (b)</label>
                <input
                  type="number"
                  step="0.5"
                  value={integralB}
                  onChange={(e) => onChangeIntegralB(parseFloat(e.target.value) || 0)}
                  className={`w-full p-1.5 rounded-lg font-mono border ${inputBg}`}
                />
              </div>
            </div>

            <button
              onClick={() => {
                const temp = integralA;
                onChangeIntegralA(integralB);
                onChangeIntegralB(temp);
              }}
              className="self-center flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <ArrowRightLeft className="w-3 h-3" /> Swap Limits
            </button>

            {/* Calculated Area Display */}
            {integralResult ? (
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-emerald-500/30 flex flex-col gap-1 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>∫[{integralResult.a} to {integralResult.b}] f(x) dx:</span>
                  <span className="font-bold text-emerald-400 text-sm">{integralResult.value}</span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                  <span>Method: Composite Simpson</span>
                  <span>{integralResult.steps} slices</span>
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 text-center py-1">
                Unable to compute integral across chosen bounds
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
