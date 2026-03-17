import { saveImage, getImages } from '../database';
import type { ConvertedImage } from '../types';
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

let selectedFiles: string[] = [];

export function setupConverterPage() {
  const dropZone = document.getElementById('dropZone')!;
  const selectedFilesContainer = document.getElementById('selectedFiles')!;
  const resultsGrid = document.getElementById('resultsGrid')!;

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

    const paths = Array.isArray(selected) ? selected : [selected];
    addFilesToSelection(paths);
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
    const filePath = target.dataset.openPath;

    if (target && filePath) {
      await openFileLocation(filePath);
    }
  });
}

export async function handleFilePaths(paths: string[]) {
  const imagePaths = paths.filter(isImagePath);
  if (imagePaths.length > 0) {
    addFilesToSelection(imagePaths);
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
  if (!selectedFilesContainer) return;

  if (selectedFiles.length === 0) {
    selectedFilesContainer.innerHTML = '';
    selectedFilesContainer.style.display = 'none';
    return;
  }

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
          return `
            <div class="selected-file-item" data-index="${index}">
              <div class="file-item-info">
                <i data-lucide="image"></i>
                <span class="file-name">${fileName}</span>
              </div>
              <div class="file-item-controls">
                <select class="format-select" data-index="${index}">
                  <option value="png">PNG</option>
                  <option value="jpg">JPG</option>
                  <option value="webp" selected>WebP</option>
                  <option value="gif">GIF</option>
                  <option value="bmp">BMP</option>
                  <option value="ico">ICO</option>
                  <option value="tiff">TIFF</option>
                </select>
                <div class="quality-control" data-index="${index}">
                  <label>Kalite: <span class="quality-value">85</span>%</label>
                  <input type="range" class="quality-slider" min="1" max="100" value="85" data-index="${index}">
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

  const sliders = selectedFilesContainer.querySelectorAll<HTMLInputElement>('.quality-slider');
  sliders.forEach((slider) => {
    slider.addEventListener('input', (event) => {
      const input = event.target as HTMLInputElement;
      const valueSpan = input.parentElement.querySelector('.quality-value');
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

  for (let index = 0; index < selectedFiles.length; index += 1) {
    const filePath = selectedFiles[index];
    const fileItem = fileItems[index];

    if (!fileItem) {
      continue;
    }

    const formatSelect = fileItem.querySelector<HTMLSelectElement>('.format-select');
    const qualitySlider = fileItem.querySelector<HTMLInputElement>('.quality-slider');
    const format = formatSelect.value || 'webp';
    const quality = Number.parseInt(qualitySlider.value || '85', 10);

    await convertFile(filePath, format, quality);
  }

  clearSelectedFiles();
}

async function convertFile(filePath: string, format: string, quality: number) {
  const { invoke } = await import('@tauri-apps/api/core');
  const conversionQueue = document.getElementById('conversionQueue');
  const fileName = fileNameFromPath(filePath);

  const queueItem = document.createElement('div');
  queueItem.className = 'queue-item';
  queueItem.innerHTML = `
    <div class="queue-item-info">
      <span class="queue-item-name">${escapeHtml(fileName)}</span>
      <span class="queue-item-status">Donusturuluyor... (${escapeHtml(format.toUpperCase())}, Kalite: ${quality}%)</span>
    </div>
    <div class="queue-item-progress">
      <div class="progress-bar"></div>
    </div>
  `;
  conversionQueue.appendChild(queueItem);

  try {
    const outputDir = await ensureOutputSubfolder('converted_images');
    const result = await invoke<ConvertedImage>('convert_image', {
      filePath,
      outputFormat: format,
      outputDir,
      quality
    });

    await saveImage(result);
    queueItem.querySelector('.queue-item-status')!.textContent = 'Tamamlandi!';
    queueItem.classList.add('success');

    await loadConvertedResults();

    setTimeout(() => {
      queueItem.remove();
    }, 3000);
  } catch (error) {
    console.error('Conversion error:', error);
    queueItem.querySelector('.queue-item-status')!.textContent = `Hata: ${String(error)}`;
    queueItem.classList.add('error');
  }
}

export async function loadConvertedResults() {
  const resultsGrid = document.getElementById('resultsGrid')!;
  if (!resultsGrid) return;

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
