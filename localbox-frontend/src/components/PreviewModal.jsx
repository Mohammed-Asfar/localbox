import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';

// File types that can be previewed
const PREVIEWABLE_EXTENSIONS = {
  images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'],
  videos: ['mp4', 'webm', 'ogg', 'mov'],
  pdfs: ['pdf'],
  audio: ['mp3', 'wav', 'ogg', 'flac', 'm4a'],
};

function getFileExtension(filename) {
  return filename.split('.').pop().toLowerCase();
}

function getPreviewType(filename) {
  const ext = getFileExtension(filename);
  if (PREVIEWABLE_EXTENSIONS.images.includes(ext)) return 'image';
  if (PREVIEWABLE_EXTENSIONS.videos.includes(ext)) return 'video';
  if (PREVIEWABLE_EXTENSIONS.pdfs.includes(ext)) return 'pdf';
  if (PREVIEWABLE_EXTENSIONS.audio.includes(ext)) return 'audio';
  return null;
}

export function canPreview(filename) {
  return getPreviewType(filename) !== null;
}

function PreviewModal({ isOpen, file, onClose, files, onNavigate }) {
  if (!isOpen || !file) return null;

  const previewType = getPreviewType(file.name);
  const fileUrl = `/api/download/${file.category}/${encodeURIComponent(file.name)}`;

  // Find current index for navigation
  const currentIndex = files.findIndex(f => f.name === file.name && f.category === file.category);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < files.length - 1;

  const handlePrev = () => {
    if (canGoPrev) onNavigate(files[currentIndex - 1]);
  };

  const handleNext = () => {
    if (canGoNext) onNavigate(files[currentIndex + 1]);
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'ArrowRight') handleNext();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/95 z-50 flex flex-col"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      autoFocus
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/50 border-b border-white/5">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-white font-medium truncate max-w-[300px] md:max-w-[500px]">
            {file.name}
          </h2>
          <span className="text-xs text-zinc-500 uppercase bg-zinc-800 px-2 py-0.5 rounded">
            {previewType}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto relative">
        {/* Navigation Arrows */}
        {canGoPrev && (
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-zinc-800/80 hover:bg-zinc-700 text-white rounded-full z-10 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {canGoNext && (
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-zinc-800/80 hover:bg-zinc-700 text-white rounded-full z-10 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Preview Content */}
        {previewType === 'image' && (
          <img 
            src={fileUrl} 
            alt={file.name}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        )}

        {previewType === 'video' && (
          <video 
            src={fileUrl} 
            controls 
            autoPlay
            className="max-w-full max-h-full rounded-lg shadow-2xl"
          >
            Your browser does not support video playback.
          </video>
        )}

        {previewType === 'audio' && (
          <div className="bg-zinc-900 p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
            <div className="w-32 h-32 bg-zinc-800 rounded-2xl flex items-center justify-center">
              <span className="text-4xl">🎵</span>
            </div>
            <p className="text-white font-medium text-center max-w-xs truncate">{file.name}</p>
            <audio src={fileUrl} controls autoPlay className="w-full max-w-md" />
          </div>
        )}

        {previewType === 'pdf' && (
          <iframe
            src={fileUrl}
            title={file.name}
            className="w-full h-full max-w-5xl bg-white rounded-lg shadow-2xl"
          />
        )}

        {!previewType && (
          <div className="text-center text-zinc-500">
            <p className="text-lg mb-2">Preview not available</p>
            <p className="text-sm">This file type cannot be previewed.</p>
          </div>
        )}
      </div>

      {/* Footer with file count */}
      <div className="px-4 py-2 bg-zinc-900/50 border-t border-white/5 text-center text-xs text-zinc-500">
        {currentIndex + 1} of {files.length}
      </div>
    </div>
  );
}

export default PreviewModal;
