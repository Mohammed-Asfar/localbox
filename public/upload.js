/**
 * LocalBox - Upload Handler
 * Uses Uppy with TUS plugin for resumable uploads
 */

// Speed tracking variables
let lastBytesUploaded = 0;
let lastTimestamp = Date.now();
let currentSpeed = 0;
let speedHistory = [];
const SPEED_HISTORY_SIZE = 5; // Average over last 5 readings for smoother display

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
        chunkSize: 100 * 1024 * 1024, // 100MB chunks
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
    // Reset speed tracking
    lastBytesUploaded = 0;
    lastTimestamp = Date.now();
    currentSpeed = 0;
    speedHistory = [];
    showSpeedDisplay();
});

// Event: Upload progress
uppy.on('upload-progress', (file, progress) => {
    const percent = Math.round((progress.bytesUploaded / progress.bytesTotal) * 100);

    // Calculate upload speed
    const now = Date.now();
    const timeDiff = (now - lastTimestamp) / 1000; // seconds

    if (timeDiff >= 0.5) { // Update every 500ms
        const bytesDiff = progress.bytesUploaded - lastBytesUploaded;
        const instantSpeed = bytesDiff / timeDiff; // bytes per second

        // Add to history for smoothing
        speedHistory.push(instantSpeed);
        if (speedHistory.length > SPEED_HISTORY_SIZE) {
            speedHistory.shift();
        }

        // Calculate average speed
        currentSpeed = speedHistory.reduce((a, b) => a + b, 0) / speedHistory.length;

        lastBytesUploaded = progress.bytesUploaded;
        lastTimestamp = now;

        // Update speed display
        updateSpeedDisplay(currentSpeed, progress.bytesTotal - progress.bytesUploaded);
    }

    console.log(`📊 ${file.name}: ${percent}% @ ${formatSpeed(currentSpeed)}`);
});

// Event: Single file upload complete
uppy.on('upload-success', (file, response) => {
    console.log(`✅ Uploaded: ${file.name}`);
    showToast(`Uploaded: ${file.name}`, 'success');
});

// Event: All uploads complete
uppy.on('complete', (result) => {
    console.log('🎉 All uploads complete:', result.successful.length, 'files');
    hideSpeedDisplay();

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

/**
 * Format speed to human readable (bytes/s to KB/s, MB/s, etc.)
 */
function formatSpeed(bytesPerSecond) {
    if (bytesPerSecond === 0) return '0 B/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format time remaining
 */
function formatETA(seconds) {
    if (!isFinite(seconds) || seconds <= 0) return '--';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

/**
 * Show speed display element
 */
function showSpeedDisplay() {
    let speedEl = document.getElementById('upload-speed-display');
    if (!speedEl) {
        speedEl = document.createElement('div');
        speedEl.id = 'upload-speed-display';
        speedEl.className = 'fixed bottom-4 left-4 bg-dark-800/95 backdrop-blur-sm border border-dark-600 rounded-xl px-4 py-3 shadow-2xl z-50 min-w-[200px]';
        speedEl.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-3 h-3 bg-primary-500 rounded-full animate-pulse"></div>
                <div>
                    <div class="text-sm text-dark-400">Upload Speed</div>
                    <div class="text-lg font-bold text-primary-400" id="speed-value">Calculating...</div>
                </div>
            </div>
            <div class="mt-2 pt-2 border-t border-dark-700 flex justify-between text-sm">
                <span class="text-dark-400">ETA:</span>
                <span class="text-dark-200" id="eta-value">--</span>
            </div>
        `;
        document.body.appendChild(speedEl);
    }
    speedEl.style.display = 'block';
}

/**
 * Hide speed display element
 */
function hideSpeedDisplay() {
    const speedEl = document.getElementById('upload-speed-display');
    if (speedEl) {
        speedEl.style.display = 'none';
    }
}

/**
 * Update speed display with current values
 */
function updateSpeedDisplay(speed, remainingBytes) {
    const speedValueEl = document.getElementById('speed-value');
    const etaValueEl = document.getElementById('eta-value');

    if (speedValueEl) {
        speedValueEl.textContent = formatSpeed(speed);
    }
    if (etaValueEl && speed > 0) {
        const etaSeconds = remainingBytes / speed;
        etaValueEl.textContent = formatETA(etaSeconds);
    }
}

// Make formatBytes available globally
window.formatBytes = formatBytes;
window.formatSpeed = formatSpeed;
window.showToast = showToast;
