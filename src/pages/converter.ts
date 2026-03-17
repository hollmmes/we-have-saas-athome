import { saveImage, getImages } from '../database';
import type { ConvertedImage, ImagePreset, WatchFolder } from '../types';
import {
  ensureOutputSubfolder,
  escapeAttribute,
  escapeHtml,
  fileNameFromPath,
  formatFileSize,
  isImagePath,
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

type ImageProcessingOptions = {
  watermarkEnabled: boolean;
  watermarkText: string;
  watermarkPosition: NonNullable<ImagePreset['watermarkPosition']>;
  watermarkOpacity: number;
  metadataCleanup: boolean;
};

const DEFAULT_WATERMARK_POSITION: NonNullable<ImagePreset['watermarkPosition']> = 'bottom-right';
const DEFAULT_WATERMARK_OPACITY = 44;

let selectedFiles: string[] = [];

export function setupConverterPage() {
  ensureConverterWorkflowUi();
  bindImageToolbarControls();

  const dropZone = document.getElementById('dropZone')!;
  const selectedFilesContainer = document.getElementById('selectedFiles')!;
  const resultsGrid = document.getElementById('resultsGrid')!;
  const presetSelect = document.getElementById('imagePresetSelect') as HTMLSelectElement | null;
  const applyPresetBtn = document.getElementById('applyImagePresetBtn');
  const savePresetBtn = document.getElementById('saveImagePresetBtn');

  dropZone.addEventListener('click', async () => {
    const { open } = await import('@tauri-apps/plugin-dialog');

    const selected = await open({
      multiple: true,
      filters: [
        {
          name: 'Images',
          extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'tiff', 'tif', 'ico']
        }
      ]
    });

    if (!selected) {
      return;
    }

    addFilesToSelection(Array.isArray(selected) ? selected : [selected]);
  });

  selectedFilesContainer.addEventListener('click', async (event) => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');
    if (!target) {
      return;
    }

    const { action, index } = target.dataset;

    if (action === 'clear-selection') {
      clearSelectedFiles();
      return;
    }

    if (action === 'remove-file' && index) {
      removeFile(Number(index));
      return;
    }

    if (action === 'convert-all') {
      await convertAllFiles();
    }
  });

  resultsGrid.addEventListener('click', async (event) => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-open-path]');
    if (!target?.dataset.openPath) {
      return;
    }

    await openFileLocation(target.dataset.openPath);
  });

  applyPresetBtn?.addEventListener('click', () => {
    const preset = resolveImagePreset(presetSelect?.value || '');
    if (!preset) {
      return;
    }

    applyPresetToSelection(preset);
    applyImageToolbarState(preset);
    notifyApp('info', `Applied image preset: ${preset.name}`);
  });

  savePresetBtn?.addEventListener('click', saveCurrentImagePreset);

  registerRetryHandler('image-convert', async (payload) => {
    const retry = payload as {
      filePath: string;
      format: string;
      quality: number;
      options: ImageProcessingOptions;
    };
    await convertFile(retry.filePath, retry.format, retry.quality, retry.options);
  });

  registerWatchProcessor('image', async (paths, folder) => {
    await processImageWatchFolder(paths, folder);
  });

  const unsubscribe = subscribeWorkflowChanges((section) => {
    if (section === 'presets' || section === 'profiles') {
      populateImagePresetSelect();
      syncImageToolbarFromProfile();
    }
  });

  window.addEventListener('beforeunload', unsubscribe, { once: true });
  populateImagePresetSelect();
  syncImageToolbarFromProfile();
}

export async function handleFilePaths(paths: string[]) {
  const imagePaths = paths.filter(isImagePath);
  if (imagePaths.length === 0) {
    return;
  }

  addFilesToSelection(imagePaths);
  const preset = getDefaultImagePreset();
  if (preset) {
    applyPresetToSelection(preset);
    applyImageToolbarState(preset);
  }
}

function addFilesToSelection(paths: string[]) {
  const imagePaths = uniqueStrings(paths.filter(isImagePath));
  if (imagePaths.length === 0) {
    return;
  }

  selectedFiles = uniqueStrings([...selectedFiles, ...imagePaths]);
  renderSelectedFiles();
}

function clearSelectedFiles() {
  selectedFiles = [];
  renderSelectedFiles();
}

function removeFile(index: number) {
  selectedFiles.splice(index, 1);
  renderSelectedFiles();
}

function renderSelectedFiles() {
  const selectedFilesContainer = document.getElementById('selectedFiles')!;
  if (!selectedFilesContainer) {
    return;
  }

  if (selectedFiles.length === 0) {
    selectedFilesContainer.innerHTML = '';
    selectedFilesContainer.style.display = 'none';
    return;
  }

  const preset = getDefaultImagePreset();
  selectedFilesContainer.style.display = 'block';
  selectedFilesContainer.innerHTML = `
    <div class="selected-files-header">
      <h3>Secilen Fotograflar (${selectedFiles.length})</h3>
      <button class="btn-secondary" data-action="clear-selection">Temizle</button>
    </div>
    <div class="selected-files-list">
      ${selectedFiles
        .map((path, index) => {
          const fileName = escapeHtml(fileNameFromPath(path));
          const defaultFormat = preset?.format || 'webp';
          const defaultQuality = preset?.quality || 85;
          return `
            <div class="selected-file-item" data-index="${index}">
              <div class="file-item-info">
                <i data-lucide="image"></i>
                <span class="file-name">${fileName}</span>
              </div>
              <div class="file-item-controls">
                <select class="format-select" data-index="${index}">
                  <option value="png" ${defaultFormat === 'png' ? 'selected' : ''}>PNG</option>
                  <option value="jpg" ${defaultFormat === 'jpg' ? 'selected' : ''}>JPG</option>
                  <option value="webp" ${defaultFormat === 'webp' ? 'selected' : ''}>WebP</option>
                  <option value="gif" ${defaultFormat === 'gif' ? 'selected' : ''}>GIF</option>
                  <option value="bmp" ${defaultFormat === 'bmp' ? 'selected' : ''}>BMP</option>
                  <option value="ico" ${defaultFormat === 'ico' ? 'selected' : ''}>ICO</option>
                  <option value="tiff" ${defaultFormat === 'tiff' ? 'selected' : ''}>TIFF</option>
                </select>
                <div class="quality-control" data-index="${index}">
                  <label>Kalite: <span class="quality-value">${defaultQuality}</span>%</label>
                  <input type="range" class="quality-slider" min="1" max="100" value="${defaultQuality}" data-index="${index}">
                </div>
                <button class="btn-icon" data-action="remove-file" data-index="${index}" title="Kaldir">
                  <i data-lucide="trash-2"></i>
                </button>
              </div>
            </div>
          `;
        })
        .join('')}
    </div>
    <div class="selected-files-actions">
      <button class="btn-primary btn-large" data-action="convert-all">Tumunu Donustur</button>
    </div>
  `;

  selectedFilesContainer.querySelectorAll<HTMLInputElement>('.quality-slider').forEach((slider) => {
    slider.addEventListener('input', (event) => {
      const input = event.target as HTMLInputElement;
      const valueSpan = input.parentElement?.querySelector('.quality-value');
      if (valueSpan) {
        valueSpan.textContent = input.value;
      }
    });
  });

  initIcons();
}

async function convertAllFiles() {
  const selectedFilesContainer = document.getElementById('selectedFiles')!;
  if (!selectedFilesContainer) {
    return;
  }

  const fileItems = selectedFilesContainer.querySelectorAll('.selected-file-item');
  const options = getCurrentImageProcessingOptions();

  for (let index = 0; index < selectedFiles.length; index += 1) {
    const filePath = selectedFiles[index];
    const fileItem = fileItems[index];

    if (!fileItem) {
      continue;
    }

    const formatSelect = fileItem.querySelector<HTMLSelectElement>('.format-select');
    const qualitySlider = fileItem.querySelector<HTMLInputElement>('.quality-slider');
    const format = formatSelect?.value || 'webp';
    const quality = Number.parseInt(qualitySlider?.value || '85', 10);

    await convertFile(filePath, format, quality, options);
  }

  clearSelectedFiles();
}

async function convertFile(
  filePath: string,
  format: string,
  quality: number,
  options = getCurrentImageProcessingOptions()
) {
  const { invoke } = await import('@tauri-apps/api/core');
  const conversionQueue = document.getElementById('conversionQueue');
  if (!conversionQueue) {
    return;
  }

  const fileName = fileNameFromPath(filePath);
  const watermarkLabel = options.watermarkEnabled && options.watermarkText
    ? `Watermark on (${options.watermarkPosition})`
    : 'Watermark off';

  const job = createQueueJob({
    tool: 'image',
    action: 'convert',
    title: `Image convert: ${fileName}`,
    inputPaths: [filePath],
    message: `Running ${format.toUpperCase()} at ${quality}% quality`,
    retryKey: 'image-convert',
    retryPayload: createRetryPayload({ filePath, format, quality, options })
  });

  const queueItem = document.createElement('div');
  queueItem.className = 'queue-item';
  queueItem.innerHTML = `
    <div class="queue-item-info">
      <span class="queue-item-name">${escapeHtml(fileName)}</span>
      <span class="queue-item-status">
        Donusturuluyor... (${escapeHtml(format.toUpperCase())}, Kalite: ${quality}%, ${escapeHtml(watermarkLabel)})
      </span>
    </div>
    <div class="queue-item-progress">
      <div class="progress-bar"></div>
    </div>
  `;
  conversionQueue.appendChild(queueItem);

  try {
    queueItem.classList.add('running');
    const outputDir = await ensureOutputSubfolder('converted_images');
    const result = await invoke<ConvertedImage>('convert_image', {
      filePath,
      outputFormat: format,
      outputDir,
      quality,
      watermarkText: options.watermarkEnabled ? options.watermarkText : '',
      watermarkPosition: options.watermarkPosition,
      watermarkOpacity: options.watermarkOpacity
    });

    await saveImage(result);
    queueItem.querySelector('.queue-item-status')!.textContent = 'Tamamlandi!';
    queueItem.classList.add('success');
    completeQueueJob(job.id, {
      outputPaths: [result.output_path],
      message: `Completed ${result.converted_format.toUpperCase()} conversion`,
      metrics: {
        format: result.converted_format.toUpperCase(),
        size: formatFileSize(result.file_size),
        watermark: options.watermarkEnabled && options.watermarkText ? options.watermarkPosition : 'off',
        metadata: options.metadataCleanup ? 'stripped' : 'unchanged',
      },
    });

    await loadConvertedResults();
    await renderImageCompareCard(filePath, result, options);

    setTimeout(() => {
      queueItem.remove();
    }, 3000);
  } catch (error) {
    console.error('Conversion error:', error);
    queueItem.querySelector('.queue-item-status')!.textContent = `Hata: ${String(error)}`;
    queueItem.classList.add('error');
    failQueueJob(job.id, String(error));
  }
}

export async function loadConvertedResults() {
  const resultsGrid = document.getElementById('resultsGrid')!;
  if (!resultsGrid) {
    return;
  }

  try {
    const images = await getImages();

    if (images.length === 0) {
      resultsGrid.innerHTML = '<p class="empty-message">Henuz donusturulmus fotograf yok</p>';
      return;
    }

    const recentImages = images.slice(0, 6);
    const { invoke } = await import('@tauri-apps/api/core');

    const imagesWithData = await Promise.all(
      recentImages.map(async (image) => {
        try {
          const dataUrl = await invoke<string>('get_image_data_url', { filePath: image.output_path });
          return { ...image, dataUrl };
        } catch (error) {
          console.error('Failed to load image:', image.output_path, error);
          return { ...image, dataUrl: '' };
        }
      })
    );

    resultsGrid.innerHTML = imagesWithData
      .map((image) => {
        const dataUrl = image.dataUrl ? `src="${escapeAttribute(image.dataUrl)}"` : '';
        return `
          <div class="result-card">
            ${image.dataUrl ? `
              <div class="result-preview">
                <img ${dataUrl} alt="${escapeAttribute(image.converted_name)}" />
              </div>
            ` : ''}
            <div class="result-card-header">
              <span class="result-format">${escapeHtml(image.converted_format)}</span>
              <span class="result-size">${formatFileSize(image.file_size)}</span>
            </div>
            <div class="result-card-body">
              <h4>${escapeHtml(image.converted_name)}</h4>
              <p class="result-meta">${escapeHtml(image.created_at)}</p>
            </div>
            <div class="result-card-actions">
              <button class="action-btn" data-open-path="${escapeAttribute(image.output_path)}" title="Dosya Konumunu Ac">
                <i data-lucide="folder-open"></i>
              </button>
            </div>
          </div>
        `;
      })
      .join('');

    initIcons();
  } catch (error) {
    console.error('Load results error:', error);
  }
}

function ensureConverterWorkflowUi() {
  const contentWrapper = document.querySelector('#converterPage .content-wrapper');
  const converterContainer = document.querySelector('#converterPage .converter-container');
  if (!contentWrapper || !converterContainer) {
    return;
  }

  if (!document.getElementById('imagePresetSelect')) {
    const toolbar = document.createElement('div');
    toolbar.className = 'tool-toolbar';
    toolbar.innerHTML = `
      <div class="tool-toolbar-group">
        <label for="imagePresetSelect">Preset</label>
        <select id="imagePresetSelect" class="tool-select"></select>
        <button class="btn-secondary btn-sm" id="applyImagePresetBtn" type="button">Apply</button>
        <button class="btn-secondary btn-sm" id="saveImagePresetBtn" type="button">Save Preset</button>
      </div>
      <div class="tool-toolbar-group">
        <label class="tool-checkbox">
          <input id="imageWatermarkEnabled" type="checkbox">
          <span>Watermark</span>
        </label>
        <input id="imageWatermarkText" class="monitor-input tool-input-compact" type="text" placeholder="Brand text">
        <select id="imageWatermarkPosition" class="tool-select tool-select-compact">
          <option value="bottom-right">Bottom right</option>
          <option value="bottom-left">Bottom left</option>
          <option value="top-right">Top right</option>
          <option value="top-left">Top left</option>
          <option value="center">Center</option>
        </select>
        <label class="tool-range-inline" for="imageWatermarkOpacity">
          <span>Opacity</span>
          <input id="imageWatermarkOpacity" type="range" min="15" max="100" value="${DEFAULT_WATERMARK_OPACITY}">
          <strong id="imageWatermarkOpacityValue">${DEFAULT_WATERMARK_OPACITY}%</strong>
        </label>
      </div>
      <div class="tool-toolbar-group tool-toolbar-note">
        <span>Metadata cleanup is automatic on every export.</span>
      </div>
    `;

    contentWrapper.insertBefore(toolbar, converterContainer);
  }

  if (!document.getElementById('imageComparePanel')) {
    const comparePanel = document.createElement('div');
    comparePanel.id = 'imageComparePanel';
    comparePanel.className = 'compare-panel';
    comparePanel.innerHTML = `
      <div class="compare-panel-header">
        <h3>Before / After</h3>
        <p>Recent image conversion comparisons appear here.</p>
      </div>
      <div class="compare-panel-grid" id="imageCompareGrid"></div>
    `;

    converterContainer.appendChild(comparePanel);
  }
}

function bindImageToolbarControls() {
  const toolbar = document.getElementById('imagePresetSelect')?.closest('.tool-toolbar');
  if (!toolbar || toolbar.getAttribute('data-image-toolbar-bound') === 'true') {
    return;
  }

  toolbar.setAttribute('data-image-toolbar-bound', 'true');

  const opacityInput = document.getElementById('imageWatermarkOpacity') as HTMLInputElement | null;
  const opacityValue = document.getElementById('imageWatermarkOpacityValue');
  opacityInput?.addEventListener('input', () => {
    if (opacityValue) {
      opacityValue.textContent = `${opacityInput.value}%`;
    }
  });
}

function populateImagePresetSelect() {
  const select = document.getElementById('imagePresetSelect') as HTMLSelectElement | null;
  if (!select) {
    return;
  }

  const presets = getPresets('image');
  const activePreset = getDefaultImagePreset();

  select.innerHTML = presets
    .map((preset) => `
      <option value="${escapeAttribute(preset.id)}" ${preset.id === activePreset?.id ? 'selected' : ''}>
        ${escapeHtml(preset.name)} - ${escapeHtml(preset.format.toUpperCase())}/${preset.quality}
      </option>
    `)
    .join('');
}

function getDefaultImagePreset() {
  const activeProfile = getActiveProfile();
  const presets = getPresets('image');
  return presets.find((preset) => preset.id === activeProfile?.imagePresetId) || presets[0] || null;
}

function resolveImagePreset(presetId: string) {
  return getPresets('image').find((preset) => preset.id === presetId) || getDefaultImagePreset();
}

function applyPresetToSelection(preset: ImagePreset) {
  document.querySelectorAll<HTMLElement>('#selectedFiles .selected-file-item').forEach((item) => {
    const formatSelect = item.querySelector<HTMLSelectElement>('.format-select');
    const qualitySlider = item.querySelector<HTMLInputElement>('.quality-slider');
    const qualityValue = item.querySelector<HTMLElement>('.quality-value');

    if (formatSelect) {
      formatSelect.value = preset.format;
    }

    if (qualitySlider) {
      qualitySlider.value = String(preset.quality);
    }

    if (qualityValue) {
      qualityValue.textContent = String(preset.quality);
    }
  });
}

function applyImageToolbarState(preset: ImagePreset) {
  const watermarkEnabled = document.getElementById('imageWatermarkEnabled') as HTMLInputElement | null;
  const watermarkText = document.getElementById('imageWatermarkText') as HTMLInputElement | null;
  const watermarkPosition = document.getElementById('imageWatermarkPosition') as HTMLSelectElement | null;
  const watermarkOpacity = document.getElementById('imageWatermarkOpacity') as HTMLInputElement | null;
  const watermarkOpacityValue = document.getElementById('imageWatermarkOpacityValue');
  const activeProfile = getActiveProfile();

  if (watermarkEnabled) {
    watermarkEnabled.checked = preset.watermarkEnabled ?? false;
  }

  if (watermarkText) {
    watermarkText.value = preset.watermarkText || activeProfile?.watermarkText || '';
  }

  if (watermarkPosition) {
    watermarkPosition.value = preset.watermarkPosition || DEFAULT_WATERMARK_POSITION;
  }

  if (watermarkOpacity) {
    watermarkOpacity.value = String(preset.watermarkOpacity ?? DEFAULT_WATERMARK_OPACITY);
  }

  if (watermarkOpacityValue) {
    watermarkOpacityValue.textContent = `${preset.watermarkOpacity ?? DEFAULT_WATERMARK_OPACITY}%`;
  }
}

function syncImageToolbarFromProfile() {
  const preset = getDefaultImagePreset();
  if (preset) {
    applyImageToolbarState(preset);
    return;
  }

  const activeProfile = getActiveProfile();
  const watermarkText = document.getElementById('imageWatermarkText') as HTMLInputElement | null;
  if (watermarkText && !watermarkText.value.trim()) {
    watermarkText.value = activeProfile?.watermarkText || '';
  }
}

function getCurrentImageProcessingOptions(): ImageProcessingOptions {
  const watermarkEnabled = (document.getElementById('imageWatermarkEnabled') as HTMLInputElement | null)?.checked ?? false;
  const watermarkTextInput = document.getElementById('imageWatermarkText') as HTMLInputElement | null;
  const watermarkPosition = (document.getElementById('imageWatermarkPosition') as HTMLSelectElement | null)?.value as ImageProcessingOptions['watermarkPosition'] | undefined;
  const watermarkOpacity = Number.parseInt((document.getElementById('imageWatermarkOpacity') as HTMLInputElement | null)?.value || String(DEFAULT_WATERMARK_OPACITY), 10);
  const activeProfile = getActiveProfile();

  return {
    watermarkEnabled,
    watermarkText: (watermarkTextInput?.value.trim() || activeProfile?.watermarkText || '').trim(),
    watermarkPosition: watermarkPosition || DEFAULT_WATERMARK_POSITION,
    watermarkOpacity: Number.isFinite(watermarkOpacity) ? watermarkOpacity : DEFAULT_WATERMARK_OPACITY,
    metadataCleanup: true,
  };
}

function saveCurrentImagePreset() {
  const selectedFilesContainer = document.getElementById('selectedFiles');
  const firstItem = selectedFilesContainer?.querySelector<HTMLElement>('.selected-file-item');
  const firstFormat = firstItem?.querySelector<HTMLSelectElement>('.format-select')?.value || 'webp';
  const firstQuality = Number.parseInt(firstItem?.querySelector<HTMLInputElement>('.quality-slider')?.value || '85', 10);
  const options = getCurrentImageProcessingOptions();
  const presetName = window.prompt('Preset name', `Image ${firstFormat.toUpperCase()} ${firstQuality}`);

  if (!presetName) {
    return;
  }

  savePreset({
    id: createPresetId('image'),
    type: 'image',
    name: presetName.trim(),
    format: firstFormat,
    quality: firstQuality,
    suffix: firstFormat,
    keepOriginalName: true,
    watermarkEnabled: options.watermarkEnabled,
    watermarkText: options.watermarkText,
    watermarkPosition: options.watermarkPosition,
    watermarkOpacity: options.watermarkOpacity,
  });

  populateImagePresetSelect();
  notifyApp('success', `Saved image preset: ${presetName.trim()}`);
}

async function renderImageCompareCard(filePath: string, result: ConvertedImage, options: ImageProcessingOptions) {
  const compareGrid = document.getElementById('imageCompareGrid');
  if (!compareGrid) {
    return;
  }

  const { invoke } = await import('@tauri-apps/api/core');
  const fs = await import('@tauri-apps/plugin-fs');

  let originalPreview = '';
  let outputPreview = '';
  let originalSize = 0;

  try {
    [originalPreview, outputPreview] = await Promise.all([
      invoke<string>('get_image_data_url', { filePath }),
      invoke<string>('get_image_data_url', { filePath: result.output_path }),
    ]);
  } catch (error) {
    console.error('Compare preview error:', error);
  }

  try {
    const stat = await fs.stat(filePath);
    originalSize = stat.size || 0;
  } catch (error) {
    console.error('Original file stat error:', error);
  }

  const delta = originalSize > 0
    ? `${Math.round(((result.file_size - originalSize) / originalSize) * 100)}%`
    : 'n/a';

  const card = document.createElement('article');
  card.className = 'compare-card';
  card.innerHTML = `
    <div class="compare-card-header">
      <h4>${escapeHtml(result.converted_name)}</h4>
      <span>${escapeHtml(result.converted_format.toUpperCase())}</span>
    </div>
    <div class="compare-card-body">
      <div class="compare-card-image">
        ${originalPreview ? `<img src="${escapeAttribute(originalPreview)}" alt="Original preview" />` : '<div class="compare-card-empty">No preview</div>'}
        <span>Original</span>
      </div>
      <div class="compare-card-image">
        ${outputPreview ? `<img src="${escapeAttribute(outputPreview)}" alt="Converted preview" />` : '<div class="compare-card-empty">No preview</div>'}
        <span>Converted</span>
      </div>
    </div>
    <div class="compare-card-metrics">
      <span>Original: ${formatFileSize(originalSize)}</span>
      <span>Output: ${formatFileSize(result.file_size)}</span>
      <span>Delta: ${escapeHtml(delta)}</span>
      <span>Watermark: ${escapeHtml(options.watermarkEnabled && options.watermarkText ? options.watermarkPosition : 'off')}</span>
      <span>Metadata: stripped</span>
    </div>
  `;

  compareGrid.prepend(card);
  while (compareGrid.children.length > 4) {
    compareGrid.lastElementChild?.remove();
  }
}

function buildImageOptionsFromPreset(preset: ImagePreset | null): ImageProcessingOptions {
  const activeProfile = getActiveProfile();
  return {
    watermarkEnabled: preset?.watermarkEnabled ?? false,
    watermarkText: preset?.watermarkText || activeProfile?.watermarkText || '',
    watermarkPosition: preset?.watermarkPosition || DEFAULT_WATERMARK_POSITION,
    watermarkOpacity: preset?.watermarkOpacity ?? DEFAULT_WATERMARK_OPACITY,
    metadataCleanup: true,
  };
}

async function processImageWatchFolder(paths: string[], folder: WatchFolder) {
  const preset = resolveImagePreset(folder.presetId);
  if (folder.behavior === 'import') {
    addFilesToSelection(paths);
    if (preset) {
      applyPresetToSelection(preset);
      applyImageToolbarState(preset);
    }
    notifyApp('info', `${folder.name} imported ${paths.length} image file(s).`);
    return;
  }

  const options = buildImageOptionsFromPreset(preset);
  for (const filePath of paths) {
    await convertFile(filePath, preset?.format || 'webp', preset?.quality || 85, options);
  }
}
