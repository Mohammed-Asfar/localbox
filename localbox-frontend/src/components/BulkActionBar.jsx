import { X, Download, Trash2, FolderInput } from 'lucide-react';

function BulkActionBar({ selectedCount, onDownload, onDelete, onMove, onClear }) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md animate-in slide-in-from-bottom-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-3 md:p-4">
        {/* Header with count and clear */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl md:text-2xl font-bold text-white">{selectedCount}</span>
            <span className="text-zinc-400 text-sm">selected</span>
          </div>
          <button
            onClick={onClear}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Clear selection"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons - Full width on mobile */}
        <div className="flex gap-2">
          <button
            onClick={onDownload}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
          <button
            onClick={onMove}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <FolderInput className="w-4 h-4" />
            <span>Move</span>
          </button>
          <button
            onClick={onDelete}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default BulkActionBar;
