import { initIcons } from '../utils/icons';
import { formatFileSize, openFileLocation } from '../utils/helpers';
import { saveVideo, getVideos } from '../database';

let selectedVideos: string[] = [];
let mergeVideos: string[] = [];

export function setupVideoPage() {
  // Make functions global for onclick handlers
  (window as any).openFileLocation = openFileLocation;
  
  // Tab switching
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = (btn as HTMLElement).dataset.tab;
      
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(`${tab}Tab`)?.classList.add('active');
    });
  });
  
  // Video file selection for optimize
  const videoDropZone = document.getElementById('videoDropZone');
  videoDropZone?.addEventListener('click', async () => {
    const { open } = await import('@tauri-apps/plugin-dialog');
    
    const selected = await open({
      multiple: true,
      filters: [{
        name: 'Videos',
        extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv']
      }]
    });
    
    if (selected) {
      const paths = Array.isArray(selected) ? selected : [selected];
      addVideosToSelection(paths);
    }
  });
  
  // Video file selection for merge
  const mergeDropZone = document.getElementById('mergeDropZone');
  mergeDropZone?.addEventListener('click', async () => {
    const { open } = await import('@tauri-apps/plugin-dialog');
    
    const selected = await open({
      multiple: true,
      filters: [{
        name: 'Videos',
        extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv']
      }]
    });
    
    if (selected) {
      const paths = Array.isArray(selected) ? selected : [selected];
      addVideosToMerge(paths);
    }
  });
  
  // Merge videos button
  const mergeVideosBtn = document.getElementById('mergeVideosBtn');
  mergeVideosBtn?.addEventListener('click', handleMergeVideos);
  
  // Load recent videos on init
  loadRecentVideos();
  
  // Make functions global for onclick handlers
  (window as any).clearSelectedVideos = clearSelectedVideos;
  (window as any).removeVideo = removeVideo;
  (window as any).optimizeAllVideos = optimizeAllVideos;
  (window as any).clearMergeVideos = clearMergeVideos;
  (window as any).removeMergeVideo = removeMergeVideo;
  (window as any).playVideo = playVideo;
}

export function addVideosToSelection(paths: string[]) {
  selectedVideos = [...selectedVideos, ...paths];
  renderSelectedVideos();
}

export function addVideosToMerge(paths: string[]) {
  mergeVideos = [...mergeVideos, ...paths];
  renderMergeList();
}

function renderSelectedVideos() {
  const selectedVideosContainer = document.getElementById('selectedVideos');
  if (!selectedVideosContainer) return;
  
  if (selectedVideos.length === 0) {
    selectedVideosContainer.innerHTML = '';
    selectedVideosContainer.style.display = 'none';
    return;
  }
  
  selectedVideosContainer.style.display = 'block';
  selectedVideosContainer.innerHTML = `
    <div class="selected-files-header">
      <h3>Seçilen Videolar (${selectedVideos.length})</h3>
      <button class="btn-secondary" onclick="clearSelectedVideos()">Temizle</button>
    </div>
    <div class="selected-files-list">
      ${selectedVideos.map((path, index) => {
        const fileName = path.split(/[\\/]/).pop() || 'unknown';
        return `
          <div class="selected-file-item" data-index="${index}">
            <div class="file-item-info">
              <i data-lucide="video"></i>
              <span class="file-name">${fileName}</span>
            </div>
            <div class="file-item-controls">
              <select class="format-select" data-index="${index}">
                <option value="ultra">Ultra Kalite (CRF 15 - En İyi)</option>
                <option value="high">Yüksek Kalite (CRF 18)</option>
                <option value="medium" selected>Orta Kalite (CRF 23 - Önerilen)</option>
                <option value="low">Düşük Kalite (CRF 28)</option>
                <option value="verylow">Çok Düşük (CRF 32 - En Küçük)</option>
              </select>
              <button class="btn-icon" onclick="removeVideo(${index})" title="Kaldır">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
    <div class="selected-files-actions">
      <button class="btn-primary btn-large" onclick="optimizeAllVideos()">Tümünü Optimize Et</button>
    </div>
  `;
  
  initIcons();
}

function renderMergeList() {
  const mergeListContainer = document.getElementById('mergeList');
  const mergeActions = document.getElementById('mergeActions');
  if (!mergeListContainer) return;
  
  if (mergeVideos.length === 0) {
    mergeListContainer.innerHTML = '';
    mergeActions!.style.display = 'none';
    return;
  }
  
  mergeActions!.style.display = 'flex';
  mergeListContainer.innerHTML = `
    <div class="merge-list-header">
      <h3>Birleştirilecek Videolar (${mergeVideos.length})</h3>
      <button class="btn-secondary" onclick="clearMergeVideos()">Temizle</button>
    </div>
    <div class="merge-items">
      ${mergeVideos.map((path, index) => {
        const fileName = path.split(/[\\/]/).pop() || 'unknown';
        return `
          <div class="merge-item" data-index="${index}">
            <span class="merge-order">${index + 1}</span>
            <i data-lucide="video"></i>
            <span class="file-name">${fileName}</span>
            <button class="btn-icon" onclick="removeMergeVideo(${index})" title="Kaldır">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        `;
      }).join('')}
    </div>
  `;
  
  initIcons();
}

function clearSelectedVideos() {
  selectedVideos = [];
  renderSelectedVideos();
}

function removeVideo(index: number) {
  selectedVideos.splice(index, 1);
  renderSelectedVideos();
}

function clearMergeVideos() {
  mergeVideos = [];
  renderMergeList();
}

function removeMergeVideo(index: number) {
  mergeVideos.splice(index, 1);
  renderMergeList();
}

async function optimizeAllVideos() {
  const selectedVideosContainer = document.getElementById('selectedVideos');
  if (!selectedVideosContainer) return;
  
  const fileItems = selectedVideosContainer.querySelectorAll('.selected-file-item');
  
  for (let i = 0; i < selectedVideos.length; i++) {
    const filePath = selectedVideos[i];
    const fileItem = fileItems[i];
    
    const qualitySelect = fileItem.querySelector('.format-select') as HTMLSelectElement;
    const quality = qualitySelect?.value || 'medium';
    
    await optimizeVideo(filePath, quality);
  }
  
  selectedVideos = [];
  renderSelectedVideos();
}

async function optimizeVideo(filePath: string, quality: string) {
  const { invoke } = await import('@tauri-apps/api/core');
  const videoQueue = document.getElementById('videoQueue');
  
  const fileName = filePath.split(/[\\/]/).pop() || 'unknown';
  const outputDir = localStorage.getItem('outputPath') || null;
  
  const queueItem = document.createElement('div');
  queueItem.className = 'queue-item';
  queueItem.innerHTML = `
    <div class="queue-item-info">
      <span class="queue-item-name">${fileName}</span>
      <span class="queue-item-status">Optimize ediliyor... (${quality})</span>
    </div>
    <div class="queue-item-progress">
      <div class="progress-bar"></div>
    </div>
  `;
  videoQueue?.appendChild(queueItem);
  
  try {
    const result: any = await invoke('optimize_video', {
      filePath: filePath,
      outputDir: outputDir,
      quality: quality
    });
    
    await saveVideo(result);
    
    queueItem.querySelector('.queue-item-status')!.textContent = `Tamamlandı! (${result.duration})`;
    queueItem.classList.add('success');
    
    await loadRecentVideos();
    
    setTimeout(() => {
      queueItem.remove();
    }, 3000);
    
  } catch (error) {
    console.error('Video optimization error:', error);
    queueItem.querySelector('.queue-item-status')!.textContent = `Hata: ${error}`;
    queueItem.classList.add('error');
  }
}

async function handleMergeVideos() {
  if (mergeVideos.length < 2) {
    alert('En az 2 video seçmelisiniz!');
    return;
  }
  
  const { invoke } = await import('@tauri-apps/api/core');
  const mergeQueue = document.getElementById('mergeQueue');
  const outputDir = localStorage.getItem('outputPath') || null;
  
  const queueItem = document.createElement('div');
  queueItem.className = 'queue-item';
  queueItem.innerHTML = `
    <div class="queue-item-info">
      <span class="queue-item-name">${mergeVideos.length} video birleştiriliyor...</span>
      <span class="queue-item-status">İşleniyor...</span>
    </div>
    <div class="queue-item-progress">
      <div class="progress-bar"></div>
    </div>
  `;
  mergeQueue?.appendChild(queueItem);
  
  try {
    const result: any = await invoke('merge_videos', {
      filePaths: mergeVideos,
      outputDir: outputDir
    });
    
    await saveVideo(result);
    
    queueItem.querySelector('.queue-item-status')!.textContent = `Tamamlandı! (${result.duration})`;
    queueItem.classList.add('success');
    
    mergeVideos = [];
    renderMergeList();
    
    await loadRecentVideos();
    
    setTimeout(() => {
      queueItem.remove();
    }, 3000);
    
  } catch (error) {
    console.error('Video merge error:', error);
    queueItem.querySelector('.queue-item-status')!.textContent = `Hata: ${error}`;
    queueItem.classList.add('error');
  }
}

export async function loadRecentVideos() {
  const videoResultsGrid = document.getElementById('videoResultsGrid');
  if (!videoResultsGrid) return;

  try {
    const videos = await getVideos();
    
    if (videos.length === 0) {
      videoResultsGrid.innerHTML = '<p class="empty-message">Henüz dönüştürülmüş video yok</p>';
      return;
    }

    const recentVideos = videos.slice(0, 6);
    const { invoke } = await import('@tauri-apps/api/core');
    
    const videoPromises = recentVideos.map(async (video) => {
      try {
        const thumbnail = await invoke('get_video_thumbnail', { filePath: video.output_path }) as string;
        return { ...video, thumbnail };
      } catch (error) {
        console.error('Failed to load thumbnail:', video.output_path, error);
        return { ...video, thumbnail: '' };
      }
    });
    
    const videosWithThumbnails = await Promise.all(videoPromises);
    
    videoResultsGrid.innerHTML = videosWithThumbnails.map(video => {
      const escapedPath = video.output_path.replace(/\\/g, '\\\\');
      return `
      <div class="result-card video-card">
        <div class="video-preview" onclick='playVideo(\`${escapedPath}\`, "${video.converted_name}")' style="${video.thumbnail ? `background-image: url('${video.thumbnail}'); background-size: cover; background-position: center;` : ''}">
          <i data-lucide="play" class="play-icon"></i>
          <span class="video-duration">${video.duration}</span>
        </div>
        <div class="result-card-header">
          <span class="result-format">MP4</span>
          <span class="result-size">${formatFileSize(video.file_size)}</span>
        </div>
        <div class="result-card-body">
          <h4>${video.converted_name}</h4>
          <p class="result-meta">${video.created_at}</p>
        </div>
        <div class="result-card-actions">
          <button class="action-btn" onclick='openFileLocation(\`${escapedPath}\`)' title="Dosya Konumunu Aç">
            <i data-lucide="folder-open"></i>
          </button>
        </div>
      </div>
    `;
    }).join('');

    initIcons();
  } catch (error) {
    console.error('Load video results error:', error);
  }
}

async function playVideo(filePath: string, fileName: string) {
  const { convertFileSrc } = await import('@tauri-apps/api/core');
  const videoUrl = convertFileSrc(filePath);
  
  const modal = document.createElement('div');
  modal.className = 'video-modal';
  modal.innerHTML = `
    <div class="video-modal-content">
      <div class="video-modal-header">
        <h3>${fileName}</h3>
        <button class="modal-close" onclick="this.closest('.video-modal').remove()">×</button>
      </div>
      <video controls autoplay>
        <source src="${videoUrl}" type="video/mp4">
        Tarayıcınız video oynatmayı desteklemiyor.
      </video>
    </div>
  `;
  document.body.appendChild(modal);
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}
