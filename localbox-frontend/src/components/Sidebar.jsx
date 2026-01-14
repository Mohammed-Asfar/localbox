import { 
  LayoutGrid, 
  Image, 
  FileText, 
  Archive, 
  Video, 
  Music, 
  Folder,
  HardDrive,
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

function Sidebar({ currentCategory, onCategoryChange, storageStats, isOpen, onClose }) {
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Base classes always applied
  const baseClasses = "bg-zinc-950 border-r border-white/5 flex flex-col p-4 transition-transform duration-300 ease-in-out z-40";
  
  const responsiveClasses = `
    fixed inset-y-0 left-0 w-64 
    ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
    md:translate-x-0 md:static md:h-auto
    border-r border-white/10 shadow-2xl md:shadow-none
  `;

  const percentUsed = () => {
    if (!storageStats.disk || storageStats.disk.total === 0) return 0;
    return (storageStats.disk.used / storageStats.disk.total) * 100;
  };

  return (
    <>
      <aside className={`${baseClasses} ${responsiveClasses}`}>
        {/* Mobile Close Button */}
        <div className="flex md:hidden justify-end mb-2">
           <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white">
             <X className="w-5 h-5" />
           </button>
        </div>

        {/* Brand */}
        <div className="flex items-center gap-3 px-2 mb-8 mt-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <HardDrive className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white tracking-wide">LocalBox</h1>
            <p className="text-[10px] text-zinc-500 font-medium">SERVER STORAGE</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          <p className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Library</p>
          
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = currentCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => {
                   onCategoryChange(cat.id);
                   onClose(); // Close on mobile selection
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative
                  ${isActive 
                    ? 'text-white bg-white/10' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-blue-500 rounded-r-full" />
                )}
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                {cat.label}
                
                {storageStats[cat.id] && storageStats[cat.id].count > 0 && (
                  <span className="ml-auto text-xs text-zinc-600 group-hover:text-zinc-500">
                    {storageStats[cat.id].count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Storage Widget */}
        <div className="mt-auto pt-6 px-2">
          <div className="p-4 rounded-2xl bg-zinc-900 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-full bg-zinc-800 text-zinc-400">
                <HardDrive className="w-3 h-3" />
              </div>
              <span className="text-xs font-medium text-zinc-300">Storage Used</span>
            </div>
            
            {/* Show "Used" out of "Total" */}
            <div className="flex items-baseline gap-1 mb-2">
                <span className="text-lg font-bold text-white">
                 {formatBytes(storageStats.disk?.used || 0)}
                </span>
                <span className="text-xs text-zinc-500">
                 / {formatBytes(storageStats.disk?.total || 0)}
                </span>
            </div>
            
            <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                style={{ width: `${percentUsed()}%` }}
              /> 
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
