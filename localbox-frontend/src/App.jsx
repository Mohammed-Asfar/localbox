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

  // Filter files based on search query
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const query = searchQuery.toLowerCase();
    return files.filter(file => file.name.toLowerCase().includes(query));
  }, [files, searchQuery]);

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

  return (
    <div className="flex h-screen bg-black text-zinc-200 overflow-hidden font-sans selection:bg-blue-500/30">
      <Sidebar 
        currentCategory={currentCategory} 
        onCategoryChange={handleCategoryChange}
        storageStats={stats}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-[#0F0F10] md:m-2 md:ml-0 md:rounded-2xl border-l md:border border-white/5 shadow-2xl relative overflow-hidden transition-all duration-300">
        <Header 
          currentCategory={currentCategory}
          currentPath={currentPath}
          onUploadClick={() => setIsUploadOpen(true)}
          onMenuClick={() => setIsMobileMenuOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCreateFolder={() => setCreateFolderModal(true)}
          onNavigatePath={handleNavigatePath}
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
        />
        
        <div className="h-8 bg-zinc-950/50 border-t border-white/5 flex items-center justify-center text-xs text-zinc-500 font-medium select-none">
           {filteredFiles.length} {searchQuery ? 'results' : 'items'} • {stats.total?.size ? (stats.total.size / 1024 / 1024).toFixed(1) : 0} MB
        </div>
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
