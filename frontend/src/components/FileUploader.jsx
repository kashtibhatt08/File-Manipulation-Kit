import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, Trash2, AlertCircle } from 'lucide-react';

const FileUploader = ({ 
  accept, 
  multiple = false, 
  onFilesSelected, 
  maxSizeMB = 50 
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setErrorMsg('');

    if (rejectedFiles.length > 0) {
      const isSizeError = rejectedFiles.some(f => f.errors.some(e => e.code === 'file-too-large'));
      if (isSizeError) {
        setErrorMsg(`One or more files exceed the size limit of ${maxSizeMB}MB.`);
      } else {
        setErrorMsg('Invalid file type uploaded.');
      }
    }

    if (acceptedFiles.length === 0) return;

    let newFiles;
    if (multiple) {
      newFiles = [...selectedFiles, ...acceptedFiles];
    } else {
      newFiles = [acceptedFiles[0]];
    }

    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  }, [selectedFiles, multiple, onFilesSelected, maxSizeMB]);

  const removeFile = (index) => {
    const updated = [...selectedFiles];
    updated.splice(index, 1);
    setSelectedFiles(updated);
    onFilesSelected(updated);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
    maxSize: maxSizeMB * 1024 * 1024
  });

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragActive 
            ? 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 scale-[0.99]' 
            : 'border-slate-300 hover:border-indigo-400 dark:border-slate-800 dark:hover:border-indigo-500 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900/30 dark:hover:bg-slate-900/60'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="p-3 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
            <UploadCloud size={28} className="animate-bounce" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {isDragActive ? 'Drop your files here' : 'Drag & Drop files here'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              or click to browse local files
            </p>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            Max File Size: {maxSizeMB}MB
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200/50 dark:border-red-900/30 text-xs">
          <AlertCircle size={14} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Selected Files ({selectedFiles.length})
          </p>
          <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
            {selectedFiles.map((file, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-3 rounded-xl bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-800/40"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <File size={16} className="text-indigo-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate max-w-[200px] sm:max-w-md">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-slate-400">{formatSize(file.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-red-500 dark:hover:bg-slate-800 dark:hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
