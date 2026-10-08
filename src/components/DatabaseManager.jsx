import React, { useState } from 'react';
import { Database, Plus, Sparkles, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export default function DatabaseManager({
  databases,
  dbName,
  onSelectDatabase,
  onCreateDatabase
}) {
  const [showModal, setShowModal] = useState(false);
  const [inputDbName, setInputDbName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const sanitizeDbName = (val) => {
    return val.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  };

  const handleInputChange = (e) => {
    const rawVal = e.target.value;
    const sanitized = sanitizeDbName(rawVal);
    setInputDbName(rawVal);

    if (databases.includes(sanitized)) {
      setErrorMsg(`Database "${sanitized}" already exists! Please enter a unique database name.`);
    } else {
      setErrorMsg('');
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const finalName = sanitizeDbName(inputDbName);

    if (!finalName) {
      setErrorMsg('Please enter a valid database name.');
      return;
    }

    if (databases.includes(finalName)) {
      setErrorMsg(`Database "${finalName}" already exists! Please enter another database name.`);
      return;
    }

    // Successfully create and select database
    onCreateDatabase(finalName);
    setShowModal(false);
    setInputDbName('');
    setErrorMsg('');
  };

  return (
    <div className="relative min-h-[85vh] flex flex-col items-center justify-center px-4 py-8 overflow-hidden bg-slate-100/40 dark:bg-slate-950">
      {/* Background Soft Glow */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-indigo-200/40 dark:bg-indigo-950/30 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/3 w-[450px] h-[450px] bg-emerald-200/30 dark:bg-emerald-950/20 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="w-full max-w-4xl mx-auto space-y-8 text-center z-10">
        
        {/* Header Title */}
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Step 1: MongoDB Database Hub</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            YOUR MONGODB DATABASES
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto font-medium">
            Select an existing database or click the <span className="font-bold text-indigo-600 dark:text-indigo-400">+ Plus Icon</span> to create a new database for your form prompt.
          </p>
        </div>

        {/* Database Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 items-stretch">
          
          {/* Card for each existing database */}
          {databases.map(dName => {
            const isSelected = dName === dbName;
            return (
              <div
                key={dName}
                onClick={() => onSelectDatabase(dName)}
                className={`relative group p-6 rounded-3xl cursor-pointer transition-all duration-300 flex flex-col justify-between text-left border ${
                  isSelected
                    ? 'bg-gradient-to-br from-indigo-600 to-blue-700 text-white border-indigo-500 shadow-xl shadow-indigo-500/20 scale-[1.02]'
                    : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg hover:-translate-y-1'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-2xl ${isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'}`}>
                      <Database className="h-6 w-6" />
                    </div>
                    {isSelected && (
                      <span className="flex items-center space-x-1 text-[11px] font-bold bg-white/20 px-2.5 py-1 rounded-full text-white backdrop-blur-md">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>

                  <div className="mt-5 space-y-1">
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                      MongoDB Collection DB
                    </span>
                    <h3 className="text-xl font-bold font-mono tracking-wide truncate">
                      {dName}
                    </h3>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 dark:border-slate-800 flex items-center justify-between text-xs font-semibold">
                  <span className={isSelected ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}>
                    Click to add Form Prompt →
                  </span>
                  <ArrowRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${isSelected ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`} />
                </div>
              </div>
            );
          })}

          {/* "+" PLUS ICON BUTTON CARD TO CREATE NEW DATABASE */}
          <div
            onClick={() => {
              setShowModal(true);
              setInputDbName('');
              setErrorMsg('');
            }}
            className="group relative p-6 rounded-3xl cursor-pointer transition-all duration-300 flex flex-col items-center justify-center text-center border-2 border-dashed border-indigo-300 dark:border-indigo-800/80 bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-xl hover:-translate-y-1 min-h-[200px]"
          >
            <div className="p-4 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
              <Plus className="h-8 w-8 stroke-[2.5]" />
            </div>

            <div className="mt-4 space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Create New Database
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click to add a custom MongoDB database
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* CREATE DATABASE MODAL PROMPT */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-left relative">
            
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
                <Database className="h-5 w-5" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Enter New Database Name
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Specify a unique database name. If it already exists, you will be prompted to make another.
              </p>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Database Name
                </label>
                
                <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-950 rounded-2xl px-3.5 py-3 border border-slate-300 dark:border-slate-800 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                  <span className="font-mono text-xs text-slate-400 font-semibold">mongodb://.../</span>
                  <input
                    type="text"
                    autoFocus
                    value={inputDbName}
                    onChange={handleInputChange}
                    placeholder="e.g. ecommerce_db"
                    className="flex-1 bg-transparent text-sm font-mono font-bold text-indigo-600 dark:text-indigo-300 outline-none"
                  />
                </div>
              </div>

              {/* Duplicate Database Error Alert */}
              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-start space-x-2.5 animate-fadeIn">
                  <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Boolean(errorMsg) || !inputDbName.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 flex items-center space-x-1.5 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create & Continue</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
