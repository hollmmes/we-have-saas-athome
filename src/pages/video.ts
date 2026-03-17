import { saveVideo, getVideos } from '../database';
import type { ConvertedVideo, VideoPreset, WatchFolder } from '../types';
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
import {
  completeQueueJob,
  createPresetId,
  createQueueJob,
  createRetryPayload,
  failQueueJob,
  getActiveProfile,
  getPresets,
  notifyApp,
  registerRetryHandler,
  registerWatchProcessor,
  savePreset,
  subscribeWorkflowChanges,
} from '../workflow';

type VideoProcessingOptions = {
  trimStart: string;
  trimEnd: string;
  normalizeAudio: boolean;
};

let selectedVideos: string[] = [];
let mergeVideos: string[] = [];

export function setupVideoPage() {
  ensureVideoWorkflowUi();
  bindVideoToolbarControls();
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const videoDropZone = document.getElementById('videoDropZone')!;
  const mergeDropZone = document.getElementById('mergeDropZone')!;
  const selectedVideosContainer = document.getElementById('selectedVideos')!;
  const mergeListContainer = document.getElementById('mergeList')!;
  const videoResultsGrid = document.getElementById('videoResultsGrid')!;
  const mergeVideosBtn = document.getElementById('mergeVideosBtn')!;
  const presetSelect = document.getElementById('videoPresetSelect') as HTMLSelectElement | null;
  const applyPresetBtn = document.getElementById('applyVideoPresetBtn');
  const savePresetBtn = document.getElementById('saveVideoPresetBtn');

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
    if (actionButton?.dataset.openPath) {
      await openFileLocation(actionButton.dataset.openPath);
      return;
    }

    const preview = (event.target as HTMLElement).closest<HTMLElement>('[data-play-path]');
    if (preview?.dataset.playPath && preview.dataset.playName) {
      await playVideo(preview.dataset.playPath, preview.dataset.playName);
    }
  });

  mergeVideosBtn.addEventListener('click', handleMergeVideos);

  applyPresetBtn?.addEventListener('click', () => {
    const preset = resolveVideoPreset(presetSelect?.value || '');
    if (!preset) {
      return;
    }

    applyPresetToSelection(preset);
    applyVideoToolbarState(preset);
    notifyApp('info', `Applied video preset: ${preset.name}`);
  });

  savePresetBtn?.addEventListener('click', saveCurrentVideoPreset);

  registerRetryHandler('video-optimize', async (payload) => {
    const retry = payload as { filePath: string; quality: string; options: VideoProcessingOptions };
    await optimizeVideo(retry.filePath, retry.quality, retry.options);
  });

  registerRetryHandler('video-merge', async (payload) => {
    const retry = payload as { filePaths: string[] };
    const previousMergeVideos = [...mergeVideos];
    mergeVideos = [...retry.filePaths];
    try {
      await handleMergeVideos();
    } finally {
      mergeVideos = previousMergeVideos;
      renderMergeList();
    }
  });

  registerWatchProcessor('video', async (paths, folder) => {
    await processVideoWatchFolder(paths, folder);
  });

  const unsubscribe = subscribeWorkflowChanges((section) => {
    if (section === 'presets' || section === 'profiles') {
      populateVideoPresetSelect();
    }
  });

  window.addEventListener('beforeunload', unsubscribe, { once: true });
  populateVideoPresetSelect();
  syncVideoToolbarFromPreset();

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
  const preset = getDefaultVideoPreset();
  if (preset) {
    applyPresetToSelection(preset);
    applyVideoToolbarState(preset);
  }
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

  const options = getCurrentVideoProcessingOptions();
  if (!validateVideoProcessingOptions(options)) {
    return;
  }

  const fileItems = selectedVideosContainer.querySelectorAll('.selected-file-item');

  for (let index = 0; index < selectedVideos.length; index += 1) {
    const filePath = selectedVideos[index];
    const fileItem = fileItems[index];
    const qualitySelect = fileItem.querySelector<HTMLSelectElement>('.format-select');
    const quality = qualitySelect.value || 'medium';

    await optimizeVideo(filePath, quality, options);
  }

  clearSelectedVideos();
}

async function optimizeVideo(filePath: string, quality: string, options = getCurrentVideoProcessingOptions()) {
  const { invoke } = await import('@tauri-apps/api/core');
  const videoQueue = document.getElementById('videoQueue');
  if (!videoQueue) {
    return;
  }

  const fileName = fileNameFromPath(filePath);
  const trimLabel = options.trimStart || options.trimEnd
    ? `${options.trimStart || '00:00'} -> ${options.trimEnd || 'end'}`
    : 'full';
  const job = createQueueJob({
    tool: 'video',
    action: 'optimize',
    title: `Video optimize: ${fileName}`,
    inputPaths: [filePath],
    message: `Running ${quality} quality optimization`,
    retryKey: 'video-optimize',
    retryPayload: createRetryPayload({ filePath, quality, options })
  });

  const queueItem = document.createElement('div');
  queueItem.className = 'queue-item';
  queueItem.innerHTML = `
    <div class="queue-item-info">
      <span class="queue-item-name">${escapeHtml(fileName)}</span>
      <span class="queue-item-status">
        Optimize ediliyor... (${escapeHtml(quality)}, Trim: ${escapeHtml(trimLabel)}, Audio: ${options.normalizeAudio ? 'normalized' : 'original'})
      </span>
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
      quality,
      trimStart: options.trimStart || null,
      trimEnd: options.trimEnd || null,
      normalizeAudio: options.normalizeAudio
    });

    await saveVideo(result);
    queueItem.querySelector('.queue-item-status')!.textContent = `Tamamlandi! (${result.duration})`;
    queueItem.classList.add('success');
    completeQueueJob(job.id, {
      outputPaths: [result.output_path],
      message: `Completed optimization in ${result.duration}`,
      metrics: {
        quality,
        duration: result.duration,
        size: formatFileSize(result.file_size),
        trim: trimLabel,
        audio: options.normalizeAudio ? 'normalized' : 'original',
      },
    });

    await loadRecentVideos();
    await renderVideoCompareCard(filePath, result, quality, options);

    setTimeout(() => {
      queueItem.remove();
    }, 3000);
  } catch (error) {
    console.error('Video optimization error:', error);
    queueItem.querySelector('.queue-item-status')!.textContent = `Hata: ${String(error)}`;
    queueItem.classList.add('error');
    failQueueJob(job.id, String(error));
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
  const job = createQueueJob({
    tool: 'video',
    action: 'merge',
    title: `Video merge (${mergeVideos.length} files)`,
    inputPaths: [...mergeVideos],
    message: `Merging ${mergeVideos.length} file(s)`,
    retryKey: 'video-merge',
    retryPayload: createRetryPayload({ filePaths: mergeVideos })
  });
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
    completeQueueJob(job.id, {
      outputPaths: [result.output_path],
      message: `Merged video ready (${result.duration})`,
      metrics: {
        files: String(mergeVideos.length),
        duration: result.duration,
        size: formatFileSize(result.file_size),
      },
    });

    clearMergeVideos();
    await loadRecentVideos();

    setTimeout(() => {
      queueItem.remove();
    }, 3000);
  } catch (error) {
    console.error('Video merge error:', error);
    queueItem.querySelector('.queue-item-status')!.textContent = `Hata: ${String(error)}`;
    queueItem.classList.add('error');
    failQueueJob(job.id, String(error));
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

function ensureVideoWorkflowUi() {
  const contentWrapper = document.querySelector('#videoPage .content-wrapper');
  const videoContainer = document.querySelector('#videoPage .video-container');
  if (!contentWrapper || !videoContainer) {
    return;
  }

  if (!document.getElementById('videoPresetSelect')) {
    const toolbar = document.createElement('div');
    toolbar.className = 'tool-toolbar';
    toolbar.innerHTML = `
      <div class="tool-toolbar-group">
        <label for="videoPresetSelect">Preset</label>
        <select id="videoPresetSelect" class="tool-select"></select>
        <button class="btn-secondary btn-sm" id="applyVideoPresetBtn" type="button">Apply</button>
        <button class="btn-secondary btn-sm" id="saveVideoPresetBtn" type="button">Save Preset</button>
      </div>
      <div class="tool-toolbar-group">
        <input id="videoTrimStart" class="monitor-input tool-input-compact" type="text" placeholder="Trim start 00:00">
        <input id="videoTrimEnd" class="monitor-input tool-input-compact" type="text" placeholder="Trim end 00:30">
        <label class="tool-checkbox">
          <input id="videoNormalizeAudio" type="checkbox">
          <span>Normalize audio</span>
        </label>
        <button class="btn-secondary btn-sm" id="resetVideoProcessingBtn" type="button">Reset</button>
      </div>
      <div class="tool-toolbar-group tool-toolbar-note">
        <span>Optimization queue, trim, retry and watch folders are active.</span>
      </div>
    `;

    contentWrapper.insertBefore(toolbar, videoContainer);
  }

  if (!document.getElementById('videoComparePanel')) {
    const comparePanel = document.createElement('div');
    comparePanel.id = 'videoComparePanel';
    comparePanel.className = 'compare-panel';
    comparePanel.innerHTML = `
      <div class="compare-panel-header">
        <h3>Video Compare</h3>
        <p>Recent optimization metrics appear here.</p>
      </div>
      <div class="compare-panel-grid" id="videoCompareGrid"></div>
    `;

    videoContainer.appendChild(comparePanel);
  }
}

function populateVideoPresetSelect() {
  const select = document.getElementById('videoPresetSelect') as HTMLSelectElement | null;
  if (!select) {
    return;
  }

  const presets = getPresets('video');
  const activePreset = getDefaultVideoPreset();

  select.innerHTML = presets
    .map((preset) => `
      <option value="${escapeAttribute(preset.id)}" ${preset.id === activePreset?.id ? 'selected' : ''}>
        ${escapeHtml(preset.name)} - ${escapeHtml(preset.quality)}
      </option>
    `)
    .join('');
}

function getDefaultVideoPreset() {
  const activeProfile = getActiveProfile();
  const presets = getPresets('video');
  return presets.find((preset) => preset.id === activeProfile?.videoPresetId) || presets[0] || null;
}

function resolveVideoPreset(presetId: string) {
  return getPresets('video').find((preset) => preset.id === presetId) || getDefaultVideoPreset();
}

function applyPresetToSelection(preset: VideoPreset) {
  document.querySelectorAll<HTMLElement>('#selectedVideos .selected-file-item').forEach((item) => {
    const qualitySelect = item.querySelector<HTMLSelectElement>('.format-select');
    if (qualitySelect) {
      qualitySelect.value = preset.quality;
    }
  });
}

function applyVideoToolbarState(preset: VideoPreset) {
  const trimStart = document.getElementById('videoTrimStart') as HTMLInputElement | null;
  const trimEnd = document.getElementById('videoTrimEnd') as HTMLInputElement | null;
  const normalizeAudio = document.getElementById('videoNormalizeAudio') as HTMLInputElement | null;

  if (trimStart) {
    trimStart.value = preset.trimStart || '';
  }

  if (trimEnd) {
    trimEnd.value = preset.trimEnd || '';
  }

  if (normalizeAudio) {
    normalizeAudio.checked = preset.normalizeAudio ?? false;
  }
}

function syncVideoToolbarFromPreset() {
  const preset = getDefaultVideoPreset();
  if (preset) {
    applyVideoToolbarState(preset);
  }
}

function bindVideoToolbarControls() {
  const toolbar = document.getElementById('videoPresetSelect')?.closest('.tool-toolbar');
  if (!toolbar || toolbar.getAttribute('data-video-toolbar-bound') === 'true') {
    return;
  }

  toolbar.setAttribute('data-video-toolbar-bound', 'true');

  const resetButton = document.getElementById('resetVideoProcessingBtn');
  resetButton?.addEventListener('click', () => {
    const trimStart = document.getElementById('videoTrimStart') as HTMLInputElement | null;
    const trimEnd = document.getElementById('videoTrimEnd') as HTMLInputElement | null;
    const normalizeAudio = document.getElementById('videoNormalizeAudio') as HTMLInputElement | null;

    if (trimStart) {
      trimStart.value = '';
    }

    if (trimEnd) {
      trimEnd.value = '';
    }

    if (normalizeAudio) {
      normalizeAudio.checked = false;
    }
  });
}

function getCurrentVideoProcessingOptions(): VideoProcessingOptions {
  return {
    trimStart: (document.getElementById('videoTrimStart') as HTMLInputElement | null)?.value.trim() || '',
    trimEnd: (document.getElementById('videoTrimEnd') as HTMLInputElement | null)?.value.trim() || '',
    normalizeAudio: (document.getElementById('videoNormalizeAudio') as HTMLInputElement | null)?.checked ?? false,
  };
}

function parseTimecodeToSeconds(value: string): number | null {
  if (!value) {
    return null;
  }

  const parts = value.split(':').map((part) => Number.parseFloat(part));
  if (parts.some((part) => Number.isNaN(part) || part < 0)) {
    return null;
  }

  if (parts.length === 1) {
    return parts[0];
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return null;
}

function validateVideoProcessingOptions(options: VideoProcessingOptions): boolean {
  const startSeconds = parseTimecodeToSeconds(options.trimStart);
  const endSeconds = parseTimecodeToSeconds(options.trimEnd);

  if (options.trimStart && startSeconds === null) {
    alert('Trim start must be a valid timecode like 00:12 or 00:00:12.');
    return false;
  }

  if (options.trimEnd && endSeconds === null) {
    alert('Trim end must be a valid timecode like 00:30 or 00:00:30.');
    return false;
  }

  if (startSeconds !== null && endSeconds !== null && endSeconds <= startSeconds) {
    alert('Trim end must be greater than trim start.');
    return false;
  }

  return true;
}

function saveCurrentVideoPreset() {
  const selectedVideosContainer = document.getElementById('selectedVideos');
  const firstItem = selectedVideosContainer?.querySelector<HTMLElement>('.selected-file-item');
  const quality = firstItem?.querySelector<HTMLSelectElement>('.format-select')?.value || 'medium';
  const options = getCurrentVideoProcessingOptions();
  const presetName = window.prompt('Preset name', `Video ${quality}`);

  if (!presetName) {
    return;
  }

  savePreset({
    id: createPresetId('video'),
    type: 'video',
    name: presetName.trim(),
    quality,
    mode: 'optimize',
    suffix: quality,
    trimStart: options.trimStart,
    trimEnd: options.trimEnd,
    normalizeAudio: options.normalizeAudio,
  });

  populateVideoPresetSelect();
  notifyApp('success', `Saved video preset: ${presetName.trim()}`);
}

async function renderVideoCompareCard(
  filePath: string,
  result: ConvertedVideo,
  quality: string,
  options: VideoProcessingOptions
) {
  const compareGrid = document.getElementById('videoCompareGrid');
  if (!compareGrid) {
    return;
  }

  const fs = await import('@tauri-apps/plugin-fs');
  let originalSize = 0;
  try {
    const stat = await fs.stat(filePath);
    originalSize = stat.size || 0;
  } catch (error) {
    console.error('Video stat error:', error);
  }

  const savedPercent = originalSize > 0
    ? `${Math.round((1 - result.file_size / originalSize) * 100)}%`
    : 'n/a';

  const card = document.createElement('article');
  card.className = 'compare-card compare-card-compact';
  card.innerHTML = `
    <div class="compare-card-header">
      <h4>${escapeHtml(result.converted_name)}</h4>
      <span>${escapeHtml(quality)}</span>
    </div>
    <div class="compare-card-metrics">
      <span>Original: ${formatFileSize(originalSize)}</span>
      <span>Output: ${formatFileSize(result.file_size)}</span>
      <span>Saved: ${escapeHtml(savedPercent)}</span>
      <span>Duration: ${escapeHtml(result.duration)}</span>
      <span>Trim: ${escapeHtml(options.trimStart || options.trimEnd ? `${options.trimStart || '00:00'} -> ${options.trimEnd || 'end'}` : 'full')}</span>
      <span>Audio: ${options.normalizeAudio ? 'normalized' : 'original'}</span>
    </div>
    <div class="compare-card-actions">
      <button class="btn-secondary btn-sm" data-open-original="${escapeAttribute(filePath)}" type="button">Open source</button>
      <button class="btn-secondary btn-sm" data-open-output="${escapeAttribute(result.output_path)}" type="button">Open output</button>
    </div>
  `;

  card.querySelector<HTMLButtonElement>('[data-open-original]')?.addEventListener('click', async () => {
    await openFileLocation(filePath);
  });

  card.querySelector<HTMLButtonElement>('[data-open-output]')?.addEventListener('click', async () => {
    await openFileLocation(result.output_path);
  });

  compareGrid.prepend(card);
  while (compareGrid.children.length > 4) {
    compareGrid.lastElementChild?.remove();
  }
}

async function processVideoWatchFolder(paths: string[], folder: WatchFolder) {
  const preset = resolveVideoPreset(folder.presetId);
  if (folder.behavior === 'import') {
    addVideosToSelection(paths);
    if (preset) {
      applyPresetToSelection(preset);
      applyVideoToolbarState(preset);
    }
    notifyApp('info', `${folder.name} imported ${paths.length} video file(s).`);
    return;
  }

  const options: VideoProcessingOptions = {
    trimStart: preset?.trimStart || '',
    trimEnd: preset?.trimEnd || '',
    normalizeAudio: preset?.normalizeAudio ?? false,
  };

  if (!validateVideoProcessingOptions(options)) {
    return;
  }

  for (const filePath of paths) {
    await optimizeVideo(filePath, preset?.quality || 'medium', options);
  }
}
