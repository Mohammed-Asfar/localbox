import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import FileList from './components/FileList';
import FileUpload from './components/FileUpload';
import DeleteModal from './components/DeleteModal';
import PreviewModal from './components/PreviewModal';
import RenameModal from './components/RenameModal';
import MoveModal from './components/MoveModal';
import BulkActionBar from './components/BulkActionBar';
import CreateFolderModal from './components/CreateFolderModal';

const API_BASE = '/api';

function App() {
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState({ total: { files: 0, size: 0 } });
  const [currentCategory, setCurrentCategory] = useState('all');
  const [currentPath, setCurrentPath] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // View & Sort State
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [sortBy, setSortBy] = useState('date'); // 'name', 'date', 'size'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [theme, setTheme] = useState('dark'); // 'dark', 'light'
  
  // Drag & Drop State
  const [isDragging, setIsDragging] = useState(false);
  
  // UI State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  
  // Selection State
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  // Modal States
  const [deleteModal, setDeleteModal] = useState({ open: false, file: null, category: null, isBulk: false, isFolder: false });
  const [renameModal, setRenameModal] = useState({ open: false, file: null });
  const [moveModal, setMoveModal] = useState({ open: false, file: null, isBulk: false });
  const [createFolderModal, setCreateFolderModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('localbox-theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('light-theme', savedTheme === 'light');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('localbox-theme', newTheme);
    document.documentElement.classList.toggle('light-theme', newTheme === 'light');
  };

  // Fetch Data
  const fetchData = async (category = currentCategory, path = currentPath) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (category && category !== 'all') {
        params.append('category', category);
        if (path) params.append('path', path);
      }
      
      const [filesRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/files?${params.toString()}`),
        axios.get(`${API_BASE}/stats`)
      ]);
      setFiles(filesRes.data.files);
      setStats(statsRes.data);
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter and sort files
  const filteredFiles = useMemo(() => {
    let result = files;
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(file => file.name.toLowerCase().includes(query));
    }
    
    // Sorting (folders always first)
    result = [...result].sort((a, b) => {
      // Folders first
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(b.createdAt) - new Date(a.createdAt);
          break;
        case 'size':
          comparison = b.size - a.size;
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? -comparison : comparison;
    });
    
    return result;
  }, [files, searchQuery, sortBy, sortOrder]);

  // Drag & Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files?.length > 0) {
      setIsUploadOpen(true);
    }
  };

  // Handlers
  const handleCategoryChange = (category) => {
    setCurrentCategory(category);
    setCurrentPath('');
    setSearchQuery('');
    setSelectedFiles([]);
    fetchData(category, '');
    setIsMobileMenuOpen(false);
  };

  const handleNavigatePath = (path) => {
    setCurrentPath(path);
    setSearchQuery('');
    setSelectedFiles([]);
    fetchData(currentCategory, path);
  };

  const handleNavigateFolder = (folderPath) => {
    setCurrentPath(folderPath);
    setSearchQuery('');
    setSelectedFiles([]);
    fetchData(currentCategory, folderPath);
  };
  
  const handleUploadComplete = () => fetchData(currentCategory, currentPath);

  // Delete Handlers
  const handleDeleteRequest = (category, filePath, isFolder = false) => {
    setDeleteModal({ open: true, file: filePath, category, isBulk: false, isFolder });
  };

  const handleBulkDeleteRequest = () => {
    setDeleteModal({ open: true, file: null, category: null, isBulk: true, isFolder: false });
  };

  const handleDeleteConfirm = async () => {
    setIsProcessing(true);
    try {
      if (deleteModal.isBulk) {
        for (const file of selectedFiles) {
          await axios.delete(`${API_BASE}/files/${file.category}/${encodeURIComponent(file.path || file.name)}`);
        }
      } else if (deleteModal.isFolder) {
        await axios.delete(`${API_BASE}/folders/${deleteModal.category}/${deleteModal.file}`);
      } else {
        await axios.delete(`${API_BASE}/files/${deleteModal.category}/${encodeURIComponent(deleteModal.file)}`);
      }
      await fetchData(currentCategory, currentPath);
      setDeleteModal({ open: false, file: null, category: null, isBulk: false, isFolder: false });
    } catch (error) {
      console.error('Delete failed:', error);
      alert(error.response?.data?.error || 'Failed to delete');
    } finally {
      setIsProcessing(false);
    }
  };

  // Rename Handlers
  const handleRenameRequest = (file) => {
    setRenameModal({ open: true, file });
  };

  const handleRenameConfirm = async (newName) => {
    setIsProcessing(true);
    try {
      await axios.put(
        `${API_BASE}/files/${renameModal.file.category}/${encodeURIComponent(renameModal.file.path || renameModal.file.name)}`,
        { newName }
      );
      await fetchData(currentCategory, currentPath);
      setRenameModal({ open: false, file: null });
    } catch (error) {
      console.error('Rename failed:', error);
      alert(error.response?.data?.error || 'Failed to rename file');
    } finally {
      setIsProcessing(false);
    }
  };

  // Move Handlers
  const handleMoveRequest = (file) => {
    setMoveModal({ open: true, file, isBulk: false });
  };

  const handleBulkMoveRequest = () => {
    setMoveModal({ open: true, file: selectedFiles[0], isBulk: true });
  };

  const handleMoveConfirm = async (newCategory, targetPath = '') => {
    setIsProcessing(true);
    try {
      if (moveModal.isBulk) {
        for (const file of selectedFiles) {
          await axios.patch(
            `${API_BASE}/files/${file.category}/${encodeURIComponent(file.path || file.name)}/move`,
            { newCategory, targetPath }
          );
        }
      } else {
        await axios.patch(
          `${API_BASE}/files/${moveModal.file.category}/${encodeURIComponent(moveModal.file.path || moveModal.file.name)}/move`,
          { newCategory, targetPath }
        );
      }
      await fetchData(currentCategory, currentPath);
      setMoveModal({ open: false, file: null, isBulk: false });
    } catch (error) {
      console.error('Move failed:', error);
      alert(error.response?.data?.error || 'Failed to move file');
    } finally {
      setIsProcessing(false);
    }
  };

  // Create Folder
  const handleCreateFolder = async (name) => {
    setIsProcessing(true);
    try {
      await axios.post(`${API_BASE}/folders`, {
        category: currentCategory,
        path: currentPath,
        name
      });
      await fetchData(currentCategory, currentPath);
      setCreateFolderModal(false);
    } catch (error) {
      console.error('Create folder failed:', error);
      alert(error.response?.data?.error || 'Failed to create folder');
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk Download
  const handleBulkDownload = () => {
    selectedFiles.forEach(file => {
      const url = `/api/download/${file.category}/${encodeURIComponent(file.path || file.name)}`;
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  };

  // Sort handler
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div 
      className={`flex h-screen overflow-hidden font-sans selection:bg-blue-500/30 transition-colors duration-300 ${
        theme === 'light' 
          ? 'bg-gray-100 text-gray-900' 
          : 'bg-black text-zinc-200'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Sidebar 
        currentCategory={currentCategory} 
        onCategoryChange={handleCategoryChange}
        storageStats={stats}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        theme={theme}
      />

      <div className={`flex-1 flex flex-col min-w-0 md:m-2 md:ml-0 md:rounded-2xl border-l md:border shadow-2xl relative overflow-hidden transition-all duration-300 ${
        theme === 'light'
          ? 'bg-white border-gray-200'
          : 'bg-[#0F0F10] border-white/5'
      }`}>
        <Header 
          currentCategory={currentCategory}
          currentPath={currentPath}
          onUploadClick={() => setIsUploadOpen(true)}
          onMenuClick={() => setIsMobileMenuOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCreateFolder={() => setCreateFolderModal(true)}
          onNavigatePath={handleNavigatePath}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          theme={theme}
          onThemeToggle={toggleTheme}
        />

        <FileList 
          files={filteredFiles} 
          isLoading={isLoading} 
          onDelete={handleDeleteRequest} 
          onRefresh={() => fetchData(currentCategory, currentPath)}
          onPreview={(file) => setPreviewFile(file)}
          onRename={handleRenameRequest}
          onMove={handleMoveRequest}
          selectedFiles={selectedFiles}
          onSelectionChange={setSelectedFiles}
          onNavigateFolder={handleNavigateFolder}
          viewMode={viewMode}
          theme={theme}
        />
        
        <div className={`h-8 border-t flex items-center justify-center text-xs font-medium select-none ${
          theme === 'light'
            ? 'bg-gray-50 border-gray-200 text-gray-500'
            : 'bg-zinc-950/50 border-white/5 text-zinc-500'
        }`}>
           {filteredFiles.length} {searchQuery ? 'results' : 'items'} • {stats.total?.size ? (stats.total.size / 1024 / 1024).toFixed(1) : 0} MB
        </div>

        {/* Drag & Drop Overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm z-50 flex items-center justify-center border-4 border-dashed border-blue-500 rounded-2xl">
            <div className="text-center">
              <div className="text-6xl mb-4">📁</div>
              <p className="text-2xl font-bold text-white">Drop files to upload</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <FileUpload 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)}
        onUploadComplete={handleUploadComplete}
      />

      <DeleteModal 
        isOpen={deleteModal.open}
        filename={deleteModal.isBulk ? `${selectedFiles.length} files` : deleteModal.file}
        isDeleting={isProcessing}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ open: false, file: null, category: null, isBulk: false, isFolder: false })}
      />

      <RenameModal
        isOpen={renameModal.open}
        file={renameModal.file}
        isLoading={isProcessing}
        onConfirm={handleRenameConfirm}
        onCancel={() => setRenameModal({ open: false, file: null })}
      />

      <MoveModal
        isOpen={moveModal.open}
        file={moveModal.isBulk ? { name: `${selectedFiles.length} files`, category: '' } : moveModal.file}
        isLoading={isProcessing}
        onConfirm={handleMoveConfirm}
        onCancel={() => setMoveModal({ open: false, file: null, isBulk: false })}
      />

      <CreateFolderModal
        isOpen={createFolderModal}
        isLoading={isProcessing}
        onConfirm={handleCreateFolder}
        onCancel={() => setCreateFolderModal(false)}
      />

      <PreviewModal
        isOpen={!!previewFile}
        file={previewFile}
        files={filteredFiles.filter(f => f.type !== 'folder')}
        onClose={() => setPreviewFile(null)}
        onNavigate={(file) => setPreviewFile(file)}
      />

      <BulkActionBar
        selectedCount={selectedFiles.length}
        onDownload={handleBulkDownload}
        onDelete={handleBulkDeleteRequest}
        onMove={handleBulkMoveRequest}
        onClear={() => setSelectedFiles([])}
      />
    </div>
  );
}

export default App;
