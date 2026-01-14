import { useEffect, useState, useRef } from 'react';
import Uppy from '@uppy/core';
import { Dashboard } from '@uppy/react';
import Tus from '@uppy/tus';
import { Upload, Zap } from 'lucide-react';

function FileUpload({ onUploadComplete }) {
  const [uppy] = useState(() => {
    return new Uppy({
      debug: true,
      autoProceed: true,
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

  // Speed tracking state
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [eta, setEta] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const lastProgress = useRef({ bytes: 0, time: Date.now() });
  const speedHistory = useRef([]);

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
        if (speedHistory.current.length > 5) {
          speedHistory.current.shift();
        }

        const avgSpeed = speedHistory.current.reduce((a, b) => a + b, 0) / speedHistory.current.length;
        setUploadSpeed(avgSpeed);

        const remaining = progress.bytesTotal - progress.bytesUploaded;
        setEta(remaining / avgSpeed);

        lastProgress.current = { bytes: progress.bytesUploaded, time: now };
      }
    });

    uppy.on('complete', (result) => {
      setIsUploading(false);
      setUploadSpeed(0);
      setEta(null);

      if (result.successful.length > 0) {
        onUploadComplete?.();
      }
    });

    return () => uppy.clear();
  }, [uppy, onUploadComplete]);

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <span className="w-8 h-8 bg-sky-500/20 rounded-lg flex items-center justify-center">
            <Upload className="w-5 h-5 text-sky-400" />
          </span>
          Upload Files
        </h2>
        <div className="text-sm text-slate-400">
          Drag & drop or click to browse • Resumable uploads
        </div>
      </div>

      <div className="relative">
        <Dashboard
          uppy={uppy}
          height={350}
          width="100%"
          showProgressDetails={true}
          proudlyDisplayPoweredByUppy={false}
          note="Large files will auto-resume if interrupted"
          theme="dark"
          showRemoveButtonAfterComplete={true}
        />

        {/* Speed Display */}
        {isUploading && (
          <div className="absolute top-4 left-4 bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-xl px-4 py-3 shadow-2xl z-50 min-w-[200px]">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-sky-500 rounded-full animate-pulse"></div>
              <div>
                <div className="text-sm text-slate-400">Upload Speed</div>
                <div className="text-lg font-bold text-sky-400 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  {formatSpeed(uploadSpeed)}
                </div>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-700 flex justify-between text-sm">
              <span className="text-slate-400">ETA:</span>
              <span className="text-slate-200">{formatETA(eta)}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default FileUpload;
