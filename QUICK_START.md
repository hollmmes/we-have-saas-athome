# Quick Start - Complete the Refactoring

## Current Status

✅ **DONE (57%):**
- src/utils/helpers.ts
- src/utils/icons.ts
- src/utils/navigation.ts
- src/pages/home.ts
- src/pages/converter.ts (complete)
- src/pages/video.ts (complete)
- src/pages/seo.ts (complete)
- src/pages/database.ts (complete)

⏳ **TODO (43%):**
- src/pages/resize.ts
- src/pages/crop.ts
- src/pages/monitor.ts
- src/pages/archive.ts
- src/utils/file-drop.ts
- src/main.ts (refactor)

## How to Complete in 3 Steps

### Step 1: Copy the Pattern (2 hours)

Use `video.ts` as your template. For each remaining page:

1. Create the file: `src/pages/[name].ts`
2. Copy the relevant code from `main.ts`
3. Add imports at the top
4. Export `setup[Name]Page()` function
5. Export any load functions
6. Make onclick functions global with `(window as any).functionName`

**Example for resize.ts:**
```typescript
import { initIcons } from '../utils/icons';

let resizeW = 350;
let resizeH = 390;
let resizeBadges = [/* ... */];
let originalResizeImages: Array<{ img: HTMLImageElement; name: string }> = [];

export function setupResizePage() {
  // Copy setup code from main.ts lines 1700-1900
  const resizeWidthInput = document.getElementById('resizeWidth');
  // ... etc
}

// Make global functions
(window as any).saveDimensionBtn = () => { /* ... */ };
(window as any).clearResizeBtn = () => { /* ... */ };
(window as any).downloadAllBtn = () => { /* ... */ };
```

### Step 2: Update main.ts (1 hour)

1. Add imports at the top:
```typescript
import { setupResizePage } from './pages/resize';
import { setupCropPage } from './pages/crop';
import { setupMonitorPage, loadDomains } from './pages/monitor';
import { setupArchivePage, loadArchive } from './pages/archive';
import { setupFileDrop } from './utils/file-drop';
```

2. Update setupNavigation call:
```typescript
setupNavigation(
  loadArchive,
  loadConvertedResults,
  loadDatabaseStats,
  loadDomains
);
```

3. Add setup calls:
```typescript
setupResizePage();
setupCropPage();
setupMonitorPage();
setupArchivePage();
setupFileDrop();
```

4. Delete old code (everything that's now in modules)

### Step 3: Test Everything (1 hour)

Run through this checklist:
- [ ] npm run dev
- [ ] Open app
- [ ] Test each page
- [ ] Test navigation
- [ ] Test file drop
- [ ] Check console for errors
- [ ] Verify icons render

## Line Number Reference

To help you find code in the original main.ts:

```
Lines 1-100:    Imports and HTML generation
Lines 100-400:  Home page and folder setup
Lines 400-500:  File drop handling
Lines 500-800:  Image converter
Lines 800-1200: Video optimizer
Lines 1200-1400: SEO tools
Lines 1400-1600: Archive page
Lines 1700-1900: Photo resize
Lines 1900-2100: Sidebar and helpers
Lines 2100-2400: Photo crop editor
Lines 2400-2500: SSL/Domain monitor
Lines 2500-2514: Database stats
```

## Copy-Paste Templates

### For resize.ts
```bash
# Find in main.ts: lines 1700-1900
# Look for: "Photo Resize Functions"
# Copy everything until: "SEO Tools Functions"
```

### For crop.ts
```bash
# Find in main.ts: lines 2100-2400
# Look for: "Photo Crop Editor Functions"
# Copy everything until: "SSL & Domain Monitor Functions"
```

### For monitor.ts
```bash
# Find in main.ts: lines 2400-2500
# Look for: "SSL & Domain Monitor Functions"
# Copy everything until end of file
```

### For archive.ts
```bash
# Find in main.ts: lines 1400-1600
# Look for: "async function loadArchive()"
# Copy everything related to archive
```

### For file-drop.ts
```bash
# Find in main.ts: lines 400-500
# Look for: "async function setupFileDrop()"
# Copy the entire function
```

## Common Issues & Solutions

### Issue: "Function not defined" error
**Solution:** Make sure you added `(window as any).functionName = functionName`

### Issue: Icons not showing
**Solution:** Call `initIcons()` after rendering HTML

### Issue: Import errors
**Solution:** Check file paths are correct (use `./` for same directory, `../` for parent)

### Issue: Page not loading data
**Solution:** Make sure you exported the load function and called it in setupNavigation

## Verification Commands

```bash
# Check TypeScript compilation
npm run build

# Run development server
npm run dev

# Check for unused exports (optional)
npx ts-prune
```

## Success Criteria

You're done when:
- ✅ All pages work correctly
- ✅ Navigation works
- ✅ File drop works
- ✅ No console errors
- ✅ Icons render everywhere
- ✅ main.ts is under 400 lines

## Time Estimate

- **Resize page:** 30 minutes
- **Crop page:** 45 minutes
- **Monitor page:** 30 minutes
- **Archive page:** 30 minutes
- **File drop:** 15 minutes
- **Main.ts refactor:** 30 minutes
- **Testing:** 30 minutes
- **Buffer:** 30 minutes

**Total:** ~4 hours

## Need Help?

1. Look at `video.ts` - it's a complete example
2. Check `REFACTORING_GUIDE.md` for detailed patterns
3. See `MODULE_STRUCTURE.md` for architecture
4. Read `IMPLEMENTATION_CHECKLIST.md` for step-by-step

## Pro Tips

1. **Work on one module at a time** - Don't try to do everything at once
2. **Test immediately** - After creating each module, test it works
3. **Use git** - Commit after each working module
4. **Keep main.ts last** - Only refactor main.ts after all modules are done
5. **Don't rush** - Take breaks, the code will be cleaner

## Final Checklist

Before you start:
- [ ] Read this guide
- [ ] Have main.ts open
- [ ] Have video.ts open as reference
- [ ] Have a plan for which module to do first

After you finish:
- [ ] All modules created
- [ ] main.ts refactored
- [ ] All tests passing
- [ ] No console errors
- [ ] Git committed
- [ ] Celebrate! 🎉

Good luck! You've got this! 💪
