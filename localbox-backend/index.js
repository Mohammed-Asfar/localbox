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

            // Check if user specified category and path
            const userCategory = metadata.category;
            const userPath = metadata.uploadPath || '';
            // Get relativePath from folder uploads (e.g., "MyFolder/SubFolder/file.txt")
            const relativePath = metadata.relativePath || '';

            let result;

            if (userCategory && getCategories().includes(userCategory)) {
                // User specified a valid category - move to that location
                let targetDir = userPath 
                    ? path.join(STORAGE_DIR, userCategory, userPath)
                    : path.join(STORAGE_DIR, userCategory);

                // If relativePath exists (folder upload), append the folder structure
                if (relativePath) {
                    // relativePath is like "FolderName/SubFolder/filename.ext"
                    // We need the directory part only
                    const relativeDir = path.dirname(relativePath);
                    if (relativeDir && relativeDir !== '.') {
                        targetDir = path.join(targetDir, relativeDir);
                    }
                }

                // Ensure target directory exists
                if (!fs.existsSync(targetDir)) {
                    fs.mkdirSync(targetDir, { recursive: true });
                }

                const targetPath = path.join(targetDir, originalFilename);
                
                // Check for duplicate and rename if needed
                let finalPath = targetPath;
                let counter = 1;
                while (fs.existsSync(finalPath)) {
                    const ext = path.extname(originalFilename);
                    const name = path.basename(originalFilename, ext);
                    finalPath = path.join(targetDir, `${name} (${counter})${ext}`);
                    counter++;
                }

                fs.renameSync(uploadPath, finalPath);
                
                result = {
                    category: userCategory,
                    filename: path.basename(finalPath),
                    path: userPath
                };
            } else {
                // Auto-categorize based on file extension (fallback)
                result = await categorizeFile(uploadPath, originalFilename, STORAGE_DIR);
            }

            // Clean up .json metadata file
            const metaFile = uploadPath + '.json';
            if (fs.existsSync(metaFile)) {
                fs.unlinkSync(metaFile);
            }

            console.log(`✅ Upload complete: ${result.category}/${result.path ? result.path + '/' : ''}${result.filename}`);

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

// API: List files and folders by category and path
app.get('/api/files', (req, res) => {
    const category = req.query.category;
    const subPath = req.query.path || ''; // e.g., 'vacation/2024'
    
    // If no category specified, list all from all categories (flat)
    if (!category || category === 'all') {
        const files = [];
        getCategories().forEach(cat => {
            const catDir = path.join(STORAGE_DIR, cat);
            if (fs.existsSync(catDir)) {
                const catFiles = fs.readdirSync(catDir)
                    .filter(name => {
                        const fPath = path.join(catDir, name);
                        return fs.statSync(fPath).isFile();
                    })
                    .map(filename => {
                        const filePath = path.join(catDir, filename);
                        const stats = fs.statSync(filePath);
                        return {
                            name: filename,
                            category: cat,
                            type: 'file',
                            size: stats.size,
                            createdAt: stats.birthtime,
                            modifiedAt: stats.mtime,
                            path: '',
                        };
                    });
                files.push(...catFiles);
            }
        });
        files.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return res.json({ files, total: files.length, currentPath: '', parentPath: null });
    }

    // Specific category with optional path
    const targetDir = subPath 
        ? path.join(STORAGE_DIR, category, subPath)
        : path.join(STORAGE_DIR, category);

    if (!fs.existsSync(targetDir)) {
        return res.json({ files: [], total: 0, currentPath: subPath, parentPath: getParentPath(subPath) });
    }

    const items = [];
    const entries = fs.readdirSync(targetDir);

    entries.forEach(name => {
        const fullPath = path.join(targetDir, name);
        const stats = fs.statSync(fullPath);
        const isFolder = stats.isDirectory();

        items.push({
            name,
            category,
            type: isFolder ? 'folder' : 'file',
            size: isFolder ? 0 : stats.size,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime,
            path: subPath ? `${subPath}/${name}` : name,
        });
    });

    // Sort: folders first, then files by date
    items.sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json({
        files: items,
        total: items.length,
        currentPath: subPath,
        parentPath: getParentPath(subPath),
    });
});

// Helper to get parent path
function getParentPath(p) {
    if (!p) return null;
    const parts = p.split('/');
    parts.pop();
    return parts.join('/');
}

// API: Create folder
app.post('/api/folders', (req, res) => {
    const { category, path: subPath, name } = req.body;

    if (!category || !name) {
        return res.status(400).json({ error: 'Category and name are required' });
    }

    // Sanitize folder name
    const safeName = name.replace(/[<>:"/\\|?*]/g, '').trim();
    if (!safeName) {
        return res.status(400).json({ error: 'Invalid folder name' });
    }

    const targetDir = subPath
        ? path.join(STORAGE_DIR, category, subPath, safeName)
        : path.join(STORAGE_DIR, category, safeName);

    if (fs.existsSync(targetDir)) {
        return res.status(409).json({ error: 'Folder already exists' });
    }

    try {
        fs.mkdirSync(targetDir, { recursive: true });
        console.log(`📁 Created folder: ${category}/${subPath ? subPath + '/' : ''}${safeName}`);
        res.json({ success: true, message: 'Folder created', name: safeName });
    } catch (error) {
        console.error('Error creating folder:', error);
        res.status(500).json({ error: 'Failed to create folder' });
    }
});

// API: Delete folder (must be empty)
app.delete('/api/folders/:category/*', (req, res) => {
    const category = req.params.category;
    const folderPath = req.params[0]; // Everything after /folders/:category/

    const targetDir = path.join(STORAGE_DIR, category, folderPath);

    if (!fs.existsSync(targetDir)) {
        return res.status(404).json({ error: 'Folder not found' });
    }

    const contents = fs.readdirSync(targetDir);
    if (contents.length > 0) {
        return res.status(400).json({ error: 'Folder is not empty' });
    }

    try {
        fs.rmdirSync(targetDir);
        console.log(`🗑️ Deleted folder: ${category}/${folderPath}`);
        res.json({ success: true, message: 'Folder deleted' });
    } catch (error) {
        console.error('Error deleting folder:', error);
        res.status(500).json({ error: 'Failed to delete folder' });
    }
});

// API: Get storage statistics
app.get('/api/stats', async (req, res) => {
    const os = require('os');
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
        const checkDiskSpace = require('check-disk-space').default;
        diskInfo = await checkDiskSpace(STORAGE_DIR);
    } catch (error) {
        console.error('Error fetching disk space:', error);
    }

    // RAM stats
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    res.json({
        categories: stats,
        total: {
            files: totalFiles,
            size: totalSize,
        },
        disk: {
            free: diskInfo.free,
            total: diskInfo.size,
            used: diskInfo.size - diskInfo.free
        },
        memory: {
            total: totalMem,
            free: freeMem,
            used: usedMem
        }
    });
});

// API: Thumbnail - serve images with caching headers for faster loading
app.get('/api/thumbnail/:category/*', (req, res) => {
    const category = req.params.category;
    const filePath = req.params[0];
    const fullPath = path.join(STORAGE_DIR, category, filePath);

    if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    // Check if it's an image
    const ext = path.extname(fullPath).toLowerCase();
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    
    if (!imageExts.includes(ext)) {
        return res.status(400).json({ error: 'Not an image file' });
    }

    // Set aggressive caching headers
    res.set({
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Type': `image/${ext.slice(1) === 'jpg' ? 'jpeg' : ext.slice(1)}`
    });

    // Stream the file
    const stream = fs.createReadStream(fullPath);
    stream.pipe(res);
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

// API: Move file to different category or folder
app.patch('/api/files/:category/*/move', (req, res) => {
    const category = req.params.category;
    const filePath = req.params[0]; // The file path after category
    const { newCategory, targetPath } = req.body;

    // newCategory is required, targetPath is optional (defaults to root of category)
    if (!newCategory || !getCategories().includes(newCategory)) {
        return res.status(400).json({ error: 'Invalid category' });
    }

    const fileName = path.basename(filePath);
    const oldFullPath = path.join(STORAGE_DIR, category, filePath);
    
    // Build new path: category + targetPath (if any) + filename
    const newFullPath = targetPath
        ? path.join(STORAGE_DIR, newCategory, targetPath, fileName)
        : path.join(STORAGE_DIR, newCategory, fileName);

    if (!fs.existsSync(oldFullPath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    if (oldFullPath === newFullPath) {
        return res.status(400).json({ error: 'Source and destination are the same' });
    }

    if (fs.existsSync(newFullPath)) {
        return res.status(409).json({ error: 'A file with this name already exists in the target location' });
    }

    // Ensure target directory exists
    const targetDir = path.dirname(newFullPath);
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    try {
        fs.renameSync(oldFullPath, newFullPath);
        console.log(`📦 Moved: ${category}/${filePath} -> ${newCategory}/${targetPath ? targetPath + '/' : ''}${fileName}`);
        res.json({ success: true, message: 'File moved', newCategory, targetPath });
    } catch (error) {
        console.error('Error moving file:', error);
        res.status(500).json({ error: 'Failed to move file' });
    }
});

// API: Get available categories
app.get('/api/categories', (req, res) => {
    res.json({ categories: getCategories() });
});

// API: List folders in a category (recursive)
app.get('/api/folders/:category', (req, res) => {
    const { category } = req.params;
    const catDir = path.join(STORAGE_DIR, category);
    
    if (!fs.existsSync(catDir)) {
        return res.json({ folders: [] });
    }

    const folders = [];
    
    function scanDir(dir, relativePath = '') {
        const entries = fs.readdirSync(dir);
        entries.forEach(name => {
            const fullPath = path.join(dir, name);
            if (fs.statSync(fullPath).isDirectory()) {
                const folderPath = relativePath ? `${relativePath}/${name}` : name;
                folders.push({ name, path: folderPath });
                scanDir(fullPath, folderPath); // Recursive
            }
        });
    }
    
    scanDir(catDir);
    res.json({ folders });
});

// API: Download folder as ZIP
app.get('/api/download-folder/:category/*', async (req, res) => {
    const archiver = require('archiver');
    const category = req.params.category;
    const folderPath = req.params[0] || '';
    const fullPath = path.join(STORAGE_DIR, category, folderPath);

    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
        return res.status(404).json({ error: 'Folder not found' });
    }

    const folderName = path.basename(folderPath) || category;
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${folderName}.zip"`);

    const archive = archiver('zip', { zlib: { level: 5 } });
    
    archive.on('error', (err) => {
        console.error('Archive error:', err);
        res.status(500).json({ error: 'Failed to create ZIP' });
    });

    archive.pipe(res);
    archive.directory(fullPath, folderName);
    archive.finalize();
    
    console.log(`📦 Downloading folder as ZIP: ${category}/${folderPath}`);
});

// API: Move folder
app.patch('/api/folders/:category/*/move', async (req, res) => {
    const category = req.params.category;
    const folderPath = req.params[0] || '';
    const { newCategory, targetPath } = req.body;

    if (!newCategory) {
        return res.status(400).json({ error: 'New category is required' });
    }

    const sourcePath = path.join(STORAGE_DIR, category, folderPath);
    const folderName = path.basename(folderPath);
    
    if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isDirectory()) {
        return res.status(404).json({ error: 'Folder not found' });
    }

    // Determine destination
    let destDir = path.join(STORAGE_DIR, newCategory);
    if (targetPath) {
        destDir = path.join(destDir, targetPath);
    }
    
    const destPath = path.join(destDir, folderName);

    // Check if destination already exists
    if (fs.existsSync(destPath)) {
        return res.status(409).json({ error: 'A folder with this name already exists at destination' });
    }

    // Ensure destination directory exists
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    try {
        // Move the folder (rename works across same filesystem)
        fs.renameSync(sourcePath, destPath);
        console.log(`📁 Moved folder: ${category}/${folderPath} -> ${newCategory}/${targetPath || ''}/${folderName}`);
        res.json({ success: true, message: 'Folder moved successfully' });
    } catch (error) {
        console.error('Error moving folder:', error);
        res.status(500).json({ error: 'Failed to move folder' });
    }
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
