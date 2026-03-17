import { deleteImage as deleteImageFromDB, deleteVideo as deleteVideoFromDB, getAllMedia } from '../database';
import type { MediaRecord } from '../types';
import { escapeAttribute, escapeHtml, formatFileSize } from '../utils/helpers';
import { initIcons } from '../utils/icons';

const SELECTION_SEPARATOR = '::';
let selectedMedia: Set<string> = new Set();

export function setupArchivePage() {
  const archiveList = document.getElementById('archiveList')!;
  const deleteSelectedBtn = document.getElementById('deleteSelectedBtn')!;
  const cancelSelectionBtn = document.getElementById('cancelSelectionBtn')!;

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
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-delete-id][data-delete-type]');
    if (!target) {
      return;
    }

    const id = target.dataset.deleteId;
    const type = target.dataset.deleteType as MediaRecord['type'] | undefined;

    if (id && type) {
      await deleteMediaHandler(id, type);
    }
  });

  deleteSelectedBtn.addEventListener('click', handleDeleteSelected);
  cancelSelectionBtn.addEventListener('click', handleCancelSelection);
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
  if (!archiveList) return;

  try {
    const allMedia = await getAllMedia();

    if (allMedia.length === 0) {
      archiveList.innerHTML = '<p class="empty-message">Henuz donusturulmus dosya yok</p>';
      updateSelectionUI();
      return;
    }

    const { invoke } = await import('@tauri-apps/api/core');
    const mediaWithPreviews = await Promise.all(
      allMedia.map(async (item) => {
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
              <button class="btn-danger btn-sm" data-delete-id="${escapeAttribute(item.id)}" data-delete-type="${item.type}">Sil</button>
            </div>
          </div>
        `;
      })
      .join('');

    initIcons();
    updateSelectionUI();
  } catch (error) {
    console.error('Archive load error:', error);
    archiveList.innerHTML = '<p class="empty-message">Arsiv yuklenirken hata olustu</p>';
  }
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
