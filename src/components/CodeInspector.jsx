import React, { useState } from 'react';
import { FileCode, Copy, CheckCircle2, Download, Terminal, Layers, Sparkles, FileArchive } from 'lucide-react';

export default function CodeInspector({ files, onDownloadAll }) {
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [copiedFile, setCopiedFile] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  const activeFile = files[activeFileIndex] || files[0];

  const handleCopyActive = () => {
    if (activeFile) {
      navigator.clipboard.writeText(activeFile.code);
      setCopiedFile(true);
      setTimeout(() => setCopiedFile(false), 2000);
    }
  };

  const handleCopyAll = () => {
    const fullBundle = files.map(f => `// File: ${f.name}\n${f.code}\n`).join('\n=========================================\n\n');
    navigator.clipboard.writeText(fullBundle);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Auto-Generated Code Studio</h2>
            <span className="text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              Production Ready ({files.length} Files)
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Inspect, copy, or download the full backend codebase compiled directly from your visual architecture.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyAll}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold transition-all"
          >
            {copiedAll ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-indigo-500" />}
            <span>{copiedAll ? 'All Copied!' : 'Copy All Files'}</span>
          </button>

          <button
            onClick={onDownloadAll}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02]"
          >
            <FileArchive className="h-4 w-4" />
            <span>Download Runnable ZIP</span>
          </button>
        </div>
      </div>

      {/* Main Code View Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Sidebar File List */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
            <Terminal className="h-4 w-4 text-indigo-500" />
            <span>Project Explorer</span>
          </div>

          <div className="space-y-1">
            {files.map((file, idx) => (
              <button
                key={file.name}
                onClick={() => setActiveFileIndex(idx)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-mono font-medium flex items-center justify-between transition-all ${
                  activeFileIndex === idx
                    ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <FileCode className={`h-4 w-4 ${activeFileIndex === idx ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="truncate">{file.name}</span>
                </div>
                <span className="text-[10px] text-slate-400 uppercase">{file.language}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Code Viewer Panel */}
        <div className="lg:col-span-9 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
          
          {/* File Header */}
          <div className="bg-slate-800/90 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold text-slate-200">{activeFile.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-indigo-300 font-mono">
                {activeFile.language}
              </span>
            </div>

            <button
              onClick={handleCopyActive}
              className="flex items-center space-x-1.5 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium transition-colors"
            >
              {copiedFile ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-300" />}
              <span>{copiedFile ? 'Copied' : 'Copy File'}</span>
            </button>
          </div>

          {/* Code Content */}
          <div className="p-4 overflow-x-auto max-h-[500px]">
            <pre className="font-mono text-xs text-indigo-200 leading-relaxed">
              <code>{activeFile.code}</code>
            </pre>
          </div>

        </div>

      </div>

    </div>
  );
}
