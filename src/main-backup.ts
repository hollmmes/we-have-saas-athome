import { createIcons, Home, Info, CheckCircle, Download, Menu, Image, Archive, Trash2, FolderOpen, Settings, Video, Plus, Play, Hash, Maximize, Monitor, Crop, Database, HardDrive, Table, RefreshCw, Folder } from 'lucide';
import { checkForUpdates } from './updater';
import { initDatabase, saveImage, getImages, deleteImage as deleteImageFromDB, saveVideo, getVideos, deleteVideo as deleteVideoFromDB, getAllMedia, saveDomain, getDomains, deleteDomain as deleteDomainFromDB } from './database';

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
      Hash,
      Maximize,
      Monitor,
      Crop,
      Database,
      HardDrive,
      Table,
      RefreshCw,
      Folder
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

    // Home Page - Output Folder Setup
    const selectFolderBtn = document.getElementById('selectFolderBtn');
    const folderPath = document.getElementById('folderPath');
    const folderStructure = document.getElementById('folderStructure');
    const setupCard = document.getElementById('setupCard');

    async function checkOutputFolder() {
      const savedPath = localStorage.getItem('outputPath');
      if (savedPath && folderPath) {
        folderPath.textContent = savedPath;
        folderStructure!.style.display = 'block';
        setupCard.classList.add('setup-complete');
        return true;
      }
      return false;
    }

    selectFolderBtn.addEventListener('click', async () => {
      const { open } = await import('@tauri-apps/plugin-dialog');
      
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Çıktı Klasörünü Seçin'
      });
      
      if (selected && typeof selected === 'string') {
        localStorage.setItem('outputPath', selected);
        folderPath!.textContent = selected;
        folderStructure!.style.display = 'block';
        setupCard.classList.add('setup-complete');
        
        // Create subfolders
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          const fs = await import('@tauri-apps/plugin-fs');
          
          const subfolders = ['converted_images', 'converted_videos', 'cropped_images', 'resized_images'];
          for (const folder of subfolders) {
            const folderPath = `${selected}/${folder}`;
            try {
              await fs.mkdir(folderPath, { recursive: true });
            } catch (e) {
              console.log(`Folder already exists or created: ${folder}`);
            }
          }
          
          alert('Çıktı klasörü ayarlandı ve alt klasörler oluşturuldu!');
          createIcons({ icons: allIcons });
        } catch (error) {
          console.error('Folder creation error:', error);
        }
      }
    });

    // Check folder on load
    checkOutputFolder();

    // Güncelleme durumu kontrolü
    const updateStatusBtn = document.getElementById("updateStatusBtn");
    const updateText = updateStatusBtn.querySelector('.update-text');
    
    async function checkUpdateStatus() {
      try {
        const { check } = await import('@tauri-apps/plugin-updater');
        const update = await check();
        
        if (update.available && updateStatusBtn && updateText) {
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
    updateStatusBtn.addEventListener("click", () => {
      checkForUpdates();
    });

    // Page Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page-content');
    
    navItems.forEach(item => {
      item.addEventListener('click', async (e) => {
        e.preventDefault();
        const pageName = (item as HTMLElement).dataset.page;
        
        // Check if output folder is required for this page
        const allowedPages = ['home', 'archive', 'settings', 'monitor'];
        
        if (!allowedPages.includes(pageName || '')) {
          const hasFolder = await checkOutputFolder();
          if (!hasFolder) {
            alert('Lütfen önce anasayfadan çıktı klasörünü ayarlayın!');
            
            // Navigate to home
            navItems.forEach(nav => nav.classList.remove('active'));
            document.querySelector('[data-page="home"]').classList.add('active');
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById('homePage').classList.add('active');
            
            return;
          }
        }
        
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
          
          // Load database stats when opening settings page
          if (pageName === 'settings') {
            await loadDatabaseStats();
          }
        }
        
        // Reinitialize icons
        createIcons({
          icons: allIcons
        });
        
        // Close sidebar on mobile
        if (window.innerWidth < 768) {
          sidebar.classList.remove('open');
        }
      });
    });

    // Image Converter Logic
    const dropZone = document.getElementById('dropZone');
    const selectedFilesContainer = document.getElementById('selectedFiles');
    const conversionQueue = document.getElementById('conversionQueue');
    let selectedFiles: string[] = [];

    // Click to select files using Tauri dialog
    dropZone.addEventListener('click', async () => {
      const { open } = await import('@tauri-apps/plugin-dialog');
      
      const selected = await open({
        multiple: true,
        filters: [{
          name: 'Images',
          extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'tiff', 'tif', 'ico']
        }]
      });
      
      if (selected) {
        const paths = Array.isArray(selected)  selected : [selected];
        addFilesToSelection(paths);
      }
    });

    // Tauri file drop event
    async function setupFileDrop() {
      const { listen } = await import('@tauri-apps/api/event');
      
      await listen('tauri://drag-over', () => {
        // Check which page is active
        const activePage = document.querySelector('.page-content.active');
        const activePageId = activePage.id;
        
        if (activePageId === 'converterPage') {
          dropZone.classList.add('drag-over');
        } else if (activePageId === 'videoPage') {
          const activeTab = document.querySelector('.tab-content.active');
          if (activeTab.id === 'optimizeTab') {
            videoDropZone.classList.add('drag-over');
          } else if (activeTab.id === 'mergeTab') {
            mergeDropZone.classList.add('drag-over');
          }
        }
      });

      await listen('tauri://drag-drop', async (event: any) => {
        dropZone.classList.remove('drag-over');
        videoDropZone.classList.remove('drag-over');
        mergeDropZone.classList.remove('drag-over');
        
        const paths = event.payload.paths as string[];
        if (paths && paths.length > 0) {
          // Check which page is active
          const activePage = document.querySelector('.page-content.active');
          const activePageId = activePage.id;
          
          if (activePageId === 'converterPage') {
            // Image converter page
            await handleFilePaths(paths);
          } else if (activePageId === 'videoPage') {
            // Video page
            const activeTab = document.querySelector('.tab-content.active');
            if (activeTab.id === 'optimizeTab') {
              addVideosToSelection(paths);
            } else if (activeTab.id === 'mergeTab') {
              addVideosToMerge(paths);
            }
          }
        }
      });

      await listen('tauri://drag-leave', () => {
        dropZone.classList.remove('drag-over');
        videoDropZone.classList.remove('drag-over');
        mergeDropZone.classList.remove('drag-over');
      });
    }

    setupFileDrop();

    async function handleFilePaths(paths: string[]) {
      // Filter only image files
      const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'tiff', 'tif', 'ico'];
      const imagePaths = paths.filter(path => {
        const ext = path.split('.').pop().toLowerCase();
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
          const valueSpan = target.parentElement.querySelector('.quality-value');
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
        
        const format = formatSelect.value || 'webp';
        const quality = parseInt(qualitySlider.value || '85');
        
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
      conversionQueue.appendChild(queueItem);

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
            ${img.dataUrl  `
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
        document.getElementById(`${tab}Tab`).classList.add('active');
      });
    });
    
    // Video file selection for optimize
    videoDropZone.addEventListener('click', async () => {
      const { open } = await import('@tauri-apps/plugin-dialog');
      
      const selected = await open({
        multiple: true,
        filters: [{
          name: 'Videos',
          extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv']
        }]
      });
      
      if (selected) {
        const paths = Array.isArray(selected)  selected : [selected];
        addVideosToSelection(paths);
      }
    });
    
    // Video file selection for merge
    mergeDropZone.addEventListener('click', async () => {
      const { open } = await import('@tauri-apps/plugin-dialog');
      
      const selected = await open({
        multiple: true,
        filters: [{
          name: 'Videos',
          extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv']
        }]
      });
      
      if (selected) {
        const paths = Array.isArray(selected)  selected : [selected];
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
        const quality = qualitySelect.value || 'medium';
        
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
      videoQueue.appendChild(queueItem);
      
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
    
    mergeVideosBtn.addEventListener('click', async () => {
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
      mergeQueue.appendChild(queueItem);
      
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
            <div class="video-preview" onclick='playVideo(\`${escapedPath}\`, "${video.converted_name}")' style="${video.thumbnail  `background-image: url('${video.thumbnail}'); background-size: cover; background-position: center;` : ''}">
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
            ${isVideo  `
            <div class="archive-preview video-preview-small" onclick='playVideo(\`${escapedPath}\`, "${item.converted_name}")' style="${item.dataUrl  `background-image: url('${item.dataUrl}'); background-size: cover; background-position: center;` : ''}">
              <i data-lucide="play"></i>
              <span class="video-duration-small">${item.duration}</span>
            </div>
            ` : item.dataUrl  `
            <div class="archive-preview">
              <img src="${item.dataUrl}" alt="${item.converted_name}" />
            </div>
            ` : ''}
            <div class="archive-item-info">
              <h4>${item.converted_name}</h4>
              <p class="archive-meta">
                ${isVideo  `
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
    deleteSelectedBtn.addEventListener('click', async () => {
      const checkboxes = document.querySelectorAll('.archive-checkbox:checked') as NodeListOf<HTMLInputElement>;
      
      if (checkboxes.length === 0) return;
      
      if (!confirm(`${checkboxes.length} fotoğrafı silmek istediğinizden emin misinizU`)) {
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
    cancelSelectionBtn.addEventListener('click', () => {
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

    menuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (window.innerWidth < 768 && 
          !sidebar.contains(target) && 
          !menuToggle.contains(target) &&
          sidebar.classList.contains("open")) {
        sidebar.classList.remove("open");
      }
    });

    // Photo Resize Functions
    let resizeW = 350;
    let resizeH = 390;
    let resizeBadges = [
      { w: 350, h: 390 },
      { w: 1200, h: 1200 },
      { w: 480, h: 600 }
    ];
    let originalResizeImages: Array<{ img: HTMLImageElement; name: string }> = [];

    const resizeWidthInput = document.getElementById('resizeWidth') as HTMLInputElement;
    const resizeHeightInput = document.getElementById('resizeHeight') as HTMLInputElement;
    const resizeGallery = document.getElementById('resizeGallery');
    const resizeDropZone = document.getElementById('resizeDropZone');
    const resizeFileInput = document.getElementById('resizeFileInput') as HTMLInputElement;

    function refreshResizeGallery() {
      resizeW = parseInt(resizeWidthInput.value || '350');
      resizeH = parseInt(resizeHeightInput.value || '390');
      
      if (resizeGallery) {
        resizeGallery.innerHTML = '';
        originalResizeImages.forEach(item => renderResizeCanvas(item.img, item.name));
      }
      renderResizeBadges();
    }

    resizeWidthInput.addEventListener('input', refreshResizeGallery);
    resizeHeightInput.addEventListener('input', refreshResizeGallery);

    // File input
    resizeFileInput.addEventListener('change', (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) handleResizeFiles(files);
    });

    // Drop zone click
    resizeDropZone.addEventListener('click', () => {
      resizeFileInput.click();
    });

    // Drag & drop
    resizeDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      resizeDropZone.classList.add('drag-over');
    });

    resizeDropZone.addEventListener('dragleave', () => {
      resizeDropZone.classList.remove('drag-over');
    });

    resizeDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      resizeDropZone.classList.remove('drag-over');
      const files = e.dataTransfer.files;
      if (files) handleResizeFiles(files);
    });

    function handleResizeFiles(files: FileList) {
      Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new window.Image();
          img.onload = () => {
            originalResizeImages.push({ img, name: file.name });
            renderResizeCanvas(img, file.name);
            
            const downloadAllBtn = document.getElementById('downloadAllBtn') as HTMLButtonElement;
            const clearBtn = document.getElementById('clearResizeBtn') as HTMLButtonElement;
            if (downloadAllBtn) downloadAllBtn.disabled = false;
            if (clearBtn) clearBtn.disabled = false;
          };
          img.src = ev.target.result as string;
        };
        reader.readAsDataURL(file);
      });
    }

    function renderResizeCanvas(img: HTMLImageElement, name: string) {
      const canvas = document.createElement('canvas');
      canvas.width = resizeW;
      canvas.height = resizeH;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scale = Math.max(resizeW / img.width, resizeH / img.height);
      const x = (resizeW / 2) - (img.width / 2) * scale;
      const y = (resizeH / 2) - (img.height / 2) * scale;

      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, resizeW, resizeH);
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

      const wrap = document.createElement('div');
      wrap.className = 'resize-thumb';
      
      const fileName = document.createElement('div');
      fileName.className = 'resize-file-name';
      fileName.textContent = name;
      
      wrap.appendChild(fileName);
      wrap.appendChild(canvas);

      const btn = document.createElement('button');
      btn.className = 'btn-secondary';
      btn.style.width = '100%';
      btn.textContent = 'İndir';
      btn.onclick = () => {
        const a = document.createElement('a');
        a.download = `${resizeW}x${resizeH}-${name}.jpg`;
        a.href = canvas.toDataURL('image/jpeg', 0.92);
        a.click();
      };
      
      wrap.appendChild(btn);
      resizeGallery.appendChild(wrap);
    }

    function renderResizeBadges() {
      const container = document.getElementById('resizeBadges');
      if (!container) return;

      container.innerHTML = '';
      resizeBadges.forEach((badge, index) => {
        const badgeEl = document.createElement('div');
        badgeEl.className = `resize-badge ${resizeW === badge.w && resizeH === badge.h  'active' : ''}`;
        
        badgeEl.innerHTML = `
          <span class="badge-text">${badge.w} × ${badge.h}</span>
          <span class="badge-remove">×</span>
        `;
        
        badgeEl.querySelector('.badge-text').addEventListener('click', () => {
          resizeWidthInput.value = badge.w.toString();
          resizeHeightInput.value = badge.h.toString();
          refreshResizeGallery();
        });
        
        badgeEl.querySelector('.badge-remove').addEventListener('click', (e) => {
          e.stopPropagation();
          resizeBadges.splice(index, 1);
          renderResizeBadges();
        });
        
        container.appendChild(badgeEl);
      });
    }

    // Save dimension button
    document.getElementById('saveDimensionBtn').addEventListener('click', () => {
      const w = parseInt(resizeWidthInput.value || '350');
      const h = parseInt(resizeHeightInput.value || '390');
      resizeBadges.push({ w, h });
      renderResizeBadges();
    });

    // Clear button
    document.getElementById('clearResizeBtn').addEventListener('click', () => {
      if (resizeGallery) resizeGallery.innerHTML = '';
      originalResizeImages = [];
      
      const downloadAllBtn = document.getElementById('downloadAllBtn') as HTMLButtonElement;
      const clearBtn = document.getElementById('clearResizeBtn') as HTMLButtonElement;
      if (downloadAllBtn) downloadAllBtn.disabled = true;
      if (clearBtn) clearBtn.disabled = true;
    });

    // Download all button
    document.getElementById('downloadAllBtn').addEventListener('click', () => {
      const canvases = resizeGallery.querySelectorAll('canvas');
      canvases.forEach((canvas, i) => {
        const a = document.createElement('a');
        a.download = `${resizeW}x${resizeH}-${originalResizeImages[i].name}.jpg`;
        a.href = canvas.toDataURL('image/jpeg', 0.92);
        a.click();
      });
    });

    // Initialize badges
    renderResizeBadges();

    // SEO Tools Functions
    function turkceToAscii(text: string): string {
      const chars: { [key: string]: string } = {
        'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
        'Ç': 'C', 'Ğ': 'G', 'İ': 'I', 'Ö': 'O', 'Ş': 'S', 'Ü': 'U'
      };
      return text.split('').map(c => chars[c] || c).join('');
    }

    function metinToUrl(metin: string): string {
      let txt = turkceToAscii(metin);
      txt = txt.toLowerCase();
      txt = txt.trim().replace(/\s+/g, '-');
      txt = txt.replace(/[^a-z0-9\-]/g, '');
      return txt;
    }

    function convertSeoKeywords() {
      const input = (document.getElementById('seoInputText') as HTMLTextAreaElement).value || '';
      const lines = input.split('\n').filter(l => l.trim() !== '');

      if (lines.length === 0) {
        alert('Lütfen anahtar kelime girin!');
        return;
      }

      // 1. Blog Hashtag (virgülle ayrılmış)
      const joined = lines.join(', ') + ',';
      (document.getElementById('seoJoinedResult') as HTMLTextAreaElement).value = joined;

      // 2. SLUG (URL)
      const maxLen = parseInt((document.getElementById('seoMaxLen') as HTMLInputElement).value || '150');
      let urlLines = lines.map(l => metinToUrl(l));
      let urlJoined = urlLines.join('-');
      
      if (urlJoined.length > maxLen) {
        urlJoined = urlJoined.substring(0, maxLen);
        if (urlJoined.endsWith('-')) {
          urlJoined = urlJoined.slice(0, -1);
        }
      }
      (document.getElementById('seoUrlResult') as HTMLTextAreaElement).value = urlJoined;

      // 3. Sosyal Medya Hashtag
      const hashtags = lines.map(line => {
        return `#${line.trim().replace(/\s+/g, '')}`;
      }).join(' ');
      (document.getElementById('seoHashtagResult') as HTMLTextAreaElement).value = hashtags;
    }

    // SEO Convert button
    const seoConvertBtn = document.getElementById('seoConvertBtn');
    seoConvertBtn.addEventListener('click', convertSeoKeywords);

    // Copy to clipboard function
    (window as any).copyToClipboard = async (elementId: string) => {
      const textarea = document.getElementById(elementId) as HTMLTextAreaElement;
      if (textarea && textarea.value) {
        try {
          await navigator.clipboard.writeText(textarea.value);
          alert('Kopyalandı!');
        } catch (err) {
          // Fallback
          textarea.select();
          document.execCommand('copy');
          alert('Kopyalandı!');
        }
      }
    };

    // Database Stats Functions
    async function loadDatabaseStats() {
      try {
        const images = await getImages();
        const videos = await getVideos();
        const domains = await getDomains();
        
        // Update counts
        document.getElementById('dbImageCount')!.textContent = images.length.toString();
        document.getElementById('dbVideoCount')!.textContent = videos.length.toString();
        document.getElementById('dbDomainCount')!.textContent = domains.length.toString();
        
        document.getElementById('tableImageCount')!.textContent = `${images.length} kayıt`;
        document.getElementById('tableVideoCount')!.textContent = `${videos.length} kayıt`;
        document.getElementById('tableDomainCount')!.textContent = `${domains.length} kayıt`;
        
        // Calculate database size (approximate)
        const { invoke } = await import('@tauri-apps/api/core');
        try {
          const appDataDir = await invoke('get_default_output_path') as string;
          const dbPath = appDataDir.replace('converted_images', 'images.db');
          
          // Try to get file size using fs
          const fs = await import('@tauri-apps/plugin-fs');
          try {
            const stat = await fs.stat(dbPath);
            const sizeKB = Math.round((stat.size || 0) / 1024);
            const sizeMB = (sizeKB / 1024).toFixed(2);
            
            if (sizeKB > 1024) {
              document.getElementById('dbSize')!.textContent = `${sizeMB} MB`;
            } else {
              document.getElementById('dbSize')!.textContent = `${sizeKB} KB`;
            }
          } catch (e) {
            // Estimate based on record count
            const estimatedSize = (images.length * 0.5) + (videos.length * 0.5) + (domains.length * 0.3);
            document.getElementById('dbSize')!.textContent = `~${estimatedSize.toFixed(1)} KB`;
          }
        } catch (error) {
          console.error('Database size calculation error:', error);
          document.getElementById('dbSize')!.textContent = 'Bilinmiyor';
        }
        
        createIcons({ icons: allIcons });
      } catch (error) {
        console.error('Database stats error:', error);
      }
    }

    const refreshDbStatsBtn = document.getElementById('refreshDbStatsBtn');
    refreshDbStatsBtn.addEventListener('click', async () => {
      await loadDatabaseStats();
      alert('İstatistikler güncellendi!');
    });

    // Photo Crop Editor Functions
    const cropFileInput = document.getElementById('cropFileInput') as HTMLInputElement;
    const cropUploadArea = document.getElementById('cropUploadArea');
    const cropCanvasWrapper = document.getElementById('cropCanvasWrapper');
    const cropCanvas = document.getElementById('cropCanvas') as HTMLCanvasElement;
    const cropBox = document.getElementById('cropBox');
    const cropOverlay = document.getElementById('cropOverlay');
    const cropDimensions = document.getElementById('cropDimensions');
    const cropRatio = document.getElementById('cropRatio');
    const cropResetBtn = document.getElementById('cropResetBtn');
    const cropRotateBtn = document.getElementById('cropRotateBtn');
    const cropSaveBtn = document.getElementById('cropSaveBtn');
    const templateBtns = document.querySelectorAll('.template-btn');

    let cropImage: HTMLImageElement | null = null;
    let cropCtx: CanvasRenderingContext2D | null = null;
    let cropState = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      aspectRatio: 0, // 0 = free, otherwise fixed ratio
      targetWidth: 0,
      targetHeight: 0,
      rotation: 0,
      isDragging: false,
      isResizing: false,
      resizeHandle: '',
      startX: 0,
      startY: 0,
      startCropX: 0,
      startCropY: 0,
      startCropWidth: 0,
      startCropHeight: 0
    };

    // Template selection
    templateBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        templateBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const ratio = btn.getAttribute('data-ratio') || 'free';
        const width = parseInt(btn.getAttribute('data-width') || '0');
        const height = parseInt(btn.getAttribute('data-height') || '0');
        
        if (ratio === 'free') {
          cropState.aspectRatio = 0;
          cropState.targetWidth = 0;
          cropState.targetHeight = 0;
        } else {
          cropState.aspectRatio = width / height;
          cropState.targetWidth = width;
          cropState.targetHeight = height;
        }
        
        if (cropImage) {
          resetCropBox();
        }
      });
    });

    // File upload
    cropUploadArea.addEventListener('click', () => {
      cropFileInput.click();
    });

    cropFileInput.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files.[0];
      if (file) loadCropImage(file);
    });

    // Drag & drop
    cropUploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      cropUploadArea.classList.add('drag-over');
    });

    cropUploadArea.addEventListener('dragleave', () => {
      cropUploadArea.classList.remove('drag-over');
    });

    cropUploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      cropUploadArea.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        loadCropImage(file);
      }
    });

    function loadCropImage(file: File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          cropImage = img;
          cropState.rotation = 0;
          initCropCanvas();
          cropUploadArea!.style.display = 'none';
          cropCanvasWrapper!.style.display = 'block';
          createIcons({ icons: allIcons });
        };
        img.src = e.target.result as string;
      };
      reader.readAsDataURL(file);
    }

    function initCropCanvas() {
      if (!cropImage || !cropCanvas) return;
      
      const container = cropCanvas.parentElement!;
      const maxWidth = container.clientWidth;
      const maxHeight = container.clientHeight;
      
      let scale = Math.min(maxWidth / cropImage.width, maxHeight / cropImage.height, 1);
      
      cropCanvas.width = cropImage.width * scale;
      cropCanvas.height = cropImage.height * scale;
      
      cropCtx = cropCanvas.getContext('2d');
      drawCropCanvas();
      resetCropBox();
    }

    function drawCropCanvas() {
      if (!cropCtx || !cropImage || !cropCanvas) return;
      
      cropCtx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
      
      if (cropState.rotation === 0) {
        cropCtx.drawImage(cropImage, 0, 0, cropCanvas.width, cropCanvas.height);
      } else {
        const centerX = cropCanvas.width / 2;
        const centerY = cropCanvas.height / 2;
        
        cropCtx.save();
        cropCtx.translate(centerX, centerY);
        cropCtx.rotate((cropState.rotation * Math.PI) / 180);
        cropCtx.drawImage(cropImage, -cropCanvas.width / 2, -cropCanvas.height / 2, cropCanvas.width, cropCanvas.height);
        cropCtx.restore();
      }
    }

    function resetCropBox() {
      if (!cropCanvas || !cropBox) return;
      
      const canvasRect = cropCanvas.getBoundingClientRect();
      
      if (cropState.aspectRatio > 0) {
        // Fixed aspect ratio
        const canvasAspect = canvasRect.width / canvasRect.height;
        
        if (cropState.aspectRatio > canvasAspect) {
          // Wider than canvas
          cropState.width = canvasRect.width * 0.8;
          cropState.height = cropState.width / cropState.aspectRatio;
        } else {
          // Taller than canvas
          cropState.height = canvasRect.height * 0.8;
          cropState.width = cropState.height * cropState.aspectRatio;
        }
      } else {
        // Free aspect ratio
        cropState.width = canvasRect.width * 0.8;
        cropState.height = canvasRect.height * 0.8;
      }
      
      cropState.x = (canvasRect.width - cropState.width) / 2;
      cropState.y = (canvasRect.height - cropState.height) / 2;
      
      updateCropBox();
    }

    function updateCropBox() {
      if (!cropBox) return;
      
      cropBox.style.left = cropState.x + 'px';
      cropBox.style.top = cropState.y + 'px';
      cropBox.style.width = cropState.width + 'px';
      cropBox.style.height = cropState.height + 'px';
      
      // Update dimensions display
      const scaleX = cropImage!.width / cropCanvas!.width;
      const scaleY = cropImage!.height / cropCanvas!.height;
      const actualWidth = Math.round(cropState.width * scaleX);
      const actualHeight = Math.round(cropState.height * scaleY);
      
      if (cropDimensions) {
        cropDimensions.textContent = `${actualWidth} × ${actualHeight}`;
      }
      
      if (cropRatio) {
        if (cropState.aspectRatio > 0) {
          const activeTemplate = document.querySelector('.template-btn.active');
          cropRatio.textContent = activeTemplate.querySelector('span').textContent || 'Sabit Oran';
        } else {
          cropRatio.textContent = 'Serbest';
        }
      }
    }

    // Crop box dragging and resizing
    cropBox.addEventListener('mousedown', (e) => {
      const target = e.target as HTMLElement;
      
      if (target.classList.contains('crop-handle')) {
        cropState.isResizing = true;
        cropState.resizeHandle = target.className.split(' ')[1];
      } else if (target === cropBox) {
        cropState.isDragging = true;
      }
      
      cropState.startX = e.clientX;
      cropState.startY = e.clientY;
      cropState.startCropX = cropState.x;
      cropState.startCropY = cropState.y;
      cropState.startCropWidth = cropState.width;
      cropState.startCropHeight = cropState.height;
      
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!cropCanvas) return;
      
      const canvasRect = cropCanvas.getBoundingClientRect();
      const dx = e.clientX - cropState.startX;
      const dy = e.clientY - cropState.startY;
      
      if (cropState.isDragging) {
        cropState.x = Math.max(0, Math.min(canvasRect.width - cropState.width, cropState.startCropX + dx));
        cropState.y = Math.max(0, Math.min(canvasRect.height - cropState.height, cropState.startCropY + dy));
        updateCropBox();
      } else if (cropState.isResizing) {
        handleResize(dx, dy, canvasRect);
      }
    });

    document.addEventListener('mouseup', () => {
      cropState.isDragging = false;
      cropState.isResizing = false;
    });

    function handleResize(dx: number, dy: number, canvasRect: DOMRect) {
      const handle = cropState.resizeHandle;
      let newX = cropState.startCropX;
      let newY = cropState.startCropY;
      let newWidth = cropState.startCropWidth;
      let newHeight = cropState.startCropHeight;
      
      if (handle.includes('e')) {
        newWidth = cropState.startCropWidth + dx;
      }
      if (handle.includes('w')) {
        newWidth = cropState.startCropWidth - dx;
        newX = cropState.startCropX + dx;
      }
      if (handle.includes('s')) {
        newHeight = cropState.startCropHeight + dy;
      }
      if (handle.includes('n')) {
        newHeight = cropState.startCropHeight - dy;
        newY = cropState.startCropY + dy;
      }
      
      // Apply aspect ratio constraint
      if (cropState.aspectRatio > 0) {
        if (handle.includes('e') || handle.includes('w')) {
          newHeight = newWidth / cropState.aspectRatio;
          if (handle.includes('n')) {
            newY = cropState.startCropY + cropState.startCropHeight - newHeight;
          }
        } else {
          newWidth = newHeight * cropState.aspectRatio;
          if (handle.includes('w')) {
            newX = cropState.startCropX + cropState.startCropWidth - newWidth;
          }
        }
      }
      
      // Bounds checking
      if (newWidth < 50) newWidth = 50;
      if (newHeight < 50) newHeight = 50;
      if (newX < 0) { newWidth += newX; newX = 0; }
      if (newY < 0) { newHeight += newY; newY = 0; }
      if (newX + newWidth > canvasRect.width) newWidth = canvasRect.width - newX;
      if (newY + newHeight > canvasRect.height) newHeight = canvasRect.height - newY;
      
      cropState.x = newX;
      cropState.y = newY;
      cropState.width = newWidth;
      cropState.height = newHeight;
      
      updateCropBox();
    }

    // Reset button
    cropResetBtn.addEventListener('click', () => {
      resetCropBox();
    });

    // Rotate button
    cropRotateBtn.addEventListener('click', () => {
      cropState.rotation = (cropState.rotation + 90) % 360;
      drawCropCanvas();
    });

    // Save button
    cropSaveBtn.addEventListener('click', () => {
      if (!cropImage || !cropCanvas) return;
      
      const scaleX = cropImage.width / cropCanvas.width;
      const scaleY = cropImage.height / cropCanvas.height;
      
      const sourceX = cropState.x * scaleX;
      const sourceY = cropState.y * scaleY;
      const sourceWidth = cropState.width * scaleX;
      const sourceHeight = cropState.height * scaleY;
      
      // Create output canvas
      const outputCanvas = document.createElement('canvas');
      const outputWidth = cropState.targetWidth || Math.round(sourceWidth);
      const outputHeight = cropState.targetHeight || Math.round(sourceHeight);
      
      outputCanvas.width = outputWidth;
      outputCanvas.height = outputHeight;
      
      const outputCtx = outputCanvas.getContext('2d')!;
      
      // Draw cropped and scaled image
      outputCtx.drawImage(
        cropImage,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, outputWidth, outputHeight
      );
      
      // Download
      const link = document.createElement('a');
      link.download = `cropped-${outputWidth}x${outputHeight}.jpg`;
      link.href = outputCanvas.toDataURL('image/jpeg', 0.95);
      link.click();
      
      alert('Fotoğraf başarıyla kırpıldı ve indirildi!');
    });

    // SSL & Domain Monitor Functions
    const domainInput = document.getElementById('domainInput') as HTMLInputElement;
    const addDomainBtn = document.getElementById('addDomainBtn');
    const refreshAllDomainsBtn = document.getElementById('refreshAllDomainsBtn');
    const domainTableBody = document.getElementById('domainTableBody');

    async function loadDomains() {
      if (!domainTableBody) return;

      try {
        const domains = await getDomains();
        
        if (domains.length === 0) {
          domainTableBody.innerHTML = '<tr><td colspan="11" class="empty-message">Henüz domain eklenmedi.</td></tr>';
          return;
        }

        domainTableBody.innerHTML = domains.map(domain => {
          const sslStatusClass = domain.ssl_status.includes('✅')  'success' : 'danger';
          const domainStatusClass = domain.domain_status.includes('✅')  'success' : 'danger';
          
          return `
            <tr>
              <td><strong>${domain.domain}</strong></td>
              <td style="color:#888;">${domain.ssl_start}</td>
              <td>${domain.ssl_end}</td>
              <td><span class="day-info">${domain.ssl_days} Gün</span></td>
              <td><span class="badge ${sslStatusClass}">${domain.ssl_status}</span></td>
              <td><span class="badge ${domainStatusClass}">${domain.domain_status}</span></td>
              <td style="color:#888;">${domain.domain_start}</td>
              <td>${domain.domain_end}</td>
              <td><span class="day-info">${domain.domain_days} Gün</span></td>
              <td style="font-size: 11px; color:#666;">${domain.ssl_issuer}</td>
              <td>
                <button class="btn-danger btn-sm" onclick="deleteDomainEntry('${domain.domain}')">SİL</button>
              </td>
            </tr>
          `;
        }).join('');

      } catch (error) {
        console.error('Domain listesi yüklenemedi:', error);
        domainTableBody.innerHTML = '<tr><td colspan="11" class="empty-message">Domain listesi yüklenirken hata oluştu</td></tr>';
      }
    }

    addDomainBtn.addEventListener('click', async () => {
      const domain = domainInput.value.trim();
      
      if (!domain) {
        alert('Lütfen bir domain girin!');
        return;
      }

      addDomainBtn.textContent = 'Sorgulanıyor...';
      addDomainBtn.setAttribute('disabled', 'true');

      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const result = await invoke('check_ssl_certificate', { domain }) as any;
        
        // Save to database
        await saveDomain(result);
        
        // Reload list
        await loadDomains();
        
        // Clear input
        if (domainInput) domainInput.value = '';
        
        alert('Domain başarıyla eklendi!');
      } catch (error) {
        console.error('Domain kontrol hatası:', error);
        alert(`Hata: ${error}`);
      } finally {
        addDomainBtn.textContent = 'Ekle ve Sorgula';
        addDomainBtn.removeAttribute('disabled');
      }
    });

    refreshAllDomainsBtn.addEventListener('click', async () => {
      const domains = await getDomains();
      
      if (domains.length === 0) {
        alert('Güncellenecek domain yok!');
        return;
      }

      refreshAllDomainsBtn.textContent = 'Güncelleniyor...';
      refreshAllDomainsBtn.setAttribute('disabled', 'true');

      try {
        const { invoke } = await import('@tauri-apps/api/core');
        
        for (const domain of domains) {
          try {
            const result = await invoke('check_ssl_certificate', { domain: domain.domain }) as any;
            await saveDomain(result);
          } catch (error) {
            console.error(`${domain.domain} güncellenemedi:`, error);
          }
        }
        
        await loadDomains();
        alert('Tüm domain\'ler güncellendi!');
      } catch (error) {
        console.error('Toplu güncelleme hatası:', error);
        alert(`Hata: ${error}`);
      } finally {
        refreshAllDomainsBtn.textContent = 'Tümünü Güncelle';
        refreshAllDomainsBtn.removeAttribute('disabled');
      }
    });

    (window as any).deleteDomainEntry = async (domain: string) => {
      if (!confirm(`${domain} domain'ini silmek istediğinizden emin misinizU`)) {
        return;
      }

      try {
        await deleteDomainFromDB(domain);
        await loadDomains();
      } catch (error) {
        console.error('Domain silinemedi:', error);
        alert('Domain silinemedi!');
      }
    };

    // Load domains when monitor page is opened
    navItems.forEach(item => {
      item.addEventListener('click', async () => {
        const pageName = (item as HTMLElement).dataset.page;
        if (pageName === 'monitor') {
          await loadDomains();
        }
      });
    });
  }
});
