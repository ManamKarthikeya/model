import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Move, ZoomIn, ZoomOut, Check, Edit2, Lock, Layers, Sparkles } from 'lucide-react';

export default function VisualNodeCanvas2D({
  parsedForm,
  extractedFormsList = null,
  dbName = 'user_db',
  tableName = 'users',
  setTableName,
  onProceedToTest,
  onBackToInput
}) {
  // Determine list of all forms to render simultaneously
  const formsList = (extractedFormsList && extractedFormsList.length > 0)
    ? extractedFormsList
    : [{ id: 'single', filename: 'form.html', formId: parsedForm.formId, parsed: parsedForm }];

  // Helper to generate unique key per field across forms
  const getFieldKey = (formItem, fieldName) => {
    const prefix = formItem.id || formItem.formId || 'form';
    return `${prefix}___${fieldName}`;
  };

  // State maps keyed by fieldKey
  const [columnNames, setColumnNames] = useState(() => {
    const init = {};
    formsList.forEach(formItem => {
      const fList = formItem.parsed ? formItem.parsed.fields : formItem.fields || [];
      fList.forEach(f => {
        init[getFieldKey(formItem, f.name)] = f.name;
      });
    });
    return init;
  });

  const [submitPayloadFields, setSubmitPayloadFields] = useState(() => {
    const init = {};
    formsList.forEach(formItem => {
      const fList = formItem.parsed ? formItem.parsed.fields : formItem.fields || [];
      fList.forEach(f => {
        init[getFieldKey(formItem, f.name)] = false;
      });
    });
    return init;
  });

  const [fieldConnections, setFieldConnections] = useState(() => {
    const init = {};
    formsList.forEach(formItem => {
      const fList = formItem.parsed ? formItem.parsed.fields : formItem.fields || [];
      fList.forEach(f => {
        init[getFieldKey(formItem, f.name)] = false;
      });
    });
    return init;
  });

  // Track submit button connections per form: { [formKey]: boolean }
  const [submitConnectedMap, setSubmitConnectedMap] = useState(() => {
    const init = {};
    formsList.forEach(formItem => {
      const key = formItem.id || formItem.formId;
      init[key] = false;
    });
    return init;
  });

  // Individual node box drag positions: { [nodeKey]: { x, y } }
  const [nodePositions, setNodePositions] = useState(() => {
    const init = {};
    formsList.forEach((formItem, idx) => {
      const key = formItem.id || formItem.formId || `form_${idx}`;
      init[`blue_${key}`] = { x: 0, y: idx * 460 };
      init[`green_${key}`] = { x: 560, y: idx * 460 };
    });
    return init;
  });

  const [draggingNodeKey, setDraggingNodeKey] = useState(null);
  const dragStartRef = useRef({ startX: 0, startY: 0, initX: 0, initY: 0 });

  const [editingFieldKey, setEditingFieldKey] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  // Zoom scale state
  const [zoomScale, setZoomScale] = useState(1.0);

  // Canvas Viewport Pan Position (x, y) - Scroll Wheel / Middle Click / Background Pan Drag
  const [panPos, setPanPos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ startX: 0, startY: 0, initX: 0, initY: 0 });

  // Active wire dragging state
  const [activeWire, setActiveWire] = useState(null);
  const wrapperRef = useRef(null);

  // SVG wire paths
  const [wirePaths, setWirePaths] = useState({});
  const [inputToSubmitPaths, setInputToSubmitPaths] = useState({});
  const [submitWirePaths, setSubmitWirePaths] = useState({});

  // Flattened active & connected fields across all forms
  const allActiveFields = [];
  formsList.forEach(formItem => {
    const fList = formItem.parsed ? formItem.parsed.fields : formItem.fields || [];
    fList.forEach(f => {
      const key = getFieldKey(formItem, f.name);
      if (submitPayloadFields[key]) {
        allActiveFields.push({
          key,
          fieldName: f.name,
          formItem,
          field: f
        });
      }
    });
  });

  const allConnectedFields = allActiveFields.filter(item => fieldConnections[item.key]);
  const connectedColumnNames = allConnectedFields.map(item => columnNames[item.key] || item.fieldName);

  const isAnyFormWired = allConnectedFields.length > 0 && Object.values(submitConnectedMap).some(Boolean);

  // Track table names per form: { [formKey]: string }
  const [formTableNames, setFormTableNames] = useState(() => {
    const init = {};
    formsList.forEach(formItem => {
      const key = formItem.id || formItem.formId;
      const fObj = formItem.parsed || formItem;
      init[key] = (fObj.collectionName || tableName || 'users').toLowerCase();
    });
    return init;
  });

  const handleProceedClick = () => {
    const wiredFormsList = formsList.map(formItem => {
      const formKey = formItem.id || formItem.formId;
      const fObj = formItem.parsed || formItem;
      const fList = fObj.fields || [];

      const formWiredFields = [];
      const formCustomColNames = {};

      fList.forEach(f => {
        const key = getFieldKey(formItem, f.name);
        if (submitPayloadFields[key] && fieldConnections[key]) {
          formWiredFields.push(f);
          formCustomColNames[f.name] = columnNames[key] || f.name;
        }
      });

      const activeFieldsForThisForm = formWiredFields.length > 0 ? formWiredFields : fList;
      const currentTableName = (formTableNames[formKey] || fObj.collectionName || tableName || 'users').toLowerCase();

      return {
        id: formKey,
        filename: formItem.filename || `${fObj.formId || 'form'}.html`,
        formId: fObj.formId || 'userForm',
        collectionName: currentTableName,
        tableName: currentTableName,
        submitText: fObj.submitText || 'Submit',
        fields: activeFieldsForThisForm,
        customColumnNames: formCustomColNames
      };
    });

    const wiredFieldsList = [];
    const customNamesMap = {};

    formsList.forEach(formItem => {
      const fList = formItem.parsed ? formItem.parsed.fields : formItem.fields || [];
      fList.forEach(f => {
        const key = getFieldKey(formItem, f.name);
        if (submitPayloadFields[key] && fieldConnections[key]) {
          wiredFieldsList.push(f);
          customNamesMap[f.name] = columnNames[key] || f.name;
        }
      });
    });

    onProceedToTest(wiredFormsList, wiredFieldsList.length > 0 ? wiredFieldsList : (parsedForm.fields || []), customNamesMap);
  };

  const handleStartEditing = (key, currentVal) => {
    setEditingFieldKey(key);
    setEditingValue(columnNames[key] || currentVal);
  };

  const handleSaveEditing = (key) => {
    if (editingValue.trim()) {
      setColumnNames(prev => ({
        ...prev,
        [key]: editingValue.trim().replace(/\s+/g, '_')
      }));
    }
    setEditingFieldKey(null);
  };

  const toggleInputToSubmit = (key) => {
    setSubmitPayloadFields(prev => {
      const isLinked = prev[key];
      if (isLinked) {
        setFieldConnections(fPrev => ({ ...fPrev, [key]: false }));
      }
      return { ...prev, [key]: !isLinked };
    });
  };

  const toggleSubmitConnected = (formKey) => {
    setSubmitConnectedMap(prev => ({ ...prev, [formKey]: !prev[formKey] }));
  };

  // Re-calculate SVG wire coordinates for all visible input boxes across all forms
  const updateWireCoordinates = () => {
    if (!wrapperRef.current) return;
    const wrapperRect = wrapperRef.current.getBoundingClientRect();

    const newWirePaths = {};
    const newSubmitInputPaths = {};
    const newSubmitWirePaths = {};

    formsList.forEach(formItem => {
      const formKey = formItem.id || formItem.formId;
      const fList = formItem.parsed ? formItem.parsed.fields : formItem.fields || [];

      fList.forEach(field => {
        const key = getFieldKey(formItem, field.name);

        // Right Input -> Output wires
        if (submitPayloadFields[key] && fieldConnections[key]) {
          const inEl = document.getElementById(`input-dot-${key}`);
          const outEl = document.getElementById(`output-dot-${key}`);

          if (inEl && outEl) {
            const inRect = inEl.getBoundingClientRect();
            const outRect = outEl.getBoundingClientRect();

            newWirePaths[key] = {
              x1: (inRect.left + inRect.width / 2 - wrapperRect.left) / zoomScale,
              y1: (inRect.top + inRect.height / 2 - wrapperRect.top) / zoomScale,
              x2: (outRect.left + outRect.width / 2 - wrapperRect.left) / zoomScale,
              y2: (outRect.top + outRect.height / 2 - wrapperRect.top) / zoomScale
            };
          }
        }

        // Left Input -> Submit Button wires
        if (submitPayloadFields[key]) {
          const leftInEl = document.getElementById(`input-left-dot-${key}`);
          const subLeftEl = document.getElementById(`submit-left-dot-${formKey}`);

          if (leftInEl && subLeftEl) {
            const inRect = leftInEl.getBoundingClientRect();
            const subRect = subLeftEl.getBoundingClientRect();

            newSubmitInputPaths[key] = {
              x1: (inRect.left + inRect.width / 2 - wrapperRect.left) / zoomScale,
              y1: (inRect.top + inRect.height / 2 - wrapperRect.top) / zoomScale,
              x2: (subRect.left + subRect.width / 2 - wrapperRect.left) / zoomScale,
              y2: (subRect.top + subRect.height / 2 - wrapperRect.top) / zoomScale
            };
          }
        }
      });

      // Submit Button right -> Table Trigger wires
      if (submitConnectedMap[formKey]) {
        const subEl = document.getElementById(`submit-dot-${formKey}`);
        const trigEl = document.getElementById(`table-trigger-dot-${formKey}`);

        if (subEl && trigEl) {
          const subRect = subEl.getBoundingClientRect();
          const trigRect = trigEl.getBoundingClientRect();

          newSubmitWirePaths[formKey] = {
            x1: (subRect.left + subRect.width / 2 - wrapperRect.left) / zoomScale,
            y1: (subRect.top + subRect.height / 2 - wrapperRect.top) / zoomScale,
            x2: (trigRect.left + trigRect.width / 2 - wrapperRect.left) / zoomScale,
            y2: (trigRect.top + trigRect.height / 2 - wrapperRect.top) / zoomScale
          };
        }
      }
    });

    setWirePaths(newWirePaths);
    setInputToSubmitPaths(newSubmitInputPaths);
    setSubmitWirePaths(newSubmitWirePaths);
  };

  useEffect(() => {
    updateWireCoordinates();
    const timer = setTimeout(updateWireCoordinates, 40);
    window.addEventListener('resize', updateWireCoordinates);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateWireCoordinates);
    };
  }, [fieldConnections, submitConnectedMap, submitPayloadFields, nodePositions, zoomScale, columnNames]);

  // Zoom controls
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoomScale(prev => Math.min(Math.max(prev * zoomFactor, 0.3), 2.5));
  };

  const handleZoomIn = () => setZoomScale(prev => Math.min(prev + 0.15, 2.5));
  const handleZoomOut = () => setZoomScale(prev => Math.max(prev - 0.15, 0.3));
  const handleResetZoom = () => {
    setZoomScale(1.0);
    setPanPos({ x: 0, y: 0 });
  };

  const handleCanvasMouseDown = (e) => {
    // Only middle mouse click (scroll wheel press, button 1) starts panning
    if (e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initX: panPos.x,
        initY: panPos.y
      };
    }
  };

  // Dragging individual node card
  const handleNodeHeaderMouseDown = (e, nodeKey) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingNodeKey(nodeKey);

    const pos = nodePositions[nodeKey] || { x: 0, y: 0 };
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: pos.x,
      initY: pos.y
    };
  };

  // Dragging active wire dot
  const handleDotMouseDown = (e, key) => {
    e.stopPropagation();
    e.preventDefault();
    if (!submitPayloadFields[key] || !wrapperRef.current) return;

    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const dotEl = document.getElementById(`input-dot-${key}`);
    const dotRect = dotEl ? dotEl.getBoundingClientRect() : e.target.getBoundingClientRect();

    const startX = (dotRect.left + dotRect.width / 2 - wrapperRect.left) / zoomScale;
    const startY = (dotRect.top + dotRect.height / 2 - wrapperRect.top) / zoomScale;

    setActiveWire({ fromKey: key, startX, startY, currentX: startX, currentY: startY });
  };

  const handleLeftDotMouseDown = (e, key) => {
    e.stopPropagation();
    e.preventDefault();
    if (!wrapperRef.current) return;

    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const dotEl = document.getElementById(`input-left-dot-${key}`);
    const dotRect = dotEl ? dotEl.getBoundingClientRect() : e.target.getBoundingClientRect();

    const startX = (dotRect.left + dotRect.width / 2 - wrapperRect.left) / zoomScale;
    const startY = (dotRect.top + dotRect.height / 2 - wrapperRect.top) / zoomScale;

    setActiveWire({ fromLeftKey: key, startX, startY, currentX: startX, currentY: startY });
  };

  const handleSubmitDotMouseDown = (e, formKey) => {
    e.stopPropagation();
    e.preventDefault();
    if (!wrapperRef.current) return;

    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const dotEl = document.getElementById(`submit-dot-${formKey}`);
    const dotRect = dotEl ? dotEl.getBoundingClientRect() : e.target.getBoundingClientRect();

    const startX = (dotRect.left + dotRect.width / 2 - wrapperRect.left) / zoomScale;
    const startY = (dotRect.top + dotRect.height / 2 - wrapperRect.top) / zoomScale;

    setActiveWire({ isSubmit: true, formKey, startX, startY, currentX: startX, currentY: startY });
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      const dx = e.clientX - panStartRef.current.startX;
      const dy = e.clientY - panStartRef.current.startY;
      setPanPos({
        x: panStartRef.current.initX + dx,
        y: panStartRef.current.initY + dy
      });
      updateWireCoordinates();
    } else if (activeWire && wrapperRef.current) {
      const wrapperRect = wrapperRef.current.getBoundingClientRect();
      setActiveWire(prev => ({
        ...prev,
        currentX: (e.clientX - wrapperRect.left) / zoomScale,
        currentY: (e.clientY - wrapperRect.top) / zoomScale
      }));
    } else if (draggingNodeKey) {
      const dx = (e.clientX - dragStartRef.current.startX) / zoomScale;
      const dy = (e.clientY - dragStartRef.current.startY) / zoomScale;

      setNodePositions(prev => ({
        ...prev,
        [draggingNodeKey]: {
          x: dragStartRef.current.initX + dx,
          y: dragStartRef.current.initY + dy
        }
      }));
      updateWireCoordinates();
    }
  };

  const handleMouseUp = () => {
    if (isPanning) setIsPanning(false);
    if (activeWire) setActiveWire(null);
    if (draggingNodeKey) setDraggingNodeKey(null);
  };

  const handleDropOnOutput = (key) => {
    if (activeWire && submitPayloadFields[key] && activeWire.fromKey === key) {
      setFieldConnections(prev => ({ ...prev, [key]: true }));
      setActiveWire(null);
    }
  };

  const handleDropOnSubmitLeft = (formKey) => {
    if (activeWire && activeWire.fromLeftKey) {
      setSubmitPayloadFields(prev => ({ ...prev, [activeWire.fromLeftKey]: true }));
      setActiveWire(null);
    }
  };

  const handleDropOnTableTrigger = (formKey) => {
    if (activeWire && activeWire.isSubmit) {
      setSubmitConnectedMap(prev => ({ ...prev, [formKey]: true }));
      setActiveWire(null);
    }
  };

  // Count total fields across all forms
  const totalFieldsCount = formsList.reduce((acc, fItem) => {
    const fList = fItem.parsed ? fItem.parsed.fields : fItem.fields || [];
    return acc + fList.length;
  }, 0);

  return (
    <div
      onWheel={handleWheel}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`fixed inset-0 w-screen h-screen bg-slate-100/60 dark:bg-slate-950 flex flex-col justify-between p-6 select-none overflow-hidden z-30 ${
        isPanning ? 'cursor-grabbing' : ''
      }`}
    >
      
      {/* Top Corners Action Bar */}
      <div className="flex items-center justify-between w-full z-40">
        <button
          onClick={onBackToInput}
          className="px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200/90 dark:hover:bg-slate-800 bg-white/95 dark:bg-slate-900/95 border border-slate-300/80 dark:border-slate-800 shadow-lg backdrop-blur-md transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          ← Back to Input
        </button>

        {/* Multi-Form Header Status Pill */}
        <div className="hidden md:flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-4 py-2 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md backdrop-blur-md text-xs font-mono">
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">MongoDB DB: db.{dbName}</span>
            <span className="text-slate-400">•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              {formsList.length} Independent Form Nodes ({totalFieldsCount} Input Boxes)
            </span>
          </div>
        </div>

        <button
          onClick={handleProceedClick}
          className={`flex items-center space-x-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white shadow-xl transition-all ${
            isAnyFormWired
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-slate-800 hover:bg-slate-700'
          }`}
        >
          <span>Proceed to Step 3: Storage Verification Test</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Floating Zoom Toolbar */}
      <div className="fixed bottom-6 right-6 z-40 bg-white/95 dark:bg-slate-900/95 border border-slate-300 dark:border-slate-800 rounded-2xl p-1.5 shadow-2xl backdrop-blur-md flex items-center space-x-1 font-mono text-xs text-slate-700 dark:text-slate-200">
        <button onClick={handleZoomOut} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800" title="Zoom Out">
          <ZoomOut className="h-4 w-4" />
        </button>
        <button onClick={handleResetZoom} className="px-2.5 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-bold" title="Reset Zoom & Pan (0, 0)">
          {Math.round(zoomScale * 100)}% • Reset View
        </button>
        <button onClick={handleZoomIn} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800" title="Zoom In">
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>

      {/* INFINITE 2D CANVAS WORKSPACE (NO SCROLLBARS) */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
        
        {/* Transform Wrapper */}
        <div
          ref={wrapperRef}
          style={{
            transform: `translate(${panPos.x}px, ${panPos.y}px) scale(${zoomScale})`,
            transformOrigin: 'center center',
            transition: isPanning || draggingNodeKey || activeWire ? 'none' : 'transform 0.05s ease-out'
          }}
          className="relative w-full max-w-7xl h-full min-h-[600px] overflow-visible"
        >
          
          {/* SVG WIRE LAYER */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
            
            {/* Active Dragging Wire */}
            {activeWire && (
              <path
                d={`M ${activeWire.startX} ${activeWire.startY} C ${activeWire.startX + (activeWire.fromLeftKey ? -60 : 140)} ${activeWire.startY}, ${activeWire.currentX - (activeWire.fromLeftKey ? -60 : 140)} ${activeWire.currentY}, ${activeWire.currentX} ${activeWire.currentY}`}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="4"
                strokeDasharray="6 6"
                className="animate-pulse"
              />
            )}

            {/* Left Input -> Submit Button Wires */}
            {Object.entries(inputToSubmitPaths).map(([key, coords]) => (
              <g key={`sub-${key}`}>
                <path
                  d={`M ${coords.x1} ${coords.y1} C ${coords.x1 - 80} ${coords.y1}, ${coords.x2 - 80} ${coords.y2}, ${coords.x2} ${coords.y2}`}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="6"
                  opacity="0.25"
                />
                <path
                  d={`M ${coords.x1} ${coords.y1} C ${coords.x1 - 80} ${coords.y1}, ${coords.x2 - 80} ${coords.y2}, ${coords.x2} ${coords.y2}`}
                  fill="none"
                  stroke="#818cf8"
                  strokeWidth="3"
                  strokeDasharray="4 4"
                />
              </g>
            ))}

            {/* Right Input -> Output Wires */}
            {Object.entries(wirePaths).map(([key, coords]) => (
              <g key={key}>
                <path
                  d={`M ${coords.x1} ${coords.y1} C ${coords.x1 + 160} ${coords.y1}, ${coords.x2 - 160} ${coords.y2}, ${coords.x2} ${coords.y2}`}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="8"
                  opacity="0.2"
                />
                <path
                  d={`M ${coords.x1} ${coords.y1} C ${coords.x1 + 160} ${coords.y1}, ${coords.x2 - 160} ${coords.y2}, ${coords.x2} ${coords.y2}`}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </g>
            ))}

            {/* Submit Button -> Table Trigger Wires */}
            {Object.entries(submitWirePaths).map(([fKey, coords]) => (
              <g key={`sub-trig-${fKey}`}>
                <path
                  d={`M ${coords.x1} ${coords.y1} C ${coords.x1 + 160} ${coords.y1}, ${coords.x2 - 160} ${coords.y2}, ${coords.x2} ${coords.y2}`}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="8"
                  opacity="0.25"
                />
                <path
                  d={`M ${coords.x1} ${coords.y1} C ${coords.x1 + 160} ${coords.y1}, ${coords.x2 - 160} ${coords.y2}, ${coords.x2} ${coords.y2}`}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="4"
                  strokeDasharray="8 4"
                  className="animate-pulse"
                />
              </g>
            ))}

          </svg>

          {/* INDIVIDUAL ABSOLUTE NODE CARDS (NO CONTAINING SCROLLBARS) */}
          <div className="relative z-10 w-full h-full">
            
            {/* RENDER INDIVIDUAL BLUE INPUT BOX NODES */}
            {formsList.map((formItem, formIdx) => {
              const formKey = formItem.id || formItem.formId || `form_${formIdx}`;
              const nodeKey = `blue_${formKey}`;
              const pos = nodePositions[nodeKey] || { x: 0, y: formIdx * 460 };
              const fObj = formItem.parsed || formItem;
              const fList = fObj.fields || [];

              return (
                <div
                  key={nodeKey}
                  style={{
                    position: 'absolute',
                    left: `${pos.x}px`,
                    top: `${pos.y}px`,
                    width: '460px'
                  }}
                  className={`bg-blue-50/40 dark:bg-blue-950/30 backdrop-blur-xl border-2 border-blue-500/80 dark:border-blue-500/60 rounded-3xl p-6 shadow-2xl shadow-blue-500/10 space-y-5 transition-shadow z-10 ${
                    draggingNodeKey === nodeKey ? 'ring-4 ring-blue-400/50 cursor-grabbing shadow-blue-500/40' : ''
                  }`}
                >
                  {/* Header (Individual Drag Handle) */}
                  <div
                    onMouseDown={(e) => handleNodeHeaderMouseDown(e, nodeKey)}
                    className="flex items-center justify-between pb-3 border-b border-blue-200/60 dark:border-blue-900/60 cursor-grab active:cursor-grabbing"
                    title="Click and drag to move node box anywhere on canvas"
                  >
                    <div className="flex items-center space-x-2">
                      <Move className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <div>
                        <h3 className="font-black text-blue-950 dark:text-blue-100 text-sm uppercase tracking-wider">
                          INPUT TAGS: {formItem.filename ? formItem.filename.toUpperCase() : `FORM ${formIdx + 1}`}
                        </h3>
                        <span className="text-[11px] font-mono text-blue-600/70 dark:text-blue-300/70">
                          Form ID: #{fObj.formId} ({fList.length} Input Boxes)
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-blue-600 text-white shadow-md">
                      BLUE = {fList.length} INPUTS
                    </span>
                  </div>

                  {/* Input Items inside this standalone Blue Node Card */}
                  <div className="space-y-3">
                    {fList.map((field) => {
                      const key = getFieldKey(formItem, field.name);
                      const isConnected = fieldConnections[key];
                      const isSubmitLinked = submitPayloadFields[key];

                      return (
                        <div
                          key={key}
                          className={`p-3.5 rounded-2xl border text-xs font-mono transition-all flex items-center justify-between backdrop-blur-md ${
                            isSubmitLinked
                              ? isConnected
                                ? 'bg-blue-500/15 dark:bg-blue-900/40 border-blue-500 shadow-md scale-[1.01]'
                                : 'bg-white/70 dark:bg-slate-900/70 border-blue-300 dark:border-blue-800'
                              : 'bg-slate-100/40 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800 opacity-60'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              id={`input-left-dot-${key}`}
                              onMouseDown={(e) => handleLeftDotMouseDown(e, key)}
                              onClick={() => toggleInputToSubmit(key)}
                              className={`w-5 h-5 rounded-full border-2 cursor-crosshair transition-all flex items-center justify-center ${
                                isSubmitLinked
                                  ? 'bg-indigo-600 border-white shadow-md ring-4 ring-indigo-300 dark:ring-indigo-900'
                                  : 'bg-slate-300 dark:bg-slate-700 border-white hover:scale-125 hover:bg-indigo-500'
                              }`}
                              title="Left Dot: Connect to Submit Button"
                            >
                              {isSubmitLinked ? (
                                <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                              )}
                            </div>

                            <div>
                              <span className="font-bold text-blue-950 dark:text-blue-100 block text-sm">{field.name}</span>
                              <span className="text-[10px] text-blue-600/70 dark:text-blue-300/70">{field.placeholder}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                              {field.type}
                            </span>

                            {isSubmitLinked ? (
                              <div
                                id={`input-dot-${key}`}
                                onMouseDown={(e) => handleDotMouseDown(e, key)}
                                onClick={() => setFieldConnections(prev => ({ ...prev, [key]: !prev[key] }))}
                                className={`w-5 h-5 rounded-full border-2 cursor-crosshair transition-all flex items-center justify-center ${
                                  isConnected
                                    ? 'bg-blue-600 border-white shadow-lg ring-4 ring-blue-300 dark:ring-blue-900'
                                    : 'bg-slate-300 dark:bg-slate-700 border-white hover:scale-125 hover:bg-blue-500'
                                }`}
                                title="Right Dot: Drag to connect to Output Column"
                              >
                                {isConnected ? (
                                  <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                                ) : (
                                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                )}
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 cursor-not-allowed flex items-center justify-center">
                                <Lock className="h-2.5 w-2.5 text-slate-400" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Submit Button Action */}
                  <div className="pt-2 border-t border-blue-200/60 dark:border-blue-900/60">
                    <div
                      onMouseUp={() => handleDropOnSubmitLeft(formKey)}
                      className={`p-4 rounded-2xl border text-xs font-mono transition-all flex items-center justify-between ${
                        submitConnectedMap[formKey]
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg border-blue-400'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          id={`submit-left-dot-${formKey}`}
                          className="w-5 h-5 rounded-full border-2 bg-indigo-400 border-white ring-4 ring-indigo-400/30 flex items-center justify-center cursor-pointer"
                        >
                          <div className="w-2 h-2 rounded-full bg-indigo-900 animate-pulse" />
                        </div>

                        <div>
                          <span className="font-bold block text-sm">Submit Button Action ({fObj.formId})</span>
                          <span className="text-[10px] opacity-80">&lt;button type="submit"&gt;{fObj.submitText || 'Submit'}&lt;/button&gt;</span>
                        </div>
                      </div>

                      <div
                        id={`submit-dot-${formKey}`}
                        onMouseDown={(e) => handleSubmitDotMouseDown(e, formKey)}
                        onClick={() => toggleSubmitConnected(formKey)}
                        className={`w-5 h-5 rounded-full border-2 cursor-crosshair transition-all flex items-center justify-center ${
                          submitConnectedMap[formKey] ? 'bg-white border-blue-600 shadow-md ring-4 ring-white/40' : 'bg-slate-400 border-white hover:scale-125'
                        }`}
                      >
                        {submitConnectedMap[formKey] ? (
                          <div className="w-2 h-2 rounded-full bg-blue-600" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}

            {/* RENDER INDIVIDUAL GREEN OUTPUT DB BOX NODES */}
            {formsList.map((formItem, formIdx) => {
              const formKey = formItem.id || formItem.formId || `form_${formIdx}`;
              const nodeKey = `green_${formKey}`;
              const pos = nodePositions[nodeKey] || { x: 560, y: formIdx * 460 };
              const fObj = formItem.parsed || formItem;
              const fList = fObj.fields || [];

              const formActiveFields = fList.filter(f => submitPayloadFields[getFieldKey(formItem, f.name)]);
              const formConnectedFields = formActiveFields.filter(f => fieldConnections[getFieldKey(formItem, f.name)]);
              const formColNames = formConnectedFields.map(f => columnNames[getFieldKey(formItem, f.name)] || f.name);

              const formTableName = (formTableNames[formKey] || fObj.collectionName || tableName || 'users').toLowerCase();

              return (
                <div
                  key={nodeKey}
                  style={{
                    position: 'absolute',
                    left: `${pos.x}px`,
                    top: `${pos.y}px`,
                    width: '460px'
                  }}
                  className={`bg-emerald-50/40 dark:bg-emerald-950/30 backdrop-blur-xl border-2 border-emerald-500/80 dark:border-emerald-500/60 rounded-3xl p-6 shadow-2xl shadow-emerald-500/10 space-y-6 transition-shadow z-10 ${
                    draggingNodeKey === nodeKey ? 'ring-4 ring-emerald-400/50 cursor-grabbing shadow-emerald-500/40' : ''
                  }`}
                >
                  {/* Header */}
                  <div className="space-y-3 pb-3 border-b border-emerald-200/60 dark:border-emerald-900/60">
                    <div
                      onMouseDown={(e) => handleNodeHeaderMouseDown(e, nodeKey)}
                      className="flex items-center justify-between cursor-grab active:cursor-grabbing"
                      title="Click and drag to move output node box anywhere on canvas"
                    >
                      <div className="flex items-center space-x-2">
                        <Move className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <h3 className="font-black text-emerald-950 dark:text-emerald-100 text-sm uppercase tracking-wider">
                          OUTPUT DB: {formItem.filename ? formItem.filename.toUpperCase() : `FORM ${formIdx + 1}`}
                        </h3>
                      </div>

                      <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-emerald-600 text-white shadow-md">
                        GREEN = {formActiveFields.length} COLS
                      </span>
                    </div>

                    {/* Table Name */}
                    <div className="p-3 rounded-2xl bg-emerald-100/70 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-950 dark:text-emerald-200">
                          Specify MongoDB Table Name
                        </label>
                        <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                          ✓ Created in db.{dbName}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 rounded-xl px-3 py-1.5 border border-emerald-300 dark:border-emerald-800">
                        <span className="font-mono text-xs text-slate-400">db.{dbName}.</span>
                        <input
                          type="text"
                          value={formTableName}
                          onChange={(e) => {
                            const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                            setFormTableNames(prev => ({ ...prev, [formKey]: val }));
                            if (setTableName) setTableName(val);
                          }}
                          placeholder="users"
                          className="flex-1 bg-transparent text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 outline-none"
                        />
                      </div>
                    </div>

                    {formColNames.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-800 dark:text-emerald-300 animate-fadeIn">
                        <span className="font-bold">✓ Columns Created in db.{formTableName}: </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">[ {formColNames.join(', ')} ]</span>
                      </div>
                    )}
                  </div>

                  {/* Columns for this form */}
                  <div className="space-y-3.5">
                    {formActiveFields.length === 0 ? (
                      <div className="p-6 text-center text-xs font-mono text-slate-400 border border-dashed border-emerald-300 dark:border-emerald-800 rounded-2xl">
                        No inputs connected to Submit Button yet. Hold & drag left dots to Submit to generate output columns!
                      </div>
                    ) : (
                      formActiveFields.map((field) => {
                        const key = getFieldKey(formItem, field.name);
                        const isConnected = fieldConnections[key];
                        const displayName = columnNames[key] || field.name;
                        const isEditing = editingFieldKey === key;

                        return (
                          <div
                            key={key}
                            onMouseUp={() => handleDropOnOutput(key)}
                            onDoubleClick={() => handleStartEditing(key, field.name)}
                            className={`p-3.5 rounded-2xl border text-xs font-mono transition-all flex items-center justify-between backdrop-blur-md cursor-pointer group ${
                              isConnected
                                ? 'bg-emerald-500/15 dark:bg-emerald-900/40 border-emerald-500 shadow-md scale-[1.01]'
                                : 'bg-white/40 dark:bg-slate-900/40 border-slate-300 dark:border-slate-700 opacity-60'
                            }`}
                            title="Double-click to rename column"
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                id={`output-dot-${key}`}
                                className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${
                                  isConnected
                                    ? 'bg-emerald-600 border-white shadow-lg ring-4 ring-emerald-300 dark:ring-emerald-900'
                                    : 'bg-slate-300 dark:bg-slate-700 border-white hover:scale-125 hover:bg-emerald-500'
                                }`}
                              >
                                {isConnected ? (
                                  <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                                ) : (
                                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                )}
                              </div>

                              {isEditing ? (
                                <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="text"
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveEditing(key);
                                    }}
                                    onBlur={() => handleSaveEditing(key)}
                                    autoFocus
                                    className="px-2 py-1 rounded-lg border border-emerald-500 bg-white dark:bg-slate-900 text-emerald-950 dark:text-emerald-100 font-bold text-sm outline-none"
                                  />
                                  <button onClick={() => handleSaveEditing(key)} className="p-1 rounded bg-emerald-600 text-white">
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-emerald-950 dark:text-emerald-100 block text-sm">
                                    {displayName}
                                  </span>
                                  <Edit2 className="h-3 w-3 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              )}
                            </div>

                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              {field.dataType || 'String'}
                            </span>
                          </div>
                        );
                      })
                    )}

                    {/* Table Insert Trigger */}
                    <div
                      onMouseUp={() => handleDropOnTableTrigger(formKey)}
                      className={`p-3.5 rounded-2xl border text-xs font-mono transition-all flex items-center justify-between ${
                        submitConnectedMap[formKey]
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg border-emerald-400'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          id={`table-trigger-dot-${formKey}`}
                          className="w-5 h-5 rounded-full border-2 bg-emerald-400 border-white ring-4 ring-emerald-400/30 flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-emerald-900 animate-pulse" />
                        </div>

                        <div>
                          <span className="font-bold block text-xs">Table Insert Trigger: db.{formTableName}.insert()</span>
                          <span className="text-[10px] opacity-80">Form ID: &lt;form id="{fObj.formId}"&gt;</span>
                        </div>
                      </div>

                      <span className="text-[9px] font-mono uppercase bg-black/20 px-2 py-1 rounded font-bold">
                        POST /API/{formTableName.toUpperCase()}
                      </span>
                    </div>

                  </div>

                </div>
              );
            })}

          </div>

        </div>

      </div>

    </div>
  );
}
