import { createIcons, Home, Info, CheckCircle, Download, Menu, Image, Archive, Trash2, FolderOpen, Settings } from 'lucide';
import { checkForUpdates } from './updater';
import { initDatabase, saveImage, getImages, deleteImage as deleteImageFromDB } from './database';

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
              <span class="version-text">v0.3.0</span>
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
                  <span class="version-badge">v0.3.0</span>
                </div>
                <div class="release-notes">
                  <h4>Sürüm Notları</h4>
                  <ul>
                    <li>Fotoğraf dönüştürme servisi eklendi (PNG, JPG, WebP, GIF, BMP, ICO, TIFF)</li>
                    <li>Sürükle-bırak ile çoklu dosya desteği</li>
                    <li>Arşiv sayfası ile dönüştürülen fotoğrafları görüntüleme</li>
                    <li>Özel çıktı klasörü seçme özelliği</li>
                    <li>SQLite veritabanı ile hızlı veri yönetimi</li>
                    <li>Dosya konumunu açma ve silme özellikleri</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Image Converter Page -->
          <div class="page-content" id="converterPage">
            <div class="content-wrapper">
              <h2>Fotoğraf Dönüştürücü</h2>
              <p>Fotoğraflarınızı farklı formatlara dönüştürün</p>
              
              <div class="converter-container">
                <div class="drop-zone" id="dropZone">
                  <i data-lucide="image" class="drop-icon"></i>
                  <h3>Fotoğraf Sürükle & Bırak</h3>
                  <p>veya tıklayarak dosya seçin</p>
                  <input type="file" id="fileInput" accept="image/*" multiple hidden>
                </div>
                
                <div class="format-selector">
                  <label>Dönüştürülecek Format:</label>
                  <select id="formatSelect">
                    <option value="png">PNG</option>
                    <option value="jpg">JPG</option>
                    <option value="webp">WebP</option>
                    <option value="gif">GIF</option>
                    <option value="bmp">BMP</option>
                    <option value="ico">ICO</option>
                    <option value="tiff">TIFF</option>
                  </select>
                </div>
                
                <div class="conversion-queue" id="conversionQueue"></div>
                
                <div class="converted-results" id="convertedResults">
                  <h3>Dönüştürülen Fotoğraflar</h3>
                  <div class="results-grid" id="resultsGrid"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Archive Page -->
          <div class="page-content" id="archivePage">
            <div class="content-wrapper">
              <h2>Dönüştürülmüş Fotoğraflar</h2>
              <p>Geçmişte dönüştürdüğünüz fotoğraflar</p>
              
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
    createIcons({
      icons: {
        Home,
        Info,
        CheckCircle,
        Download,
        Menu,
        Image,
        Archive,
        Trash2,
        FolderOpen,
        Settings
      },
      attrs: {
        width: '20',
        height: '20',
        'stroke-width': '2'
      }
    });

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
        }
        
        // Reinitialize icons
        createIcons({
          icons: {
            Home,
            Info,
            CheckCircle,
            Download,
            Menu,
            Image,
            Archive,
            Trash2,
            FolderOpen,
            Settings
          }
        });
        
        // Close sidebar on mobile
        if (window.innerWidth < 768) {
          sidebar?.classList.remove('open');
        }
      });
    });

    // Image Converter Logic
    const dropZone = document.getElementById('dropZone');
    const formatSelect = document.getElementById('formatSelect') as HTMLSelectElement;
    const conversionQueue = document.getElementById('conversionQueue');

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
        await handleFilePaths(paths);
      }
    });

    // Tauri file drop event
    async function setupFileDrop() {
      const { listen } = await import('@tauri-apps/api/event');
      
      await listen('tauri://drag-over', () => {
        dropZone?.classList.add('drag-over');
      });

      await listen('tauri://drag-drop', async (event: any) => {
        dropZone?.classList.remove('drag-over');
        const paths = event.payload.paths as string[];
        if (paths && paths.length > 0) {
          await handleFilePaths(paths);
        }
      });

      await listen('tauri://drag-leave', () => {
        dropZone?.classList.remove('drag-over');
      });
    }

    setupFileDrop();

    async function handleFilePaths(paths: string[]) {
      const format = formatSelect?.value || 'png';
      
      for (const path of paths) {
        await convertFile(path, format);
      }
    }

    async function convertFile(filePath: string, format: string) {
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
          <span class="queue-item-status">Dönüştürülüyor...</span>
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
          outputDir: outputDir
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
        
        resultsGrid.innerHTML = recentImages.map(img => {
          // Escape backslashes for HTML
          const escapedPath = img.output_path.replace(/\\/g, '\\\\');
          return `
          <div class="result-card">
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
          icons: {
            FolderOpen
          }
        });
      } catch (error) {
        console.error('Load results error:', error);
      }
    }

    async function loadArchive() {
      const archiveList = document.getElementById('archiveList');
      
      if (!archiveList) return;

      try {
        const images = await getImages();
        
        if (images.length === 0) {
          archiveList.innerHTML = '<p class="empty-message">Henüz dönüştürülmüş fotoğraf yok</p>';
          return;
        }

        archiveList.innerHTML = images.map(img => {
          // Escape backslashes for HTML
          const escapedPath = img.output_path.replace(/\\/g, '\\\\');
          return `
          <div class="archive-item" data-id="${img.id}">
            <div class="archive-item-info">
              <h4>${img.converted_name}</h4>
              <p class="archive-meta">
                <span>${img.original_format} → ${img.converted_format}</span>
                <span>${formatFileSize(img.file_size)}</span>
                <span>${img.created_at}</span>
              </p>
            </div>
            <div class="archive-item-actions">
              <button class="action-btn" onclick='openFileLocation(\`${escapedPath}\`)' title="Dosya Konumunu Aç">
                <i data-lucide="folder-open"></i>
              </button>
              <button class="action-btn delete-btn" onclick='deleteImage("${img.id}", \`${escapedPath}\`)' title="Sil">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </div>
        `;
        }).join('');

        createIcons({
          icons: {
            FolderOpen,
            Trash2
          }
        });
      } catch (error) {
        console.error('Archive load error:', error);
        archiveList.innerHTML = '<p class="empty-message">Arşiv yüklenirken hata oluştu</p>';
      }
    }

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
      if (!confirm('Bu fotoğrafı silmek istediğinizden emin misiniz?')) {
        return;
      }

      const { invoke } = await import('@tauri-apps/api/core');
      try {
        // Delete file
        await invoke('delete_converted_image', { id, filePath });
        
        // Delete from database
        await deleteImageFromDB(id);
        
        // Reload archive and results
        await loadArchive();
        await loadConvertedResults();
      } catch (error) {
        console.error('Delete error:', error);
        alert('Fotoğraf silinemedi');
      }
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
