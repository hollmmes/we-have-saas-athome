import { deleteImage as deleteImageFromDB, deleteVideo as deleteVideoFromDB, getAllMedia } from '../database';
import type { MediaRecord } from '../types';
import { escapeAttribute, escapeHtml, formatFileSize } from '../utils/helpers';
import { initIcons } from '../utils/icons';

const SELECTION_SEPARATOR = '::';
const ARCHIVE_FAVORITES_KEY = 'archive.favorites';

type FileInspection = {
  exists: boolean;
  size: number;
  sha256?: string | null;
};

type DuplicateGroup = {
  key: string;
  hash: string;
  type: MediaRecord['type'];
  items: MediaRecord[];
  potentialSavings: number;
};

let selectedMedia: Set<string> = new Set();
let archiveSearchQuery = '';
let archiveFilterType = 'all';
let duplicateGroups: DuplicateGroup[] = [];
let missingArchiveItems: MediaRecord[] = [];
let archiveScanInProgress = false;
let archiveLastScanAt = '';

export function setupArchivePage() {
  ensureArchiveFilters();
  const archiveList = document.getElementById('archiveList')!;
  const deleteSelectedBtn = document.getElementById('deleteSelectedBtn')!;
  const cancelSelectionBtn = document.getElementById('cancelSelectionBtn')!;
  const archiveSearchInput = document.getElementById('archiveSearchInput') as HTMLInputElement | null;
  const archiveTypeFilter = document.getElementById('archiveTypeFilter') as HTMLSelectElement | null;
  const scanDuplicatesBtn = document.getElementById('scanArchiveDuplicatesBtn');
  const cleanupMissingBtn = document.getElementById('cleanupMissingArchiveBtn');

  archiveList.addEventListener('change', (event) => {
    const target = event.target as HTMLInputElement;
    if (!target.matches('input[data-media-id][data-media-type]')) {
      return;
    }

    const id = target.dataset.mediaId;
    const type = target.dataset.mediaType as MediaRecord['type'] | undefined;

    if (id && type) {
      toggleSelection(id, type);
    }
  });

  archiveList.addEventListener('click', async (event) => {
    const deleteButton = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-delete-id][data-delete-type]');
    if (deleteButton) {
      const id = deleteButton.dataset.deleteId;
      const type = deleteButton.dataset.deleteType as MediaRecord['type'] | undefined;

      if (id && type) {
        await deleteMediaHandler(id, type);
      }
      return;
    }

    const favoriteButton = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-favorite-key]');
    const favoriteKey = favoriteButton?.dataset.favoriteKey;
    if (favoriteButton && favoriteKey) {
      toggleFavorite(favoriteKey);
      await loadArchive();
    }
  });

  const archiveInsights = document.getElementById('archiveInsightsPanel');
  archiveInsights?.addEventListener('click', async (event) => {
    const deduplicateButton = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-deduplicate-group]');
    if (deduplicateButton?.dataset.deduplicateGroup) {
      await deduplicateGroup(deduplicateButton.dataset.deduplicateGroup);
      return;
    }

    const selectButton = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-select-duplicates]');
    if (selectButton?.dataset.selectDuplicates) {
      await selectDuplicateGroup(selectButton.dataset.selectDuplicates);
    }
  });

  deleteSelectedBtn.addEventListener('click', handleDeleteSelected);
  cancelSelectionBtn.addEventListener('click', handleCancelSelection);
  scanDuplicatesBtn?.addEventListener('click', async () => {
    await scanArchiveHealth();
  });
  cleanupMissingBtn?.addEventListener('click', async () => {
    await cleanupMissingRecords();
  });
  archiveSearchInput?.addEventListener('input', async () => {
    archiveSearchQuery = archiveSearchInput.value.trim().toLowerCase();
    await loadArchive();
  });
  archiveTypeFilter?.addEventListener('change', async () => {
    archiveFilterType = archiveTypeFilter.value;
    await loadArchive();
  });
}

function buildSelectionKey(id: string, type: MediaRecord['type']): string {
  return `${type}${SELECTION_SEPARATOR}${id}`;
}

function parseSelectionKey(key: string): { type: MediaRecord['type']; id: string } {
  const separatorIndex = key.indexOf(SELECTION_SEPARATOR);
  if (separatorIndex === -1) {
    throw new Error(`Gecersiz secim anahtari: ${key}`);
  }

  return {
    type: key.slice(0, separatorIndex) as MediaRecord['type'],
    id: key.slice(separatorIndex + SELECTION_SEPARATOR.length)
  };
}

async function removeMediaRecord(media: MediaRecord): Promise<void> {
  const { invoke } = await import('@tauri-apps/api/core');

  if (media.type === 'image') {
    await invoke('delete_converted_image', { id: media.id, filePath: media.output_path });
    await deleteImageFromDB(media.id);
    return;
  }

  await invoke('delete_converted_video', { id: media.id, filePath: media.output_path });
  await deleteVideoFromDB(media.id);
}

export async function loadArchive() {
  const archiveList = document.getElementById('archiveList')!;
  if (!archiveList) {
    return;
  }

  try {
    const allMedia = await getAllMedia();
    renderArchiveInsights();

    if (allMedia.length === 0) {
      archiveList.innerHTML = '<p class="empty-message">Henuz donusturulmus dosya yok</p>';
      updateSelectionUI();
      return;
    }

    const filteredMedia = applyArchiveFilters(allMedia);

    if (filteredMedia.length === 0) {
      archiveList.innerHTML = '<p class="empty-message">Filtreye uygun dosya bulunamadi</p>';
      updateSelectionUI();
      return;
    }

    const { invoke } = await import('@tauri-apps/api/core');
    const mediaWithPreviews = await Promise.all(
      filteredMedia.map(async (item) => {
        if (item.type === 'image') {
          try {
            const preview = await invoke<string>('get_image_data_url', { filePath: item.output_path });
            return { ...item, preview };
          } catch (error) {
            console.error('Failed to load image:', item.output_path, error);
            return { ...item, preview: '' };
          }
        }

        try {
          const preview = await invoke<string>('get_video_thumbnail', { filePath: item.output_path });
          return { ...item, preview };
        } catch (error) {
          console.error('Failed to load thumbnail:', item.output_path, error);
          return { ...item, preview: '' };
        }
      })
    );

    archiveList.innerHTML = mediaWithPreviews
      .map((item) => {
        const isSelected = selectedMedia.has(buildSelectionKey(item.id, item.type));
        const favoriteKey = buildSelectionKey(item.id, item.type);
        const isFavorite = getFavorites().includes(favoriteKey);
        return `
          <div class="archive-item ${isSelected ? 'selected' : ''}" data-id="${escapeAttribute(item.id)}" data-type="${item.type}">
            <div class="archive-checkbox">
              <input
                type="checkbox"
                data-media-id="${escapeAttribute(item.id)}"
                data-media-type="${item.type}"
                ${isSelected ? 'checked' : ''}
              >
            </div>
            <div class="archive-preview">
              ${item.preview ? `<img src="${escapeAttribute(item.preview)}" alt="${escapeAttribute(item.converted_name)}" />` : ''}
              ${item.type === 'video' ? '<i data-lucide="play" class="play-icon"></i>' : ''}
            </div>
            <div class="archive-info">
              <h4>${escapeHtml(item.converted_name)}</h4>
              <p class="archive-meta">
                <span class="archive-format">${escapeHtml(item.type === 'image' ? item.converted_format : 'MP4')}</span>
                <span class="archive-size">${formatFileSize(item.file_size)}</span>
                <span class="archive-date">${escapeHtml(item.created_at)}</span>
              </p>
            </div>
            <div class="archive-actions">
              <button class="btn-secondary btn-sm" data-favorite-key="${escapeAttribute(favoriteKey)}">${isFavorite ? 'Unfavorite' : 'Favorite'}</button>
              <button class="btn-danger btn-sm" data-delete-id="${escapeAttribute(item.id)}" data-delete-type="${item.type}">Sil</button>
            </div>
          </div>
        `;
      })
      .join('');

    initIcons();
    updateSelectionUI();
    renderArchiveInsights();
  } catch (error) {
    console.error('Archive load error:', error);
    archiveList.innerHTML = '<p class="empty-message">Arsiv yuklenirken hata olustu</p>';
    renderArchiveInsights();
  }
}

function ensureArchiveFilters() {
  const archiveHeader = document.querySelector('#archivePage .archive-header');
  if (!archiveHeader || document.getElementById('archiveSearchInput')) {
    return;
  }

  const filters = document.createElement('div');
  filters.className = 'tool-toolbar archive-toolbar';
  filters.innerHTML = `
    <div class="tool-toolbar-group">
      <input id="archiveSearchInput" class="monitor-input" type="text" placeholder="Search archive..." />
      <select id="archiveTypeFilter" class="tool-select">
        <option value="all">All</option>
        <option value="image">Images</option>
        <option value="video">Videos</option>
        <option value="favorites">Favorites</option>
      </select>
    </div>
    <div class="tool-toolbar-group">
      <button class="btn-secondary btn-sm" id="scanArchiveDuplicatesBtn" type="button">Scan Duplicates</button>
      <button class="btn-secondary btn-sm" id="cleanupMissingArchiveBtn" type="button">Purge Missing Records</button>
    </div>
  `;

  archiveHeader.parentElement?.insertBefore(filters, archiveHeader.nextSibling);

  const insights = document.createElement('section');
  insights.id = 'archiveInsightsPanel';
  insights.className = 'archive-insights';
  archiveHeader.parentElement?.insertBefore(insights, filters.nextSibling);
}

function getFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem(ARCHIVE_FAVORITES_KEY) || '[]') as string[];
  } catch (error) {
    console.error('Failed to read archive favorites:', error);
    return [];
  }
}

function toggleFavorite(key: string) {
  const favorites = getFavorites();
  const nextFavorites = favorites.includes(key)
    ? favorites.filter((item) => item !== key)
    : [key, ...favorites];

  localStorage.setItem(ARCHIVE_FAVORITES_KEY, JSON.stringify(nextFavorites));
}

function applyArchiveFilters(media: MediaRecord[]) {
  return media.filter((item) => {
    const matchesSearch =
      archiveSearchQuery.length === 0 ||
      item.converted_name.toLowerCase().includes(archiveSearchQuery) ||
      item.created_at.toLowerCase().includes(archiveSearchQuery);

    if (!matchesSearch) {
      return false;
    }

    if (archiveFilterType === 'favorites') {
      return getFavorites().includes(buildSelectionKey(item.id, item.type));
    }

    if (archiveFilterType === 'all') {
      return true;
    }

    return item.type === archiveFilterType;
  });
}

function toggleSelection(id: string, type: MediaRecord['type']) {
  const key = buildSelectionKey(id, type);

  if (selectedMedia.has(key)) {
    selectedMedia.delete(key);
  } else {
    selectedMedia.add(key);
  }

  updateSelectionUI();
}

function updateSelectionUI() {
  const archiveActions = document.getElementById('archiveActions');
  const selectedCount = document.getElementById('selectedCount');

  if (!archiveActions || !selectedCount) {
    return;
  }

  if (selectedMedia.size > 0) {
    archiveActions.style.display = 'flex';
    selectedCount.textContent = `${selectedMedia.size} secili`;
  } else {
    archiveActions.style.display = 'none';
  }
}

function renderArchiveInsights() {
  const panel = document.getElementById('archiveInsightsPanel');
  if (!panel) {
    return;
  }

  const duplicateCount = duplicateGroups.reduce((count, group) => count + Math.max(group.items.length - 1, 0), 0);
  const potentialSavings = duplicateGroups.reduce((total, group) => total + group.potentialSavings, 0);

  panel.innerHTML = `
    <div class="archive-insights-header">
      <div>
        <h3>Cleanup Insights</h3>
        <p>Scan archive outputs for duplicate files and broken database records.</p>
      </div>
      <div class="archive-insights-meta">
        <span>${archiveScanInProgress ? 'Scanning...' : archiveLastScanAt ? `Last scan: ${escapeHtml(new Date(archiveLastScanAt).toLocaleString())}` : 'No scan yet'}</span>
      </div>
    </div>
    <div class="archive-insight-grid">
      <article class="archive-insight-card">
        <strong>${duplicateGroups.length}</strong>
        <span>Duplicate groups</span>
      </article>
      <article class="archive-insight-card">
        <strong>${duplicateCount}</strong>
        <span>Extra copies</span>
      </article>
      <article class="archive-insight-card">
        <strong>${formatFileSize(potentialSavings)}</strong>
        <span>Potential savings</span>
      </article>
      <article class="archive-insight-card">
        <strong>${missingArchiveItems.length}</strong>
        <span>Missing file records</span>
      </article>
    </div>
    <div class="archive-duplicate-groups">
      ${
        duplicateGroups.length === 0
          ? `<p class="empty-message">${archiveScanInProgress ? 'Scanning archive outputs...' : 'No duplicate groups found yet.'}</p>`
          : duplicateGroups
              .map((group) => {
                const keeper = group.items[0];
                return `
                  <article class="archive-duplicate-group">
                    <div class="archive-duplicate-header">
                      <div>
                        <h4>${escapeHtml(keeper.converted_name)}</h4>
                        <p>Keep newest copy and reclaim ${formatFileSize(group.potentialSavings)}</p>
                      </div>
                      <div class="workflow-inline-actions">
                        <button class="btn-secondary btn-sm" type="button" data-select-duplicates="${escapeAttribute(group.key)}">Select Extras</button>
                        <button class="btn-danger btn-sm" type="button" data-deduplicate-group="${escapeAttribute(group.key)}">Remove Extras</button>
                      </div>
                    </div>
                    <div class="archive-duplicate-list">
                      ${group.items
                        .map((item, index) => `
                          <div class="archive-duplicate-item ${index === 0 ? 'is-keeper' : ''}">
                            <div class="archive-duplicate-item-main">
                              <strong>${escapeHtml(item.converted_name)}</strong>
                              <span>${formatFileSize(item.file_size)} • ${escapeHtml(item.created_at)}</span>
                            </div>
                            <span class="archive-duplicate-badge">${index === 0 ? 'Keep' : 'Duplicate'}</span>
                          </div>
                        `)
                        .join('')}
                    </div>
                  </article>
                `;
              })
              .join('')
      }
    </div>
    ${
      missingArchiveItems.length > 0
        ? `
          <div class="archive-missing-list">
            <h4>Missing file records</h4>
            <div class="workflow-log-list">
              ${missingArchiveItems
                .slice(0, 6)
                .map((item) => `
                  <div class="workflow-log-item">
                    <strong>${escapeHtml(item.converted_name)}</strong>
                    <span>${escapeHtml(item.output_path)}</span>
                  </div>
                `)
                .join('')}
              ${missingArchiveItems.length > 6 ? `<p class="archive-missing-more">+${missingArchiveItems.length - 6} more missing entries</p>` : ''}
            </div>
          </div>
        `
        : ''
    }
  `;

  const cleanupButton = document.getElementById('cleanupMissingArchiveBtn') as HTMLButtonElement | null;
  if (cleanupButton) {
    cleanupButton.disabled = missingArchiveItems.length === 0 || archiveScanInProgress;
  }
}

async function scanArchiveHealth() {
  archiveScanInProgress = true;
  renderArchiveInsights();

  try {
    const allMedia = await getAllMedia();
    const { invoke } = await import('@tauri-apps/api/core');
    const sizeBuckets = new Map<string, MediaRecord[]>();

    allMedia.forEach((item) => {
      const key = `${item.type}:${item.file_size}`;
      const bucket = sizeBuckets.get(key) || [];
      bucket.push(item);
      sizeBuckets.set(key, bucket);
    });

    const candidateKeys = new Set<string>();
    sizeBuckets.forEach((items) => {
      if (items.length > 1) {
        items.forEach((item) => candidateKeys.add(buildSelectionKey(item.id, item.type)));
      }
    });

    duplicateGroups = [];
    missingArchiveItems = [];
    const hashBuckets = new Map<string, MediaRecord[]>();

    for (const item of allMedia) {
      const computeHash = candidateKeys.has(buildSelectionKey(item.id, item.type));
      const inspection = await invoke<FileInspection>('inspect_file', {
        filePath: item.output_path,
        computeHash
      });

      if (!inspection.exists) {
        missingArchiveItems.push(item);
        continue;
      }

      if (!computeHash || !inspection.sha256) {
        continue;
      }

      const hashKey = `${item.type}:${inspection.sha256}`;
      const bucket = hashBuckets.get(hashKey) || [];
      bucket.push(item);
      hashBuckets.set(hashKey, bucket);
    }

    duplicateGroups = Array.from(hashBuckets.entries())
      .map(([key, items]) => {
        const sortedItems = [...items].sort(
          (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
        );

        return {
          key,
          hash: key.split(':').slice(1).join(':'),
          type: sortedItems[0]?.type || 'image',
          items: sortedItems,
          potentialSavings: sortedItems.slice(1).reduce((total, item) => total + item.file_size, 0)
        } satisfies DuplicateGroup;
      })
      .filter((group) => group.items.length > 1)
      .sort((left, right) => right.potentialSavings - left.potentialSavings);

    archiveLastScanAt = new Date().toISOString();
  } catch (error) {
    console.error('Archive scan error:', error);
    alert(`Archive scan failed: ${String(error)}`);
  } finally {
    archiveScanInProgress = false;
    renderArchiveInsights();
  }
}

async function selectDuplicateGroup(groupKey: string) {
  const group = duplicateGroups.find((item) => item.key === groupKey);
  if (!group) {
    return;
  }

  group.items.slice(1).forEach((item) => {
    selectedMedia.add(buildSelectionKey(item.id, item.type));
  });

  await loadArchive();
}

async function deduplicateGroup(groupKey: string) {
  const group = duplicateGroups.find((item) => item.key === groupKey);
  if (!group || group.items.length < 2) {
    return;
  }

  if (!confirm(`Remove ${group.items.length - 1} duplicate file(s) and keep the newest copy?`)) {
    return;
  }

  try {
    for (const item of group.items.slice(1)) {
      await removeMediaRecord(item);
      selectedMedia.delete(buildSelectionKey(item.id, item.type));
    }

    await loadArchive();
    await scanArchiveHealth();
  } catch (error) {
    console.error('Deduplicate error:', error);
    alert('Duplicate cleanup failed');
  }
}

async function cleanupMissingRecords() {
  if (missingArchiveItems.length === 0) {
    return;
  }

  if (!confirm(`Remove ${missingArchiveItems.length} missing database record(s)?`)) {
    return;
  }

  try {
    for (const item of missingArchiveItems) {
      await removeMediaRecord(item);
      selectedMedia.delete(buildSelectionKey(item.id, item.type));
    }

    missingArchiveItems = [];
    await loadArchive();
    await scanArchiveHealth();
  } catch (error) {
    console.error('Missing record cleanup error:', error);
    alert('Missing record cleanup failed');
  }
}

async function handleDeleteSelected() {
  if (!confirm(`${selectedMedia.size} dosyayi silmek istediginizden emin misiniz?`)) {
    return;
  }

  try {
    const allMedia = await getAllMedia();

    for (const key of selectedMedia) {
      const { id, type } = parseSelectionKey(key);
      const media = allMedia.find((item) => item.id === id && item.type === type);

      if (media) {
        await removeMediaRecord(media);
      }
    }

    selectedMedia.clear();
    await loadArchive();
  } catch (error) {
    console.error('Bulk delete error:', error);
    alert('Dosyalar silinemedi');
  }
}

function handleCancelSelection() {
  selectedMedia.clear();
  void loadArchive();
}

async function deleteMediaHandler(id: string, type: MediaRecord['type']) {
  try {
    const allMedia = await getAllMedia();
    const mediaItem = allMedia.find((item) => item.id === id && item.type === type);

    if (!mediaItem) {
      console.error('Media item not found:', id, type);
      alert('Dosya bulunamadi');
      return;
    }

    await removeMediaRecord(mediaItem);
    selectedMedia.delete(buildSelectionKey(id, type));
    await loadArchive();
  } catch (error) {
    console.error('Delete error:', error);
    alert('Dosya silinemedi');
  }
}
