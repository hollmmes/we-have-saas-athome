import { getAllMedia, deleteImage as deleteImageFromDB, deleteVideo as deleteVideoFromDB } from '../database';
import { formatFileSize } from '../utils/helpers';
import { initIcons } from '../utils/icons';

let selectedMedia: Set<string> = new Set();

export function setupArchivePage() {
  // Make functions global for onclick handlers
  (window as any).toggleSelection = toggleSelection;
}

export async function loadArchive() {
  const archiveList = document.getElementById('archiveList');
  if (!archiveList) return;

  try {
    const allMedia = await getAllMedia();
    
    if (allMedia.length === 0) {
      archiveList.innerHTML = '<p class="empty-message">Henüz dönüştürülmüş dosya yok</p>';
      return;
    }

    const { invoke } = await import('@tauri-apps/api/core');
    
    const mediaPromises = allMedia.map(async (item: any) => {
      if (item.type === 'image') {
        try {
          const dataUrl = await invoke('get_image_data_url', { filePath: item.output_path }) as string;
          return { ...item, preview: dataUrl };
        } catch (error) {
          console.error('Failed to load image:', item.output_path, error);
          return { ...item, preview: '' };
        }
      } else {
        try {
          const thumbnail = await invoke('get_video_thumbnail', { filePath: item.output_path }) as string;
          return { ...item, preview: thumbnail };
        } catch (error) {
          console.error('Failed to load thumbnail:', item.output_path, error);
          return { ...item, preview: '' };
        }
      }
    });
    
    const mediaWithPreviews = await Promise.all(mediaPromises);
    
    archiveList.innerHTML = mediaWithPreviews.map(item => {
      const isSelected = selectedMedia.has(`${item.type}-${item.id}`);
      
      return `
        <div class="archive-item ${isSelected ? 'selected' : ''}" data-id="${item.id}" data-type="${item.type}">
          <div class="archive-checkbox">
            <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleSelection('${item.id}', '${item.type}')">
          </div>
          <div class="archive-preview">
            ${item.preview ? `<img src="${item.preview}" alt="${item.converted_name}" />` : ''}
            ${item.type === 'video' ? '<i data-lucide="play" class="play-icon"></i>' : ''}
          </div>
          <div class="archive-info">
            <h4>${item.converted_name}</h4>
            <p class="archive-meta">
              <span class="archive-format">${item.type === 'image' ? item.converted_format : 'MP4'}</span>
              <span class="archive-size">${formatFileSize(item.file_size)}</span>
              <span class="archive-date">${item.created_at}</span>
            </p>
          </div>
          <div class="archive-actions">
            <button class="btn-danger btn-sm" data-id="${item.id}" data-type="${item.type}">Sil</button>
          </div>
        </div>
      `;
    }).join('');

    // Add event listeners to delete buttons
    const deleteButtons = archiveList.querySelectorAll('.archive-actions .btn-danger');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const target = e.currentTarget as HTMLElement;
        const id = target.getAttribute('data-id');
        const type = target.getAttribute('data-type');
        if (id && type) {
          await deleteMediaHandler(id, type);
        }
      });
    });

    initIcons();
    updateSelectionUI();
  } catch (error) {
    console.error('Archive load error:', error);
    archiveList.innerHTML = '<p class="empty-message">Arşiv yüklenirken hata oluştu</p>';
  }
}

function toggleSelection(id: string, type: string) {
  const key = `${type}-${id}`;
  
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
  const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
  const cancelSelectionBtn = document.getElementById('cancelSelectionBtn');
  
  if (selectedMedia.size > 0) {
    archiveActions!.style.display = 'flex';
    selectedCount!.textContent = `${selectedMedia.size} seçili`;
  } else {
    archiveActions!.style.display = 'none';
  }
  
  deleteSelectedBtn?.removeEventListener('click', handleDeleteSelected);
  deleteSelectedBtn?.addEventListener('click', handleDeleteSelected);
  
  cancelSelectionBtn?.removeEventListener('click', handleCancelSelection);
  cancelSelectionBtn?.addEventListener('click', handleCancelSelection);
}

async function handleDeleteSelected() {
  if (!confirm(`${selectedMedia.size} dosyayı silmek istediğinizden emin misiniz?`)) {
    return;
  }

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    
    for (const key of selectedMedia) {
      const [type, id] = key.split('-');
      
      if (type === 'image') {
        const images = await getAllMedia();
        const image = images.find((m: any) => m.type === 'image' && m.id === parseInt(id));
        if (image) {
          await invoke('delete_converted_image', { id: parseInt(id), filePath: image.output_path });
        }
      } else {
        const videos = await getAllMedia();
        const video = videos.find((m: any) => m.type === 'video' && m.id === parseInt(id));
        if (video) {
          await invoke('delete_converted_video', { id: parseInt(id), filePath: video.output_path });
        }
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
  loadArchive();
}

async function deleteMediaHandler(id: string, type: string) {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    
    // Get the file path from database
    const allMedia = await getAllMedia();
    const mediaItem = allMedia.find((m: any) => m.type === type && m.id.toString() === id);
    
    if (!mediaItem) {
      console.error('Media item not found:', id, type);
      alert('Dosya bulunamadı');
      return;
    }
    
    if (type === 'image') {
      await invoke('delete_converted_image', { id: parseInt(id), filePath: mediaItem.output_path });
      await deleteImageFromDB(id);
    } else {
      await invoke('delete_converted_video', { id: parseInt(id), filePath: mediaItem.output_path });
      await deleteVideoFromDB(id);
    }
    
    await loadArchive();
  } catch (error) {
    console.error('Delete error:', error);
    alert('Dosya silinemedi');
  }
}
