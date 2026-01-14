import { Package } from 'lucide-react';

function Header({ stats }) {
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-sky-700 rounded-xl flex items-center justify-center shadow-lg">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
              LocalBox
            </h1>
            <p className="text-xs text-slate-400">Self-Hosted Storage</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-slate-400">Server Online</span>
          </div>
          <div className="text-slate-400">
            <span className="text-slate-100 font-semibold">{stats.total?.files || 0}</span> files
          </div>
          <div className="text-slate-400">
            <span className="text-slate-100 font-semibold">{formatBytes(stats.total?.size || 0)}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
