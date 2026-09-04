import React, { useRef } from 'react';
import {
  FolderOpen,
  Save,
  Trash2,
  Download,
  Upload,
  BookOpen,
} from 'lucide-react';
import { GraphSession } from '../../types';
import { PRESET_SESSIONS, sanitizeGraphSession } from '../../utils/graphStorage';
import { downloadSessionJson } from '../../utils/graphExport';

export interface GraphSessionsPanelProps {
  currentSession: GraphSession;
  userSessions: GraphSession[];
  onLoadSession: (session: GraphSession) => void;
  onSaveCurrentSession: (title: string) => void;
  onDeleteSession: (id: string) => void;
  onImportSession: (session: GraphSession) => void;
  theme: 'dark' | 'light' | 'oled';
}

export const GraphSessionsPanel: React.FC<GraphSessionsPanelProps> = ({
  currentSession,
  userSessions,
  onLoadSession,
  onSaveCurrentSession,
  onDeleteSession,
  onImportSession,
  theme: _theme,
}) => {
  const [sessionTitle, setSessionTitle] = React.useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const title = sessionTitle.trim() || 'My Graph Session';
    onSaveCurrentSession(title);
    setSessionTitle('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const sanitized = sanitizeGraphSession(parsed);
        if (sanitized) {
          onImportSession(sanitized);
        }
      } catch (err) {
        console.error('Failed to parse graph session file:', err);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto p-3 space-y-4">
      {/* Save Current Session Form */}
      <div className="p-3 rounded-2xl border border-slate-700/60 bg-slate-900/50 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
          <Save className="w-4 h-4" />
          <span>Save Current Workspace</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Session title (e.g. Calculus Project)"
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            className="flex-1 px-2.5 py-1.5 rounded-xl text-xs bg-slate-800 border border-slate-700 focus:outline-none"
          />
          <button
            onClick={handleSave}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white shadow-xs"
          >
            Save
          </button>
        </div>
      </div>

      {/* File Import / Export */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => downloadSessionJson(currentSession)}
          className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 flex items-center justify-center gap-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export File (.json)</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 flex items-center justify-center gap-1.5 transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import File</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Mathematical Presets */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span>Curated Mathematical Presets</span>
        </div>

        <div className="grid grid-cols-1 gap-1.5">
          {PRESET_SESSIONS.map((preset) => (
            <div
              key={preset.id}
              onClick={() => onLoadSession(preset)}
              className="p-2.5 rounded-xl border border-slate-700/50 bg-slate-900/40 hover:bg-slate-800/60 hover:border-cyan-500/40 cursor-pointer transition-all flex items-center justify-between"
            >
              <div>
                <h4 className="text-xs font-bold text-slate-200">{preset.title}</h4>
                <div className="text-[11px] font-mono text-cyan-400">
                  {preset.expressions.map((e) => e.expression).join(', ')}
                </div>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Load</span>
            </div>
          ))}
        </div>
      </div>

      {/* User Saved Sessions */}
      {userSessions.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
            <FolderOpen className="w-4 h-4 text-emerald-400" />
            <span>Saved Workspaces ({userSessions.length})</span>
          </div>

          <div className="space-y-1.5">
            {userSessions.map((sess) => (
              <div
                key={sess.id}
                className="p-2.5 rounded-xl border border-slate-700/50 bg-slate-900/40 hover:bg-slate-800/60 flex items-center justify-between transition-colors"
              >
                <div onClick={() => onLoadSession(sess)} className="cursor-pointer flex-1 min-w-0 pr-2">
                  <h4 className="text-xs font-bold text-slate-200 truncate">{sess.title}</h4>
                  <div className="text-[10px] text-slate-400">
                    {sess.expressions.length} functions • {new Date(sess.timestamp).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => downloadSessionJson(sess)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                    title="Export session"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteSession(sess.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400"
                    title="Delete session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
