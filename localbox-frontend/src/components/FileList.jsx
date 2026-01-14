import { MoreHorizontal, Download, Trash2, File as FileIcon, Image as ImageIcon, FileText, Video as VideoIcon, Music, Archive } from 'lucide-react';

const getFileIcon = (category) => {
  switch (category) {
    case 'images': return { icon: ImageIcon, color: 'text-purple-400' };
    case 'documents': return { icon: FileText, color: 'text-blue-400' };
    case 'videos': return { icon: VideoIcon, color: 'text-rose-400' };
    case 'audio': return { icon: Music, color: 'text-emerald-400' };
    case 'archives': return { icon: Archive, color: 'text-amber-400' };
    default: return { icon: FileIcon, color: 'text-zinc-400' };
  }
};

function FileList({ files, isLoading, onDelete, onRefresh }) {
  // ... (Keep existing helpers) ...
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
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
    const url = `/api/download/${file.category}/${encodeURIComponent(file.name)}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (files.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 pb-20">
        <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 border border-white/5">
          <FileIcon className="w-8 h-8 opacity-50" />
        </div>
        <p className="text-zinc-400 font-medium">No files found</p>
        <p className="text-sm mt-1">Upload a file to get started</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-left text-sm border-separate border-spacing-0">
        <thead className="sticky top-0 bg-zinc-950/95 backdrop-blur-sm z-10 text-zinc-500 font-medium">
          <tr>
            <th className="px-4 md:px-6 py-3 border-b border-white/5 w-full md:w-[50%]">Name</th>
            <th className="hidden md:table-cell px-6 py-3 border-b border-white/5">Date</th>
            <th className="hidden sm:table-cell px-6 py-3 border-b border-white/5">Size</th>
            <th className="px-4 md:px-6 py-3 border-b border-white/5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {files.map((file, idx) => {
            const { icon: Icon, color } = getFileIcon(file.category);
            
            return (
              <tr 
                key={`${file.name}-${idx}`} 
                className="group hover:bg-white/[0.02] transition-colors cursor-default"
              >
                <td className="px-4 md:px-6 py-3 max-w-[200px] sm:max-w-none">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
                    <div className="min-w-0">
                        <div className="text-zinc-200 font-medium group-hover:text-white transition-colors truncate">
                            {file.name}
                        </div>
                        {/* Mobile-only info subtext */}
                        <div className="md:hidden text-xs text-zinc-500 flex gap-2">
                             <span>{formatBytes(file.size)}</span>
                             <span>•</span>
                             <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                  </div>
                </td>
                <td className="hidden md:table-cell px-6 py-3 text-zinc-500 whitespace-nowrap">
                  {formatDate(file.createdAt)}
                </td>
                <td className="hidden sm:table-cell px-6 py-3 text-zinc-500 font-mono text-xs whitespace-nowrap">
                  {formatBytes(file.size)}
                </td>
                <td className="px-4 md:px-6 py-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1 md:gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => handleDownload(e, file)}
                      className="p-2 md:p-1.5 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(file.category, file.name); }}
                      className="p-2 md:p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
