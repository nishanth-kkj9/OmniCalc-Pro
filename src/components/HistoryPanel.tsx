import React, { useState, useEffect } from 'react';
import {
  History,
  Trash2,
  Copy,
  Check,
  Search,
  Download,
  Filter,
  FileSpreadsheet,
} from 'lucide-react';
import { getHistory, clearHistory, deleteHistoryItem } from '../utils/history';
import { HistoryItem, AppSettings } from '../types';
import { downloadTextFile, generateCSV } from '../utils/exportEngine';

interface HistoryPanelProps {
  onSelectExpr?: (expr: string) => void;
  onSelectCalculation?: () => void;
  settings?: AppSettings;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ onSelectExpr, settings }) => {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [filterMode, setFilterMode] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadItems = () => {
    setItems(getHistory());
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all calculation history?')) {
      clearHistory();
      loadItems();
    }
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteHistoryItem(id);
    loadItems();
  };

  const handleCopy = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filteredItems = items.filter((item) => {
    const matchesMode = filterMode === 'all' || item.mode === filterMode;
    const matchesSearch =
      !searchQuery.trim() ||
      item.expression.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.result.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMode && matchesSearch;
  });

  const isLight = settings?.theme === 'light';
  const isOled = settings?.theme === 'oled';

  const panelBg = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : isOled
      ? 'bg-zinc-950 border-zinc-800 text-white'
      : 'bg-slate-900 border-slate-800 text-slate-100';

  const cardBg = isLight
    ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
    : isOled
      ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
      : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700';

  const handleExportCSV = () => {
    const headers = ['ID', 'Timestamp', 'Engine Mode', 'Expression', 'Result'];
    const rows = filteredItems.map((item) => [
      item.id,
      new Date(item.timestamp).toLocaleString(),
      item.mode,
      item.expression,
      item.result,
    ]);
    const csvContent = generateCSV(headers, rows);
    downloadTextFile('omnicalc_history_export.csv', csvContent, 'text/csv');
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(filteredItems, null, 2);
    downloadTextFile('omnicalc_history_export.json', jsonStr, 'application/json');
  };

  return (
    <div className={`max-w-4xl mx-auto w-full p-4 sm:p-6 rounded-3xl border shadow-xl ${panelBg} flex flex-col gap-6`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-600/10 border border-sky-500/20 rounded-2xl text-sky-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold">Calculation Log & Audit</h2>
            <p className="text-xs text-slate-400">
              {items.length} total entries recorded across engines
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            disabled={filteredItems.length === 0}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export CSV
          </button>

          <button
            onClick={handleExportJSON}
            disabled={filteredItems.length === 0}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" /> JSON
          </button>

          {items.length > 0 && (
            <button
              onClick={handleClear}
              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-rose-500/30 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search expressions or results..."
            className="w-full bg-slate-800/60 border border-slate-700/80 focus:border-sky-500 rounded-2xl pl-10 pr-4 py-2 text-xs font-mono text-slate-100 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="w-full bg-slate-800/60 border border-slate-700/80 focus:border-sky-500 rounded-2xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none"
          >
            <option value="all">All Calculator Engines</option>
            <option value="basic">Basic & Standard</option>
            <option value="scientific">Scientific</option>
            <option value="programmer">Programmer</option>
            <option value="matrix">Matrix</option>
            <option value="calculus">Calculus</option>
            <option value="equation">Equation Solver</option>
          </select>
        </div>
      </div>

      {/* History Items List */}
      <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center gap-2">
            <History className="w-8 h-8 text-slate-600" />
            <span>No calculation logs match your query or filter.</span>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectExpr?.(item.expression)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between gap-4 ${cardBg}`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    {item.mode}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(item.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="font-mono text-xs text-slate-400 truncate mb-0.5">
                  {item.expression} =
                </div>
                <div className="font-mono text-base font-bold text-slate-100 truncate">
                  {item.result}
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 flex-shrink-0">
                <button
                  onClick={(e) => handleCopy(item.result, item.id, e)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                  title="Copy Result"
                  aria-label="Copy result"
                >
                  {copiedId === item.id ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={(e) => handleDeleteItem(item.id, e)}
                  className="p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition-colors"
                  title="Delete Item"
                  aria-label="Delete history item"
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
