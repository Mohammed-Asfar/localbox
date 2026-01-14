import { 
  LayoutGrid, 
  Image, 
  FileText, 
  Archive, 
  Video, 
  Music, 
  Folder,
  HardDrive,
  Cpu,
  X
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Files', icon: LayoutGrid },
  { id: 'images', label: 'Images', icon: Image },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'archives', label: 'Archives', icon: Archive },
  { id: 'videos', label: 'Videos', icon: Video },
  { id: 'audio', label: 'Audio', icon: Music },
  { id: 'others', label: 'Others', icon: Folder },
];

function Sidebar({ currentCategory, onCategoryChange, storageStats, isOpen, onClose, theme }) {
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isDark = theme !== 'light';

  const responsiveClasses = `
    fixed inset-y-0 left-0 w-64 
    ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
    md:translate-x-0 md:static md:h-auto
    shadow-2xl md:shadow-none z-40
  `;

  const diskPercent = () => {
    if (!storageStats.disk || storageStats.disk.total === 0) return 0;
    return (storageStats.disk.used / storageStats.disk.total) * 100;
  };

  const memPercent = () => {
    if (!storageStats.memory || storageStats.memory.total === 0) return 0;
    return (storageStats.memory.used / storageStats.memory.total) * 100;
  };

  return (
    <>
      <aside className={`flex flex-col p-4 transition-all duration-300 ${responsiveClasses} ${
        isDark 
          ? 'bg-zinc-950 border-r border-white/5' 
          : 'bg-gray-50 border-r border-gray-200'
      }`}>
        {/* Mobile Close Button */}
        <div className="flex md:hidden justify-end mb-2">
           <button onClick={onClose} className={`p-2 rounded-lg ${isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
             <X className="w-5 h-5" />
           </button>
        </div>

        {/* Brand */}
        <div className="flex items-center gap-3 px-2 mb-8 mt-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <HardDrive className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`font-bold tracking-wide ${isDark ? 'text-white' : 'text-gray-900'}`}>LocalBox</h1>
            <p className={`text-[10px] font-medium ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>SERVER STORAGE</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          <p className={`px-3 text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>Library</p>
          
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = currentCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => {
                   onCategoryChange(cat.id);
                   onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative
                  ${isActive 
                    ? isDark 
                      ? 'text-white bg-white/10' 
                      : 'text-blue-600 bg-blue-50'
                    : isDark
                      ? 'text-zinc-400 hover:text-white hover:bg-white/5'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-blue-500 rounded-r-full" />
                )}
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : isDark ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {cat.label}
                
                {storageStats.categories?.[cat.id]?.count > 0 && (
                  <span className={`ml-auto text-xs ${isDark ? 'text-zinc-600 group-hover:text-zinc-500' : 'text-gray-400'}`}>
                    {storageStats.categories[cat.id].count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* System Stats Widget */}
        <div className="mt-auto pt-4 px-2 pb-4 space-y-3">
          {/* Disk Usage */}
          <div className={`p-3 rounded-xl ${isDark ? 'bg-zinc-900 border border-white/5' : 'bg-white border border-gray-200 shadow-sm'}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <HardDrive className={`w-3.5 h-3.5 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`} />
              <span className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Disk</span>
              <span className={`ml-auto text-xs ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                {diskPercent().toFixed(0)}%
              </span>
            </div>
            <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`}>
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                style={{ width: `${diskPercent()}%` }}
              /> 
            </div>
            <div className="flex justify-between mt-1.5">
              <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                {formatBytes(storageStats.disk?.used || 0)} used
              </span>
              <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                {formatBytes(storageStats.disk?.total || 0)}
              </span>
            </div>
          </div>

          {/* RAM Usage */}
          <div className={`p-3 rounded-xl ${isDark ? 'bg-zinc-900 border border-white/5' : 'bg-white border border-gray-200 shadow-sm'}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <Cpu className={`w-3.5 h-3.5 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`} />
              <span className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>RAM</span>
              <span className={`ml-auto text-xs ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                {memPercent().toFixed(0)}%
              </span>
            </div>
            <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`}>
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  memPercent() > 80 ? 'bg-red-500' : memPercent() > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${memPercent()}%` }}
              /> 
            </div>
            <div className="flex justify-between mt-1.5">
              <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                {formatBytes(storageStats.memory?.used || 0)} used
              </span>
              <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                {formatBytes(storageStats.memory?.total || 0)}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Backdrop for Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}

export default Sidebar;
