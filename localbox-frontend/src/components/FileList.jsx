import { useState } from 'react';
import { FolderOpen, RefreshCw, Image, FileText, Archive, Video, Music, File, Loader2 } from 'lucide-react';
import FileCard from './FileCard';
import DeleteModal from './DeleteModal';

const CATEGORIES = [
  { id: 'all', label: 'All Files', icon: FolderOpen },
  { id: 'images', label: 'Images', icon: Image, emoji: '🖼️' },
  { id: 'documents', label: 'Documents', icon: FileText, emoji: '📄' },
  { id: 'archives', label: 'Archives', icon: Archive, emoji: '📦' },
  { id: 'videos', label: 'Videos', icon: Video, emoji: '🎬' },
  { id: 'audio', label: 'Audio', icon: Music, emoji: '🎵' },
  { id: 'others', label: 'Others', icon: File, emoji: '📁' },
];

function FileList({ files, isLoading, currentCategory, onCategoryChange, onDelete, onRefresh }) {
  const [deleteModal, setDeleteModal] = useState({ open: false, file: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (file) => {
    setDeleteModal({ open: true, file });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.file) return;
    
    setIsDeleting(true);
    const success = await onDelete(deleteModal.file.category, deleteModal.file.name);
    setIsDeleting(false);
    
    if (success) {
      setDeleteModal({ open: false, file: null });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ open: false, file: null });
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <span className="w-8 h-8 bg-sky-500/20 rounded-lg flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-sky-400" />
          </span>
          Your Files
        </h2>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              currentCategory === cat.id
                ? 'bg-gradient-to-r from-sky-500 to-sky-700 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {cat.emoji || ''} {cat.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-16">
          <Loader2 className="w-12 h-12 text-sky-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading files...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && files.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-slate-800 rounded-full mx-auto mb-6 flex items-center justify-center">
            <FolderOpen className="w-12 h-12 text-slate-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-300 mb-2">No files yet</h3>
          <p className="text-slate-500">Upload some files to get started</p>
        </div>
      )}

      {/* File Grid */}
      {!isLoading && files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {files.map((file, index) => (
            <FileCard
              key={`${file.category}-${file.name}-${index}`}
              file={file}
              onDelete={() => handleDeleteClick(file)}
            />
          ))}
        </div>
      )}

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.open}
        filename={deleteModal.file?.name}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isDeleting={isDeleting}
      />
    </section>
  );
}

export default FileList;
