# LocalBox - Product Requirements Document (PRD)

## 1. Product Overview

**LocalBox** is a self-hosted file storage and management application that provides a modern, Mac-like interface for organizing files on a local server. It enables users to upload, preview, organize, and manage files from any device on the same network.

### Vision
A clean, fast, and intuitive file manager that runs on any local machine, accessible from any device without cloud dependencies.

### Target Users
- Home users managing personal files across devices
- Small teams needing shared file storage
- Developers wanting a local file server solution

---

## 2. Technical Architecture

### Stack
| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, Tailwind CSS |
| **Backend** | Node.js, Express |
| **Upload Protocol** | TUS (resumable uploads) |
| **Icons** | Lucide React |

### Project Structure
```
localbox/
├── localbox-backend/     # Express API server
│   ├── index.js          # Main server with all endpoints
│   └── categorizer.js    # File categorization logic
├── localbox-frontend/    # React SPA
│   ├── src/
│   │   ├── App.jsx       # Main application state
│   │   └── components/   # UI components
│   └── dist/             # Production build
└── deploy.sh             # Deployment script
```

---

## 3. Features

### 3.1 File Management

#### Upload System
- **TUS Protocol**: Resumable uploads for large files
- **Folder Selection**: Choose destination category and subfolder
- **Speed Display**: Real-time upload speed and ETA
- **Drag & Drop**: Drop files anywhere on the page

#### File Operations
| Operation | Description |
|-----------|-------------|
| **Preview** | View images, videos, audio, PDFs in-app |
| **Download** | Single or bulk file download |
| **Rename** | Change file names with collision detection |
| **Move** | Move files between categories or folders |
| **Delete** | Remove files with confirmation modal |
| **Bulk Actions** | Select multiple files for batch operations |

#### Folder Support
- Create subfolders within any category
- Navigate via breadcrumb trail
- Delete empty folders

### 3.2 Organization

#### Categories (Auto-detection)
| Category | File Types |
|----------|------------|
| Images | jpg, png, gif, webp, svg, bmp |
| Documents | pdf, doc, docx, xls, xlsx, txt, md |
| Videos | mp4, webm, mov, avi, mkv |
| Audio | mp3, wav, flac, m4a, ogg |
| Archives | zip, rar, 7z, tar, gz |
| Others | Uncategorized files |

#### Search
- Real-time client-side filtering
- Searches across file names

#### Sorting
- Sort by: Name, Date, Size
- Ascending/Descending toggle

### 3.3 User Interface

#### Views
- **List View**: Detailed table with columns (name, date, size, actions)
- **Grid View**: Thumbnail gallery with lazy loading

#### Themes
- **Dark Mode**: Default zinc/black theme
- **Light Mode**: Clean white/gray theme
- Theme persists in localStorage

#### Responsive Design
- Desktop: Full sidebar, all features
- Tablet: Collapsible sidebar
- Mobile: Hamburger menu, simplified actions

### 3.4 System Monitoring

#### Storage Widget
- Disk usage (used/total with progress bar)
- RAM usage (color-coded: green/amber/red)

---

## 4. API Endpoints

### Files
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/files` | List files (supports `?category=` and `?path=`) |
| DELETE | `/api/files/:category/:path` | Delete a file |
| PUT | `/api/files/:category/:path` | Rename a file |
| PATCH | `/api/files/:category/:path/move` | Move file to new location |

### Folders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/folders/:category` | List all folders in category |
| POST | `/api/folders` | Create new folder |
| DELETE | `/api/folders/:category/:path` | Delete empty folder |

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Storage stats (disk, RAM, categories) |
| GET | `/api/categories` | List available categories |
| GET | `/api/thumbnail/:category/:path` | Cached image thumbnails |
| GET | `/api/download/:category/:path` | Download file |

### Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST/PATCH | `/files` | TUS upload endpoint |

---

## 5. Configuration

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4000 | Server port |
| `STORAGE_DIR` | `/home/user/Downloads/localboxstorage` | File storage location |

### Storage Directory Structure
```
STORAGE_DIR/
├── images/
│   └── vacation/
│       └── photo.jpg
├── documents/
├── videos/
├── audio/
├── archives/
└── others/
```

---

## 6. Deployment

### Development
```bash
# Frontend
cd localbox-frontend && npm run dev

# Backend
cd localbox-backend && npm start
```

### Production
```bash
./deploy.sh
# Builds frontend, serves from backend on port 4000
```

### Auto-start (pm2)
```bash
pm2 start npm --name "localbox" -- start
pm2 save
pm2 startup
```

---

## 7. Future Enhancements

### Planned
- [ ] Favorites/Starred files
- [ ] Recent files view
- [ ] Trash/Recycle bin with recovery
- [ ] QR code sharing for mobile access
- [ ] Custom user-defined categories
- [ ] File tagging system

### Considered
- [ ] Multiple user accounts with auth
- [ ] File versioning
- [ ] Thumbnail generation for videos
- [ ] WebSocket for real-time updates
- [ ] Mobile app (React Native)

---

## 8. Performance Optimizations

| Optimization | Implementation |
|--------------|----------------|
| **Lazy Loading** | Images load on scroll (loading="lazy") |
| **Content Visibility** | CSS containment for off-screen items |
| **Image Caching** | Thumbnail endpoint with 1-year cache headers |
| **Streaming** | File downloads use streams |
| **Chunked Uploads** | TUS with 100MB chunks |

---

## 9. Browser Support

| Browser | Support |
|---------|---------|
| Chrome/Edge | ✅ Full |
| Firefox | ✅ Full |
| Safari | ✅ Full |
| Mobile Browsers | ✅ Responsive |

---

*Document Version: 1.0*  
*Last Updated: January 2026*
