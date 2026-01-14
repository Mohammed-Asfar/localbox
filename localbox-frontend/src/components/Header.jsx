import { Search, Bell, Settings, FilePlus, Menu, X, FolderPlus, ChevronRight, Home } from 'lucide-react';

function Header({ 
  currentCategory, 
  currentPath, 
  onUploadClick, 
  onMenuClick, 
  searchQuery, 
  onSearchChange,
  onCreateFolder,
  onNavigatePath
}) {
  // Build breadcrumb parts
  const pathParts = currentPath ? currentPath.split('/') : [];
  
  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-white/5 bg-zinc-950/50 backdrop-blur-sm">
      {/* Left: Menu & Breadcrumb */}
      <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
        {/* Mobile Menu Trigger */}
        <button 
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white flex-shrink-0"
        >
            <Menu className="w-5 h-5" />
        </button>

        {/* Window Controls (Desktop Only) */}
        <div className="hidden md:flex gap-2 group mr-2 flex-shrink-0">
          <div className="window-control window-red group-hover:opacity-100 opacity-60 transition-opacity" />
          <div className="window-control window-yellow group-hover:opacity-100 opacity-60 transition-opacity" />
          <div className="window-control window-green group-hover:opacity-100 opacity-60 transition-opacity" />
        </div>
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center text-sm font-medium text-zinc-400 overflow-hidden min-w-0">
          {/* Home / Category */}
          <button 
            onClick={() => onNavigatePath('')}
            className="hover:text-white transition-colors flex items-center gap-1 flex-shrink-0"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">{currentCategory}</span>
          </button>

          {/* Path segments */}
          {pathParts.map((part, idx) => (
            <div key={idx} className="flex items-center min-w-0">
              <ChevronRight className="w-4 h-4 mx-1 text-zinc-600 flex-shrink-0" />
              <button
                onClick={() => onNavigatePath(pathParts.slice(0, idx + 1).join('/'))}
                className={`hover:text-white transition-colors truncate max-w-[100px] ${
                  idx === pathParts.length - 1 ? 'text-white' : ''
                }`}
              >
                {part}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search files..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-2 pl-10 pr-10 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50 focus:bg-zinc-900 transition-all placeholder:text-zinc-600"
          />
          {searchQuery && (
            <button 
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* New Folder - only show when in a category */}
        {currentCategory && currentCategory !== 'all' && (
          <button 
            onClick={onCreateFolder}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition-colors"
            title="New Folder"
          >
            <FolderPlus className="w-4 h-4" />
            <span className="hidden lg:inline">New Folder</span>
          </button>
        )}
        
        <button 
          onClick={onUploadClick}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          <FilePlus className="w-4 h-4" />
          <span className="hidden sm:inline">Add File</span>
        </button>

        <div className="hidden lg:block w-px h-6 bg-white/10 mx-1" />

        <button className="hidden lg:block p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-zinc-950" />
        </button>
        <button className="hidden lg:block p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

export default Header;
