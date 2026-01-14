import { useState, useEffect } from 'react';
import axios from 'axios';
import { FolderInput, Image, FileText, Archive, Video, Music, Folder, ChevronRight, ChevronDown, Home } from 'lucide-react';

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
  const [selectedPath, setSelectedPath] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [foldersByCategory, setFoldersByCategory] = useState({});

  // Fetch folders when modal opens
  useEffect(() => {
    if (isOpen) {
      Object.keys(CATEGORY_INFO).forEach(async (cat) => {
        try {
          const res = await axios.get(`/api/folders/${cat}`);
          setFoldersByCategory(prev => ({ ...prev, [cat]: res.data.folders }));
        } catch (e) {
          console.error('Error fetching folders:', e);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen || !file) return null;

  const handleSelectDestination = (category, path = '') => {
    setSelectedCategory(category);
    setSelectedPath(path);
  };

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedCategory) {
      onConfirm(selectedCategory, selectedPath);
    }
  };

  const isSelected = (cat, path = '') => {
    return selectedCategory === cat && selectedPath === path;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-white/5 flex-shrink-0">
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

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <p className="text-sm text-zinc-400 px-6 pt-4 pb-2">Select destination:</p>
          
          <div className="flex-1 overflow-auto px-6 pb-4">
            <div className="space-y-1">
              {Object.entries(CATEGORY_INFO).map(([cat, info]) => {
                const Icon = info.icon;
                const isExpanded = expandedCategories[cat];
                const folders = foldersByCategory[cat] || [];
                const hasFolders = folders.length > 0;

                return (
                  <div key={cat}>
                    {/* Category Row */}
                    <div className="flex items-center gap-1">
                      {hasFolders && (
                        <button
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className="p-1 text-zinc-500 hover:text-white"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      )}
                      {!hasFolders && <div className="w-6" />}
                      
                      <button
                        type="button"
                        onClick={() => handleSelectDestination(cat, '')}
                        className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                          isSelected(cat, '') 
                            ? 'bg-blue-600/20 border-2 border-blue-500' 
                            : 'bg-zinc-800 border-2 border-transparent hover:bg-zinc-700'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${info.color}`} />
                        <span className="text-white font-medium">{info.label}</span>
                        {isSelected(cat, '') && (
                          <span className="ml-auto text-xs text-blue-400 font-medium">Selected</span>
                        )}
                      </button>
                    </div>

                    {/* Subfolders */}
                    {isExpanded && hasFolders && (
                      <div className="ml-6 mt-1 space-y-1">
                        {folders.map((folder) => (
                          <button
                            key={folder.path}
                            type="button"
                            onClick={() => handleSelectDestination(cat, folder.path)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all text-sm ${
                              isSelected(cat, folder.path)
                                ? 'bg-blue-600/20 border-2 border-blue-500'
                                : 'bg-zinc-800/50 border-2 border-transparent hover:bg-zinc-700'
                            }`}
                          >
                            <Folder className="w-4 h-4 text-yellow-400" />
                            <span className="text-zinc-200 truncate">{folder.path}</span>
                            {isSelected(cat, folder.path) && (
                              <span className="ml-auto text-xs text-blue-400">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 p-6 border-t border-white/5 flex-shrink-0">
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
              {isLoading ? 'Moving...' : 'Move Here'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MoveModal;
