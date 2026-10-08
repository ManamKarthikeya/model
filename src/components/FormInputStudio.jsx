import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, Copy, AlertTriangle, FileArchive, Upload, FileCode, Layers, Code2 } from 'lucide-react';
import { extractFormsFromZip } from '../utils/zipReader';

export default function FormInputStudio({ rawHtml, setRawHtml, parsedForm, dbName, setDbName, onGenerate, onChangeDatabase }) {
  const [inputMode, setInputMode] = useState('zip'); // 'zip' | 'paste'
  const [copied, setCopied] = useState(false);
  const [validationError, setValidationError] = useState(null);
  
  const [isReadingZip, setIsReadingZip] = useState(false);
  const [extractedForms, setExtractedForms] = useState([]);
  const [zipFileName, setZipFileName] = useState(null);
  const [selectedFormId, setSelectedFormId] = useState(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.zip')) {
      setValidationError('Please upload a valid .zip file containing HTML files.');
      return;
    }

    setIsReadingZip(true);
    setValidationError(null);
    setZipFileName(file.name);

    try {
      const forms = await extractFormsFromZip(file);
      setIsReadingZip(false);

      if (forms.length === 0) {
        setValidationError(`No <form> tags were found in any .html files inside ${file.name}.`);
        setExtractedForms([]);
      } else {
        setExtractedForms(forms);
        // Automatically select first detected form
        const firstForm = forms[0];
        setSelectedFormId(firstForm.id);
        setRawHtml(firstForm.rawHtml);
      }
    } catch (err) {
      console.error('Error unzipping file:', err);
      setIsReadingZip(false);
      setValidationError('Failed to read ZIP file: ' + err.message);
    }
  };

  const handleSelectExtractedForm = (formItem) => {
    setSelectedFormId(formItem.id);
    setRawHtml(formItem.rawHtml);
    if (validationError) setValidationError(null);
  };

  const handleAnalyzeAndProceed = () => {
    if (!parsedForm.success) {
      setValidationError(parsedForm.error);
    } else {
      setValidationError(null);
      onGenerate(extractedForms && extractedForms.length > 0 ? extractedForms : null);
    }
  };

  return (
    <div className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 py-8 overflow-hidden bg-slate-100/40 dark:bg-slate-950">
      
      {/* Background Soft Glow */}
      <div className="absolute top-1/4 left-1/4 w-[450px] h-[450px] bg-white/80 dark:bg-slate-800/30 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-100/50 dark:bg-indigo-950/20 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="w-full max-w-3xl mx-auto space-y-6 text-center z-10">
        
        {/* Step Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
              Step 2: HTML Form Extraction & Database Prompt
            </span>
            {onChangeDatabase && (
              <button
                onClick={onChangeDatabase}
                className="text-xs font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
              >
                ← Change Database
              </button>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-widest uppercase">
            {inputMode === 'zip' ? 'UPLOAD YOUR PROJECT ZIP ARCHIVE' : 'PASTE YOUR FORM CODE HERE'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto font-medium">
            Upload a ZIP archive to automatically extract all HTML form tags, or paste raw HTML code directly.
          </p>
        </div>

        {/* INPUT MODE TOGGLE BUTTONS */}
        <div className="inline-flex p-1 bg-slate-200/80 dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-inner">
          <button
            onClick={() => setInputMode('zip')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              inputMode === 'zip'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileArchive className="h-4 w-4" />
            <span>Upload Website ZIP Archive</span>
          </button>

          <button
            onClick={() => setInputMode('paste')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              inputMode === 'paste'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Code2 className="h-4 w-4" />
            <span>Paste Raw HTML Snippet</span>
          </button>
        </div>

        {/* GLASSMORPHISM CARD CONTAINER */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/90 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-left transition-all">
          
          {/* DATABASE INFO BANNER */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-950 dark:text-indigo-200 flex items-center space-x-1">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Target Database</span>
              </span>
              <h4 className="text-sm font-bold font-mono text-indigo-700 dark:text-indigo-300">
                mongodb://localhost:27017/{dbName || 'user_db'}
              </h4>
            </div>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-950 px-2.5 py-1 rounded-full">
              ✓ Ready for Wiring
            </span>
          </div>

          {/* MODE 1: ZIP UPLOADER & EXTRACTED FORMS INSPECTOR */}
          {inputMode === 'zip' && (
            <div className="space-y-6">
              
              {/* Dropzone File Upload Input */}
              <div className="relative group border-2 border-dashed border-indigo-300 dark:border-indigo-800 rounded-3xl p-8 text-center bg-indigo-50/30 dark:bg-indigo-950/10 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30 hover:border-indigo-500 transition-all cursor-pointer">
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
                
                <div className="space-y-3 pointer-events-none">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                    {isReadingZip ? (
                      <Upload className="h-7 w-7 animate-bounce" />
                    ) : (
                      <FileArchive className="h-7 w-7" />
                    )}
                  </div>

                  <div>
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {zipFileName ? `Uploaded: ${zipFileName}` : 'Click or Drag & Drop Project ZIP File'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Upload your website's .zip file. We automatically inspect all .html files for form tags!
                    </p>
                  </div>

                  {zipFileName && (
                    <span className="inline-block text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950 px-3 py-1 rounded-full">
                      ✓ ZIP Loaded & Parsed
                    </span>
                  )}
                </div>
              </div>

              {/* LIST OF DETECTED FORM TAGS */}
              {extractedForms.length > 0 && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-2">
                      <Layers className="h-4 w-4 text-indigo-600" />
                      <span>Detected Form Tags ({extractedForms.length} Found)</span>
                    </h4>
                    <span className="text-xs text-slate-400">Select a form tag below to wire</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[340px] overflow-y-auto pr-1">
                    {extractedForms.map(formItem => {
                      const isSelected = formItem.id === selectedFormId;
                      return (
                        <div
                          key={formItem.id}
                          onClick={() => handleSelectExtractedForm(formItem)}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg scale-[1.01]'
                              : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:border-indigo-400'
                          }`}
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-white/20 dark:border-slate-800">
                            <div className="flex items-center space-x-2">
                              <FileCode className="h-4 w-4" />
                              <span className="text-xs font-mono font-bold">{formItem.filename}</span>
                            </div>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'}`}>
                              &lt;form id="{formItem.formId}"&gt;
                            </span>
                          </div>

                          <div className="mt-3 space-y-1">
                            <p className={`text-xs ${isSelected ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                              Inputs Detected: <strong className="font-bold">{formItem.fieldCount} fields</strong>
                            </p>
                            <div className="flex flex-wrap gap-1 pt-1">
                              {formItem.parsed.fields && formItem.parsed.fields.slice(0, 4).map(f => (
                                <span
                                  key={f.name}
                                  className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                                    isSelected
                                      ? 'bg-white/20 text-white'
                                      : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  {f.name}
                                </span>
                              ))}
                              {formItem.parsed.fields && formItem.parsed.fields.length > 4 && (
                                <span className="text-[10px] font-mono opacity-80">+ more</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* MODE 2: RAW HTML CODE TEXTAREA PASTE */}
          {inputMode === 'paste' && (
            <div className="bg-white/70 dark:bg-slate-950/70 backdrop-blur-md rounded-2xl p-4 border border-white/80 dark:border-slate-800/80 shadow-inner space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  HTML Form Code Snippet
                </label>
                <button
                  onClick={handleCopy}
                  className="text-xs font-mono text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  {copied ? '✓ Copied' : 'Copy Code'}
                </button>
              </div>
              <textarea
                value={rawHtml}
                onChange={(e) => {
                  setRawHtml(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                rows={7}
                spellCheck={false}
                className="w-full bg-transparent text-slate-800 dark:text-indigo-200 font-mono text-xs sm:text-sm outline-none resize-none leading-relaxed placeholder:text-slate-400 focus:ring-0"
                placeholder="Paste your form input here... (e.g. <form id='userForm'> ... </form>)"
              />
            </div>
          )}

          {/* Validation Alert */}
          {validationError && (
            <div className="p-4 rounded-2xl bg-rose-50/90 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-start space-x-3 backdrop-blur-md animate-fadeIn">
              <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-rose-900 dark:text-rose-100">HTML Parsing Notice</span>
                <p className="mt-0.5 text-rose-700 dark:text-rose-300 font-mono">{validationError}</p>
              </div>
            </div>
          )}

          {/* ACTION BUTTON TO PROCEED TO WIRING */}
          <div className="flex items-center justify-end pt-2">
            <button
              onClick={handleAnalyzeAndProceed}
              disabled={!parsedForm.success}
              className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-xl flex items-center space-x-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="h-4 w-4 fill-white" />
              <span>Proceed to 2D Node Canvas Wiring</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
