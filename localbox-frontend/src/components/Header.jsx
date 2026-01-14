import { Search, Bell, Settings, FilePlus, Menu, X } from 'lucide-react';

function Header({ currentPath = 'Home', onUploadClick, onMenuClick, searchQuery, onSearchChange }) {
  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-white/5 bg-zinc-950/50 backdrop-blur-sm">
      {/* Left: Menu & Breadcrumb */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Trigger */}
        <button 
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white"
        >
            <Menu className="w-5 h-5" />
        </button>

        {/* Window Controls (Desktop Only) */}
        <div className="hidden md:flex gap-2 group mr-4">
          <div className="window-control window-red group-hover:opacity-100 opacity-60 transition-opacity" />
          <div className="window-control window-yellow group-hover:opacity-100 opacity-60 transition-opacity" />
          <div className="window-control window-green group-hover:opacity-100 opacity-60 transition-opacity" />
        </div>
        
        <div className="flex items-center text-sm font-medium text-zinc-400 overflow-hidden whitespace-nowrap">
          <span className="hidden sm:inline hover:text-white transition-colors cursor-pointer">server</span>
          <span className="hidden sm:inline mx-2 text-zinc-600">/</span>
          <span className="text-white bg-zinc-800/50 px-2 py-0.5 rounded-md border border-white/5 truncate max-w-[100px] sm:max-w-none">
            {currentPath}
          </span>
        </div>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-md mx-4 md:mx-8 hidden sm:block">
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
      <div className="flex items-center gap-2 md:gap-4">
        <button 
          onClick={onUploadClick}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          <FilePlus className="w-4 h-4" />
          <span className="hidden sm:inline">Add File</span>
        </button>

        <div className="hidden sm:block w-px h-6 bg-white/10 mx-1" />

        <button className="hidden sm:block p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-zinc-950" />
        </button>
        <button className="hidden sm:block p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

export default Header;
