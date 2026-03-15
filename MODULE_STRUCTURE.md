# Module Structure Diagram

## Current Architecture

```
we-have-saas-athome/
├── src/
│   ├── main.ts (2514 lines) ❌ TOO BIG!
│   ├── database.ts
│   ├── updater.ts
│   └── styles.css
```

## New Modular Architecture

```
we-have-saas-athome/
├── src/
│   ├── main.ts (~300 lines) ✅ CLEAN!
│   │   ├── Imports all modules
│   │   ├── HTML template generation
│   │   ├── Database initialization
│   │   ├── Update checker
│   │   └── Calls all setup functions
│   │
│   ├── database.ts (unchanged)
│   ├── updater.ts (unchanged)
│   ├── styles.css (unchanged)
│   │
│   ├── utils/
│   │   ├── helpers.ts (~30 lines) ✅
│   │   │   ├── formatFileSize()
│   │   │   ├── turkceToAscii()
│   │   │   ├── metinToUrl()
│   │   │   └── openFileLocation()
│   │   │
│   │   ├── icons.ts (~35 lines) ✅
│   │   │   └── initIcons()
│   │   │
│   │   ├── navigation.ts (~80 lines) ✅
│   │   │   ├── checkOutputFolder()
│   │   │   ├── setupNavigation()
│   │   │   └── setupSidebarToggle()
│   │   │
│   │   └── file-drop.ts (~50 lines) ⏳
│   │       └── setupFileDrop()
│   │
│   └── pages/
│       ├── home.ts (~60 lines) ✅
│       │   ├── checkOutputFolder()
│       │   └── setupHomePage()
│       │
│       ├── converter.ts (~200 lines) ✅
│       │   ├── setupConverterPage()
│       │   ├── handleFilePaths()
│       │   ├── loadConvertedResults()
│       │   └── Global: clearSelectedFiles, removeFile, convertAllFiles
│       │
│       ├── video.ts (~250 lines) ✅
│       │   ├── setupVideoPage()
│       │   ├── addVideosToSelection()
│       │   ├── addVideosToMerge()
│       │   ├── loadRecentVideos()
│       │   └── Global: clearSelectedVideos, removeVideo, optimizeAllVideos,
│       │       clearMergeVideos, removeMergeVideo, playVideo
│       │
│       ├── seo.ts (~60 lines) ✅
│       │   ├── setupSeoPage()
│       │   └── Global: copyToClipboard
│       │
│       ├── resize.ts (~150 lines) ⏳
│       │   ├── setupResizePage()
│       │   └── Global: dimension controls, clear, download
│       │
│       ├── crop.ts (~400 lines) ⏳
│       │   ├── setupCropPage()
│       │   └── Crop editor logic
│       │
│       ├── monitor.ts (~150 lines) ⏳
│       │   ├── setupMonitorPage()
│       │   ├── loadDomains()
│       │   └── Global: deleteDomainEntry
│       │
│       ├── archive.ts (~200 lines) ⏳
│       │   ├── setupArchivePage()
│       │   ├── loadArchive()
│       │   └── Global: toggleSelection, deleteMedia
│       │
│       └── database.ts (~70 lines) ✅
│           ├── loadDatabaseStats()
│           └── setupDatabasePage()
```

## Module Dependencies

```
main.ts
  ├─> updater.ts
  ├─> database.ts
  │
  ├─> utils/
  │   ├─> helpers.ts
  │   ├─> icons.ts
  │   ├─> navigation.ts
  │   └─> file-drop.ts
  │
  └─> pages/
      ├─> home.ts ──────> utils/icons.ts
      ├─> converter.ts ─> utils/icons.ts, utils/helpers.ts, database.ts
      ├─> video.ts ─────> utils/icons.ts, utils/helpers.ts, database.ts
      ├─> seo.ts ───────> utils/helpers.ts
      ├─> resize.ts ────> utils/icons.ts
      ├─> crop.ts ──────> utils/icons.ts
      ├─> monitor.ts ───> utils/icons.ts, database.ts
      ├─> archive.ts ───> utils/icons.ts, utils/helpers.ts, database.ts
      └─> database.ts ──> utils/icons.ts, database.ts
```

## Data Flow

### Image Conversion Flow
```
User Action (Drop/Select Files)
  ↓
file-drop.ts (routes to converter)
  ↓
converter.ts (handleFilePaths)
  ↓
converter.ts (renderSelectedFiles)
  ↓
User clicks "Convert"
  ↓
converter.ts (convertAllFiles)
  ↓
Rust Backend (convert_image)
  ↓
database.ts (saveImage)
  ↓
converter.ts (loadConvertedResults)
  ↓
Display results
```

### Navigation Flow
```
User clicks nav item
  ↓
navigation.ts (setupNavigation)
  ↓
Check if folder required
  ↓
navigation.ts (checkOutputFolder)
  ↓
If folder missing → redirect to home
If folder exists → show page
  ↓
Call page-specific load function
  ↓
icons.ts (initIcons)
```

## Function Call Graph

### Initialization (on app load)
```
main.ts: DOMContentLoaded
  ├─> initDatabase()
  ├─> Render HTML
  ├─> initIcons()
  ├─> setupUpdateChecker()
  ├─> setupNavigation()
  ├─> setupSidebarToggle()
  ├─> setupHomePage()
  ├─> setupConverterPage()
  ├─> setupVideoPage()
  ├─> setupSeoPage()
  ├─> setupResizePage()
  ├─> setupCropPage()
  ├─> setupMonitorPage()
  ├─> setupArchivePage()
  ├─> setupDatabasePage()
  └─> setupFileDrop()
```

### Page Navigation
```
User clicks nav item
  ├─> navigation.ts: setupNavigation handler
  ├─> Check folder requirement
  ├─> Switch active page
  ├─> Call page loader:
  │   ├─> archive → loadArchive()
  │   ├─> converter → loadConvertedResults()
  │   ├─> settings → loadDatabaseStats()
  │   └─> monitor → loadDomains()
  └─> initIcons()
```

## File Size Breakdown

### Before Refactoring
```
main.ts: ████████████████████████████████████████ 2514 lines (100%)
```

### After Refactoring
```
main.ts:      ████████ 300 lines (12%)
utils/:       ████ 195 lines (8%)
pages/:       ████████████████████████ 1540 lines (61%)
unchanged:    ████ 479 lines (19%)
              ─────────────────────────────────────
Total:        ████████████████████████████████████ 2514 lines (100%)
```

## Benefits Visualization

### Maintainability
```
Before: Find bug in video code
  → Search through 2514 lines ❌
  → Hard to locate issue

After: Find bug in video code
  → Open video.ts (250 lines) ✅
  → Easy to locate issue
```

### Adding Features
```
Before: Add new feature
  → Scroll through massive file ❌
  → Risk breaking existing code
  → Hard to test in isolation

After: Add new feature
  → Create new page module ✅
  → Import utilities
  → Test independently
  → No risk to other features
```

### Code Review
```
Before: Review changes
  → Large diff in single file ❌
  → Hard to understand context
  → Easy to miss issues

After: Review changes
  → Small diff in specific module ✅
  → Clear context
  → Easy to spot issues
```

## Module Responsibilities

### Utils (Shared functionality)
- **helpers.ts**: Pure functions, no side effects
- **icons.ts**: Icon initialization only
- **navigation.ts**: Routing and page switching
- **file-drop.ts**: File drop event handling

### Pages (Feature-specific)
- **home.ts**: Folder setup only
- **converter.ts**: Image conversion only
- **video.ts**: Video optimization and merge only
- **seo.ts**: SEO keyword tools only
- **resize.ts**: Photo resizing only
- **crop.ts**: Photo cropping only
- **monitor.ts**: SSL/Domain monitoring only
- **archive.ts**: Media archive only
- **database.ts**: Database statistics only

### Main (Orchestration)
- **main.ts**: Coordinates everything, minimal logic

## Testing Strategy

### Unit Testing (per module)
```
helpers.ts
  ├─ formatFileSize() → test with various byte values
  ├─ turkceToAscii() → test Turkish characters
  └─ metinToUrl() → test URL slug generation

converter.ts
  ├─ handleFilePaths() → test file filtering
  └─ loadConvertedResults() → test data loading

video.ts
  ├─ addVideosToSelection() → test array management
  └─ loadRecentVideos() → test data loading
```

### Integration Testing (cross-module)
```
Navigation Flow
  ├─ Click nav item → page switches
  ├─ Folder check → redirects if needed
  └─ Icons render → no missing icons

File Drop Flow
  ├─ Drop on converter → images added
  ├─ Drop on video → videos added
  └─ Drop on wrong page → ignored
```

## Summary

✅ **8 modules created** (57% complete)
⏳ **6 modules remaining** (43% to go)

**Estimated completion time:** 8-10 hours
**Estimated testing time:** 2-3 hours
**Total project time:** 10-13 hours

**Result:** Clean, maintainable, modular codebase! 🎉
