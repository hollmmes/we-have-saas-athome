# Main.ts Refactoring Status

## ✅ Completed Modules

### 1. src/utils/helpers.ts
- `formatFileSize()` - Format bytes to KB/MB
- `turkceToAscii()` - Convert Turkish characters
- `metinToUrl()` - Convert text to URL slug
- `openFileLocation()` - Open file in system explorer

### 2. src/utils/icons.ts
- `initIcons()` - Initialize Lucide icons
- Global `createIcons()` function for dynamic updates

### 3. src/utils/navigation.ts
- `checkOutputFolder()` - Verify output folder is set
- `setupNavigation()` - Handle page navigation with folder checks
- `setupSidebarToggle()` - Mobile sidebar toggle

### 4. src/pages/home.ts
- `checkOutputFolder()` - Check and display folder status
- `setupHomePage()` - Folder selection and subfolder creation
- Handles output folder setup with validation

### 5. src/pages/converter.ts (Complete)
- `setupConverterPage()` - Initialize image converter
- `handleFilePaths()` - Handle dropped image files
- `loadConvertedResults()` - Display recent conversions
- File selection, format/quality controls, conversion queue
- Global functions: `clearSelectedFiles`, `removeFile`, `convertAllFiles`

### 6. src/pages/video.ts (Complete)
- `setupVideoPage()` - Initialize video optimizer
- `addVideosToSelection()` - Add videos to optimize queue
- `addVideosToMerge()` - Add videos to merge queue
- `loadRecentVideos()` - Display recent video conversions
- Tab switching (Optimize/Merge)
- Video player modal
- Global functions: `clearSelectedVideos`, `removeVideo`, `optimizeAllVideos`, `clearMergeVideos`, `removeMergeVideo`, `playVideo`

### 7. src/pages/seo.ts (Complete)
- `setupSeoPage()` - Initialize SEO tools
- SEO keyword conversion (Blog hashtag, SLUG, Social media hashtag)
- Turkish character handling
- Global function: `copyToClipboard`

### 8. src/pages/database.ts (Complete)
- `loadDatabaseStats()` - Calculate and display database statistics
- `setupDatabasePage()` - Initialize database page
- Shows image/video/domain counts and database size

## 📝 Remaining Modules to Create

### 9. src/pages/resize.ts
**Lines in original:** ~1700-1900
**Functions needed:**
- `setupResizePage()` - Initialize resize tool
- Dimension management (width/height inputs)
- Badge system for saved dimensions
- Canvas rendering for previews
- Download all functionality
- Global functions: `saveDimensionBtn`, `clearResizeBtn`, `downloadAllBtn`

### 10. src/pages/crop.ts
**Lines in original:** ~2100-2400
**Functions needed:**
- `setupCropPage()` - Initialize crop editor
- Template selection (Instagram, Facebook, YouTube, etc.)
- Canvas-based crop editor
- Drag and resize handlers
- Rotation functionality
- Save and download
- Global functions: crop box interaction handlers

### 11. src/pages/monitor.ts
**Lines in original:** ~2400-2500
**Functions needed:**
- `setupMonitorPage()` - Initialize SSL/Domain monitor
- `loadDomains()` - Load and display domain list
- Add domain functionality
- Refresh all domains
- SSL certificate checking
- WHOIS data fetching
- Global function: `deleteDomainEntry`

### 12. src/pages/archive.ts
**Lines in original:** ~1400-1600
**Functions needed:**
- `setupArchivePage()` - Initialize archive page
- `loadArchive()` - Load all media (images + videos)
- Selection management
- Bulk delete with confirmation
- Individual delete without confirmation
- Global functions: `toggleSelection`, `deleteMedia`

### 13. src/utils/file-drop.ts
**Lines in original:** ~400-500
**Functions needed:**
- `setupFileDrop()` - Setup Tauri file drop listeners
- Route dropped files to correct page (converter/video/resize/crop)
- Handle drag-over, drag-drop, drag-leave events

### 14. src/main.ts (Refactored)
**Current:** 2500+ lines
**Target:** ~300-400 lines
**Contents:**
- Import all modules
- HTML template generation (keep in main for structure visibility)
- Database initialization
- Update checker setup
- Call all setup functions
- File drop initialization

## Implementation Guide

### For Resize Page (src/pages/resize.ts)
```typescript
import { initIcons } from '../utils/icons';

let resizeW = 350;
let resizeH = 390;
let resizeBadges = [{ w: 350, h: 390 }, { w: 1200, h: 1200 }, { w: 480, h: 600 }];
let originalResizeImages: Array<{ img: HTMLImageElement; name: string }> = [];

export function setupResizePage() {
  // Setup dimension inputs
  // Setup file input and drop zone
  // Setup badges
  // Setup buttons (save dimension, clear, download all)
}

function refreshResizeGallery() {
  // Re-render all canvases with new dimensions
}

function renderResizeCanvas(img: HTMLImageElement, name: string) {
  // Create canvas with specified dimensions
  // Draw scaled image
  // Add download button
}

function renderResizeBadges() {
  // Render saved dimension badges
  // Add click handlers
}
```

### For Crop Page (src/pages/crop.ts)
```typescript
import { initIcons } from '../utils/icons';

let cropImage: HTMLImageElement | null = null;
let cropState = {
  x: 0, y: 0, width: 0, height: 0,
  aspectRatio: 0, targetWidth: 0, targetHeight: 0,
  rotation: 0, isDragging: false, isResizing: false
};

export function setupCropPage() {
  // Setup template buttons
  // Setup file upload
  // Setup crop controls (reset, rotate, save)
  // Setup mouse handlers for drag/resize
}

function loadCropImage(file: File) {
  // Load image into canvas
}

function initCropCanvas() {
  // Initialize canvas with image
}

function updateCropBox() {
  // Update crop box position and size
}
```

### For Monitor Page (src/pages/monitor.ts)
```typescript
import { saveDomain, getDomains, deleteDomain as deleteDomainFromDB } from '../database';
import { initIcons } from '../utils/icons';

export function setupMonitorPage() {
  // Setup add domain button
  // Setup refresh all button
}

export async function loadDomains() {
  // Fetch domains from database
  // Render table
}

async function addDomain() {
  // Call Rust check_ssl_certificate
  // Save to database
  // Reload list
}

async function refreshAllDomains() {
  // Loop through all domains
  // Re-check each one
  // Update database
}
```

### For Archive Page (src/pages/archive.ts)
```typescript
import { getAllMedia, deleteImage, deleteVideo } from '../database';
import { initIcons } from '../utils/icons';

let selectedMedia: Set<string> = new Set();

export function setupArchivePage() {
  // Setup selection handlers
  // Setup delete buttons
}

export async function loadArchive() {
  // Fetch all media
  // Load thumbnails
  // Render grid
}

function toggleSelection(id: string, type: string) {
  // Add/remove from selection
  // Update UI
}

async function deleteSelected() {
  // Confirm deletion
  // Delete all selected
  // Reload archive
}
```

### For File Drop (src/utils/file-drop.ts)
```typescript
export async function setupFileDrop(
  handleImagePaths: (paths: string[]) => Promise<void>,
  handleVideoPaths: (paths: string[]) => Promise<void>
) {
  const { listen } = await import('@tauri-apps/api/event');
  
  await listen('tauri://drag-over', () => {
    // Add drag-over class to active drop zone
  });

  await listen('tauri://drag-drop', async (event: any) => {
    // Route files based on active page
  });

  await listen('tauri://drag-leave', () => {
    // Remove drag-over class
  });
}
```

## Next Steps

1. Create remaining page modules (resize, crop, monitor, archive)
2. Create file-drop utility
3. Refactor main.ts to use all modules
4. Test thoroughly
5. Remove old code once verified

## Benefits Achieved

- ✅ Separated concerns (each page is independent)
- ✅ Reusable utilities (helpers, icons, navigation)
- ✅ Easier to maintain (find code quickly)
- ✅ Better for testing (can test modules individually)
- ✅ Clearer structure (obvious where each feature lives)
- ✅ No performance impact (all code still bundles together)

## File Size Comparison

**Before:**
- main.ts: 2514 lines

**After (when complete):**
- main.ts: ~300-400 lines
- utils/helpers.ts: ~30 lines
- utils/icons.ts: ~35 lines
- utils/navigation.ts: ~80 lines
- utils/file-drop.ts: ~50 lines (to be created)
- pages/home.ts: ~60 lines
- pages/converter.ts: ~200 lines
- pages/video.ts: ~250 lines
- pages/seo.ts: ~60 lines
- pages/resize.ts: ~150 lines (to be created)
- pages/crop.ts: ~400 lines (to be created)
- pages/monitor.ts: ~150 lines (to be created)
- pages/archive.ts: ~200 lines (to be created)
- pages/database.ts: ~70 lines

**Total:** ~2035 lines (split across 14 files)
**Average per file:** ~145 lines
**Largest file:** crop.ts (~400 lines) - still manageable!

## Testing Strategy

After completing refactoring:

1. Test each page individually
2. Verify all onclick handlers work
3. Check file drop on each page
4. Verify navigation between pages
5. Test with actual files (images, videos)
6. Check database operations
7. Verify icons render correctly
8. Test on mobile viewport (sidebar toggle)

## Conclusion

The refactoring is well underway! The most complex pages (converter, video) are complete, showing the pattern for the remaining pages. The structure is clean, maintainable, and follows best practices for TypeScript/Tauri applications.
