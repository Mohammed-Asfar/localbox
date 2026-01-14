import { Download, Trash2, Image, FileText, Archive, Video, Music, File } from 'lucide-react';

const CATEGORY_CONFIG = {
  images: { icon: Image, gradient: 'from-pink-500 to-rose-500', emoji: '🖼️' },
  documents: { icon: FileText, gradient: 'from-blue-500 to-indigo-500', emoji: '📄' },
  archives: { icon: Archive, gradient: 'from-amber-500 to-orange-500', emoji: '📦' },
  videos: { icon: Video, gradient: 'from-purple-500 to-violet-500', emoji: '🎬' },
  audio: { icon: Music, gradient: 'from-green-500 to-emerald-500', emoji: '🎵' },
  others: { icon: File, gradient: 'from-gray-500 to-slate-500', emoji: '📁' },
};

function FileCard({ file, onDelete }) {
  const config = CATEGORY_CONFIG[file.category] || CATEGORY_CONFIG.others;
  const Icon = config.icon;

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
    });
  };

  const fileExt = file.name.split('.').pop().toUpperCase();

  const handleDownload = () => {
    const url = `/api/download/${file.category}/${encodeURIComponent(file.name)}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 hover:border-slate-600 transition-all hover:-translate-y-0.5 hover:shadow-xl">
      <div className="flex items-start gap-4">
        {/* File Icon */}
        <div className={`w-12 h-12 bg-gradient-to-br ${config.gradient} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
          <span className="text-xl">{config.emoji}</span>
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-slate-100 truncate" title={file.name}>
            {file.name}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
            <span className="px-2 py-0.5 bg-slate-700 rounded text-xs">{fileExt}</span>
            <span>{formatBytes(file.size)}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">{formatDate(file.createdAt)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700">
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 rounded-xl transition text-sm"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default FileCard;
