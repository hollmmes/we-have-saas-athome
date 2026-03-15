# Refactoring Implementation Checklist

## ✅ Phase 1: Utilities (COMPLETE)
- [x] Create `src/utils/helpers.ts`
- [x] Create `src/utils/icons.ts`
- [x] Create `src/utils/navigation.ts`

## ✅ Phase 2: Core Pages (COMPLETE)
- [x] Create `src/pages/home.ts`
- [x] Create `src/pages/converter.ts`
- [x] Create `src/pages/video.ts`
- [x] Create `src/pages/seo.ts`
- [x] Create `src/pages/database.ts`

## 📝 Phase 3: Remaining Pages (TODO)

### Step 1: Create Resize Page
```bash
# Create file: src/pages/resize.ts
```
- [ ] Copy resize logic from main.ts (lines 1700-1900)
- [ ] Export `setupResizePage()` function
- [ ] Add dimension management
- [ ] Add badge system
- [ ] Add canvas rendering
- [ ] Add download functionality
- [ ] Make global functions: dimension controls, clear, download all

### Step 2: Create Crop Page
```bash
# Create file: src/pages/crop.ts
```
- [ ] Copy crop logic from main.ts (lines 2100-2400)
- [ ] Export `setupCropPage()` function
- [ ] Add template selection
- [ ] Add canvas editor
- [ ] Add drag/resize handlers
- [ ] Add rotation
- [ ] Add save/download

### Step 3: Create Monitor Page
```bash
# Create file: src/pages/monitor.ts
```
- [ ] Copy monitor logic from main.ts (lines 2400-2500)
- [ ] Export `setupMonitorPage()` and `loadDomains()` functions
- [ ] Add domain input handler
- [ ] Add refresh all handler
- [ ] Add delete handler
- [ ] Make global function: `deleteDomainEntry`

### Step 4: Create Archive Page
```bash
# Create file: src/pages/archive.ts
```
- [ ] Copy archive logic from main.ts (lines 1400-1600)
- [ ] Export `setupArchivePage()` and `loadArchive()` functions
- [ ] Add media loading
- [ ] Add selection management
- [ ] Add delete handlers (individual + bulk)
- [ ] Make global functions: `toggleSelection`, `deleteMedia`

### Step 5: Create File Drop Utility
```bash
# Create file: src/utils/file-drop.ts
```
- [ ] Copy file drop logic from main.ts (lines 400-500)
- [ ] Export `setupFileDrop()` function
- [ ] Add drag-over handler
- [ ] Add drag-drop handler
- [ ] Add drag-leave handler
- [ ] Route files to correct page handler

## 📝 Phase 4: Refactor Main.ts (TODO)

### Step 1: Update Imports
```typescript
// Add all module imports at top of main.ts
import { setupResizePage } from './pages/resize';
import { setupCropPage } from './pages/crop';
import { setupMonitorPage, loadDomains } from './pages/monitor';
import { setupArchivePage, loadArchive } from './pages/archive';
import { setupFileDrop } from './utils/file-drop';
```

### Step 2: Update Navigation Setup
```typescript
// Update setupNavigation call with all load functions
setupNavigation(
  loadArchive,           // archive page loader
  loadConvertedResults,  // converter page loader
  loadDatabaseStats,     // database page loader
  loadDomains            // monitor page loader
);
```

### Step 3: Add Setup Calls
```typescript
// In DOMContentLoaded, after HTML is rendered:
setupResizePage();
setupCropPage();
setupMonitorPage();
setupArchivePage();
setupFileDrop();
```

### Step 4: Remove Old Code
- [ ] Remove all converter logic (now in converter.ts)
- [ ] Remove all video logic (now in video.ts)
- [ ] Remove all SEO logic (now in seo.ts)
- [ ] Remove all resize logic (now in resize.ts)
- [ ] Remove all crop logic (now in crop.ts)
- [ ] Remove all monitor logic (now in monitor.ts)
- [ ] Remove all archive logic (now in archive.ts)
- [ ] Remove all database stats logic (now in database.ts)
- [ ] Remove file drop logic (now in file-drop.ts)
- [ ] Keep only: HTML generation, update checker, initialization

## ✅ Phase 5: Testing (TODO)

### Functional Testing
- [ ] Home page - folder selection works
- [ ] Converter page - image conversion works
- [ ] Video page - optimization works
- [ ] Video page - merge works
- [ ] SEO page - keyword conversion works
- [ ] Resize page - dimension management works
- [ ] Resize page - canvas rendering works
- [ ] Crop page - template selection works
- [ ] Crop page - crop editor works
- [ ] Monitor page - add domain works
- [ ] Monitor page - refresh all works
- [ ] Archive page - media loading works
- [ ] Archive page - selection works
- [ ] Archive page - delete works
- [ ] Database page - stats display works

### Integration Testing
- [ ] Navigation between pages works
- [ ] File drop works on converter page
- [ ] File drop works on video page
- [ ] Icons render on all pages
- [ ] Sidebar toggle works on mobile
- [ ] Update checker works
- [ ] All onclick handlers work
- [ ] All global functions accessible

### Visual Testing
- [ ] All pages render correctly
- [ ] No console errors
- [ ] No missing icons
- [ ] Responsive design works
- [ ] Modals work correctly

## 📊 Progress Tracking

**Completed:** 8/14 files (57%)
- ✅ helpers.ts
- ✅ icons.ts
- ✅ navigation.ts
- ✅ home.ts
- ✅ converter.ts
- ✅ video.ts
- ✅ seo.ts
- ✅ database.ts

**Remaining:** 6/14 files (43%)
- ⏳ resize.ts
- ⏳ crop.ts
- ⏳ monitor.ts
- ⏳ archive.ts
- ⏳ file-drop.ts
- ⏳ main.ts (refactor)

## 🎯 Quick Win Strategy

To complete the refactoring quickly:

1. **Day 1:** Create resize.ts and crop.ts (2-3 hours)
2. **Day 2:** Create monitor.ts and archive.ts (2 hours)
3. **Day 3:** Create file-drop.ts and refactor main.ts (2 hours)
4. **Day 4:** Testing and bug fixes (2-3 hours)

**Total estimated time:** 8-10 hours

## 💡 Tips

- Copy-paste from original main.ts, then clean up
- Test each module immediately after creating it
- Use the video.ts and converter.ts as templates
- Keep HTML generation in main.ts for now
- Don't forget to make functions global with `(window as any).functionName`
- Always call `initIcons()` after dynamic HTML changes
- Use TypeScript strict mode to catch errors early

## 🚀 Benefits After Completion

- Each file is ~150-400 lines (easy to navigate)
- Clear separation of concerns
- Easy to find and fix bugs
- Easy to add new features
- Better for code reviews
- Easier for new developers to understand
- No performance impact (same bundle size)

## 📝 Notes

- The HTML templates can stay in main.ts (they're just strings)
- Global functions are necessary for onclick handlers
- Import only what you need from each module
- Keep the same function signatures for compatibility
- Test thoroughly before removing old code
