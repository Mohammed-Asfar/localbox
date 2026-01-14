import { useEffect, useState, useRef } from 'react';
import Uppy from '@uppy/core';
import Dashboard from '@uppy/react/dashboard';
import Tus from '@uppy/tus';
import { X, Zap } from 'lucide-react';

function FileUpload({ isOpen, onClose, onUploadComplete }) {
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
      chunkSize: 100 * 1024 * 1024, // 100MB chunks
      removeFingerprintOnSuccess: true,
      storeFingerprintForResuming: true,
    });
  });

  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [eta, setEta] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const lastProgress = useRef({ bytes: 0, time: Date.now() });
  const speedHistory = useRef([]);

  // ... (Keep existing formatting helpers) ...
  const formatSpeed = (bytesPerSecond) => {
    if (bytesPerSecond === 0) return '0 B/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatETA = (seconds) => {
    if (!isFinite(seconds) || seconds <= 0) return '--';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  useEffect(() => {
    uppy.on('upload', () => {
      setIsUploading(true);
      lastProgress.current = { bytes: 0, time: Date.now() };
      speedHistory.current = [];
    });

    uppy.on('upload-progress', (file, progress) => {
      const now = Date.now();
      const timeDiff = (now - lastProgress.current.time) / 1000;

      if (timeDiff >= 0.5) {
        const bytesDiff = progress.bytesUploaded - lastProgress.current.bytes;
        const instantSpeed = bytesDiff / timeDiff;
        speedHistory.current.push(instantSpeed);
        if (speedHistory.current.length > 5) speedHistory.current.shift();
        const avgSpeed = speedHistory.current.reduce((a, b) => a + b, 0) / speedHistory.current.length;
        setUploadSpeed(avgSpeed);
        const remaining = progress.bytesTotal - progress.bytesUploaded;
        setEta(remaining / avgSpeed);
        lastProgress.current = { bytes: progress.bytesUploaded, time: now };
      }
    });

    uppy.on('complete', (result) => {
      setIsUploading(false);
      if (result.successful.length > 0) {
        onUploadComplete?.();
      }
    });

    return () => uppy.clear();
  }, [uppy, onUploadComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden relative">
        <button // Close button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white z-10 p-1 bg-zinc-800 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 border-b border-white/5 bg-zinc-900">
          <h2 className="text-xl font-bold text-white">Upload Files</h2>
          <p className="text-sm text-zinc-500">Drag & drop files or resume previous uploads</p>
        </div>

        <div className="bg-[#1a1a1a]">
          <Dashboard
            uppy={uppy}
            width="100%"
            height={400}
            theme="dark"
            showProgressDetails={true}
            proudlyDisplayPoweredByUppy={false}
          />
        </div>

        {/* Speed Display Overlay */}
        {isUploading && (
          <div className="absolute bottom-6 left-6 bg-zinc-950/90 backdrop-blur border border-white/10 rounded-xl px-4 py-3 shadow-xl z-20 min-w-[200px] flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Zap className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-zinc-500">Speed</div>
                  <div className="text-base font-bold text-white font-mono">{formatSpeed(uploadSpeed)}</div>
                </div>
             </div>
             <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-zinc-500">ETA</div>
                  <div className="text-base font-bold text-zinc-300 font-mono">{formatETA(eta)}</div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FileUpload;
