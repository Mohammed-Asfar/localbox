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
app.get('/api/stats', (req, res) => {
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
                const fileStats = fs.statSync(filePath);
                catSize += fileStats.size;
                catCount++;
            });
        }

        stats[cat] = {
            count: catCount,
            size: catSize,
        };

        totalSize += catSize;
        totalFiles += catCount;
    });

    res.json({
        categories: stats,
        total: {
            files: totalFiles,
            size: totalSize,
        },
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

// Start server
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   📦 LocalBox is running!                             ║
║                                                       ║
║   🌐 Web UI:  http://${HOST}:${PORT}                    ║
║   📁 Storage: ${STORAGE_DIR}
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});
