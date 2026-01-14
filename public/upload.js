/**
 * LocalBox - Upload Handler
 * Uses Uppy with TUS plugin for resumable uploads
 */

// Initialize Uppy with Dashboard and Tus plugins
const uppy = new Uppy.Uppy({
    debug: true,
    autoProceed: true,
    restrictions: {
        maxFileSize: null, // No size limit
        maxNumberOfFiles: null, // No file count limit
    },
    meta: {
        // Add any default metadata here
    },
})
    .use(Uppy.Dashboard, {
        target: '#uppy-dashboard',
        inline: true,
        height: 350,
        width: '100%',
        showProgressDetails: true,
        proudlyDisplayPoweredByUppy: false,
        note: 'Drag & drop files here or click to browse. Large files will auto-resume if interrupted.',
        theme: 'dark',
        showRemoveButtonAfterComplete: true,
        doneButtonHandler: () => {
            uppy.cancelAll();
        },
    })
    .use(Uppy.Tus, {
        endpoint: '/files',
        retryDelays: [0, 1000, 3000, 5000], // Retry delays in ms
        chunkSize: 5 * 1024 * 1024, // 5MB chunks
        removeFingerprintOnSuccess: true,
        // Store uploads in localStorage for resume capability
        storeFingerprintForResuming: true,
        // Include file metadata
        headers: {},
        async onBeforeRequest(req, file) {
            // Could add authentication headers here if needed
        },
    });

// Event: Upload started
uppy.on('upload', () => {
    console.log('📤 Upload started');
});

// Event: Upload progress
uppy.on('upload-progress', (file, progress) => {
    const percent = Math.round((progress.bytesUploaded / progress.bytesTotal) * 100);
    console.log(`📊 ${file.name}: ${percent}%`);
});

// Event: Single file upload complete
uppy.on('upload-success', (file, response) => {
    console.log(`✅ Uploaded: ${file.name}`);
    showToast(`Uploaded: ${file.name}`, 'success');
});

// Event: All uploads complete
uppy.on('complete', (result) => {
    console.log('🎉 All uploads complete:', result.successful.length, 'files');

    if (result.successful.length > 0) {
        // Refresh file list after uploads complete
        setTimeout(() => {
            if (typeof refreshFiles === 'function') {
                refreshFiles();
                loadStats();
            }
        }, 500);

        showToast(`${result.successful.length} file(s) uploaded successfully!`, 'success');
    }

    if (result.failed.length > 0) {
        showToast(`${result.failed.length} file(s) failed to upload`, 'error');
    }
});

// Event: Upload error
uppy.on('upload-error', (file, error, response) => {
    console.error(`❌ Error uploading ${file.name}:`, error);
    showToast(`Failed: ${file.name}`, 'error');
});

// Event: Retry
uppy.on('upload-retry', (fileID) => {
    console.log('🔄 Retrying upload:', fileID);
});

// Event: File added
uppy.on('file-added', (file) => {
    console.log(`📁 File added: ${file.name} (${formatBytes(file.size)})`);
});

// Event: File removed
uppy.on('file-removed', (file) => {
    console.log(`🗑️ File removed: ${file.name}`);
});

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-xl shadow-2xl z-50 transform transition-all duration-300 translate-y-20 opacity-0`;

    // Set colors based on type
    switch (type) {
        case 'success':
            toast.classList.add('bg-green-600', 'text-white');
            toast.innerHTML = `<span class="mr-2">✅</span>${message}`;
            break;
        case 'error':
            toast.classList.add('bg-red-600', 'text-white');
            toast.innerHTML = `<span class="mr-2">❌</span>${message}`;
            break;
        default:
            toast.classList.add('bg-primary-600', 'text-white');
            toast.innerHTML = `<span class="mr-2">ℹ️</span>${message}`;
    }

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-20', 'opacity-0');
    });

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Make formatBytes available globally
window.formatBytes = formatBytes;
window.showToast = showToast;
