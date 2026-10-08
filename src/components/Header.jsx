import React from 'react';
import { Layers, Sun, Moon, Database, Server, Download, Code2, Box, FileCode, Zap } from 'lucide-react';

export default function Header({ isDarkMode, setIsDarkMode, onDownloadAll, activeTab, setActiveTab }) {
  return (
    <header className="border-b transition-colors duration-200 sticky top-0 z-50 backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-slate-200/80 dark:border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">BackendFlow</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                AI 3D
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">Visual Full-Stack Architecture Platform</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('studio')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'studio'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>1. Form Input</span>
          </button>
          
          <button
            onClick={() => setActiveTab('visualizer')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'visualizer'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Box className="h-3.5 w-3.5" />
            <span>2. Visual Architecture</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'code'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileCode className="h-3.5 w-3.5" />
            <span>3. Code Inspector</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'simulator'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>4. Live Playground</span>
          </button>
        </nav>

        {/* Right Tools: Stack Badge, Theme Toggle & Download */}
        <div className="flex items-center space-x-2">
          
          <div className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <Server className="h-3.5 w-3.5 text-emerald-600" />
            <span>Node.js</span>
            <span className="text-emerald-400">+</span>
            <Database className="h-3.5 w-3.5 text-emerald-600" />
            <span>MongoDB</span>
          </div>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Toggle Light / Dark Mode"
          >
            {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-600" />}
          </button>

          <button
            onClick={onDownloadAll}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export ZIP</span>
          </button>

        </div>
      </div>
    </header>
  );
}
