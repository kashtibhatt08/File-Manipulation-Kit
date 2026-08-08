import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import FileUploader from '../components/FileUploader';
import api from '../services/api';
import { 
  Image as ImageIcon, Minimize2, Move, Crop, 
  RefreshCw, Type, Eraser, ArrowRight, Download, AlertCircle
} from 'lucide-react';

const IMAGE_TOOLS = [
  { id: 'compress', name: 'Compress Image', icon: Minimize2, desc: 'Optimize JPG, PNG or WEBP files to minimize dimensions.', accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] } },
  { id: 'resize', name: 'Resize Image', icon: Move, desc: 'Alter pixel width and height dimensions of images.', accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] } },
  { id: 'crop', name: 'Crop Image', icon: Crop, desc: 'Isolate a custom bounding box region from the image.', accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] } },
  { id: 'convert', name: 'Convert Format', icon: RefreshCw, desc: 'Convert image encoding types between PNG, JPG, and WEBP.', accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] } },
  { id: 'watermark', name: 'Add Watermark', icon: Type, desc: 'Embed text strings in custom alignment positions.', accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] } },
  { id: 'removeBackground', name: 'Remove Background', icon: Eraser, desc: 'Erase ambient image backgrounds to yield transparent alpha layers.', accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] } }
];

const ImageTools = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('compress');
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState(null);

  // Tool specific configurations
  const [quality, setQuality] = useState(80);
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [fit, setFit] = useState('cover');
  const [cropLeft, setCropLeft] = useState('0');
  const [cropTop, setCropTop] = useState('0');
  const [targetFormat, setTargetFormat] = useState('png');
  const [watermarkText, setWatermarkText] = useState('Universal File Toolkit');
  const [watermarkPos, setWatermarkPos] = useState('bottom-right');

  // Sync tab selection with query parameter if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tool = params.get('tool');
    if (tool && IMAGE_TOOLS.some(t => t.id === tool)) {
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
      setErrorMsg('Please select a file first.');
      return;
    }

    setErrorMsg('');
    setIsProcessing(true);
    setResult(null);

    const formData = new FormData();
    formData.append('action', activeTab);
    formData.append('file', files[0]);

    // Append tool specific parameters
    if (activeTab === 'compress') {
      formData.append('quality', quality);
    } else if (activeTab === 'resize') {
      formData.append('width', width);
      formData.append('height', height);
      formData.append('fit', fit);
    } else if (activeTab === 'crop') {
      formData.append('width', width);
      formData.append('height', height);
      formData.append('left', cropLeft);
      formData.append('top', cropTop);
    } else if (activeTab === 'convert') {
      formData.append('format', targetFormat);
    } else if (activeTab === 'watermark') {
      formData.append('text', watermarkText);
      formData.append('position', watermarkPos);
    }

    try {
      const res = await api.post('/api/files/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setResult(res.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'An error occurred during file processing');
    } finally {
      setIsProcessing(false);
    }
  };

  const activeTool = IMAGE_TOOLS.find(t => t.id === activeTab);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Image Utilities</h1>
        <p className="text-xs text-slate-400">Compress, crop, scale, apply overlays, convert format, and extract backgrounds.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          <div className="glass-panel p-2.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1.5">
            {IMAGE_TOOLS.map((tool) => (
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
                multiple={false}
                onFilesSelected={setFiles}
              />
            )}

            {/* Option parameters */}
            {files.length > 0 && !result && !isProcessing && (
              <div className="p-5 rounded-2xl bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200/40 dark:border-slate-800/40 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Configure parameters</h3>
                
                {activeTab === 'compress' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>Compression Quality</span>
                      <span className="text-indigo-500">{quality}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="100"
                      value={quality}
                      onChange={(e) => setQuality(e.target.value)}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-850 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <p className="text-[10px] text-slate-400">Lower quality results in smaller file sizes.</p>
                  </div>
                )}

                {activeTab === 'resize' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Width (pixels)</label>
                        <input 
                          type="number" 
                          value={width}
                          onChange={(e) => setWidth(e.target.value)}
                          placeholder="e.g. 800"
                          className="block w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:bg-slate-900 dark:border-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Height (pixels)</label>
                        <input 
                          type="number" 
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          placeholder="e.g. 600"
                          className="block w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:bg-slate-900 dark:border-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Fitting Method</label>
                      <select 
                        value={fit}
                        onChange={(e) => setFit(e.target.value)}
                        className="block w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:bg-slate-900 dark:border-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="cover">Crop to Fit (Cover)</option>
                        <option value="contain">Add Borders if needed (Contain)</option>
                        <option value="fill">Force Distortion (Fill)</option>
                        <option value="inside">Scale to fit inside (Inside)</option>
                      </select>
                    </div>
                  </div>
                )}

                {activeTab === 'crop' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Crop Width</label>
                        <input 
                          type="number" 
                          value={width}
                          onChange={(e) => setWidth(e.target.value)}
                          placeholder="e.g. 400"
                          className="block w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:bg-slate-900 dark:border-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Crop Height</label>
                        <input 
                          type="number" 
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          placeholder="e.g. 400"
                          className="block w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:bg-slate-900 dark:border-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Left Offset</label>
                        <input 
                          type="number" 
                          value={cropLeft}
                          onChange={(e) => setCropLeft(e.target.value)}
                          placeholder="0"
                          className="block w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:bg-slate-900 dark:border-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Top Offset</label>
                        <input 
                          type="number" 
                          value={cropTop}
                          onChange={(e) => setCropTop(e.target.value)}
                          placeholder="0"
                          className="block w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:bg-slate-900 dark:border-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'convert' && (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Format</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['png', 'jpeg', 'webp'].map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setTargetFormat(fmt)}
                          className={`py-2 px-3 text-xs rounded-xl border font-medium uppercase transition-all ${
                            targetFormat === fmt
                              ? 'border-indigo-600 bg-indigo-600/5 text-indigo-600 dark:text-indigo-400'
                              : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900/20'
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'watermark' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Watermark Text</label>
                      <input 
                        type="text" 
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        placeholder="Overlay Text"
                        className="block w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:bg-slate-900 dark:border-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Position Align</label>
                      <select 
                        value={watermarkPos}
                        onChange={(e) => setWatermarkPos(e.target.value)}
                        className="block w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:bg-slate-900 dark:border-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="bottom-right">Bottom Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="top-right">Top Right</option>
                        <option value="top-left">Top Left</option>
                        <option value="center">Center Overlay</option>
                      </select>
                    </div>
                  </div>
                )}

                {activeTab === 'removeBackground' && (
                  <p className="text-[10px] text-slate-400 italic">This will output a transparent PNG by masking border color spaces. Click compile below to begin processing.</p>
                )}
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
                  <p className="text-sm font-semibold">Processing image...</p>
                  <p className="text-[10px] text-slate-400 mt-1">Please wait while the server edits your image. This may take a few seconds.</p>
                </div>
              </div>
            )}

            {/* Result display */}
            {result && (
              <div className="p-6 rounded-3xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 shrink-0">
                    <ImageIcon size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{result.fileName}</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Image processed and ready for download.</p>
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
                    <span>Download Image</span>
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
                  Clear File
                </button>
                <button
                  type="button"
                  onClick={handleProcess}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20"
                >
                  <span>Process Image</span>
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

export default ImageTools;
