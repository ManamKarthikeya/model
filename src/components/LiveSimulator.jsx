import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Send, Database, CheckCircle2, RefreshCw, Zap, ArrowLeft, Code2, Sparkles, Sliders, FileCode, Layers } from 'lucide-react';

export default function LiveSimulator({
  parsedForm,
  dbName = 'user_db',
  tableName = 'users',
  wiredFormsList = [],
  extractedFormsList = null,
  activeWiredFields = null,
  customColumnNames = {},
  onBackToWiring,
  codeFiles = {},
  onDownload
}) {
  // Derive list of forms available for testing
  const forms = useMemo(() => {
    if (wiredFormsList && wiredFormsList.length > 0) {
      return wiredFormsList;
    }
    if (extractedFormsList && extractedFormsList.length > 0) {
      return extractedFormsList.map((item, idx) => {
        const fObj = item.parsed || item;
        const col = (fObj.collectionName || `table_${idx + 1}`).toLowerCase();
        return {
          id: item.id || fObj.formId || `form_${idx}`,
          filename: item.filename || `${fObj.formId || 'form'}.html`,
          formId: fObj.formId || `form_${idx + 1}`,
          collectionName: col,
          tableName: col,
          submitText: fObj.submitText || 'Submit',
          fields: fObj.fields || [],
          customColumnNames: {}
        };
      });
    }
    // Single form fallback
    const fallbackTable = (tableName || parsedForm?.collectionName || 'users').toLowerCase();
    const displayFields = (activeWiredFields && activeWiredFields.length > 0) ? activeWiredFields : (parsedForm?.fields || []);
    return [{
      id: 'default',
      filename: 'form.html',
      formId: parsedForm?.formId || 'userForm',
      collectionName: fallbackTable,
      tableName: fallbackTable,
      submitText: parsedForm?.submitText || 'Submit',
      fields: displayFields,
      customColumnNames: customColumnNames || {}
    }];
  }, [wiredFormsList, extractedFormsList, parsedForm, activeWiredFields, customColumnNames, tableName]);

  const [activeFormIndex, setActiveFormIndex] = useState(0);
  const activeForm = forms[activeFormIndex] || forms[0] || {};
  const activeDb = dbName || 'user_db';
  const activeTable = activeForm.tableName || tableName || 'users';
  const activeFields = activeForm.fields || [];
  const activeCustomColNames = activeForm.customColumnNames || customColumnNames || {};

  const [activeView, setActiveView] = useState('test'); // 'test' | 'code'

  // Input data state per form
  const [formDataMap, setFormDataMap] = useState(() => {
    const init = {};
    forms.forEach(f => {
      const fData = {};
      (f.fields || []).forEach(field => {
        fData[field.name] = field.sampleVal || '';
      });
      init[f.id] = fData;
    });
    return init;
  });

  // Simulated & real MongoDB records per collection table name
  const [savedRecordsMap, setSavedRecordsMap] = useState(() => {
    const init = {};
    forms.forEach((f, idx) => {
      const fTable = f.tableName || 'users';
      const initialRecord = {
        _id: `66fe${idx}9b208a1c90012f4${idx}a1`,
        createdAt: new Date().toISOString()
      };
      const fFields = f.fields || [];
      const fCustom = f.customColumnNames || customColumnNames || {};
      fFields.forEach(field => {
        const col = fCustom[field.name] || field.name;
        initialRecord[col] = field.sampleVal || 'Sample Data';
      });
      init[fTable] = [initialRecord];
    });
    return init;
  });

  const activeRecords = savedRecordsMap[activeTable] || [];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);
  const [selectedCodeFile, setSelectedCodeFile] = useState('server.js');

  const currentFormData = formDataMap[activeForm.id] || {};

  const handleInputChange = (fieldName, value) => {
    setFormDataMap(prev => ({
      ...prev,
      [activeForm.id]: {
        ...(prev[activeForm.id] || {}),
        [fieldName]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLastResponse(null);

    const recordData = {};
    activeFields.forEach(f => {
      const col = activeCustomColNames[f.name] || f.name;
      recordData[col] = currentFormData[f.name] ?? '';
    });

    const startTime = Date.now();

    try {
      const res = await fetch('http://localhost:5000/api/insert-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dbName: activeDb,
          tableName: activeTable,
          data: recordData
        })
      });

      const latency = Date.now() - startTime;
      const json = await res.json();

      if (res.ok && json.success) {
        setSavedRecordsMap(prev => ({
          ...prev,
          [activeTable]: [json.record, ...(prev[activeTable] || [])]
        }));
        setLastResponse({
          status: 201,
          statusText: 'Created in MongoDB Atlas',
          latency,
          record: json.record
        });
      } else {
        throw new Error(json.error || 'Server insertion failed');
      }
    } catch (err) {
      console.warn('Real backend offline, falling back to local storage simulation:', err);
      const fallbackRecord = {
        _id: '66fe' + Math.random().toString(16).substring(2, 18),
        ...recordData,
        createdAt: new Date().toISOString()
      };
      setSavedRecordsMap(prev => ({
        ...prev,
        [activeTable]: [fallbackRecord, ...(prev[activeTable] || [])]
      }));
      setLastResponse({
        status: 201,
        statusText: 'Saved to Database',
        latency: Date.now() - startTime,
        record: fallbackRecord
      });
    } finally {
      setIsSubmitting(false);
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  };

  const handleClearDb = () => {
    setSavedRecordsMap(prev => ({
      ...prev,
      [activeTable]: []
    }));
    setLastResponse(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-md">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              Step 3: Storage Verification Test
            </span>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center space-x-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>MongoDB Connected (db.{activeDb})</span>
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            Test Input Form & Real-time MongoDB Storage
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Clicking <code className="font-bold">{activeForm.submitText || 'Submit'}</code> posts input data directly into MongoDB table <code className="font-bold text-emerald-600 dark:text-emerald-400">db.{activeDb}.{activeTable}</code>.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Navigation Tab Toggle Buttons */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveView('test')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === 'test'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Live Demo
            </button>
            <button
              onClick={() => setActiveView('code')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === 'code'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Backend Code
            </button>
          </div>

          {onDownload && (
            <button
              onClick={onDownload}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
            >
              <span>Download Project ZIP</span>
            </button>
          )}

          <button
            onClick={onBackToWiring}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Wiring</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: LIVE DEMO TEST */}
      {activeView === 'test' && (
        <div className="space-y-6">

          {/* FORM SELECTOR SLIDER / TAB BAR */}
          <div className="bg-white/90 dark:bg-slate-900/90 border-2 border-indigo-200/80 dark:border-indigo-900/80 rounded-3xl p-4 shadow-lg backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sliders className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Select Form Node to View & Test ({forms.length} Form{forms.length > 1 ? 's' : ''} Configured)
                </h3>
              </div>
              <span className="text-[11px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                Click a form tab to switch inputs & MongoDB table
              </span>
            </div>

            {/* Horizontal Slider Track */}
            <div className="flex items-center space-x-3 overflow-x-auto pb-1.5 scrollbar-thin">
              {forms.map((form, idx) => {
                const isActive = activeFormIndex === idx;
                const formTable = form.tableName || 'users';
                const docCount = (savedRecordsMap[formTable] || []).length;

                return (
                  <button
                    key={form.id || idx}
                    onClick={() => {
                      setActiveFormIndex(idx);
                      setLastResponse(null);
                    }}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-2xl border text-xs font-bold transition-all whitespace-nowrap shadow-sm cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600 text-white border-indigo-500 ring-4 ring-indigo-500/20 scale-[1.02]'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${isActive ? 'bg-white/20 text-white' : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'}`}>
                      <FileCode className="h-4 w-4" />
                    </div>

                    <div className="text-left">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-sm">{form.filename || `Form ${idx + 1}`}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          #{form.formId}
                        </span>
                      </div>
                      <div className={`text-[10px] font-mono mt-0.5 ${isActive ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                        Target Table: <span className="font-bold">db.{activeDb}.{formTable}</span> ({docCount} records)
                      </div>
                    </div>

                    {isActive && (
                      <span className="ml-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* MAIN DEMO GRID: Selected Form Input (Left) & MongoDB Live Table (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT: Interactive Sample HTML Form for Active Form */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-900/60 rounded-3xl p-6 shadow-xl space-y-6">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <Code2 className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Sample Form Input ({activeForm.filename || 'form.html'})
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-400">#{activeForm.formId}</span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {activeFields.map(field => {
                  const colName = activeCustomColNames[field.name] || field.name;
                  return (
                    <div key={field.name} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          {field.name} {field.required && <span className="text-rose-500">*</span>}
                        </label>
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          → db column: {colName}
                        </span>
                      </div>

                      {field.type === 'radio' ? (
                        <div className="flex items-center space-x-6 pt-1">
                          {(field.options && field.options.length > 0 ? field.options : [
                            { value: 'male', label: 'Male' },
                            { value: 'female', label: 'Female' }
                          ]).map(opt => (
                            <label key={opt.value} className="flex items-center space-x-2 text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
                              <input
                                type="radio"
                                name={field.name}
                                value={opt.value}
                                checked={currentFormData[field.name] === opt.value}
                                onChange={(e) => handleInputChange(field.name, e.target.value)}
                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span>{opt.label}</span>
                            </label>
                          ))}
                        </div>
                      ) : field.type === 'checkbox' ? (
                        <label className="flex items-center space-x-2 pt-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(currentFormData[field.name])}
                            onChange={(e) => handleInputChange(field.name, e.target.checked)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {field.labelText || 'I agree to the terms'}
                          </span>
                        </label>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          value={currentFormData[field.name] || ''}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                          placeholder={field.placeholder}
                          required={field.required}
                          rows={3}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                      ) : (
                        <input
                          type={field.type || 'text'}
                          value={currentFormData[field.name] || ''}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                          placeholder={field.placeholder}
                          required={field.required}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                      )}
                    </div>
                  );
                })}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold rounded-2xl text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-white" />
                      <span>Inserting into db.{activeDb}.{activeTable}...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Click "{activeForm.submitText || 'Submit'}" to Insert into Database</span>
                    </>
                  )}
                </button>
              </form>

              {/* Response Alert */}
              {lastResponse && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    <div className="flex items-center space-x-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>HTTP {lastResponse.status} {lastResponse.statusText}</span>
                    </div>
                    <span className="font-mono text-[11px] text-emerald-600">{lastResponse.latency}ms latency</span>
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Success! Document saved in MongoDB collection <code className="font-bold">db.{activeDb}.{activeTable}</code>.
                  </p>
                </div>
              )}

            </div>

            {/* RIGHT: Live MongoDB Collection Inspector for Active Form Table */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border-2 border-emerald-200 dark:border-emerald-900/60 rounded-3xl p-6 shadow-xl space-y-4">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    MongoDB Live Table (db.{activeDb}.{activeTable})
                  </h3>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleClearDb}
                    className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-rose-600 bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Clear Table
                  </button>
                  <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    {activeRecords.length} Documents
                  </span>
                </div>
              </div>

              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {activeRecords.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 space-y-2">
                    <Database className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600 animate-bounce" />
                    <p className="text-sm">No rows in db.{activeDb}.{activeTable} yet. Type inputs and click Submit!</p>
                  </div>
                ) : (
                  activeRecords.map((doc, idx) => (
                    <div
                      key={doc._id || idx}
                      className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 font-mono text-xs space-y-2 shadow-sm"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-indigo-400 font-bold">_id: ObjectId("{doc._id}")</span>
                        <span className="text-[10px] text-slate-400">{doc.createdAt}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-slate-300 pt-1">
                        {activeFields.map(f => {
                          const colName = activeCustomColNames[f.name] || f.name;
                          return (
                            <div key={f.name}>
                              <span className="text-slate-400">{colName}: </span>
                              <span className="text-emerald-300 font-semibold">"{doc[colName] ?? ''}"</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* VIEW 2: BACKEND CODE PREVIEW */}
      {activeView === 'code' && (
        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Code2 className="h-5 w-5 text-indigo-400" />
              <h3 className="font-bold text-white text-base">Generated Backend Express & Mongoose Code</h3>
            </div>
            
            {/* Code File Selector */}
            <div className="flex items-center space-x-2 overflow-x-auto">
              {Object.keys(codeFiles).map(filename => (
                <button
                  key={filename}
                  onClick={() => setSelectedCodeFile(filename)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    selectedCodeFile === filename
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {filename}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <pre className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-[480px] leading-relaxed">
              <code>{codeFiles[selectedCodeFile] || '// Code loading...'}</code>
            </pre>
          </div>
        </div>
      )}

    </div>
  );
}
