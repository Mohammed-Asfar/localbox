/**
 * LocalBox - File List Handler
 * Handles file browsing, categorization, and file operations
 */

// Current category filter
let currentCategory = 'all';
let pendingDelete = null;

// Category icons and colors
const CATEGORY_CONFIG = {
    images: { icon: '🖼️', color: 'from-pink-500 to-rose-500' },
    documents: { icon: '📄', color: 'from-blue-500 to-indigo-500' },
    archives: { icon: '📦', color: 'from-amber-500 to-orange-500' },
    videos: { icon: '🎬', color: 'from-purple-500 to-violet-500' },
    audio: { icon: '🎵', color: 'from-green-500 to-emerald-500' },
    others: { icon: '📁', color: 'from-gray-500 to-slate-500' },
};

/**
 * Initialize file list on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    // Set up category tab click handlers
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const category = tab.dataset.category;
            setActiveCategory(category);
            loadFiles(category);
        });
    });

    // Load initial files
    loadFiles('all');
    loadStats();
});

/**
 * Set active category tab
 */
function setActiveCategory(category) {
    currentCategory = category;
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.category === category) {
            tab.classList.add('active');
        }
    });
}

/**
 * Load files from API
 */
async function loadFiles(category = 'all') {
    const grid = document.getElementById('files-grid');
    const emptyState = document.getElementById('empty-state');
    const loadingState = document.getElementById('loading-state');

    // Show loading
    grid.innerHTML = '';
    loadingState.classList.remove('hidden');
    emptyState.classList.add('hidden');

    try {
        const url = category === 'all' ? '/api/files' : `/api/files?category=${category}`;
        const response = await fetch(url);
        const data = await response.json();

        loadingState.classList.add('hidden');

        if (data.files.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }

        // Render files
        data.files.forEach(file => {
            grid.appendChild(createFileCard(file));
        });
    } catch (error) {
        console.error('Error loading files:', error);
        loadingState.classList.add('hidden');
        grid.innerHTML = `
      <div class="col-span-full text-center py-8 text-red-400">
        <p>Failed to load files. Please try again.</p>
      </div>
    `;
    }
}

/**
 * Create file card element
 */
function createFileCard(file) {
    const config = CATEGORY_CONFIG[file.category] || CATEGORY_CONFIG.others;
    const card = document.createElement('div');
    card.className = 'file-card bg-dark-800 rounded-2xl p-4 border border-dark-700 hover:border-dark-600';

    const fileExt = file.name.split('.').pop().toUpperCase();
    const fileDate = new Date(file.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    card.innerHTML = `
    <div class="flex items-start gap-4">
      <!-- File Icon -->
      <div class="w-12 h-12 bg-gradient-to-br ${config.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
        <span class="text-xl">${config.icon}</span>
      </div>
      
      <!-- File Info -->
      <div class="flex-1 min-w-0">
        <h3 class="font-medium text-dark-100 truncate" title="${file.name}">${file.name}</h3>
        <div class="flex items-center gap-2 mt-1 text-sm text-dark-400">
          <span class="px-2 py-0.5 bg-dark-700 rounded text-xs">${fileExt}</span>
          <span>${formatBytes(file.size)}</span>
        </div>
        <p class="text-xs text-dark-500 mt-2">${fileDate}</p>
      </div>
    </div>
    
    <!-- Actions -->
    <div class="flex gap-2 mt-4 pt-4 border-t border-dark-700">
      <button onclick="downloadFile('${file.category}', '${encodeURIComponent(file.name)}')" 
              class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-600/20 hover:bg-primary-600/30 text-primary-400 rounded-xl transition text-sm">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
        Download
      </button>
      <button onclick="openDeleteModal('${file.category}', '${encodeURIComponent(file.name)}')" 
              class="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl transition">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </button>
    </div>
  `;

    return card;
}

/**
 * Download file
 */
function downloadFile(category, filename) {
    const url = `/api/download/${category}/${filename}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = decodeURIComponent(filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

/**
 * Open delete confirmation modal
 */
function openDeleteModal(category, filename) {
    pendingDelete = { category, filename: decodeURIComponent(filename) };
    document.getElementById('delete-filename').textContent = pendingDelete.filename;
    document.getElementById('delete-modal').classList.remove('hidden');
    document.getElementById('delete-modal').classList.add('flex');
}

/**
 * Close delete modal
 */
function closeDeleteModal() {
    pendingDelete = null;
    document.getElementById('delete-modal').classList.add('hidden');
    document.getElementById('delete-modal').classList.remove('flex');
}

/**
 * Confirm and execute delete
 */
async function confirmDelete() {
    if (!pendingDelete) return;

    try {
        const response = await fetch(`/api/files/${pendingDelete.category}/${encodeURIComponent(pendingDelete.filename)}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            showToast(`Deleted: ${pendingDelete.filename}`, 'success');
            loadFiles(currentCategory);
            loadStats();
        } else {
            showToast('Failed to delete file', 'error');
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        showToast('Failed to delete file', 'error');
    }

    closeDeleteModal();
}

/**
 * Refresh files (called from refresh button)
 */
function refreshFiles() {
    loadFiles(currentCategory);
    loadStats();
}

/**
 * Load storage statistics
 */
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();

        document.getElementById('total-files').textContent = data.total.files;
        document.getElementById('total-size').textContent = formatBytes(data.total.size);
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Make functions globally available
window.refreshFiles = refreshFiles;
window.loadStats = loadStats;
window.downloadFile = downloadFile;
window.openDeleteModal = openDeleteModal;
window.closeDeleteModal = closeDeleteModal;
window.confirmDelete = confirmDelete;
