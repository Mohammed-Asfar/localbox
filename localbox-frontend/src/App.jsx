import Header from './components/Header';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';
import { useState, useEffect } from 'react';
import axios from 'axios';

// API base URL - will be proxied in development
const API_BASE = '/api';

function App() {
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState({ total: { files: 0, size: 0 } });
  const [currentCategory, setCurrentCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch files from API
  const fetchFiles = async (category = 'all') => {
    setIsLoading(true);
    try {
      const url = category === 'all' ? `${API_BASE}/files` : `${API_BASE}/files?category=${category}`;
      const response = await axios.get(url);
      setFiles(response.data.files);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch storage stats
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Delete file
  const deleteFile = async (category, filename) => {
    try {
      await axios.delete(`${API_BASE}/files/${category}/${encodeURIComponent(filename)}`);
      fetchFiles(currentCategory);
      fetchStats();
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  };

  // Handle category change
  const handleCategoryChange = (category) => {
    setCurrentCategory(category);
    fetchFiles(category);
  };

  // Handle upload complete
  const handleUploadComplete = () => {
    setTimeout(() => {
      fetchFiles(currentCategory);
      fetchStats();
    }, 500);
  };

  // Initial load
  useEffect(() => {
    fetchFiles();
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950">
      <Header stats={stats} />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <FileUpload onUploadComplete={handleUploadComplete} />
        
        <FileList
          files={files}
          isLoading={isLoading}
          currentCategory={currentCategory}
          onCategoryChange={handleCategoryChange}
          onDelete={deleteFile}
          onRefresh={() => {
            fetchFiles(currentCategory);
            fetchStats();
          }}
        />
      </main>

      <footer className="border-t border-slate-800 mt-16 py-8 text-center text-slate-500 text-sm">
        <p>LocalBox v1.0.0 • Self-Hosted File Storage</p>
        <p className="mt-1">Your files. Your server. Your control.</p>
      </footer>
    </div>
  );
}

export default App;
