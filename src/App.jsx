import React, { useState, useMemo, useEffect } from 'react';
import DatabaseManager from './components/DatabaseManager';
import FormInputStudio from './components/FormInputStudio';
import VisualNodeCanvas2D from './components/VisualNodeCanvas2D';
import LiveSimulator from './components/LiveSimulator';

import { validateAndParseHtmlForm } from './utils/htmlParser';
import { generateCodeFiles } from './utils/codeGenerators';
import { downloadProjectZip } from './utils/zipExporter';

const DEFAULT_HTML_FORM = `<form id="userForm">
  <input type="text" name="name" placeholder="Name" required />
  <input type="email" name="email" placeholder="Email" required />
  <input type="text" name="address" placeholder="Address" required />
  <button type="submit">Submit</button>
</form>`;

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('databases'); // 'databases' | 'studio' | 'visualizer' | 'simulator'
  
  const [databases, setDatabases] = useState(['user_db']);
  const [rawHtml, setRawHtml] = useState(DEFAULT_HTML_FORM);
  const [dbName, setDbName] = useState('user_db');
  const [tableName, setTableName] = useState('users');

  // Sync dark class to html document body
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Parse HTML form dynamically
  const parsedForm = useMemo(() => {
    const parsed = validateAndParseHtmlForm(rawHtml);
    if (parsed.collectionName && (!tableName || tableName === 'users')) {
      setTableName(parsed.collectionName);
    }
    return parsed;
  }, [rawHtml, tableName]);

  // Generate code bundle dynamically in background
  const codeFiles = useMemo(() => {
    const updatedForm = { ...parsedForm, collectionName: tableName || 'users' };
    return generateCodeFiles(updatedForm, 'nodejs-mongodb');
  }, [parsedForm, tableName]);

  const [activeWiredFields, setActiveWiredFields] = useState(null);
  const [customColumnNames, setCustomColumnNames] = useState({});

  const handleSelectDatabase = (selectedName) => {
    setDbName(selectedName);
    setActiveTab('studio');
  };

  const handleCreateDatabase = (newDbName) => {
    if (!databases.includes(newDbName)) {
      setDatabases(prev => [...prev, newDbName]);
    }
    setDbName(newDbName);
    setActiveTab('studio');
  };

  const [extractedFormsList, setExtractedFormsList] = useState(null);

  const handleProceedToWiring = (formsList) => {
    if (formsList && formsList.length > 0) {
      setExtractedFormsList(formsList);
    } else {
      setExtractedFormsList(null);
    }
    setActiveTab('visualizer');
  };

  const [wiredFormsList, setWiredFormsList] = useState([]);

  const handleProceedToStorageTest = (wiredForms, wiredFieldsList, columnNamesMap) => {
    if (wiredForms && wiredForms.length > 0) {
      setWiredFormsList(wiredForms);
    }
    if (wiredFieldsList && wiredFieldsList.length > 0) {
      setActiveWiredFields(wiredFieldsList);
    } else {
      setActiveWiredFields(parsedForm.fields);
    }
    if (columnNamesMap) {
      setCustomColumnNames(columnNamesMap);
    }
    setActiveTab('simulator');
  };

  const handleBackToInput = () => {
    setActiveTab('studio');
  };

  const handleDownloadAll = () => {
    downloadProjectZip(codeFiles, `${tableName || 'users'}-backend`);
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${
      isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Main Workspace Body */}
      <main className="min-h-screen flex flex-col justify-center py-6 sm:py-10">
        {activeTab === 'databases' && (
          <DatabaseManager
            databases={databases}
            dbName={dbName}
            setDbName={setDbName}
            onSelectDatabase={handleSelectDatabase}
            onCreateDatabase={handleCreateDatabase}
          />
        )}

        {activeTab === 'studio' && (
          <FormInputStudio
            rawHtml={rawHtml}
            setRawHtml={setRawHtml}
            parsedForm={parsedForm}
            dbName={dbName}
            setDbName={setDbName}
            onGenerate={handleProceedToWiring}
            onChangeDatabase={() => setActiveTab('databases')}
          />
        )}

        {activeTab === 'visualizer' && (
          <VisualNodeCanvas2D
            parsedForm={parsedForm}
            extractedFormsList={extractedFormsList}
            dbName={dbName}
            tableName={tableName}
            setTableName={setTableName}
            setRawHtml={setRawHtml}
            onProceedToTest={handleProceedToStorageTest}
            onBackToInput={handleBackToInput}
          />
        )}

        {activeTab === 'simulator' && (
          <LiveSimulator
            parsedForm={parsedForm}
            dbName={dbName}
            tableName={tableName}
            wiredFormsList={wiredFormsList}
            extractedFormsList={extractedFormsList}
            activeWiredFields={activeWiredFields}
            customColumnNames={customColumnNames}
            onBackToWiring={() => setActiveTab('visualizer')}
            codeFiles={codeFiles}
            onDownload={handleDownloadAll}
          />
        )}
      </main>

    </div>
  );
}
