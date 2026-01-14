import { Download, Trash2, Eye, Pencil, FolderInput, File as FileIcon, Image as ImageIcon, FileText, Video as VideoIcon, Music, Archive, Folder, ChevronRight } from 'lucide-react';
import { canPreview } from './PreviewModal';

const getFileIcon = (category, type) => {
  if (type === 'folder') return { icon: Folder, color: 'text-yellow-400' };
  switch (category) {
    case 'images': return { icon: ImageIcon, color: 'text-purple-400' };
    case 'documents': return { icon: FileText, color: 'text-blue-400' };
    case 'videos': return { icon: VideoIcon, color: 'text-rose-400' };
    case 'audio': return { icon: Music, color: 'text-emerald-400' };
    case 'archives': return { icon: Archive, color: 'text-amber-400' };
    default: return { icon: FileIcon, color: 'text-zinc-400' };
  }
};

const isImageFile = (name) => {
  const ext = name.split('.').pop().toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
};

function FileList({ files, isLoading, onDelete, onRefresh, onPreview, onRename, onMove, selectedFiles, onSelectionChange, onNavigateFolder, viewMode, theme }) {
  const formatBytes = (bytes) => {
    if (bytes === 0) return '—';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };
  
  const handleDownload = (e, file) => {
    e.stopPropagation();
    const url = `/api/download/${file.category}/${encodeURIComponent(file.path || file.name)}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleRowClick = (item) => {
    if (item.type === 'folder') {
      onNavigateFolder(item.path);
    } else if (canPreview(item.name)) {
      onPreview(item);
    }
  };

  const isSelected = (file) => {
    return selectedFiles.some(f => f.name === file.name && f.category === file.category && f.path === file.path);
  };

  const handleCheckboxChange = (e, file) => {
    e.stopPropagation();
    if (isSelected(file)) {
      onSelectionChange(selectedFiles.filter(f => !(f.name === file.name && f.category === file.category && f.path === file.path)));
    } else {
      onSelectionChange([...selectedFiles, file]);
    }
  };

  const selectableFiles = files.filter(f => f.type !== 'folder');
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      onSelectionChange(selectableFiles);
    } else {
      onSelectionChange([]);
    }
  };

  const allSelected = selectableFiles.length > 0 && selectedFiles.length === selectableFiles.length;
  const someSelected = selectedFiles.length > 0 && selectedFiles.length < selectableFiles.length;

  if (files.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center pb-20">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
          theme === 'light' ? 'bg-gray-100' : 'bg-zinc-900 border border-white/5'
        }`}>
          <Folder className={`w-8 h-8 ${theme === 'light' ? 'text-gray-400' : 'text-zinc-600'}`} />
        </div>
        <p className={theme === 'light' ? 'text-gray-600 font-medium' : 'text-zinc-400 font-medium'}>This folder is empty</p>
        <p className={`text-sm mt-1 ${theme === 'light' ? 'text-gray-400' : 'text-zinc-500'}`}>Upload files or create a subfolder</p>
      </div>
    );
  }

  // GRID VIEW
  if (viewMode === 'grid') {
    return (
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {files.map((item, idx) => {
            const { icon: Icon, color } = getFileIcon(item.category, item.type);
            const isFolder = item.type === 'folder';
            const selected = !isFolder && isSelected(item);
            const isImage = !isFolder && isImageFile(item.name);
            // Use thumbnail endpoint for cached images
            const thumbnailUrl = isImage ? `/api/thumbnail/${item.category}/${encodeURIComponent(item.path || item.name)}` : null;

            return (
              <div
                key={`${item.name}-${idx}`}
                onClick={() => handleRowClick(item)}
                style={{ contentVisibility: 'auto', containIntrinsicSize: '0 180px' }}
                className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all ${
                  selected 
                    ? 'ring-2 ring-blue-500' 
                    : theme === 'light'
                      ? 'hover:bg-gray-100 border border-gray-200'
                      : 'hover:bg-white/5 border border-white/5'
                }`}
              >
                {/* Thumbnail / Icon */}
                <div className={`aspect-square flex items-center justify-center relative overflow-hidden ${
                  theme === 'light' ? 'bg-gray-100' : 'bg-zinc-900'
                }`}>
                  {thumbnailUrl ? (
                    <img 
                      src={thumbnailUrl} 
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <Icon className={`w-10 h-10 ${color}`} />
                  )}
                  
                  {/* Checkbox */}
                  {!isFolder && (
                    <div className={`absolute top-2 left-2 transition-opacity ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => handleCheckboxChange(e, item)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Hover Actions */}
                  {!isFolder && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleDownload(e, item)}
                        className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className={`px-2 py-1.5 ${theme === 'light' ? 'bg-white' : 'bg-zinc-950'}`}>
                  <p className={`text-xs font-medium truncate ${
                    theme === 'light' ? 'text-gray-700' : 'text-zinc-300'
                  }`}>{item.name}</p>
                  <p className={`text-[10px] ${theme === 'light' ? 'text-gray-400' : 'text-zinc-500'}`}>
                    {isFolder ? 'Folder' : formatBytes(item.size)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-left text-sm border-separate border-spacing-0">
        <thead className={`sticky top-0 z-10 font-medium ${
          theme === 'light' 
            ? 'bg-gray-50/95 text-gray-500' 
            : 'bg-zinc-950/95 text-zinc-500'
        }`}>
          <tr>
            <th className={`px-4 py-3 border-b w-10 ${theme === 'light' ? 'border-gray-200' : 'border-white/5'}`}>
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => { if (el) el.indeterminate = someSelected; }}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 cursor-pointer"
              />
            </th>
            <th className={`px-2 md:px-4 py-3 border-b w-full md:w-[45%] ${theme === 'light' ? 'border-gray-200' : 'border-white/5'}`}>Name</th>
            <th className={`hidden md:table-cell px-4 py-3 border-b ${theme === 'light' ? 'border-gray-200' : 'border-white/5'}`}>Date</th>
            <th className={`hidden sm:table-cell px-4 py-3 border-b ${theme === 'light' ? 'border-gray-200' : 'border-white/5'}`}>Size</th>
            <th className={`px-2 md:px-4 py-3 border-b text-right ${theme === 'light' ? 'border-gray-200' : 'border-white/5'}`}>Actions</th>
          </tr>
        </thead>
        <tbody className={`divide-y ${theme === 'light' ? 'divide-gray-100' : 'divide-white/5'}`}>
          {files.map((item, idx) => {
            const { icon: Icon, color } = getFileIcon(item.category, item.type);
            const isFolder = item.type === 'folder';
            const isPreviewable = !isFolder && canPreview(item.name);
            const selected = !isFolder && isSelected(item);
            
            return (
              <tr 
                key={`${item.name}-${idx}`} 
                onClick={() => handleRowClick(item)}
                className={`group transition-colors cursor-pointer ${
                  selected 
                    ? 'bg-blue-500/10' 
                    : theme === 'light'
                      ? 'hover:bg-gray-50'
                      : 'hover:bg-white/[0.02]'
                }`}
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  {!isFolder && (
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(e) => handleCheckboxChange(e, item)}
                      className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 cursor-pointer"
                    />
                  )}
                </td>
                <td className="px-2 md:px-4 py-3 max-w-[150px] sm:max-w-none">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
                    <div className="min-w-0 flex-1">
                      <div className={`font-medium truncate flex items-center gap-2 ${
                        theme === 'light' ? 'text-gray-700 group-hover:text-gray-900' : 'text-zinc-200 group-hover:text-white'
                      }`}>
                        {item.name}
                        {isFolder && <ChevronRight className="w-4 h-4 opacity-40" />}
                        {isPreviewable && (
                          <Eye className="w-3 h-3 opacity-0 group-hover:opacity-40" />
                        )}
                      </div>
                      <div className={`md:hidden text-xs flex gap-2 ${theme === 'light' ? 'text-gray-400' : 'text-zinc-500'}`}>
                        <span>{isFolder ? 'Folder' : formatBytes(item.size)}</span>
                        <span>•</span>
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className={`hidden md:table-cell px-4 py-3 whitespace-nowrap ${theme === 'light' ? 'text-gray-500' : 'text-zinc-500'}`}>
                  {formatDate(item.createdAt)}
                </td>
                <td className={`hidden sm:table-cell px-4 py-3 font-mono text-xs whitespace-nowrap ${theme === 'light' ? 'text-gray-500' : 'text-zinc-500'}`}>
                  {isFolder ? '—' : formatBytes(item.size)}
                </td>
                <td className="px-2 md:px-4 py-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-0.5 md:gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    {!isFolder && (
                      <>
                        {/* Desktop-only buttons */}
                        {isPreviewable && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onPreview(item); }}
                            className="hidden md:block p-1.5 text-zinc-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); onRename(item); }}
                          className="hidden md:block p-1.5 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg"
                          title="Rename"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onMove(item); }}
                          className="hidden md:block p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg"
                          title="Move"
                        >
                          <FolderInput className="w-4 h-4" />
                        </button>
                        {/* Always visible buttons */}
                        <button 
                          onClick={(e) => handleDownload(e, item)}
                          className="p-1.5 text-zinc-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(item.category, item.path || item.name, isFolder); }}
                      className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default FileList;
