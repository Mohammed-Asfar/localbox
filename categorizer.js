const fs = require('fs');
const path = require('path');

// File extension to category mapping
const CATEGORY_MAP = {
    // Images
    jpg: 'images',
    jpeg: 'images',
    png: 'images',
    gif: 'images',
    webp: 'images',
    svg: 'images',
    bmp: 'images',
    ico: 'images',

    // Documents
    pdf: 'documents',
    doc: 'documents',
    docx: 'documents',
    txt: 'documents',
    rtf: 'documents',
    xls: 'documents',
    xlsx: 'documents',
    ppt: 'documents',
    pptx: 'documents',
    odt: 'documents',
    ods: 'documents',
    odp: 'documents',
    csv: 'documents',
    md: 'documents',

    // Archives
    zip: 'archives',
    rar: 'archives',
    '7z': 'archives',
    tar: 'archives',
    gz: 'archives',
    bz2: 'archives',
    xz: 'archives',

    // Videos
    mp4: 'videos',
    mkv: 'videos',
    avi: 'videos',
    mov: 'videos',
    webm: 'videos',
    wmv: 'videos',
    flv: 'videos',
    m4v: 'videos',

    // Audio
    mp3: 'audio',
    wav: 'audio',
    flac: 'audio',
    aac: 'audio',
    ogg: 'audio',
    wma: 'audio',
    m4a: 'audio',
};

/**
 * Get category for a file based on its extension
 * @param {string} filename - The filename with extension
 * @returns {string} - Category name
 */
function getCategory(filename) {
    const ext = path.extname(filename).toLowerCase().slice(1);
    return CATEGORY_MAP[ext] || 'others';
}

/**
 * Generate a unique filename if file already exists
 * @param {string} destPath - Destination file path
 * @returns {string} - Unique file path
 */
function getUniqueFilePath(destPath) {
    if (!fs.existsSync(destPath)) {
        return destPath;
    }

    const dir = path.dirname(destPath);
    const ext = path.extname(destPath);
    const baseName = path.basename(destPath, ext);
    let counter = 1;

    while (fs.existsSync(destPath)) {
        destPath = path.join(dir, `${baseName}_${counter}${ext}`);
        counter++;
    }

    return destPath;
}

/**
 * Move uploaded file to the appropriate category folder
 * @param {string} sourcePath - Source file path (from tmp)
 * @param {string} originalFilename - Original filename
 * @param {string} storageDir - Base storage directory
 * @returns {Promise<{category: string, filename: string, path: string}>}
 */
async function categorizeFile(sourcePath, originalFilename, storageDir) {
    const category = getCategory(originalFilename);
    const categoryDir = path.join(storageDir, category);

    // Ensure category directory exists
    if (!fs.existsSync(categoryDir)) {
        fs.mkdirSync(categoryDir, { recursive: true });
    }

    // Get unique destination path
    let destPath = path.join(categoryDir, originalFilename);
    destPath = getUniqueFilePath(destPath);

    const finalFilename = path.basename(destPath);

    // Move file atomically (rename if same filesystem, copy+delete if not)
    try {
        fs.renameSync(sourcePath, destPath);
    } catch (err) {
        // If rename fails (cross-device), use copy + delete
        if (err.code === 'EXDEV') {
            fs.copyFileSync(sourcePath, destPath);
            fs.unlinkSync(sourcePath);
        } else {
            throw err;
        }
    }

    console.log(`📁 Categorized: ${originalFilename} → ${category}/${finalFilename}`);

    return {
        category,
        filename: finalFilename,
        path: destPath,
    };
}

/**
 * Get all available categories
 * @returns {string[]}
 */
function getCategories() {
    return ['images', 'documents', 'archives', 'videos', 'audio', 'others'];
}

module.exports = {
    getCategory,
    categorizeFile,
    getCategories,
    CATEGORY_MAP,
};
