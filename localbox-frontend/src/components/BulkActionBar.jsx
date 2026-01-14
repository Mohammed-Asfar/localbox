import { X, Download, Trash2, FolderInput } from 'lucide-react';

function BulkActionBar({ selectedCount, onDownload, onDelete, onMove, onClear }) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-white">{selectedCount}</span>
          <span className="text-zinc-400 text-sm">selected</span>
        </div>

        <div className="w-px h-8 bg-white/10" />

        <div className="flex items-center gap-2">
          <button
            onClick={onDownload}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            onClick={onMove}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <FolderInput className="w-4 h-4" />
            Move
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>

        <button
          onClick={onClear}
          className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          title="Clear selection"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default BulkActionBar;
