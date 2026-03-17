import { saveVideo, getVideos } from '../database';
import type { ConvertedVideo } from '../types';
import {
  ensureOutputSubfolder,
  escapeAttribute,
  escapeHtml,
  fileNameFromPath,
  formatFileSize,
  isVideoPath,
  openFileLocation,
  uniqueStrings
} from '../utils/helpers';
import { initIcons } from '../utils/icons';

let selectedVideos: string[] = [];
let mergeVideos: string[] = [];

export function setupVideoPage() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const videoDropZone = document.getElementById('videoDropZone')!;
  const mergeDropZone = document.getElementById('mergeDropZone')!;
  const selectedVideosContainer = document.getElementById('selectedVideos')!;
  const mergeListContainer = document.getElementById('mergeList')!;
  const videoResultsGrid = document.getElementById('videoResultsGrid')!;
  const mergeVideosBtn = document.getElementById('mergeVideosBtn')!;

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = (btn as HTMLElement).dataset.tab;

      tabBtns.forEach((item) => item.classList.remove('active'));
      tabContents.forEach((item) => item.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(`${tab}Tab`).classList.add('active');
    });
  });

  videoDropZone.addEventListener('click', async () => {
    const { open } = await import('@tauri-apps/plugin-dialog');

    const selected = await open({
      multiple: true,
      filters: [
        {
          name: 'Videos',
          extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv']
        }
      ]
    });

    if (!selected) {
      return;
    }

    addVideosToSelection(Array.isArray(selected) ? selected : [selected]);
  });

  mergeDropZone.addEventListener('click', async () => {
    const { open } = await import('@tauri-apps/plugin-dialog');

    const selected = await open({
      multiple: true,
      filters: [
        {
          name: 'Videos',
          extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv']
        }
      ]
    });

    if (!selected) {
      return;
    }

    addVideosToMerge(Array.isArray(selected) ? selected : [selected]);
  });

  selectedVideosContainer.addEventListener('click', async (event) => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');
    if (!target) {
      return;
    }

    const { action, index } = target.dataset;

    if (action === 'clear-selected-videos') {
      clearSelectedVideos();
      return;
    }

    if (action === 'remove-selected-video' && index) {
      removeVideo(Number(index));
      return;
    }

    if (action === 'optimize-all-videos') {
      await optimizeAllVideos();
    }
  });

  mergeListContainer.addEventListener('click', async (event) => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');
    if (!target) {
      return;
    }

    const { action, index } = target.dataset;

    if (action === 'clear-merge-videos') {
      clearMergeVideos();
      return;
    }

    if (action === 'remove-merge-video' && index) {
      removeMergeVideo(Number(index));
    }
  });

  videoResultsGrid.addEventListener('click', async (event) => {
    const actionButton = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-open-path]');
    if (actionButton.dataset.openPath) {
      await openFileLocation(actionButton.dataset.openPath);
      return;
    }

    const preview = (event.target as HTMLElement).closest<HTMLElement>('[data-play-path]');
    if (preview.dataset.playPath && preview.dataset.playName) {
      await playVideo(preview.dataset.playPath, preview.dataset.playName);
    }
  });

  mergeVideosBtn.addEventListener('click', handleMergeVideos);

  void loadRecentVideos();
}

function normalizeVideoPaths(paths: string[]): string[] {
  return uniqueStrings(paths.filter(isVideoPath));
}

export function addVideosToSelection(paths: string[]) {
  const validPaths = normalizeVideoPaths(paths);
  if (validPaths.length === 0) {
    return;
  }

  selectedVideos = uniqueStrings([...selectedVideos, ...validPaths]);
  renderSelectedVideos();
}

export function addVideosToMerge(paths: string[]) {
  const validPaths = normalizeVideoPaths(paths);
  if (validPaths.length === 0) {
    return;
  }

  mergeVideos = uniqueStrings([...mergeVideos, ...validPaths]);
  renderMergeList();
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

function renderSelectedVideos() {
  const selectedVideosContainer = document.getElementById('selectedVideos')!;
  if (!selectedVideosContainer) return;

  if (selectedVideos.length === 0) {
    selectedVideosContainer.innerHTML = '';
    selectedVideosContainer.style.display = 'none';
    return;
  }

  selectedVideosContainer.style.display = 'block';
  selectedVideosContainer.innerHTML = `
    <div class="selected-files-header">
      <h3>Secilen Videolar (${selectedVideos.length})</h3>
      <button class="btn-secondary" data-action="clear-selected-videos">Temizle</button>
    </div>
    <div class="selected-files-list">
      ${selectedVideos
        .map((path, index) => {
          const fileName = escapeHtml(fileNameFromPath(path));
          return `
            <div class="selected-file-item" data-index="${index}">
              <div class="file-item-info">
                <i data-lucide="video"></i>
                <span class="file-name">${fileName}</span>
              </div>
              <div class="file-item-controls">
                <select class="format-select" data-index="${index}">
                  <option value="ultra">Ultra Kalite (CRF 15 - En Iyi)</option>
                  <option value="high">Yuksek Kalite (CRF 18)</option>
                  <option value="medium" selected>Orta Kalite (CRF 23 - Onerilen)</option>
                  <option value="low">Dusuk Kalite (CRF 28)</option>
                  <option value="verylow">Cok Dusuk (CRF 32 - En Kucuk)</option>
                </select>
                <button class="btn-icon" data-action="remove-selected-video" data-index="${index}" title="Kaldir">
                  <i data-lucide="trash-2"></i>
                </button>
              </div>
            </div>
          `;
        })
        .join('')}
    </div>
    <div class="selected-files-actions">
      <button class="btn-primary btn-large" data-action="optimize-all-videos">Tumunu Optimize Et</button>
    </div>
  `;

  initIcons();
}

function renderMergeList() {
  const mergeListContainer = document.getElementById('mergeList')!;
  const mergeActions = document.getElementById('mergeActions');
  if (!mergeListContainer || !mergeActions) return;

  if (mergeVideos.length === 0) {
    mergeListContainer.innerHTML = '';
    mergeActions.style.display = 'none';
    return;
  }

  mergeActions.style.display = 'flex';
  mergeListContainer.innerHTML = `
    <div class="merge-list-header">
      <h3>Birlestirilecek Videolar (${mergeVideos.length})</h3>
      <button class="btn-secondary" data-action="clear-merge-videos">Temizle</button>
    </div>
    <div class="merge-items">
      ${mergeVideos
        .map((path, index) => `
          <div class="merge-item" data-index="${index}">
            <span class="merge-order">${index + 1}</span>
            <i data-lucide="video"></i>
            <span class="file-name">${escapeHtml(fileNameFromPath(path))}</span>
            <button class="btn-icon" data-action="remove-merge-video" data-index="${index}" title="Kaldir">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        `)
        .join('')}
    </div>
  `;

  initIcons();
}

async function optimizeAllVideos() {
  const selectedVideosContainer = document.getElementById('selectedVideos')!;
  if (!selectedVideosContainer) {
    return;
  }

  const fileItems = selectedVideosContainer.querySelectorAll('.selected-file-item');

  for (let index = 0; index < selectedVideos.length; index += 1) {
    const filePath = selectedVideos[index];
    const fileItem = fileItems[index];
    const qualitySelect = fileItem.querySelector<HTMLSelectElement>('.format-select');
    const quality = qualitySelect.value || 'medium';

    await optimizeVideo(filePath, quality);
  }

  clearSelectedVideos();
}

async function optimizeVideo(filePath: string, quality: string) {
  const { invoke } = await import('@tauri-apps/api/core');
  const videoQueue = document.getElementById('videoQueue');
  const fileName = fileNameFromPath(filePath);

  const queueItem = document.createElement('div');
  queueItem.className = 'queue-item';
  queueItem.innerHTML = `
    <div class="queue-item-info">
      <span class="queue-item-name">${escapeHtml(fileName)}</span>
      <span class="queue-item-status">Optimize ediliyor... (${escapeHtml(quality)})</span>
    </div>
    <div class="queue-item-progress">
      <div class="progress-bar"></div>
    </div>
  `;
  videoQueue.appendChild(queueItem);

  try {
    const outputDir = await ensureOutputSubfolder('converted_videos');
    const result = await invoke<ConvertedVideo>('optimize_video', {
      filePath,
      outputDir,
      quality
    });

    await saveVideo(result);
    queueItem.querySelector('.queue-item-status')!.textContent = `Tamamlandi! (${result.duration})`;
    queueItem.classList.add('success');

    await loadRecentVideos();

    setTimeout(() => {
      queueItem.remove();
    }, 3000);
  } catch (error) {
    console.error('Video optimization error:', error);
    queueItem.querySelector('.queue-item-status')!.textContent = `Hata: ${String(error)}`;
    queueItem.classList.add('error');
  }
}

async function handleMergeVideos() {
  if (mergeVideos.length < 2) {
    alert('En az 2 video secmelisiniz!');
    return;
  }

  const { invoke } = await import('@tauri-apps/api/core');
  const mergeQueue = document.getElementById('mergeQueue');

  const queueItem = document.createElement('div');
  queueItem.className = 'queue-item';
  queueItem.innerHTML = `
    <div class="queue-item-info">
      <span class="queue-item-name">${mergeVideos.length} video birlestiriliyor...</span>
      <span class="queue-item-status">Isleniyor...</span>
    </div>
    <div class="queue-item-progress">
      <div class="progress-bar"></div>
    </div>
  `;
  mergeQueue.appendChild(queueItem);

  try {
    const outputDir = await ensureOutputSubfolder('converted_videos');
    const result = await invoke<ConvertedVideo>('merge_videos', {
      filePaths: mergeVideos,
      outputDir
    });

    await saveVideo(result);
    queueItem.querySelector('.queue-item-status')!.textContent = `Tamamlandi! (${result.duration})`;
    queueItem.classList.add('success');

    clearMergeVideos();
    await loadRecentVideos();

    setTimeout(() => {
      queueItem.remove();
    }, 3000);
  } catch (error) {
    console.error('Video merge error:', error);
    queueItem.querySelector('.queue-item-status')!.textContent = `Hata: ${String(error)}`;
    queueItem.classList.add('error');
  }
}

export async function loadRecentVideos() {
  const videoResultsGrid = document.getElementById('videoResultsGrid')!;
  if (!videoResultsGrid) return;

  try {
    const videos = await getVideos();

    if (videos.length === 0) {
      videoResultsGrid.innerHTML = '<p class="empty-message">Henuz donusturulmus video yok</p>';
      return;
    }

    const recentVideos = videos.slice(0, 6);
    const { invoke } = await import('@tauri-apps/api/core');

    const videosWithThumbnails = await Promise.all(
      recentVideos.map(async (video) => {
        try {
          const thumbnail = await invoke<string>('get_video_thumbnail', { filePath: video.output_path });
          return { ...video, thumbnail };
        } catch (error) {
          console.error('Failed to load thumbnail:', video.output_path, error);
          return { ...video, thumbnail: '' };
        }
      })
    );

    videoResultsGrid.innerHTML = videosWithThumbnails
      .map((video) => `
        <div class="result-card video-card">
          <div
            class="video-preview"
            data-play-path="${escapeAttribute(video.output_path)}"
            data-play-name="${escapeAttribute(video.converted_name)}"
            style="${video.thumbnail ? `background-image: url('${escapeAttribute(video.thumbnail)}'); background-size: cover; background-position: center;` : ''}"
          >
            <i data-lucide="play" class="play-icon"></i>
            <span class="video-duration">${escapeHtml(video.duration)}</span>
          </div>
          <div class="result-card-header">
            <span class="result-format">MP4</span>
            <span class="result-size">${formatFileSize(video.file_size)}</span>
          </div>
          <div class="result-card-body">
            <h4>${escapeHtml(video.converted_name)}</h4>
            <p class="result-meta">${escapeHtml(video.created_at)}</p>
          </div>
          <div class="result-card-actions">
            <button class="action-btn" data-open-path="${escapeAttribute(video.output_path)}" title="Dosya Konumunu Ac">
              <i data-lucide="folder-open"></i>
            </button>
          </div>
        </div>
      `)
      .join('');

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

  const content = document.createElement('div');
  content.className = 'video-modal-content';

  const header = document.createElement('div');
  header.className = 'video-modal-header';

  const title = document.createElement('h3');
  title.textContent = fileName;

  const closeButton = document.createElement('button');
  closeButton.className = 'modal-close';
  closeButton.textContent = 'x';
  closeButton.addEventListener('click', () => {
    modal.remove();
  });

  const video = document.createElement('video');
  video.controls = true;
  video.autoplay = true;

  const source = document.createElement('source');
  source.src = videoUrl;
  source.type = 'video/mp4';

  video.appendChild(source);
  video.append('Tarayiciniz video oynatmayi desteklemiyor.');
  header.append(title, closeButton);
  content.append(header, video);
  modal.appendChild(content);
  document.body.appendChild(modal);

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.remove();
    }
  });
}
