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

function FileList({ files, isLoading, onDelete, onRefresh, onPreview, onRename, onMove, selectedFiles, onSelectionChange, onNavigateFolder }) {
  const formatBytes = (bytes) => {
    if (bytes === 0) return '—';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  // Only select files, not folders
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
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 pb-20">
        <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 border border-white/5">
          <Folder className="w-8 h-8 opacity-50" />
        </div>
        <p className="text-zinc-400 font-medium">This folder is empty</p>
        <p className="text-sm mt-1">Upload files or create a subfolder</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-left text-sm border-separate border-spacing-0">
        <thead className="sticky top-0 bg-zinc-950/95 backdrop-blur-sm z-10 text-zinc-500 font-medium">
          <tr>
            <th className="px-4 py-3 border-b border-white/5 w-10">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => { if (el) el.indeterminate = someSelected; }}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
              />
            </th>
            <th className="px-2 md:px-4 py-3 border-b border-white/5 w-full md:w-[45%]">Name</th>
            <th className="hidden md:table-cell px-4 py-3 border-b border-white/5">Date</th>
            <th className="hidden sm:table-cell px-4 py-3 border-b border-white/5">Size</th>
            <th className="px-2 md:px-4 py-3 border-b border-white/5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {files.map((item, idx) => {
            const { icon: Icon, color } = getFileIcon(item.category, item.type);
            const isFolder = item.type === 'folder';
            const isPreviewable = !isFolder && canPreview(item.name);
            const selected = !isFolder && isSelected(item);
            
            return (
              <tr 
                key={`${item.name}-${idx}`} 
                onClick={() => handleRowClick(item)}
                className={`group transition-colors cursor-pointer ${selected ? 'bg-blue-500/10' : 'hover:bg-white/[0.02]'}`}
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  {!isFolder && (
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(e) => handleCheckboxChange(e, item)}
                      className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                    />
                  )}
                </td>
                <td className="px-2 md:px-4 py-3 max-w-[150px] sm:max-w-none">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
                    <div className="min-w-0 flex-1">
                        <div className="text-zinc-200 font-medium group-hover:text-white transition-colors truncate flex items-center gap-2">
                            {item.name}
                            {isFolder && (
                              <ChevronRight className="w-4 h-4 text-zinc-600" />
                            )}
                            {isPreviewable && (
                              <Eye className="w-3 h-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                        </div>
                        <div className="md:hidden text-xs text-zinc-500 flex gap-2">
                             <span>{isFolder ? 'Folder' : formatBytes(item.size)}</span>
                             <span>•</span>
                             <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                  </div>
                </td>
                <td className="hidden md:table-cell px-4 py-3 text-zinc-500 whitespace-nowrap">
                  {formatDate(item.createdAt)}
                </td>
                <td className="hidden sm:table-cell px-4 py-3 text-zinc-500 font-mono text-xs whitespace-nowrap">
                  {isFolder ? '—' : formatBytes(item.size)}
                </td>
                <td className="px-2 md:px-4 py-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    {!isFolder && (
                      <>
                        {isPreviewable && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onPreview(item); }}
                            className="p-1.5 text-zinc-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); onRename(item); }}
                          className="p-1.5 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Rename"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onMove(item); }}
                          className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                          title="Move"
                        >
                          <FolderInput className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => handleDownload(e, item)}
                          className="p-1.5 text-zinc-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(item.category, item.path || item.name, isFolder); }}
                      className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
