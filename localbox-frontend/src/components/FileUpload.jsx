import { useEffect, useState, useRef } from 'react';
import Uppy from '@uppy/core';
import Dashboard from '@uppy/react/dashboard';
import Tus from '@uppy/tus';
import axios from 'axios';
import { X, Zap, Folder, ChevronDown, ChevronRight, Image, FileText, Archive, Video, Music } from 'lucide-react';

const CATEGORIES = [
  { id: 'images', label: 'Images', icon: Image },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'archives', label: 'Archives', icon: Archive },
  { id: 'videos', label: 'Videos', icon: Video },
  { id: 'audio', label: 'Audio', icon: Music },
  { id: 'others', label: 'Others', icon: Folder },
];

function FileUpload({ isOpen, onClose, onUploadComplete, currentCategory, currentPath, droppedFiles }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPath, setSelectedPath] = useState('');
  const [folders, setFolders] = useState([]);
  const [showFolderPicker, setShowFolderPicker] = useState(false);

  const [uppy] = useState(() => {
    return new Uppy({
      debug: true,
      autoProceed: false,
      restrictions: {
        maxFileSize: null,
        maxNumberOfFiles: null,
      },
    }).use(Tus, {
      endpoint: '/files',
      retryDelays: [0, 1000, 3000, 5000],
      chunkSize: 100 * 1024 * 1024,
      removeFingerprintOnSuccess: true,
      storeFingerprintForResuming: true,
    });
  });

  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [eta, setEta] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const lastProgress = useRef({ bytes: 0, time: Date.now() });
  const speedHistory = useRef([]);

  // Set initial category when modal opens
  useEffect(() => {
    if (isOpen) {
      const cat = currentCategory && currentCategory !== 'all' ? currentCategory : 'images';
      setSelectedCategory(cat);
      setSelectedPath(currentPath || '');
      loadFolders(cat);
    }
  }, [isOpen, currentCategory, currentPath]);

  // Add dropped files to Uppy when modal opens
  useEffect(() => {
    if (isOpen && droppedFiles && droppedFiles.length > 0) {
      // Convert FileList to array and add each file to Uppy
      Array.from(droppedFiles).forEach(file => {
        try {
          uppy.addFile({
            name: file.name,
            type: file.type,
            data: file,
            source: 'dropped',
          });
        } catch (err) {
          // File might already exist, ignore
          console.log('Could not add file:', err.message);
        }
      });
    }
  }, [isOpen, droppedFiles, uppy]);

  const loadFolders = async (category) => {
    try {
      const res = await axios.get(`/api/folders/${category}`);
      setFolders(res.data.folders || []);
    } catch (e) {
      setFolders([]);
    }
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setSelectedPath('');
    loadFolders(cat);
  };

  // Update Tus metadata when category/path changes
  useEffect(() => {
    uppy.setOptions({
      meta: {
        category: selectedCategory,
        uploadPath: selectedPath,
      }
    });
  }, [selectedCategory, selectedPath, uppy]);

  const formatSpeed = (bytesPerSecond) => {
    if (!bytesPerSecond || !isFinite(bytesPerSecond) || bytesPerSecond <= 0) return '-- B/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    if (i < 0 || i >= sizes.length) return '-- B/s';
    return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatETA = (seconds) => {
    if (!seconds || !isFinite(seconds) || seconds <= 0) return '--';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  // Track bytes per file for accurate multi-file speed
  const fileBytesRef = useRef({});
  
  useEffect(() => {
    uppy.on('upload', () => {
      setIsUploading(true);
      setUploadSpeed(0);
      setEta(null);
      lastProgress.current = { bytes: 0, time: Date.now() };
      speedHistory.current = [];
      fileBytesRef.current = {};
    });

    // Track per-file progress and sum for total
    uppy.on('upload-progress', (file, progress) => {
      // Store current progress for this file
      fileBytesRef.current[file.id] = progress.bytesUploaded;
      
      // Calculate total bytes uploaded across all files
      const totalUploaded = Object.values(fileBytesRef.current).reduce((a, b) => a + b, 0);
      
      // Get total size of all files
      const files = uppy.getFiles();
      const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);

      const now = Date.now();
      const timeDiff = (now - lastProgress.current.time) / 1000;

      if (timeDiff >= 0.5 && totalUploaded > 0) {
        const bytesDiff = totalUploaded - lastProgress.current.bytes;
        if (bytesDiff > 0) {
          const instantSpeed = bytesDiff / timeDiff;
          speedHistory.current.push(instantSpeed);
          if (speedHistory.current.length > 5) speedHistory.current.shift();
          const avgSpeed = speedHistory.current.reduce((a, b) => a + b, 0) / speedHistory.current.length;
          setUploadSpeed(avgSpeed);
          
          const remaining = totalSize - totalUploaded;
          if (avgSpeed > 0 && remaining > 0) {
            setEta(remaining / avgSpeed);
          }
        }
        lastProgress.current = { bytes: totalUploaded, time: now };
      }
    });

    uppy.on('complete', (result) => {
      setIsUploading(false);
      setUploadSpeed(0);
      setEta(null);
      fileBytesRef.current = {};
      if (result.successful.length > 0) {
        onUploadComplete?.();
      }
    });

    uppy.on('cancel-all', () => {
      setIsUploading(false);
      setUploadSpeed(0);
      setEta(null);
      fileBytesRef.current = {};
    });

    return () => uppy.clear();
  }, [uppy, onUploadComplete]);

  if (!isOpen) return null;

  const selectedCategoryInfo = CATEGORIES.find(c => c.id === selectedCategory);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white z-10 p-1 bg-zinc-800 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-4 border-b border-white/5 bg-zinc-900">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-bold text-white">Upload Files</h2>
              <p className="text-xs text-zinc-500">Select destination folder</p>
            </div>
            
            {/* Speed Display */}
            {isUploading && (
              <div className="flex items-center gap-3 bg-zinc-800/50 border border-white/5 rounded-lg px-3 py-1.5">
                <Zap className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-mono text-white">{formatSpeed(uploadSpeed)}</span>
                <span className="text-xs text-zinc-500">ETA: {formatETA(eta)}</span>
              </div>
            )}
          </div>

          {/* Destination Picker */}
          <div className="mt-3 flex flex-wrap gap-2">
            {/* Category Selector */}
            <div className="flex gap-1 flex-wrap">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Folder Selector */}
            {folders.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowFolderPicker(!showFolderPicker)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors"
                >
                  <Folder className="w-4 h-4 text-yellow-400" />
                  <span className="max-w-[150px] truncate">
                    {selectedPath || 'Root folder'}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFolderPicker ? 'rotate-180' : ''}`} />
                </button>

                {showFolderPicker && (
                  <div className="absolute top-full left-0 mt-1 bg-zinc-900 border border-white/10 rounded-lg shadow-xl z-20 min-w-[200px] max-h-48 overflow-auto">
                    <button
                      onClick={() => { setSelectedPath(''); setShowFolderPicker(false); }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-zinc-800 flex items-center gap-2 ${
                        !selectedPath ? 'text-blue-400' : 'text-zinc-300'
                      }`}
                    >
                      <Folder className="w-4 h-4" />
                      Root folder
                    </button>
                    {folders.map((folder) => (
                      <button
                        key={folder.path}
                        onClick={() => { setSelectedPath(folder.path); setShowFolderPicker(false); }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-zinc-800 flex items-center gap-2 ${
                          selectedPath === folder.path ? 'text-blue-400' : 'text-zinc-300'
                        }`}
                      >
                        <Folder className="w-4 h-4 text-yellow-400" />
                        {folder.path}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Current destination display */}
          <p className="mt-2 text-xs text-zinc-500">
            Uploading to: <span className="text-zinc-300">{selectedCategory}/{selectedPath || '(root)'}</span>
          </p>
        </div>

        <div className="bg-[#1a1a1a]">
          <Dashboard
            uppy={uppy}
            width="100%"
            height={350}
            theme="dark"
            showProgressDetails={true}
            proudlyDisplayPoweredByUppy={false}
          />
        </div>
      </div>
    </div>
  );
}

export default FileUpload;
