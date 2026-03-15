import { createIcons, Home, Info, CheckCircle, Download, Menu, Image, Archive, Trash2, FolderOpen, Settings, Video, Plus, Play, Film } from 'lucide';
import { checkForUpdates } from './updater';
import { initDatabase, saveImage, getImages, deleteImage as deleteImageFromDB, saveVideo, getVideos, deleteVideo as deleteVideoFromDB, getAllMedia } from './database';
import { initEditor } from './editor';

window.addEventListener("DOMContentLoaded", async () => {
  // Initialize database
  await initDatabase();
  
  const app = document.querySelector("#app");
  if (app) {
    app.innerHTML = `
      <div class="app-layout">
        <!-- Header -->
        <header class="header">
          <button class="menu-toggle" id="menuToggle">
            <i data-lucide="menu"></i>
          </button>
          <div class="header-content">
            <h1>We Have SaaS at Home</h1>
            <p class="header-subtitle">by hollmmes</p>
          </div>
          <div class="header-actions">
            <button class="update-status-btn" id="updateStatusBtn">
              <span class="update-text">Uygulama güncel</span>
              <i data-lucide="check-circle" class="update-icon"></i>
            </button>
          </div>
        </header>

        <!-- Sidebar -->
        <aside class="sidebar" id="sidebar">
          <nav class="sidebar-nav">
            <a href="#" class="nav-item active" data-page="home">
              <i data-lucide="home" class="nav-icon"></i>
              <span class="nav-text">Giriş</span>
            </a>
            <a href="#" class="nav-item" data-page="converter">
              <i data-lucide="image" class="nav-icon"></i>
              <span class="nav-text">Fotoğraf Dönüştür</span>
            </a>
            <a href="#" class="nav-item" data-page="video">
              <i data-lucide="video" class="nav-icon"></i>
              <span class="nav-text">Video Optimize</span>
            </a>
            <a href="#" class="nav-item" data-page="editor">
              <i data-lucide="film" class="nav-icon"></i>
              <span class="nav-text">Video Editör</span>
            </a>
            <a href="#" class="nav-item" data-page="archive">
              <i data-lucide="archive" class="nav-icon"></i>
              <span class="nav-text">Arşiv</span>
            </a>
            <a href="#" class="nav-item" data-page="settings">
              <i data-lucide="settings" class="nav-icon"></i>
              <span class="nav-text">Ayarlar</span>
            </a>
          </nav>
          <div class="sidebar-footer">
            <div class="version-info">
              <i data-lucide="info" class="version-icon"></i>
              <span class="version-text">v0.4.0</span>
            </div>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="main-content" id="mainContent">
          <!-- Home Page -->
          <div class="page-content active" id="homePage">
            <div class="content-wrapper">
              <h2>We Have SaaS at Home</h2>
              <p>Modern ve güçlü bir masaüstü uygulama deneyimi. Otomatik güncelleme sistemi ile her zaman en son özelliklere sahip olun.</p>
              
              <div class="version-section">
                <div class="version-header">
                  <h3>Sürüm Bilgisi</h3>
                  <span class="version-badge">v0.4.0</span>
                </div>
                <div class="release-notes">
                  <h4>Sürüm Notları</h4>
                  <ul>
                    <li>🎬 Video Editör eklendi (Timeline tabanlı düzenleme)</li>
                    <li>✂️ Video kesme (trim) özelliği</li>
                    <li>🎞️ Videoları birleştirme</li>
                    <li>📹 Video thumbnail önizleme</li>
                    <li>🎨 Drag & drop ile timeline düzenleme</li>
                    <li>⚙️ 5 kalite seviyesi (Ultra, Yüksek, Orta, Düşük, Çok Düşük)</li>
                    <li>🎥 Built-in video player</li>
                    <li>📊 Video süre gösterimi</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Image Converter Page -->
          <div class="page-content" id="converterPage">
            <div class="content-wrapper">
              <h2>Fotoğraf Dönüştürücü</h2>
              <p>Fotoğraflarınızı farklı formatlara dönüştürün ve optimize edin</p>
              
              <div class="converter-container">
                <div class="drop-zone" id="dropZone">
                  <i data-lucide="image" class="drop-icon"></i>
                  <h3>Fotoğraf Sürükle & Bırak</h3>
                  <p>veya tıklayarak dosya seçin</p>
                  <input type="file" id="fileInput" accept="image/*" multiple hidden>
                </div>
                
                <div class="selected-files" id="selectedFiles"></div>
                
                <div class="conversion-queue" id="conversionQueue"></div>
                
                <div class="converted-results" id="convertedResults">
                  <h3>Son Dönüştürülen Fotoğraflar</h3>
                  <div class="results-grid" id="resultsGrid"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Video Optimizer Page -->
          <div class="page-content" id="videoPage">
            <div class="content-wrapper">
              <h2>Video Optimize & Birleştir</h2>
              <p>Videolarınızı optimize edin, boyutunu küçültün ve birleştirin</p>
              
              <div class="video-container">
                <div class="video-tabs">
                  <button class="tab-btn active" data-tab="optimize">Optimize Et</button>
                  <button class="tab-btn" data-tab="merge">Birleştir</button>
                </div>
                
                <!-- Optimize Tab -->
                <div class="tab-content active" id="optimizeTab">
                  <div class="drop-zone" id="videoDropZone">
                    <i data-lucide="video" class="drop-icon"></i>
                    <h3>Video Sürükle & Bırak</h3>
                    <p>veya tıklayarak dosya seçin</p>
                  </div>
                  
                  <div class="selected-videos" id="selectedVideos"></div>
                  
                  <div class="video-queue" id="videoQueue"></div>
                  
                  <div class="converted-results" id="convertedVideoResults">
                    <h3>Son Dönüştürülen Videolar</h3>
                    <div class="results-grid" id="videoResultsGrid"></div>
                  </div>
                </div>
                
                <!-- Merge Tab -->
                <div class="tab-content" id="mergeTab">
                  <div class="drop-zone" id="mergeDropZone">
                    <i data-lucide="plus" class="drop-icon"></i>
                    <h3>Birleştirilecek Videoları Seçin</h3>
                    <p>Sırayla birleştirilecek</p>
                  </div>
                  
                  <div class="merge-list" id="mergeList"></div>
                  
                  <div class="merge-actions" id="mergeActions" style="display: none;">
                    <button class="btn-primary btn-large" id="mergeVideosBtn">Videoları Birleştir</button>
                  </div>
                  
                  <div class="video-queue" id="mergeQueue"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Video Editor Page -->
          <div class="page-content" id="editorPage">
            <div class="editor-layout">
              <!-- Left Panel: Media Library -->
              <div class="editor-sidebar">
                <div class="editor-sidebar-header">
                  <h3>Medya Kütüphanesi</h3>
                  <button class="btn-icon" id="importMediaBtn" title="Medya İçe Aktar">
                    <i data-lucide="plus"></i>
                  </button>
                </div>
                <div class="media-library" id="mediaLibrary">
                  <p class="empty-message">Medya eklemek için + butonuna tıklayın</p>
                </div>
              </div>

              <!-- Center: Preview & Timeline -->
              <div class="editor-main">
                <!-- Preview Area -->
                <div class="editor-preview">
                  <div class="preview-container">
                    <video id="editorPreview" controls>
                      <source src="" type="video/mp4">
                    </video>
                    <div class="preview-placeholder" id="previewPlaceholder">
                      <i data-lucide="film"></i>
                      <p>Timeline'a video ekleyin</p>
                    </div>
                  </div>
                  <div class="preview-controls">
                    <button class="control-btn" id="playPauseBtn">
                      <i data-lucide="play"></i>
                    </button>
                    <div class="time-display">
                      <span id="currentTime">00:00</span> / <span id="totalTime">00:00</span>
                    </div>
                    <input type="range" class="timeline-scrubber" id="timelineScrubber" min="0" max="100" value="0">
                  </div>
                </div>

                <!-- Timeline Area -->
                <div class="editor-timeline">
                  <div class="timeline-header">
                    <h3>Timeline</h3>
                    <div class="timeline-tools">
                      <button class="btn-secondary btn-sm" id="clearTimelineBtn">Temizle</button>
                      <button class="btn-primary btn-sm" id="exportVideoBtn">Dışa Aktar</button>
                    </div>
                  </div>
                  <div class="timeline-tracks">
                    <div class="timeline-track" id="videoTrack" data-track="video">
                      <div class="track-label">Video</div>
                      <div class="track-content" id="videoTrackContent">
                        <p class="track-empty">Videoları buraya sürükleyin</p>
                      </div>
                    </div>
                    <div class="timeline-track" id="audioTrack" data-track="audio">
                      <div class="track-label">Ses</div>
                      <div class="track-content" id="audioTrackContent">
                        <p class="track-empty">Ses dosyalarını buraya sürükleyin</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right Panel: Properties -->
              <div class="editor-properties">
                <div class="properties-header">
                  <h3>Özellikler</h3>
                </div>
                <div class="properties-content" id="propertiesContent">
                  <p class="empty-message">Bir clip seçin</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Archive Page -->
          <div class="page-content" id="archivePage">
            <div class="content-wrapper">
              <div class="archive-header">
                <div>
                  <h2>Dönüştürülmüş Fotoğraflar</h2>
                  <p>Geçmişte dönüştürdüğünüz fotoğraflar</p>
                </div>
                <div class="archive-actions" id="archiveActions" style="display: none;">
                  <span class="selected-count" id="selectedCount">0 seçili</span>
                  <button class="btn-danger" id="deleteSelectedBtn">Seçilenleri Sil</button>
                  <button class="btn-secondary" id="cancelSelectionBtn">İptal</button>
                </div>
              </div>
              
              <div class="archive-list" id="archiveList">
                <p class="empty-message">Henüz dönüştürülmüş fotoğraf yok</p>
              </div>
            </div>
          </div>

          <!-- Settings Page -->
          <div class="page-content" id="settingsPage">
            <div class="content-wrapper">
              <h2>Ayarlar</h2>
              <p>Uygulama ayarlarını yapılandırın</p>
              
              <div class="settings-container">
                <div class="setting-item">
                  <div class="setting-info">
                    <h3>Çıktı Klasörü</h3>
                    <p class="setting-description">Dönüştürülen fotoğrafların kaydedileceği klasör</p>
                    <p class="current-path" id="currentOutputPath">Yükleniyor...</p>
                  </div>
                  <button class="btn-primary" id="selectOutputFolder">Klasör Seç</button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    `;

    // Initialize Lucide icons
    const allIcons = {
      Home,
      Info,
      CheckCircle,
      Download,
      Menu,
      Image,
      Archive,
      Trash2,
      FolderOpen,
      Settings,
      Video,
      Plus,
      Play,
      Film
    };
    
    // Make createIcons global for editor
    (window as any).createIcons = () => {
      createIcons({
        icons: allIcons,
        attrs: {
          width: '20',
          height: '20',
          'stroke-width': '2'
        }
      });
    };
    
    (window as any).createIcons();

    // Settings
    const selectOutputFolderBtn = document.getElementById('selectOutputFolder');
    const currentOutputPathEl = document.getElementById('currentOutputPath');

    async function loadSettings() {
      const savedPath = localStorage.getItem('outputPath');
      if (savedPath) {
        currentOutputPathEl!.textContent = savedPath;
      } else {
        // Get default path
        const { invoke } = await import('@tauri-apps/api/core');
        try {
          const defaultPath = await invoke('get_default_output_path') as string;
          currentOutputPathEl!.textContent = defaultPath;
        } catch (error) {
          currentOutputPathEl!.textContent = 'Varsayılan klasör';
        }
      }
    }

    selectOutputFolderBtn?.addEventListener('click', async () => {
      const { open } = await import('@tauri-apps/plugin-dialog');
      
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Çıktı Klasörünü Seçin'
      });
      
      if (selected && typeof selected === 'string') {
        localStorage.setItem('outputPath', selected);
        currentOutputPathEl!.textContent = selected;
        alert('Çıktı klasörü güncellendi!');
      }
    });

    loadSettings();

    // Güncelleme durumu kontrolü
    const updateStatusBtn = document.getElementById("updateStatusBtn");
    const updateText = updateStatusBtn?.querySelector('.update-text');
    
    async function checkUpdateStatus() {
      try {
        const { check } = await import('@tauri-apps/plugin-updater');
        const update = await check();
        
        if (update?.available && updateStatusBtn && updateText) {
          // Güncelleme mevcut
          updateStatusBtn.classList.add('update-available');
          updateText.textContent = `Güncelleme mevcut: ${update.version}`;
          const icon = updateStatusBtn.querySelector('i');
          if (icon) {
            icon.setAttribute('data-lucide', 'download');
            createIcons();
          }
        }
      } catch (error) {
        console.error('Güncelleme kontrolü hatası:', error);
      }
    }

    // Sayfa yüklendiğinde güncelleme kontrolü yap
    checkUpdateStatus();

    // Güncelleme butonuna tıklandığında
    updateStatusBtn?.addEventListener("click", () => {
      checkForUpdates();
    });

    // Page Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page-content');
    
    navItems.forEach(item => {
      item.addEventListener('click', async (e) => {
        e.preventDefault();
        const pageName = (item as HTMLElement).dataset.page;
        
        // Update active nav item
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // Show selected page
        pages.forEach(page => page.classList.remove('active'));
        const targetPage = document.getElementById(`${pageName}Page`);
        if (targetPage) {
          targetPage.classList.add('active');
          
          // Refresh archive when opening archive page
          if (pageName === 'archive') {
            await loadArchive();
          }
          
          // Load converted results when opening converter page
          if (pageName === 'converter') {
            await loadConvertedResults();
          }
          
          // Load settings when opening settings page
          if (pageName === 'settings') {
            await loadSettings();
          }
          
          // Initialize editor when opening editor page
          if (pageName === 'editor') {
            initEditor();
          }
        }
        
        // Reinitialize icons
        createIcons({
          icons: allIcons
        });
        
        // Close sidebar on mobile
        if (window.innerWidth < 768) {
          sidebar?.classList.remove('open');
        }
      });
    });

    // Image Converter Logic
    const dropZone = document.getElementById('dropZone');
    const selectedFilesContainer = document.getElementById('selectedFiles');
    const conversionQueue = document.getElementById('conversionQueue');
    let selectedFiles: string[] = [];

    // Click to select files using Tauri dialog
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

    // Tauri file drop event
    async function setupFileDrop() {
      const { listen } = await import('@tauri-apps/api/event');
      
      await listen('tauri://drag-over', () => {
        // Check which page is active
        const activePage = document.querySelector('.page-content.active');
        const activePageId = activePage?.id;
        
        if (activePageId === 'converterPage') {
          dropZone?.classList.add('drag-over');
        } else if (activePageId === 'videoPage') {
          const activeTab = document.querySelector('.tab-content.active');
          if (activeTab?.id === 'optimizeTab') {
            videoDropZone?.classList.add('drag-over');
          } else if (activeTab?.id === 'mergeTab') {
            mergeDropZone?.classList.add('drag-over');
          }
        }
      });

      await listen('tauri://drag-drop', async (event: any) => {
        dropZone?.classList.remove('drag-over');
        videoDropZone?.classList.remove('drag-over');
        mergeDropZone?.classList.remove('drag-over');
        
        const paths = event.payload.paths as string[];
        if (paths && paths.length > 0) {
          // Check which page is active
          const activePage = document.querySelector('.page-content.active');
          const activePageId = activePage?.id;
          
          if (activePageId === 'converterPage') {
            // Image converter page
            await handleFilePaths(paths);
          } else if (activePageId === 'videoPage') {
            // Video page
            const activeTab = document.querySelector('.tab-content.active');
            if (activeTab?.id === 'optimizeTab') {
              addVideosToSelection(paths);
            } else if (activeTab?.id === 'mergeTab') {
              addVideosToMerge(paths);
            }
          }
        }
      });

      await listen('tauri://drag-leave', () => {
        dropZone?.classList.remove('drag-over');
        videoDropZone?.classList.remove('drag-over');
        mergeDropZone?.classList.remove('drag-over');
      });
    }

    setupFileDrop();

    async function handleFilePaths(paths: string[]) {
      // Filter only image files
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

      createIcons({
        icons: allIcons
      });
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

      // Clear selection after conversion
      selectedFiles = [];
      renderSelectedFiles();
    };

    async function convertFile(filePath: string, format: string, quality: number) {
      const { invoke } = await import('@tauri-apps/api/core');
      
      // Get filename from path
      const fileName = filePath.split(/[\\/]/).pop() || 'unknown';
      
      // Get output directory from settings
      const outputDir = localStorage.getItem('outputPath') || null;
      
      // Create queue item
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
        // Convert image
        const result: any = await invoke('convert_image', {
          filePath: filePath,
          outputFormat: format,
          outputDir: outputDir,
          quality: quality
        });

        // Save to database
        await saveImage(result);

        // Update queue item
        queueItem.querySelector('.queue-item-status')!.textContent = 'Tamamlandı!';
        queueItem.classList.add('success');
        
        // Add to results grid
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

    async function loadConvertedResults() {
      const resultsGrid = document.getElementById('resultsGrid');
      if (!resultsGrid) return;

      try {
        const images = await getImages();
        
        if (images.length === 0) {
          resultsGrid.innerHTML = '<p class="empty-message">Henüz dönüştürülmüş fotoğraf yok</p>';
          return;
        }

        // Show last 6 images
        const recentImages = images.slice(0, 6);
        
        // Import invoke for getting image data
        const { invoke } = await import('@tauri-apps/api/core');
        
        // Load images with data URLs
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
          // Escape backslashes for HTML
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

        createIcons({
          icons: allIcons
        });
      } catch (error) {
        console.error('Load results error:', error);
      }
    }

    // Video Optimizer Logic
    const videoDropZone = document.getElementById('videoDropZone');
    const mergeDropZone = document.getElementById('mergeDropZone');
    const selectedVideosContainer = document.getElementById('selectedVideos');
    const mergeListContainer = document.getElementById('mergeList');
    const videoQueue = document.getElementById('videoQueue');
    const mergeQueue = document.getElementById('mergeQueue');
    const mergeActions = document.getElementById('mergeActions');
    const mergeVideosBtn = document.getElementById('mergeVideosBtn');
    
    let selectedVideos: string[] = [];
    let mergeVideos: string[] = [];
    
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
    
    function addVideosToSelection(paths: string[]) {
      selectedVideos = [...selectedVideos, ...paths];
      renderSelectedVideos();
    }
    
    function addVideosToMerge(paths: string[]) {
      mergeVideos = [...mergeVideos, ...paths];
      renderMergeList();
    }
    
    function renderSelectedVideos() {
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
      
      createIcons({ icons: allIcons });
    }
    
    function renderMergeList() {
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
      
      createIcons({ icons: allIcons });
    }
    
    (window as any).clearSelectedVideos = () => {
      selectedVideos = [];
      renderSelectedVideos();
    };
    
    (window as any).removeVideo = (index: number) => {
      selectedVideos.splice(index, 1);
      renderSelectedVideos();
    };
    
    (window as any).clearMergeVideos = () => {
      mergeVideos = [];
      renderMergeList();
    };
    
    (window as any).removeMergeVideo = (index: number) => {
      mergeVideos.splice(index, 1);
      renderMergeList();
    };
    
    (window as any).optimizeAllVideos = async () => {
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
    };
    
    async function optimizeVideo(filePath: string, quality: string) {
      const { invoke } = await import('@tauri-apps/api/core');
      
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
        
        // Save to database
        await saveVideo(result);
        
        queueItem.querySelector('.queue-item-status')!.textContent = `Tamamlandı! (${result.duration})`;
        queueItem.classList.add('success');
        
        // Reload recent videos
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
    
    mergeVideosBtn?.addEventListener('click', async () => {
      if (mergeVideos.length < 2) {
        alert('En az 2 video seçmelisiniz!');
        return;
      }
      
      const { invoke } = await import('@tauri-apps/api/core');
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
        
        // Save to database
        await saveVideo(result);
        
        queueItem.querySelector('.queue-item-status')!.textContent = `Tamamlandı! (${result.duration})`;
        queueItem.classList.add('success');
        
        mergeVideos = [];
        renderMergeList();
        
        // Reload recent videos
        await loadRecentVideos();
        
        setTimeout(() => {
          queueItem.remove();
        }, 3000);
        
      } catch (error) {
        console.error('Video merge error:', error);
        queueItem.querySelector('.queue-item-status')!.textContent = `Hata: ${error}`;
        queueItem.classList.add('error');
      }
    });

    async function loadRecentVideos() {
      const videoResultsGrid = document.getElementById('videoResultsGrid');
      if (!videoResultsGrid) return;

      try {
        const videos = await getVideos();
        
        if (videos.length === 0) {
          videoResultsGrid.innerHTML = '<p class="empty-message">Henüz dönüştürülmüş video yok</p>';
          return;
        }

        // Show last 6 videos
        const recentVideos = videos.slice(0, 6);
        
        // Import invoke for getting thumbnails
        const { invoke } = await import('@tauri-apps/api/core');
        
        // Load videos with thumbnails
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

        createIcons({ icons: allIcons });
      } catch (error) {
        console.error('Load video results error:', error);
      }
    }
    
    // Load recent videos on page load
    loadRecentVideos();

    async function loadArchive() {
      const archiveList = document.getElementById('archiveList');
      
      if (!archiveList) return;

      try {
        const allMedia = await getAllMedia();
        
        if (allMedia.length === 0) {
          archiveList.innerHTML = '<p class="empty-message">Henüz dönüştürülmüş dosya yok</p>';
          return;
        }

        // Import invoke for getting previews
        const { invoke } = await import('@tauri-apps/api/core');
        
        // Load media with previews
        const mediaPromises = allMedia.map(async (item: any) => {
          if (item.type === 'image') {
            try {
              const dataUrl = await invoke('get_image_data_url', { filePath: item.output_path }) as string;
              return { ...item, dataUrl };
            } catch (error) {
              console.error('Failed to load image:', item.output_path, error);
              return { ...item, dataUrl: '' };
            }
          } else {
            // Video - get thumbnail
            try {
              const thumbnail = await invoke('get_video_thumbnail', { filePath: item.output_path }) as string;
              return { ...item, dataUrl: thumbnail };
            } catch (error) {
              console.error('Failed to load video thumbnail:', item.output_path, error);
              return { ...item, dataUrl: '' };
            }
          }
        });
        
        const mediaWithData = await Promise.all(mediaPromises);

        archiveList.innerHTML = mediaWithData.map(item => {
          const escapedPath = item.output_path.replace(/\\/g, '\\\\');
          const isVideo = item.type === 'video';
          
          return `
          <div class="archive-item" data-id="${item.id}" data-type="${item.type}">
            <input type="checkbox" class="archive-checkbox" data-id="${item.id}" data-path="${escapedPath}" data-type="${item.type}">
            ${isVideo ? `
            <div class="archive-preview video-preview-small" onclick='playVideo(\`${escapedPath}\`, "${item.converted_name}")' style="${item.dataUrl ? `background-image: url('${item.dataUrl}'); background-size: cover; background-position: center;` : ''}">
              <i data-lucide="play"></i>
              <span class="video-duration-small">${item.duration}</span>
            </div>
            ` : item.dataUrl ? `
            <div class="archive-preview">
              <img src="${item.dataUrl}" alt="${item.converted_name}" />
            </div>
            ` : ''}
            <div class="archive-item-info">
              <h4>${item.converted_name}</h4>
              <p class="archive-meta">
                ${isVideo ? `
                  <span>Video (${item.duration})</span>
                ` : `
                  <span>${item.original_format} → ${item.converted_format}</span>
                `}
                <span>${formatFileSize(item.file_size)}</span>
                <span>${item.created_at}</span>
              </p>
            </div>
            <div class="archive-item-actions">
              <button class="action-btn" onclick='openFileLocation(\`${escapedPath}\`)' title="Dosya Konumunu Aç">
                <i data-lucide="folder-open"></i>
              </button>
              <button class="action-btn delete-btn" onclick='deleteMedia("${item.id}", \`${escapedPath}\`, "${item.type}")' title="Sil">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </div>
        `;
        }).join('');

        // Add checkbox event listeners
        const checkboxes = archiveList.querySelectorAll('.archive-checkbox');
        checkboxes.forEach(checkbox => {
          checkbox.addEventListener('change', updateSelectionUI);
        });

        createIcons({
          icons: allIcons
        });
      } catch (error) {
        console.error('Archive load error:', error);
        archiveList.innerHTML = '<p class="empty-message">Arşiv yüklenirken hata oluştu</p>';
      }
    }

    function updateSelectionUI() {
      const checkboxes = document.querySelectorAll('.archive-checkbox:checked');
      const archiveActions = document.getElementById('archiveActions');
      const selectedCount = document.getElementById('selectedCount');
      
      if (checkboxes.length > 0) {
        archiveActions!.style.display = 'flex';
        selectedCount!.textContent = `${checkboxes.length} seçili`;
      } else {
        archiveActions!.style.display = 'none';
      }
    }

    // Delete selected items
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    deleteSelectedBtn?.addEventListener('click', async () => {
      const checkboxes = document.querySelectorAll('.archive-checkbox:checked') as NodeListOf<HTMLInputElement>;
      
      if (checkboxes.length === 0) return;
      
      if (!confirm(`${checkboxes.length} fotoğrafı silmek istediğinizden emin misiniz?`)) {
        return;
      }

      const { invoke } = await import('@tauri-apps/api/core');
      
      for (const checkbox of checkboxes) {
        const id = checkbox.dataset.id!;
        const filePath = checkbox.dataset.path!.replace(/\\\\/g, '\\');
        
        try {
          // Delete from database first
          await deleteImageFromDB(id);
          
          // Then delete file
          await invoke('delete_converted_image', { id, filePath });
        } catch (error) {
          console.error('Delete error:', error);
        }
      }
      
      // Reload archive and results
      await loadArchive();
      await loadConvertedResults();
    });

    // Cancel selection
    const cancelSelectionBtn = document.getElementById('cancelSelectionBtn');
    cancelSelectionBtn?.addEventListener('click', () => {
      const checkboxes = document.querySelectorAll('.archive-checkbox:checked') as NodeListOf<HTMLInputElement>;
      checkboxes.forEach(checkbox => {
        checkbox.checked = false;
      });
      updateSelectionUI();
    });

    function formatFileSize(bytes: number): string {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    // Global functions for archive actions
    (window as any).openFileLocation = async (path: string) => {
      const { invoke } = await import('@tauri-apps/api/core');
      try {
        console.log('Opening file location:', path);
        await invoke('open_file_location', { filePath: path });
      } catch (error) {
        console.error('Open location error:', error);
        alert(`Dosya konumu açılamadı: ${error}`);
      }
    };

    (window as any).deleteImage = async (id: string, filePath: string) => {
      const { invoke } = await import('@tauri-apps/api/core');
      try {
        // Delete from database first
        await deleteImageFromDB(id);
        
        // Then delete file
        await invoke('delete_converted_image', { id, filePath });
        
        // Reload archive and results
        await loadArchive();
        await loadConvertedResults();
      } catch (error) {
        console.error('Delete error:', error);
        alert('Fotoğraf silinemedi');
      }
    };
    
    (window as any).deleteMedia = async (id: string, filePath: string, type: string) => {
      const { invoke } = await import('@tauri-apps/api/core');
      try {
        // Delete from database first
        if (type === 'image') {
          await deleteImageFromDB(id);
        } else {
          await deleteVideoFromDB(id);
        }
        
        // Then delete file
        await invoke('delete_converted_image', { id, filePath });
        
        // Reload archive and results
        await loadArchive();
        if (type === 'image') {
          await loadConvertedResults();
        } else {
          await loadRecentVideos();
        }
      } catch (error) {
        console.error('Delete error:', error);
        alert('Dosya silinemedi');
      }
    };
    
    (window as any).playVideo = async (filePath: string, fileName: string) => {
      // Convert file path to proper URL using Tauri's convertFileSrc
      const { convertFileSrc } = await import('@tauri-apps/api/core');
      const videoUrl = convertFileSrc(filePath);
      
      // Simple video player modal
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
      
      // Close on background click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });
    };

    // Sidebar toggle functionality
    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");

    menuToggle?.addEventListener("click", () => {
      sidebar?.classList.toggle("open");
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (window.innerWidth < 768 && 
          !sidebar?.contains(target) && 
          !menuToggle?.contains(target) &&
          sidebar?.classList.contains("open")) {
        sidebar?.classList.remove("open");
      }
    });
  }
});
