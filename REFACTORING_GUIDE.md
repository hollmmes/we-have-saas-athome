# Main.ts Refactoring Guide

## Overview
This guide explains how to refactor the monolithic `main.ts` (2500+ lines) into a modular structure for better maintainability.

## Created Files

### ✅ Already Created:
1. `src/utils/helpers.ts` - Helper functions (formatFileSize, turkceToAscii, metinToUrl, openFileLocation)
2. `src/utils/icons.ts` - Icon initialization
3. `src/utils/navigation.ts` - Navigation and routing logic
4. `src/pages/home.ts` - Home page with folder setup
5. `src/pages/converter.ts` - Image converter logic
6. `src/pages/seo.ts` - SEO tools
7. `src/pages/database.ts` - Database statistics

### 📝 To Be Created:
8. `src/pages/video.ts` - Video optimizer and merge
9. `src/pages/resize.ts` - Photo resize tool
10. `src/pages/crop.ts` - Photo crop editor
11. `src/pages/monitor.ts` - SSL & Domain monitoring
12. `src/pages/archive.ts` - Archive page
13. `src/utils/file-drop.ts` - File drop handler
14. `src/main.ts` - Simplified main entry point

## Module Structure

### src/utils/helpers.ts
```typescript
export function formatFileSize(bytes: number): string
export function turkceToAscii(text: string): string
export function metinToUrl(metin: string): string
export async function openFileLocation(filePath: string): Promise<void>
```

### src/utils/icons.ts
```typescript
export function initIcons(): void
```

### src/utils/navigation.ts
```typescript
export async function checkOutputFolder(): Promise<boolean>
export function setupNavigation(...): void
export function setupSidebarToggle(): void
```

### src/pages/home.ts
```typescript
export async function checkOutputFolder(): Promise<boolean>
export function setupHomePage(): void
```

### src/pages/converter.ts
```typescript
export function setupConverterPage(): void
export async function handleFilePaths(paths: string[]): Promise<void>
export async function loadConvertedResults(): Promise<void>
```

### src/pages/seo.ts
```typescript
export function setupSeoPage(): void
```

### src/pages/database.ts
```typescript
export async function loadDatabaseStats(): Promise<void>
export function setupDatabasePage(): void
```

## Next Steps

### Step 1: Create Remaining Page Modules

Each page module should follow this pattern:

```typescript
// src/pages/[pagename].ts
import { initIcons } from '../utils/icons';
import { /* database functions */ } from '../database';

// State variables
let pageState = {};

// Setup function - called once on app init
export function setup[PageName]Page() {
  // Add event listeners
  // Initialize page-specific logic
}

// Load function - called when page becomes active
export async function load[PageName]Data() {
  // Fetch and display data
}

// Helper functions
function helperFunction() {
  // Page-specific helpers
}

// Make necessary functions global for onclick handlers
(window as any).globalFunction = globalFunction;
```

### Step 2: Extract Video Page
From main.ts lines ~800-1200, extract:
- Video optimization logic
- Video merge logic
- Tab switching
- Video thumbnail loading

### Step 3: Extract Resize Page
From main.ts lines ~1700-1900, extract:
- Resize dimension management
- Badge system
- Canvas rendering
- Download functionality

### Step 4: Extract Crop Page
From main.ts lines ~2100-2400, extract:
- Crop editor canvas
- Template selection
- Drag/resize handlers
- Rotation and save

### Step 5: Extract Monitor Page
From main.ts lines ~2400-2500, extract:
- Domain management
- SSL certificate checking
- Domain table rendering

### Step 6: Extract Archive Page
From main.ts lines ~1400-1600, extract:
- Media loading
- Selection management
- Delete functionality

### Step 7: Create File Drop Handler
Extract file drop logic into `src/utils/file-drop.ts`:
```typescript
export async function setupFileDrop(
  handleImagePaths: (paths: string[]) => Promise<void>,
  handleVideoPaths: (paths: string[]) => Promise<void>
): Promise<void>
```

### Step 8: Simplify main.ts

The new main.ts should be ~200 lines:

```typescript
import { initDatabase } from './database';
import { initIcons } from './utils/icons';
import { setupNavigation, setupSidebarToggle } from './utils/navigation';
import { setupHomePage } from './pages/home';
import { setupConverterPage, loadConvertedResults } from './pages/converter';
import { setupVideoPage, loadRecentVideos } from './pages/video';
import { setupSeoPage } from './pages/seo';
import { setupResizePage } from './pages/resize';
import { setupCropPage } from './pages/crop';
import { setupMonitorPage, loadDomains } from './pages/monitor';
import { setupArchivePage, loadArchive } from './pages/archive';
import { setupDatabasePage, loadDatabaseStats } from './pages/database';
import { setupFileDrop } from './utils/file-drop';
import { checkForUpdates } from './updater';

window.addEventListener("DOMContentLoaded", async () => {
  await initDatabase();
  
  const app = document.querySelector("#app");
  if (app) {
    app.innerHTML = getAppHTML(); // Keep HTML generation in main
    
    initIcons();
    setupUpdateChecker();
    setupNavigation(loadArchive, loadConvertedResults, loadDatabaseStats, loadDomains);
    setupSidebarToggle();
    
    // Initialize all pages
    setupHomePage();
    setupConverterPage();
    setupVideoPage();
    setupSeoPage();
    setupResizePage();
    setupCropPage();
    setupMonitorPage();
    setupArchivePage();
    setupDatabasePage();
    
    setupFileDrop();
  }
});

function getAppHTML(): string {
  // Keep all HTML template strings here
  // This keeps the structure visible in one place
}

function setupUpdateChecker() {
  // Update checker logic
}
```

## Benefits of This Structure

1. **Maintainability**: Each page is in its own file (~200-400 lines)
2. **Testability**: Individual modules can be tested separately
3. **Reusability**: Utility functions are shared across pages
4. **Clarity**: Clear separation of concerns
5. **Performance**: No impact - all code still bundles together

## Migration Strategy

1. ✅ Create utility modules (DONE)
2. ✅ Create initial page modules (DONE)
3. Create remaining page modules (video, resize, crop, monitor, archive)
4. Create file-drop utility
5. Update main.ts to import and use modules
6. Test each page thoroughly
7. Remove old main.ts once verified

## Testing Checklist

After refactoring, verify:
- [ ] All pages load correctly
- [ ] Navigation works
- [ ] File upload/drop works
- [ ] Image conversion works
- [ ] Video optimization works
- [ ] SEO tools work
- [ ] Resize tool works
- [ ] Crop editor works
- [ ] Monitor page works
- [ ] Archive page works
- [ ] Database stats work
- [ ] All onclick handlers work
- [ ] Icons render correctly

## Notes

- Keep HTML generation in main.ts for now (easier to maintain structure)
- Use `(window as any).functionName` for onclick handlers
- Always call `initIcons()` after dynamic HTML changes
- Import only what you need from each module
