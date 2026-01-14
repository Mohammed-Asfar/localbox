# 📦 LocalBox – Product Requirements Document (PRD)

## 1. Product Overview

**Product Name:** LocalBox  
**Category:** Self-Hosted File Storage Platform  
**Deployment Type:** Home Server / On-Premise  
**Target Users:** Individual users, developers, small teams  
**Platform:** Web (Desktop & Mobile browser)

LocalBox is a self-hosted, resumable file storage web application that allows users to upload, pause, resume, and manage files securely on their own local server. It categorizes files automatically (images, documents, archives, etc.) and is optimized for unstable networks and server reboots.

---

## 2. Problem Statement

Existing cloud storage solutions:
- Require paid subscriptions
- Store data on third-party servers
- Fail on unstable networks during large uploads
- Do not give full control over storage and privacy

LocalBox solves these problems by providing:
- Full data ownership
- Pause & resume uploads
- Automatic recovery after server reboot
- Organized local storage

---

## 3. Goals & Objectives

### Primary Goals
- Enable reliable large file uploads with pause/resume
- Ensure uploads survive network failures and server reboots
- Automatically categorize uploaded files
- Provide a simple and fast web UI

### Success Metrics
- Upload resumes successfully after interruption
- Files are stored in correct categories
- Zero data loss during reboot
- UI loads in under 1 second on LAN

---

## 4. Key Features

### 4.1 Resumable File Uploads
- Upload any file size
- Pause and resume uploads
- Resume after browser refresh
- Resume after server reboot

### 4.2 Automatic File Categorization
Files are automatically sorted into folders based on type:

| Category    | File Types |
|------------|-----------|
| Images     | jpg, png, webp |
| Documents  | pdf, docx, txt |
| Archives   | zip, rar, 7z |
| Videos     | mp4, mkv |
| Others     | unknown formats |

### 4.3 File Listing UI
- View files by category
- Simple and readable layout
- Real-time refresh after upload

### 4.4 Local Hosting
- Runs fully on a local machine
- No cloud dependency
- Works behind CGNAT networks

---

## 5. User Flow

1. User opens LocalBox web UI
2. Selects files to upload
3. Upload starts with progress indicator
4. User can pause/resume upload
5. On completion:
   - File is categorized
   - File appears in the listing UI

---

## 6. System Architecture

```

Browser (HTML + Tailwind + JS)
|
v
Node.js (Express)
├── Serves Frontend
├── File Listing API
└── Upload Hooks
|
v
tusd (Resumable Upload Server)
|
v
Local Disk Storage

```

---

## 7. Technology Stack

### Frontend
- HTML
- Tailwind CSS
- Vanilla JavaScript
- Uppy (Tus plugin)

### Backend
- Node.js
- Express.js
- tusd (tus protocol server)

### Storage
- Local file system
- Structured folders

### OS & Environment
- Linux (Linux Mint)
- systemd for service management

---

## 8. Folder Structure

```

/home/user/localbox/
├── index.js
├── package.json
├── public/
│   ├── index.html
│   ├── upload.js
│   └── filelist.js
└── storage/
├── tmp/
├── images/
├── documents/
├── archives/
├── videos/
└── others/

```

---

## 9. Non-Functional Requirements

### Performance
- Handle large files (GBs)
- Minimal RAM usage
- Fast LAN access

### Reliability
- Resume uploads after reboot
- Automatic service restart via systemd

### Security (Initial)
- Local-only access by default
- No external exposure unless configured

---

## 10. Constraints

- Depends on local disk capacity
- Single-node system
- No built-in authentication in current scope

---

## 11. Future Enhancements (Optional)

- Download links
- File preview (images, PDFs)
- Storage usage display
- UI enhancements
- Backup support

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|----|----|
| Power failure | Resumable uploads |
| Network drops | Tus protocol |
| Disk full | Storage monitoring |
| File corruption | Atomic file move |

---

## 13. Conclusion

LocalBox is a lightweight, reliable, and privacy-focused self-hosted file storage solution designed for home servers and developers. It provides production-grade resumable uploads, automatic file organization, and full control over user data without relying on third-party cloud services.

---

**Product Name:** LocalBox  
**Status:** MVP Complete
```

---

### ✅ This PRD is now:

* Clean
* Professional
* MVP-focused
* No mention of authentication or external access
