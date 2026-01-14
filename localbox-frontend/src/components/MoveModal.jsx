import { useState } from 'react';
import { FolderInput, Image, FileText, Archive, Video, Music, Folder } from 'lucide-react';

const CATEGORY_INFO = {
  images: { label: 'Images', icon: Image, color: 'text-purple-400' },
  documents: { label: 'Documents', icon: FileText, color: 'text-blue-400' },
  archives: { label: 'Archives', icon: Archive, color: 'text-amber-400' },
  videos: { label: 'Videos', icon: Video, color: 'text-rose-400' },
  audio: { label: 'Audio', icon: Music, color: 'text-emerald-400' },
  others: { label: 'Others', icon: Folder, color: 'text-zinc-400' },
};

function MoveModal({ isOpen, file, onConfirm, onCancel, isLoading }) {
  const [selectedCategory, setSelectedCategory] = useState('');

  if (!isOpen || !file) return null;

  const availableCategories = Object.keys(CATEGORY_INFO).filter(cat => cat !== file.category);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedCategory) {
      onConfirm(selectedCategory);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <FolderInput className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Move File</h2>
              <p className="text-sm text-zinc-500 truncate max-w-[300px]">{file.name}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-sm text-zinc-400 mb-4">Select destination category:</p>
          
          <div className="space-y-2">
            {availableCategories.map((cat) => {
              const info = CATEGORY_INFO[cat];
              const Icon = info.icon;
              const isSelected = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                    isSelected 
                      ? 'bg-blue-600/20 border-2 border-blue-500' 
                      : 'bg-zinc-800 border-2 border-transparent hover:bg-zinc-700'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${info.color}`} />
                  <span className="text-white font-medium">{info.label}</span>
                  {isSelected && (
                    <span className="ml-auto text-xs text-blue-400 font-medium">Selected</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedCategory}
              className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Moving...' : 'Move'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MoveModal;
