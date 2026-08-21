import React, { useState, useEffect } from 'react';
import { HistoryItem, AppSettings } from '../types';
import { getHistory, clearHistory, deleteHistoryItem } from '../utils/history';
import { Search, Trash2, Copy, Download, Check, ArrowRight } from 'lucide-react';

interface HistoryPanelProps {
  onSelectCalculation?: (expr: string) => void;
  settings?: AppSettings;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ onSelectCalculation, settings }) => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isLight = settings?.theme === 'light';
  const isOled = settings?.theme === 'oled';

  useEffect(() => {
    setHistoryItems(getHistory());
  }, []);

  const handleClearAll = () => {
    clearHistory();
    setHistoryItems([]);
  };

  const handleDelete = (id: string) => {
    const updated = deleteHistoryItem(id);
    setHistoryItems(updated);
  };

  const copyItem = (item: HistoryItem) => {
    navigator.clipboard.writeText(`${item.expression} = ${item.result}`);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(historyItems, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `omnicalc-history-${Date.now()}.json`);
    dlAnchorElem.click();
  };

  const filteredItems = historyItems.filter((item) => {
    const matchesSearch =
      item.expression.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.result.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMode = modeFilter === 'all' || item.mode === modeFilter;
    return matchesSearch && matchesMode;
  });

  const cardBg = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
    : isOled
      ? 'bg-zinc-950 border-zinc-800 text-white'
      : 'bg-slate-900 border-slate-800 text-slate-100 shadow-xl';

  const inputBg = isLight
    ? 'bg-slate-50 border-slate-200 text-slate-900'
    : isOled
      ? 'bg-zinc-900 border-zinc-800 text-white'
      : 'bg-slate-800/80 border-slate-700/80 text-slate-100';

  const rowBg = isLight
    ? 'bg-white border-slate-200 hover:border-slate-300 text-slate-900'
    : isOled
      ? 'bg-zinc-950 border-zinc-800/80 hover:border-zinc-700 text-white'
      : 'bg-slate-900 border-slate-800/80 hover:border-slate-700 text-slate-100';

  const btnSecondary = isLight
    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
    : isOled
      ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/80';

  return (
    <div className="max-w-4xl mx-auto w-full p-4 flex flex-col gap-5">
      {/* Search & Filter Header */}
      <div
        className={`${cardBg} border rounded-3xl p-4 flex flex-wrap items-center justify-between gap-3`}
      >
        <div
          className={`flex items-center gap-2 flex-1 min-w-[200px] border px-3 py-2 rounded-2xl ${inputBg}`}
        >
          <Search className={`w-4 h-4 ${isLight ? 'text-slate-400' : 'text-slate-400'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search calculations..."
            className="bg-transparent border-none text-sm focus:outline-none w-full"
          />
        </div>

        <select
          value={modeFilter}
          onChange={(e) => setModeFilter(e.target.value)}
          className={`border text-xs font-semibold rounded-2xl px-3 py-2 focus:outline-none cursor-pointer ${btnSecondary}`}
        >
          <option value="all">All Modes</option>
          <option value="basic">Basic</option>
          <option value="scientific">Scientific</option>
          <option value="programmer">Programmer</option>
          <option value="matrix">Matrix</option>
        </select>

        <div className="flex items-center gap-2">
          <button
            onClick={exportJSON}
            disabled={historyItems.length === 0}
            className={`px-3 py-2 text-xs font-bold rounded-2xl border flex items-center gap-1.5 transition-all disabled:opacity-40 ${btnSecondary}`}
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button
            onClick={handleClearAll}
            disabled={historyItems.length === 0}
            className="px-3 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-500 text-xs font-bold rounded-2xl border border-rose-500/30 flex items-center gap-1.5 transition-all disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear All
          </button>
        </div>
      </div>

      {/* History Items List */}
      <div className="flex flex-col gap-3">
        {filteredItems.length === 0 ? (
          <div className={`${cardBg} border rounded-3xl p-12 text-center text-slate-400 text-sm`}>
            No calculation entries found in history.
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className={`${rowBg} border rounded-3xl p-4 shadow-xs flex items-center justify-between gap-4 transition-all group`}
            >
              <div className="flex flex-col gap-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: isLight
                        ? 'rgba(2, 132, 199, 0.1)'
                        : 'rgba(2, 132, 199, 0.2)',
                      color: 'var(--accent)',
                      borderColor: 'var(--accent)',
                    }}
                  >
                    {item.mode}
                  </span>
                  <span
                    className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}
                  >
                    {new Date(item.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div
                  className={`text-sm font-mono truncate ${isLight ? 'text-slate-600' : 'text-slate-400'}`}
                >
                  {item.expression}
                </div>
                <div className="text-lg font-mono font-bold flex items-center gap-2">
                  <span>=</span>
                  <span style={{ color: 'var(--accent)' }}>{item.result}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {onSelectCalculation && (
                  <button
                    onClick={() => onSelectCalculation(item.expression)}
                    className={`p-2 rounded-xl transition-colors ${
                      isLight
                        ? 'text-slate-500 hover:text-sky-600 hover:bg-slate-100'
                        : 'text-slate-400 hover:text-sky-400 hover:bg-slate-800'
                    }`}
                    title="Open in Calculator"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => copyItem(item)}
                  className={`p-2 rounded-xl transition-colors ${
                    isLight
                      ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Copy Entry"
                >
                  {copiedId === item.id ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className={`p-2 rounded-xl transition-colors ${
                    isLight
                      ? 'text-slate-400 hover:text-rose-500 hover:bg-slate-100'
                      : 'text-slate-500 hover:text-rose-400 hover:bg-slate-800'
                  }`}
                  title="Delete Entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
