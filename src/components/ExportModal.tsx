import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Printer,
  FileText,
  Code2,
  Table as TableIcon,
} from 'lucide-react';
import {
  ExportReportData,
  generateLatexSnippet,
  generateMarkdownReport,
  generateCSV,
  downloadTextFile,
  printCalculationSheet,
} from '../utils/exportEngine';
import { AppSettings } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ExportReportData;
  settings?: AppSettings;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, data, settings }) => {
  const [activeTab, setActiveTab] = useState<'latex' | 'markdown' | 'csv' | 'pdf'>('latex');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const isLight = settings?.theme === 'light';
  const isOled = settings?.theme === 'oled';

  const modalBg = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-2xl'
    : isOled
      ? 'bg-zinc-950 border-zinc-800 text-white shadow-2xl'
      : 'bg-slate-900 border-slate-800 text-slate-100 shadow-2xl';

  const latexText = generateLatexSnippet(data);
  const markdownText = generateMarkdownReport(data);
  const csvText =
    data.tableHeaders && data.tableRows ? generateCSV(data.tableHeaders, data.tableRows) : '';

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const cleanTitle = data.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (activeTab === 'latex') {
      downloadTextFile(`${cleanTitle}_latex.tex`, latexText, 'application/x-tex');
    } else if (activeTab === 'markdown') {
      downloadTextFile(`${cleanTitle}_report.md`, markdownText, 'text/markdown');
    } else if (activeTab === 'csv' && csvText) {
      downloadTextFile(`${cleanTitle}_data.csv`, csvText, 'text/csv');
    }
  };

  const handlePrint = () => {
    printCalculationSheet(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className={`w-full max-w-2xl border rounded-3xl p-6 flex flex-col gap-5 ${modalBg}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 border-slate-800/80">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <Download className="w-4 h-4 text-sky-400" /> Export Calculation & Report
            </h3>
            <p className="text-xs text-slate-400">
              {data.title} • {data.engine}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2">
          <button
            onClick={() => setActiveTab('latex')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'latex'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" /> LaTeX Math
          </button>

          <button
            onClick={() => setActiveTab('markdown')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'markdown'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Markdown Doc
          </button>

          {csvText && (
            <button
              onClick={() => setActiveTab('csv')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'csv'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" /> CSV Data
            </button>
          )}

          <button
            onClick={() => setActiveTab('pdf')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'pdf'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Printer className="w-3.5 h-3.5" /> PDF / Print Sheet
          </button>
        </div>

        {/* Content Display */}
        <div className="flex flex-col gap-3">
          {activeTab === 'latex' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>LaTeX Equation Block (Ready for Overleaf / Academic papers)</span>
                <span className="font-mono text-[10px]">.tex</span>
              </div>
              <textarea
                readOnly
                value={latexText}
                rows={6}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 font-mono text-xs text-sky-300 focus:outline-none resize-none"
              />
            </div>
          )}

          {activeTab === 'markdown' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Full Markdown Calculation Document</span>
                <span className="font-mono text-[10px]">.md</span>
              </div>
              <textarea
                readOnly
                value={markdownText}
                rows={8}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 font-mono text-xs text-emerald-300 focus:outline-none resize-none"
              />
            </div>
          )}

          {activeTab === 'csv' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Comma-Separated Values (CSV Table)</span>
                <span className="font-mono text-[10px]">.csv</span>
              </div>
              <textarea
                readOnly
                value={csvText}
                rows={6}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 font-mono text-xs text-amber-300 focus:outline-none resize-none"
              />
            </div>
          )}

          {activeTab === 'pdf' && (
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-3 text-center">
              <Printer className="w-10 h-10 text-sky-400" />
              <div>
                <h4 className="text-sm font-bold text-slate-200">Formal PDF Calculation Sheet</h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Generates an executive mathematical summary sheet formatted for printing, saving
                  to PDF, or archiving.
                </p>
              </div>
              <button
                onClick={handlePrint}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-sky-600/20 transition-all"
              >
                <Printer className="w-4 h-4" /> Open Print & PDF Dialog
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {activeTab !== 'pdf' && (
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
            <button
              onClick={() => {
                const textToCopy =
                  activeTab === 'latex'
                    ? latexText
                    : activeTab === 'markdown'
                      ? markdownText
                      : csvText;
                handleCopy(textToCopy);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 border border-slate-700 transition-all"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-sky-600/20 transition-all"
            >
              <Download className="w-4 h-4" /> Download File
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
