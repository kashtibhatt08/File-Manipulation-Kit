import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import FileUploader from '../components/FileUploader';
import api from '../services/api';
import { 
  FolderArchive, FolderPlus, FolderOpen, 
  ArrowRight, Download, RefreshCw, AlertCircle
} from 'lucide-react';

const ZIP_TOOLS = [
  { id: 'zip', name: 'Zip Files', icon: FolderPlus, desc: 'Pack multiple files of any extension into a single compressed ZIP archive.', accept: {}, multiple: true },
  { id: 'unzip', name: 'Unzip Archive', icon: FolderOpen, desc: 'Extract contents from an existing ZIP archive into individual files.', accept: { 'application/zip': ['.zip'] }, multiple: false }
];

const ZIPTools = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('zip');
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState(null);

  // Sync tab selection with query parameter if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tool = params.get('tool');
    if (tool && ZIP_TOOLS.some(t => t.id === tool)) {
      setActiveTab(tool);
      resetState();
    }
  }, [location]);

  // Sync files if redirected from quick upload
  useEffect(() => {
    if (location.state?.initialFiles) {
      setFiles(location.state.initialFiles);
    }
  }, [location.state]);

  const resetState = () => {
    setFiles([]);
    setErrorMsg('');
    setResult(null);
    setIsProcessing(false);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    resetState();
  };

  const handleProcess = async () => {
    if (files.length === 0) {
      setErrorMsg('Please select files first.');
      return;
    }

    setErrorMsg('');
    setIsProcessing(true);
    setResult(null);

    const formData = new FormData();
    formData.append('action', activeTab);

    // Append files
    if (activeTab === 'zip') {
      files.forEach(file => {
        formData.append('files', file);
      });
    } else {
      formData.append('file', files[0]);
    }

    try {
      const res = await api.post('/api/files/zip', formData);
      setResult(res.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'An error occurred during file processing');
    } finally {
      setIsProcessing(false);
    }
  };

  const activeTool = ZIP_TOOLS.find(t => t.id === activeTab);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ZIP Utilities</h1>
        <p className="text-xs text-slate-400">Pack files into compressed archives or extract files from ZIPs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          <div className="glass-panel p-2.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1.5">
            {ZIP_TOOLS.map((tool) => (
              <button
                key={tool.id}
                onClick={() => handleTabChange(tool.id)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-xs font-semibold shrink-0 transition-all ${
                  activeTab === tool.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900/60'
                }`}
              >
                <tool.icon size={16} />
                <span>{tool.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Panel Workspace */}
        <div className="lg:col-span-9 space-y-6">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 space-y-6">
            
            {/* Tool Description */}
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <activeTool.icon size={18} className="text-indigo-500" />
                <span>{activeTool.name}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">{activeTool.desc}</p>
            </div>

            {/* Main File Selector */}
            {!result && !isProcessing && (
              <FileUploader 
                accept={activeTool.accept}
                multiple={activeTool.multiple}
                onFilesSelected={setFiles}
              />
            )}

            {/* Option parameters info */}
            {files.length > 0 && !result && !isProcessing && (
              <div className="p-4 rounded-xl bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200/40 dark:border-slate-800/40 text-center">
                <p className="text-[10px] text-slate-400 italic">No extra configurations needed. Click compile below to finalize operations.</p>
              </div>
            )}

            {/* Error alerts */}
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200/50 dark:border-red-900/30 text-xs">
                <AlertCircle size={14} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Loader / Processing state */}
            {isProcessing && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <RefreshCw size={36} className="text-indigo-500 animate-spin" />
                <div className="text-center">
                  <p className="text-sm font-semibold">Compiling ZIP archive...</p>
                  <p className="text-[10px] text-slate-400 mt-1">Please wait while the server packages your contents. This may take a few seconds.</p>
                </div>
              </div>
            )}

            {/* Result display */}
            {result && (
              <div className="p-6 rounded-3xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 shrink-0">
                    <FolderArchive size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{result.fileName}</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Archive processed and ready for download.</p>
                  </div>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <a
                    href={result.downloadUrl}
                    download
                    onClick={resetState}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/20"
                  >
                    <Download size={14} />
                    <span>Download ZIP</span>
                  </a>
                  <button
                    onClick={resetState}
                    className="flex items-center justify-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900/60"
                  >
                    <RefreshCw size={14} className="text-slate-500" />
                  </button>
                </div>
              </div>
            )}

            {/* Action Trigger Buttons */}
            {files.length > 0 && !result && !isProcessing && (
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={resetState}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/60 transition-colors"
                >
                  Clear Files
                </button>
                <button
                  type="button"
                  onClick={handleProcess}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20"
                >
                  <span>Compile Archive</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
};

export default ZIPTools;
