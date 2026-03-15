// Video Editor Logic
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

interface MediaItem {
  id: string;
  name: string;
  path: string;
  duration: number;
  thumbnail?: string;
  type: 'video' | 'audio';
}

interface TimelineClip {
  id: string;
  mediaId: string;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  trimStart: number;
  trimEnd: number;
  track: 'video' | 'audio';
}

let mediaLibraryItems: MediaItem[] = [];
let timelineClips: TimelineClip[] = [];
let selectedClip: TimelineClip | null = null;

export function initEditor() {
  console.log('Editor initializing...');
  
  const importMediaBtn = document.getElementById('importMediaBtn');
  const clearTimelineBtn = document.getElementById('clearTimelineBtn');
  const exportVideoBtn = document.getElementById('exportVideoBtn');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const editorPreview = document.getElementById('editorPreview') as HTMLVideoElement;
  const timelineScrubber = document.getElementById('timelineScrubber') as HTMLInputElement;

  // Setup drag and drop immediately
  setupDragAndDrop();

  // Import media
  importMediaBtn?.addEventListener('click', async () => {
    const selected = await open({
      multiple: true,
      filters: [{
        name: 'Media',
        extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'mp3', 'wav', 'aac']
      }]
    });

    if (selected) {
      const paths = Array.isArray(selected) ? selected : [selected];
      for (const path of paths) {
        await addMediaToLibrary(path);
      }
    }
  });

  // Clear timeline
  clearTimelineBtn?.addEventListener('click', () => {
    if (confirm('Timeline\'daki tüm clipleri silmek istediğinizden emin misiniz?')) {
      timelineClips = [];
      renderTimeline();
      updatePreview();
    }
  });

  // Export video
  exportVideoBtn?.addEventListener('click', () => {
    if (timelineClips.length === 0) {
      alert('Timeline boş! Önce video ekleyin.');
      return;
    }
    showExportModal();
  });

  // Play/Pause
  playPauseBtn?.addEventListener('click', () => {
    if (editorPreview.paused) {
      editorPreview.play();
      playPauseBtn.innerHTML = '<i data-lucide="pause"></i>';
    } else {
      editorPreview.pause();
      playPauseBtn.innerHTML = '<i data-lucide="play"></i>';
    }
  });

  // Timeline scrubber
  timelineScrubber?.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    const time = (parseFloat(target.value) / 100) * editorPreview.duration;
    editorPreview.currentTime = time;
  });

  // Update time display
  editorPreview?.addEventListener('timeupdate', () => {
    const currentTime = document.getElementById('currentTime');
    const totalTime = document.getElementById('totalTime');
    
    if (currentTime) {
      currentTime.textContent = formatTime(editorPreview.currentTime);
    }
    if (totalTime) {
      totalTime.textContent = formatTime(editorPreview.duration);
    }
    if (timelineScrubber) {
      timelineScrubber.value = ((editorPreview.currentTime / editorPreview.duration) * 100).toString();
    }
  });

  console.log('Editor initialized successfully');
}

async function addMediaToLibrary(path: string) {
  const fileName = path.split(/[\\/]/).pop() || 'unknown';
  const ext = fileName.split('.').pop()?.toLowerCase();
  const type = ['mp3', 'wav', 'aac'].includes(ext || '') ? 'audio' : 'video';

  const id = generateId();
  
  let thumbnail = '';
  let duration = 0;

  if (type === 'video') {
    try {
      thumbnail = await invoke('get_video_thumbnail', { filePath: path }) as string;
      // Get duration from ffprobe
      duration = await getVideoDuration(path);
    } catch (error) {
      console.error('Failed to get video info:', error);
    }
  }

  const mediaItem: MediaItem = {
    id,
    name: fileName,
    path,
    duration,
    thumbnail,
    type
  };

  mediaLibraryItems.push(mediaItem);
  renderMediaLibrary();
}

async function getVideoDuration(path: string): Promise<number> {
  try {
    const result = await invoke('get_video_duration', { filePath: path }) as number;
    return result;
  } catch {
    return 0;
  }
}

function renderMediaLibrary() {
  const mediaLibrary = document.getElementById('mediaLibrary');
  if (!mediaLibrary) return;

  if (mediaLibraryItems.length === 0) {
    mediaLibrary.innerHTML = '<p class="empty-message">Medya eklemek için + butonuna tıklayın</p>';
    return;
  }

  mediaLibrary.innerHTML = mediaLibraryItems.map(item => `
    <div class="media-item" draggable="true" data-media-id="${item.id}">
      <div class="media-item-thumbnail" style="${item.thumbnail ? `background-image: url('${item.thumbnail}'); background-size: cover; background-position: center;` : ''}">
        ${!item.thumbnail ? `<i data-lucide="${item.type}"></i>` : ''}
        ${item.duration > 0 ? `<span class="media-duration">${formatTime(item.duration)}</span>` : ''}
      </div>
      <div class="media-item-info">
        <div class="media-item-name">${item.name}</div>
        <div class="media-item-meta">${item.type === 'video' ? 'Video' : 'Ses'}</div>
      </div>
    </div>
  `).join('');

  // Re-initialize icons
  if (typeof (window as any).createIcons === 'function') {
    (window as any).createIcons();
  }
}

let dragDropInitialized = false;

function setupDragAndDrop() {
  // Only initialize once
  if (dragDropInitialized) {
    console.log('Drag & drop already initialized, skipping');
    return;
  }

  const mediaLibrary = document.getElementById('mediaLibrary');
  const videoTrackContent = document.getElementById('videoTrackContent');
  const audioTrackContent = document.getElementById('audioTrackContent');

  if (!mediaLibrary || !videoTrackContent || !audioTrackContent) {
    console.error('Drag & drop elements not found');
    return;
  }

  // Drag start from media library - use event delegation
  mediaLibrary.addEventListener('dragstart', (e) => {
    const target = e.target as HTMLElement;
    const mediaItem = target.closest('.media-item') as HTMLElement;
    if (mediaItem && e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('text/plain', mediaItem.dataset.mediaId || '');
      mediaItem.classList.add('dragging');
      console.log('Drag started:', mediaItem.dataset.mediaId);
    }
  });

  mediaLibrary.addEventListener('dragend', (e) => {
    const target = e.target as HTMLElement;
    const mediaItem = target.closest('.media-item');
    if (mediaItem) {
      mediaItem.classList.remove('dragging');
      console.log('Drag ended');
    }
  });

  // Drop on video track
  videoTrackContent.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    videoTrackContent.classList.add('drag-over');
  });

  videoTrackContent.addEventListener('dragleave', (e) => {
    const rect = videoTrackContent.getBoundingClientRect();
    const x = (e as DragEvent).clientX;
    const y = (e as DragEvent).clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      videoTrackContent.classList.remove('drag-over');
    }
  });

  videoTrackContent.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    videoTrackContent.classList.remove('drag-over');
    
    if (e.dataTransfer) {
      const mediaId = e.dataTransfer.getData('text/plain');
      console.log('Dropped on video track:', mediaId);
      if (mediaId) {
        addClipToTimeline(mediaId, 'video');
      }
    }
  });

  // Drop on audio track
  audioTrackContent.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    audioTrackContent.classList.add('drag-over');
  });

  audioTrackContent.addEventListener('dragleave', (e) => {
    const rect = audioTrackContent.getBoundingClientRect();
    const x = (e as DragEvent).clientX;
    const y = (e as DragEvent).clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      audioTrackContent.classList.remove('drag-over');
    }
  });

  audioTrackContent.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    audioTrackContent.classList.remove('drag-over');
    
    if (e.dataTransfer) {
      const mediaId = e.dataTransfer.getData('text/plain');
      console.log('Dropped on audio track:', mediaId);
      if (mediaId) {
        addClipToTimeline(mediaId, 'audio');
      }
    }
  });

  dragDropInitialized = true;
  console.log('Drag & drop setup complete');
}

function addClipToTimeline(mediaId: string, track: 'video' | 'audio') {
  const mediaItem = mediaLibraryItems.find(m => m.id === mediaId);
  if (!mediaItem) return;

  // Check if media type matches track
  if (mediaItem.type !== track) {
    alert(`Bu medya ${track === 'video' ? 'video' : 'ses'} track'ine eklenemez!`);
    return;
  }

  // Calculate start time (end of last clip on this track)
  const clipsOnTrack = timelineClips.filter(c => c.track === track);
  const lastClip = clipsOnTrack[clipsOnTrack.length - 1];
  const startTime = lastClip ? lastClip.endTime : 0;

  const clip: TimelineClip = {
    id: generateId(),
    mediaId: mediaItem.id,
    name: mediaItem.name,
    startTime,
    endTime: startTime + mediaItem.duration,
    duration: mediaItem.duration,
    trimStart: 0,
    trimEnd: mediaItem.duration,
    track
  };

  timelineClips.push(clip);
  renderTimeline();
  updatePreview();
}

function renderTimeline() {
  const videoTrackContent = document.getElementById('videoTrackContent');
  const audioTrackContent = document.getElementById('audioTrackContent');

  if (!videoTrackContent || !audioTrackContent) return;

  const videoClips = timelineClips.filter(c => c.track === 'video');
  const audioClips = timelineClips.filter(c => c.track === 'audio');

  videoTrackContent.innerHTML = videoClips.length === 0 
    ? '<p class="track-empty">Videoları buraya sürükleyin</p>'
    : videoClips.map(clip => renderClip(clip)).join('');

  audioTrackContent.innerHTML = audioClips.length === 0
    ? '<p class="track-empty">Ses dosyalarını buraya sürükleyin</p>'
    : audioClips.map(clip => renderClip(clip)).join('');

  // Add click handlers
  document.querySelectorAll('.timeline-clip').forEach(clipEl => {
    clipEl.addEventListener('click', () => {
      const clipId = (clipEl as HTMLElement).dataset.clipId;
      selectClip(clipId || '');
    });
  });

  // Add delete handlers
  document.querySelectorAll('.clip-delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const clipId = (btn as HTMLElement).dataset.clipId;
      deleteClip(clipId || '');
    });
  });

  // Re-initialize icons
  if (typeof (window as any).createIcons === 'function') {
    (window as any).createIcons();
  }
}

function renderClip(clip: TimelineClip): string {
  const isSelected = selectedClip?.id === clip.id;
  return `
    <div class="timeline-clip ${isSelected ? 'selected' : ''}" data-clip-id="${clip.id}">
      <div class="clip-name">${clip.name}</div>
      <div class="clip-duration">${formatTime(clip.duration)}</div>
      <div class="clip-actions">
        <button class="clip-action-btn clip-delete-btn" data-clip-id="${clip.id}" title="Sil">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    </div>
  `;
}

function selectClip(clipId: string) {
  const clip = timelineClips.find(c => c.id === clipId);
  if (!clip) return;

  selectedClip = clip;
  renderTimeline();
  renderProperties();
}

function deleteClip(clipId: string) {
  timelineClips = timelineClips.filter(c => c.id !== clipId);
  if (selectedClip?.id === clipId) {
    selectedClip = null;
  }
  renderTimeline();
  renderProperties();
  updatePreview();
}

function renderProperties() {
  const propertiesContent = document.getElementById('propertiesContent');
  if (!propertiesContent) return;

  if (!selectedClip) {
    propertiesContent.innerHTML = '<p class="empty-message">Bir clip seçin</p>';
    return;
  }

  propertiesContent.innerHTML = `
    <div class="property-group">
      <div class="property-group-title">Genel</div>
      <div class="property-item">
        <label class="property-label">İsim</label>
        <input type="text" class="property-input" value="${selectedClip.name}" readonly>
      </div>
      <div class="property-item">
        <label class="property-label">Süre</label>
        <input type="text" class="property-input" value="${formatTime(selectedClip.duration)}" readonly>
      </div>
    </div>

    <div class="property-group">
      <div class="property-group-title">Kesme (Trim)</div>
      <div class="property-item">
        <label class="property-label">Başlangıç: <span class="property-value">${formatTime(selectedClip.trimStart)}</span></label>
        <input type="range" class="property-slider" id="trimStartSlider" min="0" max="${selectedClip.duration}" value="${selectedClip.trimStart}" step="0.1">
      </div>
      <div class="property-item">
        <label class="property-label">Bitiş: <span class="property-value">${formatTime(selectedClip.trimEnd)}</span></label>
        <input type="range" class="property-slider" id="trimEndSlider" min="0" max="${selectedClip.duration}" value="${selectedClip.trimEnd}" step="0.1">
      </div>
    </div>

    <div class="property-group">
      <div class="property-group-title">İşlemler</div>
      <button class="btn-danger" style="width: 100%;" onclick="window.deleteSelectedClip()">Clip'i Sil</button>
    </div>
  `;

  // Add trim slider handlers
  const trimStartSlider = document.getElementById('trimStartSlider') as HTMLInputElement;
  const trimEndSlider = document.getElementById('trimEndSlider') as HTMLInputElement;

  trimStartSlider?.addEventListener('input', (e) => {
    const value = parseFloat((e.target as HTMLInputElement).value);
    if (selectedClip) {
      selectedClip.trimStart = value;
      selectedClip.duration = selectedClip.trimEnd - selectedClip.trimStart;
      renderProperties();
      renderTimeline();
    }
  });

  trimEndSlider?.addEventListener('input', (e) => {
    const value = parseFloat((e.target as HTMLInputElement).value);
    if (selectedClip) {
      selectedClip.trimEnd = value;
      selectedClip.duration = selectedClip.trimEnd - selectedClip.trimStart;
      renderProperties();
      renderTimeline();
    }
  });
}

function updatePreview() {
  const editorPreview = document.getElementById('editorPreview') as HTMLVideoElement;
  const previewPlaceholder = document.getElementById('previewPlaceholder');

  if (timelineClips.length === 0) {
    editorPreview?.classList.remove('active');
    previewPlaceholder?.classList.remove('hidden');
    return;
  }

  // Show first video clip
  const firstVideoClip = timelineClips.find(c => c.track === 'video');
  if (firstVideoClip) {
    const mediaItem = mediaLibraryItems.find(m => m.id === firstVideoClip.mediaId);
    if (mediaItem) {
      // Convert path using Tauri
      import('@tauri-apps/api/core').then(({ convertFileSrc }) => {
        const videoUrl = convertFileSrc(mediaItem.path);
        editorPreview.src = videoUrl;
        editorPreview.classList.add('active');
        previewPlaceholder?.classList.add('hidden');
      });
    }
  }
}

function showExportModal() {
  const modal = document.createElement('div');
  modal.className = 'export-modal';
  modal.innerHTML = `
    <div class="export-modal-content">
      <div class="export-modal-header">
        <h3>Videoyu Dışa Aktar</h3>
      </div>
      <div class="export-options">
        <div class="property-item">
          <label class="property-label">Kalite</label>
          <select class="property-input" id="exportQuality">
            <option value="ultra">Ultra Kalite (CRF 15)</option>
            <option value="high">Yüksek Kalite (CRF 18)</option>
            <option value="medium" selected>Orta Kalite (CRF 23)</option>
            <option value="low">Düşük Kalite (CRF 28)</option>
          </select>
        </div>
      </div>
      <div class="export-actions">
        <button class="btn-secondary" onclick="this.closest('.export-modal').remove()">İptal</button>
        <button class="btn-primary" onclick="window.startExport()">Dışa Aktar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

(window as any).startExport = async () => {
  const quality = (document.getElementById('exportQuality') as HTMLSelectElement)?.value || 'medium';
  
  // Close modal
  document.querySelector('.export-modal')?.remove();

  // Show progress
  alert('Video dışa aktarma başladı! Bu işlem biraz zaman alabilir.');

  try {
    // Export timeline
    const result = await invoke('export_timeline', {
      clips: timelineClips.map(clip => {
        const mediaItem = mediaLibraryItems.find(m => m.id === clip.mediaId);
        return {
          path: mediaItem?.path,
          trimStart: clip.trimStart,
          trimEnd: clip.trimEnd,
          track: clip.track
        };
      }),
      quality
    });

    alert('Video başarıyla dışa aktarıldı!');
    console.log('Export result:', result);
  } catch (error) {
    alert(`Dışa aktarma hatası: ${error}`);
    console.error('Export error:', error);
  }
};

(window as any).deleteSelectedClip = () => {
  if (selectedClip) {
    deleteClip(selectedClip.id);
  }
};

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds === 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
