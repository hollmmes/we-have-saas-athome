import { initIcons } from '../utils/icons';
import { formatFileSize, openFileLocation } from '../utils/helpers';
import { saveImage, getImages } from '../database';

let selectedFiles: string[] = [];

export function setupConverterPage() {
  const dropZone = document.getElementById('dropZone');
  
  // Click to select files
  dropZone?.addEventListener('click', async () => {
    const { open } = await import('@tauri-apps/plugin-dialog');
    
    const selected = await open({
      multiple: true,
      filters: [{
        name: 'Images',
        extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'tiff', 'tif', 'ico']
      }]
    });
    
    if (selected) {
      const paths = Array.isArray(selected) ? selected : [selected];
      addFilesToSelection(paths);
    }
  });
}

export async function handleFilePaths(paths: string[]) {
  const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'tiff', 'tif', 'ico'];
  const imagePaths = paths.filter(path => {
    const ext = path.split('.').pop()?.toLowerCase();
    return ext && imageExtensions.includes(ext);
  });
  
  if (imagePaths.length > 0) {
    addFilesToSelection(imagePaths);
  }
}

function addFilesToSelection(paths: string[]) {
  selectedFiles = [...selectedFiles, ...paths];
  renderSelectedFiles();
}

function renderSelectedFiles() {
  const selectedFilesContainer = document.getElementById('selectedFiles');
  if (!selectedFilesContainer) return;
  
  if (selectedFiles.length === 0) {
    selectedFilesContainer.innerHTML = '';
    selectedFilesContainer.style.display = 'none';
    return;
  }

  selectedFilesContainer.style.display = 'block';
  selectedFilesContainer.innerHTML = `
    <div class="selected-files-header">
      <h3>Seçilen Fotoğraflar (${selectedFiles.length})</h3>
      <button class="btn-secondary" onclick="clearSelectedFiles()">Temizle</button>
    </div>
    <div class="selected-files-list">
      ${selectedFiles.map((path, index) => {
        const fileName = path.split(/[\\/]/).pop() || 'unknown';
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
              <button class="btn-icon" onclick="removeFile(${index})" title="Kaldır">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
    <div class="selected-files-actions">
      <button class="btn-primary btn-large" onclick="convertAllFiles()">Tümünü Dönüştür</button>
    </div>
  `;

  // Add event listeners for quality sliders
  const sliders = selectedFilesContainer.querySelectorAll('.quality-slider');
  sliders.forEach(slider => {
    slider.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const value = target.value;
      const valueSpan = target.parentElement?.querySelector('.quality-value');
      if (valueSpan) {
        valueSpan.textContent = value;
      }
    });
  });

  initIcons();
}

(window as any).clearSelectedFiles = () => {
  selectedFiles = [];
  renderSelectedFiles();
};

(window as any).removeFile = (index: number) => {
  selectedFiles.splice(index, 1);
  renderSelectedFiles();
};

(window as any).convertAllFiles = async () => {
  const selectedFilesContainer = document.getElementById('selectedFiles');
  if (!selectedFilesContainer) return;

  const fileItems = selectedFilesContainer.querySelectorAll('.selected-file-item');
  
  for (let i = 0; i < selectedFiles.length; i++) {
    const filePath = selectedFiles[i];
    const fileItem = fileItems[i];
    
    const formatSelect = fileItem.querySelector('.format-select') as HTMLSelectElement;
    const qualitySlider = fileItem.querySelector('.quality-slider') as HTMLInputElement;
    
    const format = formatSelect?.value || 'webp';
    const quality = parseInt(qualitySlider?.value || '85');
    
    await convertFile(filePath, format, quality);
  }

  selectedFiles = [];
  renderSelectedFiles();
};

async function convertFile(filePath: string, format: string, quality: number) {
  const { invoke } = await import('@tauri-apps/api/core');
  const conversionQueue = document.getElementById('conversionQueue');
  
  const fileName = filePath.split(/[\\/]/).pop() || 'unknown';
  const outputDir = localStorage.getItem('outputPath') || null;
  
  const queueItem = document.createElement('div');
  queueItem.className = 'queue-item';
  queueItem.innerHTML = `
    <div class="queue-item-info">
      <span class="queue-item-name">${fileName}</span>
      <span class="queue-item-status">Dönüştürülüyor... (${format.toUpperCase()}, Kalite: ${quality}%)</span>
    </div>
    <div class="queue-item-progress">
      <div class="progress-bar"></div>
    </div>
  `;
  conversionQueue?.appendChild(queueItem);

  try {
    const result: any = await invoke('convert_image', {
      filePath: filePath,
      outputFormat: format,
      outputDir: outputDir,
      quality: quality
    });

    await saveImage(result);

    queueItem.querySelector('.queue-item-status')!.textContent = 'Tamamlandı!';
    queueItem.classList.add('success');
    
    await loadConvertedResults();
    
    setTimeout(() => {
      queueItem.remove();
    }, 3000);

  } catch (error) {
    console.error('Conversion error:', error);
    queueItem.querySelector('.queue-item-status')!.textContent = `Hata: ${error}`;
    queueItem.classList.add('error');
  }
}

export async function loadConvertedResults() {
  const resultsGrid = document.getElementById('resultsGrid');
  if (!resultsGrid) return;

  try {
    const images = await getImages();
    
    if (images.length === 0) {
      resultsGrid.innerHTML = '<p class="empty-message">Henüz dönüştürülmüş fotoğraf yok</p>';
      return;
    }

    const recentImages = images.slice(0, 6);
    const { invoke } = await import('@tauri-apps/api/core');
    
    const imagePromises = recentImages.map(async (img) => {
      try {
        const dataUrl = await invoke('get_image_data_url', { filePath: img.output_path }) as string;
        return { ...img, dataUrl };
      } catch (error) {
        console.error('Failed to load image:', img.output_path, error);
        return { ...img, dataUrl: '' };
      }
    });
    
    const imagesWithData = await Promise.all(imagePromises);
    
    resultsGrid.innerHTML = imagesWithData.map(img => {
      const escapedPath = img.output_path.replace(/\\/g, '\\\\');
      return `
      <div class="result-card">
        ${img.dataUrl ? `
        <div class="result-preview">
          <img src="${img.dataUrl}" alt="${img.converted_name}" />
        </div>
        ` : ''}
        <div class="result-card-header">
          <span class="result-format">${img.converted_format}</span>
          <span class="result-size">${formatFileSize(img.file_size)}</span>
        </div>
        <div class="result-card-body">
          <h4>${img.converted_name}</h4>
          <p class="result-meta">${img.created_at}</p>
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
    console.error('Load results error:', error);
  }
}

// Make openFileLocation global
(window as any).openFileLocation = openFileLocation;
