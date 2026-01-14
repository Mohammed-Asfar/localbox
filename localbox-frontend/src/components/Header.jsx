import { Search, FilePlus, Menu, X, FolderPlus, ChevronRight, Home, Grid, List, ArrowUpDown, Sun, Moon, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

function Header({ 
  currentCategory, 
  currentPath, 
  onUploadClick, 
  onMenuClick, 
  searchQuery, 
  onSearchChange,
  onCreateFolder,
  onNavigatePath,
  viewMode,
  onViewModeChange,
  sortBy,
  sortOrder,
  onSort,
  theme,
  onThemeToggle
}) {
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef(null);
  
  // Close sort menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const pathParts = currentPath ? currentPath.split('/') : [];
  
  const sortOptions = [
    { id: 'date', label: 'Date' },
    { id: 'name', label: 'Name' },
    { id: 'size', label: 'Size' },
  ];

  return (
    <header className={`h-14 flex items-center justify-between px-3 md:px-4 border-b transition-colors ${
      theme === 'light' 
        ? 'bg-white border-gray-200' 
        : 'bg-zinc-950/50 border-white/5'
    }`}>
      {/* Left: Menu & Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button 
          onClick={onMenuClick}
          className={`md:hidden p-2 -ml-1 rounded-lg transition-colors ${
            theme === 'light' ? 'text-gray-500 hover:text-gray-900' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Window Controls (Desktop Only) */}
        <div className="hidden md:flex gap-2 group mr-2 flex-shrink-0">
          <div className="window-control window-red group-hover:opacity-100 opacity-60 transition-opacity" />
          <div className="window-control window-yellow group-hover:opacity-100 opacity-60 transition-opacity" />
          <div className="window-control window-green group-hover:opacity-100 opacity-60 transition-opacity" />
        </div>
        
        {/* Breadcrumb */}
        <div className={`flex items-center text-sm font-medium overflow-hidden min-w-0 ${
          theme === 'light' ? 'text-gray-500' : 'text-zinc-400'
        }`}>
          <button 
            onClick={() => onNavigatePath('')}
            className={`hover:text-blue-500 transition-colors flex items-center gap-1 flex-shrink-0`}
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">{currentCategory}</span>
          </button>

          {pathParts.map((part, idx) => (
            <div key={idx} className="flex items-center min-w-0">
              <ChevronRight className="w-4 h-4 mx-1 opacity-40 flex-shrink-0" />
              <button
                onClick={() => onNavigatePath(pathParts.slice(0, idx + 1).join('/'))}
                className={`hover:text-blue-500 transition-colors truncate max-w-[80px] ${
                  idx === pathParts.length - 1 ? (theme === 'light' ? 'text-gray-900' : 'text-white') : ''
                }`}
              >
                {part}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-sm mx-3 hidden md:block">
        <div className="relative group">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
            theme === 'light' ? 'text-gray-400 group-focus-within:text-blue-500' : 'text-zinc-500 group-focus-within:text-blue-500'
          }`} />
          <input 
            type="text" 
            placeholder="Search files..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full rounded-lg py-2 pl-9 pr-9 text-sm transition-all focus:outline-none ${
              theme === 'light'
                ? 'bg-gray-100 border border-gray-200 text-gray-900 focus:border-blue-500 focus:bg-white placeholder:text-gray-400'
                : 'bg-zinc-900/50 border border-white/5 text-zinc-200 focus:border-blue-500/50 focus:bg-zinc-900 placeholder:text-zinc-600'
            }`}
          />
          {searchQuery && (
            <button 
              onClick={() => onSearchChange('')}
              className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                theme === 'light' ? 'text-gray-400 hover:text-gray-600' : 'text-zinc-500 hover:text-white'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
        {/* View Toggle */}
        <div className={`hidden sm:flex items-center rounded-lg p-0.5 ${
          theme === 'light' ? 'bg-gray-100' : 'bg-zinc-800'
        }`}>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'list'
                ? (theme === 'light' ? 'bg-white shadow text-gray-900' : 'bg-zinc-700 text-white')
                : (theme === 'light' ? 'text-gray-500 hover:text-gray-700' : 'text-zinc-400 hover:text-white')
            }`}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'grid'
                ? (theme === 'light' ? 'bg-white shadow text-gray-900' : 'bg-zinc-700 text-white')
                : (theme === 'light' ? 'text-gray-500 hover:text-gray-700' : 'text-zinc-400 hover:text-white')
            }`}
            title="Grid view"
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="relative hidden sm:block" ref={sortMenuRef}>
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm transition-colors ${
              theme === 'light'
                ? 'text-gray-600 hover:bg-gray-100'
                : 'text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <ArrowUpDown className="w-4 h-4" />
            <span className="hidden md:inline capitalize">{sortBy}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
          </button>

          {showSortMenu && (
            <div className={`absolute right-0 top-full mt-1 py-1 rounded-lg shadow-xl border z-20 min-w-[120px] ${
              theme === 'light'
                ? 'bg-white border-gray-200'
                : 'bg-zinc-900 border-white/10'
            }`}>
              {sortOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => { onSort(opt.id); setShowSortMenu(false); }}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between transition-colors ${
                    theme === 'light'
                      ? 'hover:bg-gray-100 text-gray-700'
                      : 'hover:bg-zinc-800 text-zinc-300'
                  } ${sortBy === opt.id ? 'font-medium' : ''}`}
                >
                  {opt.label}
                  {sortBy === opt.id && (
                    <span className="text-xs opacity-60">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onThemeToggle}
          className={`p-2 rounded-lg transition-colors ${
            theme === 'light'
              ? 'text-gray-600 hover:bg-gray-100'
              : 'text-zinc-400 hover:bg-zinc-800'
          }`}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className={`hidden md:block w-px h-6 mx-1 ${theme === 'light' ? 'bg-gray-200' : 'bg-white/10'}`} />

        {/* New Folder */}
        {currentCategory && currentCategory !== 'all' && (
          <button 
            onClick={onCreateFolder}
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              theme === 'light'
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
            }`}
            title="New Folder"
          >
            <FolderPlus className="w-4 h-4" />
            <span className="hidden lg:inline">Folder</span>
          </button>
        )}
        
        <button 
          onClick={onUploadClick}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          <FilePlus className="w-4 h-4" />
          <span className="hidden sm:inline">Upload</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
