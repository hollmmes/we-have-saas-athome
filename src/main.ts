// Refactored imports - using modular structure
import { initDatabase } from './database';
import { initIcons } from './utils/icons';
import { setupNavigation, setupSidebarToggle } from './utils/navigation';
import { setupFileDrop } from './utils/file-drop';
import { setupHomePage } from './pages/home';
import { setupConverterPage, loadConvertedResults, handleFilePaths } from './pages/converter';
import { setupVideoPage, addVideosToSelection, addVideosToMerge } from './pages/video';
import { setupSeoPage } from './pages/seo';
import { setupResizePage } from './pages/resize';
import { setupCropPage } from './pages/crop';
import { setupMonitorPage, loadDomains } from './pages/monitor';
import { setupArchivePage, loadArchive } from './pages/archive';
import { setupDatabasePage, loadDatabaseStats } from './pages/database';

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
            <a href="#" class="nav-item" data-page="seo">
              <i data-lucide="hash" class="nav-icon"></i>
              <span class="nav-text">SEO Araçları</span>
            </a>
            <a href="#" class="nav-item" data-page="resize">
              <i data-lucide="maximize" class="nav-icon"></i>
              <span class="nav-text">Fotoğraf Boyutlandır</span>
            </a>
            <a href="#" class="nav-item" data-page="crop">
              <i data-lucide="crop" class="nav-icon"></i>
              <span class="nav-text">Fotoğraf Kırp</span>
            </a>
            <a href="#" class="nav-item" data-page="monitor">
              <i data-lucide="monitor" class="nav-icon"></i>
              <span class="nav-text">SSL & Domain Takip</span>
            </a>
            <a href="#" class="nav-item" data-page="archive">
              <i data-lucide="archive" class="nav-icon"></i>
              <span class="nav-text">Arşiv</span>
            </a>
            <a href="#" class="nav-item" data-page="settings">
              <i data-lucide="database" class="nav-icon"></i>
              <span class="nav-text">Veritabanı</span>
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
              <p>Hoş geldiniz! Başlamak için önce çıktı klasörünüzü ayarlayın.</p>
              
              <div class="setup-section">
                <div class="setup-card" id="setupCard">
                  <div class="setup-icon">
                    <i data-lucide="folder-open" class="setup-icon-svg"></i>
                  </div>
                  <h3>Çıktı Klasörü Ayarla</h3>
                  <p class="setup-description">Tüm dönüştürülmüş dosyalarınız bu klasörde saklanacak. Her araç için otomatik alt klasörler oluşturulacak.</p>
                  
                  <div class="current-folder" id="currentFolder">
                    <span class="folder-label">Seçili Klasör:</span>
                    <span class="folder-path" id="folderPath">Henüz seçilmedi</span>
                  </div>
                  
                  <button class="btn-primary btn-large" id="selectFolderBtn">
                    <i data-lucide="folder-open"></i>
                    <span>Klasör Seç</span>
                  </button>
                  
                  <div class="folder-structure" id="folderStructure" style="display: none;">
                    <h4>Oluşturulacak Alt Klasörler:</h4>
                    <ul>
                      <li><i data-lucide="folder"></i> converted_images (Dönüştürülmüş fotoğraflar)</li>
                      <li><i data-lucide="folder"></i> converted_videos (Optimize edilmiş videolar)</li>
                      <li><i data-lucide="folder"></i> cropped_images (Kırpılmış fotoğraflar)</li>
                      <li><i data-lucide="folder"></i> resized_images (Boyutlandırılmış fotoğraflar)</li>
                    </ul>
                  </div>
                </div>

                <div class="version-section">
                  <div class="version-header">
                    <h3>Sürüm Bilgisi</h3>
                    <span class="version-badge">v0.4.0</span>
                  </div>
                  <div class="release-notes">
                    <h4>Yeni Özellikler</h4>
                    <ul>
                      <li>🖼️ Profesyonel fotoğraf kırpma editörü</li>
                      <li>📱 Instagram, Facebook, YouTube şablonları</li>
                      <li>🔒 SSL & Domain takip sistemi</li>
                      <li>📹 Video thumbnail önizleme</li>
                      <li>⚙️ 5 kalite seviyesi</li>
                      <li>🎥 Built-in video player</li>
                    </ul>
                  </div>
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

          <!-- SEO Tools Page -->
          <div class="page-content" id="seoPage">
            <div class="content-wrapper">
              <h2>SEO Araçları</h2>
              <p>Anahtar kelimelerden etiket, slug ve hashtag oluşturun</p>
              
              <div class="seo-container">
                <div class="seo-input-section">
                  <h3>SEO Anahtar Kelimeleri Girin</h3>
                  <p class="seo-hint"><strong>(her satır ayrı metin)</strong><br>örnek: dijital pazarlama<br>sosyal medya<br>içerik stratejisi</p>
                  <textarea id="seoInputText" class="seo-textarea" placeholder="Her satıra bir anahtar kelime yazın..."></textarea>
                  
                  <div class="seo-options">
                    <label>SLUG için MAX karakter:</label>
                    <input type="number" id="seoMaxLen" value="150" class="seo-number-input">
                    <button class="btn-primary" id="seoConvertBtn">Dönüştür</button>
                  </div>
                </div>
                
                <div class="seo-results">
                  <div class="seo-result-item">
                    <div class="seo-result-header">
                      <h3>Blog Hashtag</h3>
                      <span class="seo-format">key, key, key</span>
                    </div>
                    <textarea id="seoJoinedResult" class="seo-result-textarea" readonly></textarea>
                    <button class="btn-secondary btn-sm" onclick="copyToClipboard('seoJoinedResult')">Kopyala</button>
                  </div>
                  
                  <div class="seo-result-item">
                    <div class="seo-result-header">
                      <h3>SLUG (URL)</h3>
                      <span class="seo-format">key-key-key</span>
                    </div>
                    <textarea id="seoUrlResult" class="seo-result-textarea" readonly></textarea>
                    <button class="btn-secondary btn-sm" onclick="copyToClipboard('seoUrlResult')">Kopyala</button>
                  </div>
                  
                  <div class="seo-result-item">
                    <div class="seo-result-header">
                      <h3>Sosyal Medya Hashtag</h3>
                      <span class="seo-format">#key #key #key</span>
                    </div>
                    <textarea id="seoHashtagResult" class="seo-result-textarea" readonly></textarea>
                    <button class="btn-secondary btn-sm" onclick="copyToClipboard('seoHashtagResult')">Kopyala</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Photo Resize Page -->
          <div class="page-content" id="resizePage">
            <div class="content-wrapper">
              <h2>Fotoğraf Boyutlandırıcı</h2>
              <p>Fotoğraflarınızı istediğiniz boyuta getirin</p>
              
              <div class="resize-container">
                <!-- Üst Kontrol Paneli -->
                <div class="resize-controls">
                  <div class="resize-dimensions">
                    <div class="dimension-input">
                      <label>Genişlik:</label>
                      <input type="number" id="resizeWidth" value="350" class="dimension-number">
                    </div>
                    <div class="dimension-input">
                      <label>Yükseklik:</label>
                      <input type="number" id="resizeHeight" value="390" class="dimension-number">
                    </div>
                    <button class="btn-secondary" id="saveDimensionBtn">Ölçü Kaydet</button>
                  </div>
                  <div class="resize-actions">
                    <button class="btn-primary" id="downloadAllBtn" disabled>Hepsini İndir</button>
                    <button class="btn-danger" id="clearResizeBtn" disabled>Temizle</button>
                  </div>
                </div>

                <!-- Kaydedilmiş Ölçüler (Rozetler) -->
                <div class="resize-badges" id="resizeBadges"></div>

                <!-- Sürükle Bırak Alanı -->
                <div class="resize-drop-zone" id="resizeDropZone">
                  <i data-lucide="maximize" class="drop-icon"></i>
                  <h3>Fotoğrafları Sürükle & Bırak</h3>
                  <p>veya tıklayarak dosya seçin</p>
                  <input type="file" id="resizeFileInput" accept="image/*" multiple hidden>
                </div>

                <!-- Önizleme Galerisi -->
                <div class="resize-gallery" id="resizeGallery"></div>
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

          <!-- Photo Crop Page -->
          <div class="page-content" id="cropPage">
            <div class="content-wrapper">
              <h2>Fotoğraf Kırpma Editörü</h2>
              <p>Fotoğraflarınızı profesyonel şablonlarla kırpın ve düzenleyin</p>
              
              <div class="crop-container">
                <!-- Template Selection -->
                <div class="crop-templates">
                  <h3>Hazır Şablonlar</h3>
                  <div class="template-grid">
                    <button class="template-btn active" data-ratio="free" data-width="0" data-height="0">
                      <div class="template-icon">
                        <div class="template-preview" style="aspect-ratio: 1/1; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>
                      </div>
                      <span>Serbest</span>
                    </button>
                    <button class="template-btn" data-ratio="1:1" data-width="1080" data-height="1080">
                      <div class="template-icon">
                        <div class="template-preview" style="aspect-ratio: 1/1; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);"></div>
                      </div>
                      <span>Instagram Post</span>
                      <small>1080×1080</small>
                    </button>
                    <button class="template-btn" data-ratio="4:5" data-width="1080" data-height="1350">
                      <div class="template-icon">
                        <div class="template-preview" style="aspect-ratio: 4/5; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);"></div>
                      </div>
                      <span>Instagram Portrait</span>
                      <small>1080×1350</small>
                    </button>
                    <button class="template-btn" data-ratio="9:16" data-width="1080" data-height="1920">
                      <div class="template-icon">
                        <div class="template-preview" style="aspect-ratio: 9/16; background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);"></div>
                      </div>
                      <span>Instagram Story</span>
                      <small>1080×1920</small>
                    </button>
                    <button class="template-btn" data-ratio="16:9" data-width="1920" data-height="1080">
                      <div class="template-icon">
                        <div class="template-preview" style="aspect-ratio: 16/9; background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);"></div>
                      </div>
                      <span>YouTube Thumbnail</span>
                      <small>1920×1080</small>
                    </button>
                    <button class="template-btn" data-ratio="1.91:1" data-width="1200" data-height="628">
                      <div class="template-icon">
                        <div class="template-preview" style="aspect-ratio: 1.91/1; background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);"></div>
                      </div>
                      <span>Facebook Post</span>
                      <small>1200×628</small>
                    </button>
                    <button class="template-btn" data-ratio="16:9" data-width="1200" data-height="675">
                      <div class="template-icon">
                        <div class="template-preview" style="aspect-ratio: 16/9; background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);"></div>
                      </div>
                      <span>Facebook Cover</span>
                      <small>1200×675</small>
                    </button>
                    <button class="template-btn" data-ratio="2:1" data-width="1500" data-height="500">
                      <div class="template-icon">
                        <div class="template-preview" style="aspect-ratio: 2/1; background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);"></div>
                      </div>
                      <span>Twitter Header</span>
                      <small>1500×500</small>
                    </button>
                  </div>
                </div>

                <!-- Editor Area -->
                <div class="crop-editor">
                  <div class="crop-upload-area" id="cropUploadArea">
                    <i data-lucide="crop" class="crop-upload-icon"></i>
                    <h3>Fotoğraf Yükle</h3>
                    <p>Kırpmak istediğiniz fotoğrafı sürükleyin veya tıklayın</p>
                    <input type="file" id="cropFileInput" accept="image/*" hidden>
                  </div>

                  <div class="crop-canvas-wrapper" id="cropCanvasWrapper" style="display: none;">
                    <div class="crop-canvas-container">
                      <canvas id="cropCanvas"></canvas>
                      <div class="crop-overlay" id="cropOverlay">
                        <div class="crop-box" id="cropBox">
                          <div class="crop-handle nw"></div>
                          <div class="crop-handle ne"></div>
                          <div class="crop-handle sw"></div>
                          <div class="crop-handle se"></div>
                          <div class="crop-handle n"></div>
                          <div class="crop-handle s"></div>
                          <div class="crop-handle w"></div>
                          <div class="crop-handle e"></div>
                        </div>
                      </div>
                    </div>

                    <div class="crop-controls">
                      <div class="crop-info">
                        <span id="cropDimensions">0 × 0</span>
                        <span id="cropRatio">Serbest</span>
                      </div>
                      <div class="crop-actions">
                        <button class="btn-secondary" id="cropResetBtn">Sıfırla</button>
                        <button class="btn-secondary" id="cropRotateBtn">90° Döndür</button>
                        <button class="btn-primary" id="cropSaveBtn">Kırp ve İndir</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- SSL & Domain Monitor Page -->
          <div class="page-content" id="monitorPage">
            <div class="content-wrapper">
              <h2>SSL & Domain Takip</h2>
              <p>Domain'lerinizin SSL sertifikalarını ve süre bilgilerini takip edin</p>
              
              <div class="monitor-container">
                <div class="monitor-add-section">
                  <h3>Yeni Domain Ekle</h3>
                  <div class="monitor-input-group">
                    <input type="text" id="domainInput" class="monitor-input" placeholder="example.com" />
                    <button class="btn-primary" id="addDomainBtn">Ekle ve Sorgula</button>
                  </div>
                  <button class="btn-secondary" id="refreshAllDomainsBtn" style="margin-top: 10px; width: 100%;">Tümünü Güncelle</button>
                </div>
                
                <div class="monitor-list">
                  <h3>Domain Listesi</h3>
                  <div class="monitor-table-wrapper">
                    <table class="monitor-table">
                      <thead>
                        <tr>
                          <th>Domain</th>
                          <th>SSL Başlangıç</th>
                          <th>SSL Bitiş</th>
                          <th>SSL Kalan</th>
                          <th>SSL Durum</th>
                          <th>Domain Durum</th>
                          <th>Domain Başlangıç</th>
                          <th>Domain Bitiş</th>
                          <th>Domain Kalan</th>
                          <th>Yayıncı</th>
                          <th>İşlem</th>
                        </tr>
                      </thead>
                      <tbody id="domainTableBody">
                        <tr>
                          <td colspan="11" class="empty-message">Henüz domain eklenmedi.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Settings Page -->
          <div class="page-content" id="settingsPage">
            <div class="content-wrapper">
              <h2>Veritabanı Takibi</h2>
              <p>Uygulama veritabanı istatistikleri ve yönetimi</p>
              
              <div class="database-container">
                <div class="db-stats-grid">
                  <div class="db-stat-card">
                    <div class="db-stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                      <i data-lucide="image"></i>
                    </div>
                    <div class="db-stat-info">
                      <h3 id="dbImageCount">0</h3>
                      <p>Dönüştürülmüş Fotoğraf</p>
                    </div>
                  </div>

                  <div class="db-stat-card">
                    <div class="db-stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                      <i data-lucide="video"></i>
                    </div>
                    <div class="db-stat-info">
                      <h3 id="dbVideoCount">0</h3>
                      <p>Optimize Edilmiş Video</p>
                    </div>
                  </div>

                  <div class="db-stat-card">
                    <div class="db-stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                      <i data-lucide="monitor"></i>
                    </div>
                    <div class="db-stat-info">
                      <h3 id="dbDomainCount">0</h3>
                      <p>Takip Edilen Domain</p>
                    </div>
                  </div>

                  <div class="db-stat-card">
                    <div class="db-stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                      <i data-lucide="hard-drive"></i>
                    </div>
                    <div class="db-stat-info">
                      <h3 id="dbSize">0 KB</h3>
                      <p>Veritabanı Boyutu</p>
                    </div>
                  </div>
                </div>

                <div class="db-tables">
                  <h3>Tablo Detayları</h3>
                  <div class="db-table-list">
                    <div class="db-table-item">
                      <div class="db-table-header">
                        <i data-lucide="table"></i>
                        <span>converted_images</span>
                      </div>
                      <div class="db-table-stats">
                        <span id="tableImageCount">0 kayıt</span>
                      </div>
                    </div>

                    <div class="db-table-item">
                      <div class="db-table-header">
                        <i data-lucide="table"></i>
                        <span>converted_videos</span>
                      </div>
                      <div class="db-table-stats">
                        <span id="tableVideoCount">0 kayıt</span>
                      </div>
                    </div>

                    <div class="db-table-item">
                      <div class="db-table-header">
                        <i data-lucide="table"></i>
                        <span>domains</span>
                      </div>
                      <div class="db-table-stats">
                        <span id="tableDomainCount">0 kayıt</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="db-actions">
                  <button class="btn-secondary" id="refreshDbStatsBtn">
                    <i data-lucide="refresh-cw"></i>
                    <span>İstatistikleri Yenile</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    `;



    // Initialize icons
    initIcons();

    // Setup update checker
    setupUpdateChecker();

    // Setup navigation with page loaders
    setupNavigation(
      loadArchive,
      loadConvertedResults,
      loadDatabaseStats,
      loadDomains
    );

    // Setup sidebar toggle
    setupSidebarToggle();

    // Setup all page modules
    setupHomePage();
    setupConverterPage();
    setupVideoPage();
    setupSeoPage();
    setupResizePage();
    setupCropPage();
    setupMonitorPage();
    setupArchivePage();
    setupDatabasePage();

    // Setup file drop handling
    await setupFileDrop(
      handleFilePaths,
      async (paths: string[]) => {
        const activePage = document.querySelector('.page-content.active');
        if (activePage?.id === 'videoPage') {
          const activeTab = document.querySelector('.tab-content.active');
          if (activeTab?.id === 'optimizeTab') {
            addVideosToSelection(paths);
          } else if (activeTab?.id === 'mergeTab') {
            addVideosToMerge(paths);
          }
        }
      }
    );
  }
});

function setupUpdateChecker() {
  const updateStatusBtn = document.getElementById("updateStatusBtn");
  const updateText = updateStatusBtn?.querySelector('.update-text');
  const updateIcon = updateStatusBtn?.querySelector('i');
  
  async function checkUpdateStatus() {
    try {
      const { checkUpdateStatus: getUpdateStatus } = await import('./updater');
      const status = await getUpdateStatus();
      
      if (status.available && updateStatusBtn && updateText && updateIcon) {
        updateStatusBtn.classList.add('update-available');
        updateText.textContent = 'Güncelleme mevcut';
        updateIcon.setAttribute('data-lucide', 'download');
        initIcons();
      } else if (updateStatusBtn && updateText && updateIcon) {
        updateStatusBtn.classList.remove('update-available');
        updateText.textContent = 'Uygulama güncel';
        updateIcon.setAttribute('data-lucide', 'check-circle');
        initIcons();
      }
    } catch (error) {
      console.error('Güncelleme kontrolü hatası:', error);
    }
  }

  // İlk kontrol
  checkUpdateStatus();
  
  // Her 30 dakikada bir kontrol et
  setInterval(checkUpdateStatus, 30 * 60 * 1000);

  updateStatusBtn?.addEventListener("click", async () => {
    const { checkForUpdates } = await import('./updater');
    await checkForUpdates(true);
    // Güncelleme kontrolünden sonra durumu yenile
    await checkUpdateStatus();
  });
}
