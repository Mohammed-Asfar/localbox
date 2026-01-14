import { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import FileList from './components/FileList';
import FileUpload from './components/FileUpload';
import DeleteModal from './components/DeleteModal';

// API Configuration
const API_BASE = '/api';

function App() {
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState({ total: { files: 0, size: 0 } });
  const [currentCategory, setCurrentCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  
  // UI State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, file: null, category: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Data
  const fetchData = async (category = currentCategory) => {
    setIsLoading(true);
    try {
      const [filesRes, statsRes] = await Promise.all([
        axios.get(category === 'all' ? `${API_BASE}/files` : `${API_BASE}/files?category=${category}`),
        axios.get(`${API_BASE}/stats`)
      ]);
      setFiles(filesRes.data.files);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handlers
  const handleCategoryChange = (category) => {
    setCurrentCategory(category);
    fetchData(category);
    setIsMobileMenuOpen(false); // Close menu on selection
  };
  
  // ... (Keep existing handlers for upload and delete) ...
  const handleUploadComplete = () => {
    fetchData();
  };

  const handleDeleteRequest = (category, filename) => {
    setDeleteModal({ open: true, file: filename, category });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.file) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${API_BASE}/files/${deleteModal.category}/${encodeURIComponent(deleteModal.file)}`);
      await fetchData();
      setDeleteModal({ open: false, file: null, category: null });
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex h-screen bg-black text-zinc-200 overflow-hidden font-sans selection:bg-blue-500/30">
      {/* 1. Sidebar (Pass mobile state) */}
      <Sidebar 
        currentCategory={currentCategory} 
        onCategoryChange={handleCategoryChange}
        storageStats={stats}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0F0F10] md:m-2 md:ml-0 md:rounded-2xl border-l md:border border-white/5 shadow-2xl relative overflow-hidden transition-all duration-300">
        
        {/* Header (Pass onMenuClick) */}
        <Header 
          currentPath={`Library / ${currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)}`}
          onUploadClick={() => setIsUploadOpen(true)}
          onMenuClick={() => setIsMobileMenuOpen(true)}
        />

        {/* File List */}
        <FileList 
          files={files} 
          isLoading={isLoading} 
          onDelete={handleDeleteRequest} 
          onRefresh={() => fetchData(currentCategory)} 
        />
        
        {/* Footer Stats similar to Finder */}
        <div className="h-8 bg-zinc-950/50 border-t border-white/5 flex items-center justify-center text-xs text-zinc-500 font-medium select-none">
           {files.length} items • {stats.total?.size ? (stats.total.size / 1024 / 1024).toFixed(1) : 0} MB available
        </div>
      </div>

      {/* 3. Modals */}
      <FileUpload 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)}
        onUploadComplete={handleUploadComplete}
      />

      <DeleteModal 
        isOpen={deleteModal.open}
        filename={deleteModal.file}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ open: false, file: null, category: null })}
      />
    </div>
  );
}

export default App;
