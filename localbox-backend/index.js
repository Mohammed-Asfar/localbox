const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { Server } = require('@tus/server');
const { FileStore } = require('@tus/file-store');
const { categorizeFile, getCategories } = require('./categorizer');

// Configuration
const PORT = process.env.PORT || 4000;
const STORAGE_DIR = '/home/izonak/Downloads/localboxstorage';
const TMP_DIR = path.join(STORAGE_DIR, 'tmp');

// Ensure storage directories exist
const categories = getCategories();
[TMP_DIR, ...categories.map(c => path.join(STORAGE_DIR, c))].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Create TUS server with file store
const tusServer = new Server({
    path: '/files',
    datastore: new FileStore({
        directory: TMP_DIR,
    }),
    // Handle upload completion
    onUploadFinish: async (req, res, upload) => {
        try {
            const metadata = upload.metadata || {};
            const originalFilename = metadata.filename || `upload_${Date.now()}`;
            const uploadPath = path.join(TMP_DIR, upload.id);

            // Wait a bit to ensure file is fully written
            await new Promise(resolve => setTimeout(resolve, 100));

            // Categorize and move file
            const result = await categorizeFile(uploadPath, originalFilename, STORAGE_DIR);

            // Clean up .json metadata file
            const metaFile = uploadPath + '.json';
            if (fs.existsSync(metaFile)) {
                fs.unlinkSync(metaFile);
            }

            console.log(`✅ Upload complete: ${result.category}/${result.filename}`);

            return res;
        } catch (error) {
            console.error('Error processing upload:', error);
            throw error;
        }
    },
});

// Mount TUS server
app.all('/files', (req, res) => tusServer.handle(req, res));
app.all('/files/*', (req, res) => tusServer.handle(req, res));

// API: List files by category
app.get('/api/files', (req, res) => {
    const category = req.query.category;
    const categoriesToList = category && category !== 'all' ? [category] : getCategories();

    const files = [];

    categoriesToList.forEach(cat => {
        const catDir = path.join(STORAGE_DIR, cat);
        if (fs.existsSync(catDir)) {
            const catFiles = fs.readdirSync(catDir).map(filename => {
                const filePath = path.join(catDir, filename);
                const stats = fs.statSync(filePath);
                return {
                    name: filename,
                    category: cat,
                    size: stats.size,
                    createdAt: stats.birthtime,
                    modifiedAt: stats.mtime,
                };
            });
            files.push(...catFiles);
        }
    });

    // Sort by most recent first
    files.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
        files,
        total: files.length,
    });
});

// API: Get storage statistics
app.get('/api/stats', async (req, res) => {
    const stats = {};
    let totalSize = 0;
    let totalFiles = 0;

    getCategories().forEach(cat => {
        const catDir = path.join(STORAGE_DIR, cat);
        let catSize = 0;
        let catCount = 0;

        if (fs.existsSync(catDir)) {
            fs.readdirSync(catDir).forEach(filename => {
                const filePath = path.join(catDir, filename);
                try {
                    const fileStats = fs.statSync(filePath);
                    catSize += fileStats.size;
                    catCount++;
                } catch (e) {
                    // Ignore errors for individual files
                }
            });
        }

        stats[cat] = {
            count: catCount,
            size: catSize,
        };

        totalSize += catSize;
        totalFiles += catCount;
    });

    let diskInfo = { free: 0, size: 0 };
    try {
        // check-disk-space returns { diskPath, free, size }
        const checkDiskSpace = require('check-disk-space').default;
        diskInfo = await checkDiskSpace(STORAGE_DIR);
    } catch (error) {
        console.error('Error fetching disk space:', error);
    }

    res.json({
        categories: stats,
        total: {
            files: totalFiles,
            size: totalSize, // Size of files managed by app
        },
        disk: {
            free: diskInfo.free,
            total: diskInfo.size,
            used: diskInfo.size - diskInfo.free
        }
    });
});

// API: Download file
app.get('/api/download/:category/:filename', (req, res) => {
    const { category, filename } = req.params;
    const filePath = path.join(STORAGE_DIR, category, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath);
});

// API: Delete file
app.delete('/api/files/:category/:filename', (req, res) => {
    const { category, filename } = req.params;
    const filePath = path.join(STORAGE_DIR, category, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    try {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted: ${category}/${filename}`);
        res.json({ success: true, message: 'File deleted' });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

// API: Rename file
app.put('/api/files/:category/:filename', (req, res) => {
    const { category, filename } = req.params;
    const { newName } = req.body;

    if (!newName || newName.trim() === '') {
        return res.status(400).json({ error: 'New name is required' });
    }

    const oldPath = path.join(STORAGE_DIR, category, filename);
    const newPath = path.join(STORAGE_DIR, category, newName.trim());

    if (!fs.existsSync(oldPath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    if (fs.existsSync(newPath)) {
        return res.status(409).json({ error: 'A file with this name already exists' });
    }

    try {
        fs.renameSync(oldPath, newPath);
        console.log(`✏️ Renamed: ${category}/${filename} -> ${newName}`);
        res.json({ success: true, message: 'File renamed', newName: newName.trim() });
    } catch (error) {
        console.error('Error renaming file:', error);
        res.status(500).json({ error: 'Failed to rename file' });
    }
});

// API: Move file to different category
app.patch('/api/files/:category/:filename/move', (req, res) => {
    const { category, filename } = req.params;
    const { newCategory } = req.body;

    if (!newCategory || !getCategories().includes(newCategory)) {
        return res.status(400).json({ error: 'Invalid category' });
    }

    if (category === newCategory) {
        return res.status(400).json({ error: 'File is already in this category' });
    }

    const oldPath = path.join(STORAGE_DIR, category, filename);
    const newPath = path.join(STORAGE_DIR, newCategory, filename);

    if (!fs.existsSync(oldPath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    if (fs.existsSync(newPath)) {
        return res.status(409).json({ error: 'A file with this name already exists in the target category' });
    }

    try {
        fs.renameSync(oldPath, newPath);
        console.log(`📦 Moved: ${category}/${filename} -> ${newCategory}/${filename}`);
        res.json({ success: true, message: 'File moved', newCategory });
    } catch (error) {
        console.error('Error moving file:', error);
        res.status(500).json({ error: 'Failed to move file' });
    }
});

// API: Get available categories (for move dropdown)
app.get('/api/categories', (req, res) => {
    res.json({ categories: getCategories() });
});

// Get local IP address
function getLocalIP() {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal (loopback) and non-IPv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// Start server
const HOST = '0.0.0.0';
const LOCAL_IP = getLocalIP();
app.listen(PORT, HOST, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   📦 LocalBox is running!                                  ║
║                                                            ║
║   🌐 Local:   http://localhost:${PORT}                       ║
║   🌐 Network: http://${LOCAL_IP}:${PORT}
║   📁 Storage: ${STORAGE_DIR}
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});
