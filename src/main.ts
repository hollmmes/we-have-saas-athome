// Refactored imports - using modular structure
import { initDatabase } from "./database";
import { initIcons } from "./utils/icons";
import { setupNavigation, setupSidebarToggle } from "./utils/navigation";
import { setupFileDrop } from "./utils/file-drop";
import { setupHomePage } from "./pages/home";
import {
  setupConverterPage,
  loadConvertedResults,
  handleFilePaths,
} from "./pages/converter";
import {
  setupVideoPage,
  addVideosToSelection,
  addVideosToMerge,
} from "./pages/video";
import { setupSeoPage } from "./pages/seo";
import { setupResizePage } from "./pages/resize";
import { setupCropPage } from "./pages/crop";
import { setupMonitorPage, loadDomains } from "./pages/monitor";
import { setupArchivePage, loadArchive } from "./pages/archive";
import { setupDatabasePage, loadDatabaseStats } from "./pages/database";
import { handleHexFinderPaths, setupHexFinderPage } from "./pages/hex-finder";

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
              <span class="update-text">Uygulama guncel</span>
              <i data-lucide="check-circle" class="update-icon"></i>
            </button>
          </div>
        </header>

        <!-- Sidebar -->
        <aside class="sidebar" id="sidebar">
          <div class="sidebar-topbar">
            <button class="sidebar-pin-toggle" id="sidebarPinToggle" type="button" title="Kenar cubugunu sabitle">
              <i data-lucide="panel-left-open"></i>
            </button>
          </div>
          <nav class="sidebar-nav">
            <a href="#" class="nav-item active" data-page="home">
              <i data-lucide="home" class="nav-icon"></i>
              <span class="nav-text">Giris</span>
            </a>
            <a href="#" class="nav-item" data-page="converter">
              <i data-lucide="image" class="nav-icon"></i>
              <span class="nav-text">Fotograf Donustur</span>
            </a>
            <a href="#" class="nav-item" data-page="video">
              <i data-lucide="video" class="nav-icon"></i>
              <span class="nav-text">Video Optimize</span>
            </a>
            <a href="#" class="nav-item" data-page="seo">
              <i data-lucide="hash" class="nav-icon"></i>
              <span class="nav-text">SEO Araclari</span>
            </a>
            <a href="#" class="nav-item" data-page="resize">
              <i data-lucide="maximize" class="nav-icon"></i>
              <span class="nav-text">Fotograf Boyutlandir</span>
            </a>
            <a href="#" class="nav-item" data-page="crop">
              <i data-lucide="crop" class="nav-icon"></i>
              <span class="nav-text">Fotograf Kirp</span>
            </a>
            <a href="#" class="nav-item" data-page="hexFinder">
              <i data-lucide="pipette" class="nav-icon"></i>
              <span class="nav-text">Hex Finder</span>
            </a>
            <a href="#" class="nav-item" data-page="monitor">
              <i data-lucide="monitor" class="nav-icon"></i>
              <span class="nav-text">SSL & Domain Takip</span>
            </a>
            <a href="#" class="nav-item" data-page="archive">
              <i data-lucide="archive" class="nav-icon"></i>
              <span class="nav-text">Arsiv</span>
            </a>
            <a href="#" class="nav-item" data-page="settings">
              <i data-lucide="database" class="nav-icon"></i>
              <span class="nav-text">Veritabani</span>
            </a>
          </nav>
          <div class="sidebar-footer">
            <div class="version-info">
              <i data-lucide="info" class="version-icon"></i>
              <span class="version-text">v${__APP_VERSION__}</span>
            </div>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="main-content" id="mainContent">
          <!-- Home Page -->
          <div class="page-content active" id="homePage">
            <div class="content-wrapper">
              <h2>We Have SaaS at Home</h2>
              <p>Hos geldiniz! Baslamak icin once cikti klasorunuzu ayarlayin.</p>

              <div class="setup-section">
                <div class="setup-card" id="setupCard">
                  <div class="setup-icon">
                    <i data-lucide="folder-open" class="setup-icon-svg"></i>
                  </div>
                  <h3>Cikti Klasoru Ayarla</h3>
                  <p class="setup-description">Tum donusturulmus dosyalariniz bu klasorde saklanacak. Her arac icin otomatik alt klasorler olusturulacak.</p>

                  <div class="current-folder" id="currentFolder">
                    <span class="folder-label">Secili Klasor:</span>
                    <span class="folder-path" id="folderPath">Henuz secilmedi</span>
                  </div>

                  <button class="btn-primary btn-large" id="selectFolderBtn">
                    <i data-lucide="folder-open"></i>
                    <span>Klasor Sec</span>
                  </button>

                  <div class="folder-structure" id="folderStructure" style="display: none;">
                    <h4>Olusturulacak Alt Klasorler:</h4>
                    <ul>
                      <li><i data-lucide="folder"></i> converted_images (Donusturulmus fotograflar)</li>
                      <li><i data-lucide="folder"></i> converted_videos (Optimize edilmis videolar)</li>
                      <li><i data-lucide="folder"></i> cropped_images (Kirpilmis fotograflar)</li>
                      <li><i data-lucide="folder"></i> resized_images (Boyutlandirilmis fotograflar)</li>
                    </ul>
                  </div>
                </div>

                <div class="version-section">
                  <div class="version-header">
                    <h3>Surum Bilgisi</h3>
                    <span class="version-badge">v${__APP_VERSION__}</span>
                  </div>
                  <div class="release-notes">
                    <h4>Yeni Ozellikler</h4>
                    <ul>
                      <li> Profesyonel fotograf kirpma editoru</li>
                      <li> Instagram, Facebook, YouTube sablonlari</li>
                      <li> SSL & Domain takip sistemi</li>
                      <li> Video thumbnail onizleme</li>
                      <li> 5 kalite seviyesi</li>
                      <li> Built-in video player</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Image Converter Page -->
          <div class="page-content" id="converterPage">
            <div class="content-wrapper">
              <h2>Fotograf Donusturucu</h2>
              <p>Fotograflarinizi farkli formatlara donusturun ve optimize edin</p>

              <div class="converter-container">
                <div class="drop-zone" id="dropZone">
                  <i data-lucide="image" class="drop-icon"></i>
                  <h3>Foto&#287;raf S&uuml;r&uuml;kle &amp; B&#305;rak</h3>
                  <p>veya tiklayarak dosya secin</p>
                  <input type="file" id="fileInput" accept="image/*" multiple hidden>
                </div>

                <div class="selected-files" id="selectedFiles"></div>

                <div class="conversion-queue" id="conversionQueue"></div>

                <div class="converted-results" id="convertedResults">
                  <h3>Son Donusturulen Fotograflar</h3>
                  <div class="results-grid" id="resultsGrid"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Video Optimizer Page -->
          <div class="page-content" id="videoPage">
            <div class="content-wrapper">
              <h2>Video Optimize & Birlestir</h2>
              <p>Videolarinizi optimize edin, boyutunu kucultun ve birlestirin</p>

              <div class="video-container">
                <div class="video-tabs">
                  <button class="tab-btn active" data-tab="optimize">Optimize Et</button>
                  <button class="tab-btn" data-tab="merge">Birlestir</button>
                </div>

                <!-- Optimize Tab -->
                <div class="tab-content active" id="optimizeTab">
                  <div class="drop-zone" id="videoDropZone">
                    <i data-lucide="video" class="drop-icon"></i>
                    <h3>Video Surukle & Birak</h3>
                    <p>veya tiklayarak dosya secin</p>
                  </div>

                  <div class="selected-videos" id="selectedVideos"></div>

                  <div class="video-queue" id="videoQueue"></div>

                  <div class="converted-results" id="convertedVideoResults">
                    <h3>Son Donusturulen Videolar</h3>
                    <div class="results-grid" id="videoResultsGrid"></div>
                  </div>
                </div>

                <!-- Merge Tab -->
                <div class="tab-content" id="mergeTab">
                  <div class="drop-zone" id="mergeDropZone">
                    <i data-lucide="plus" class="drop-icon"></i>
                    <h3>Birlestirilecek Videolari Secin</h3>
                    <p>Sirayla birlestirilecek</p>
                  </div>

                  <div class="merge-list" id="mergeList"></div>

                  <div class="merge-actions" id="mergeActions" style="display: none;">
                    <button class="btn-primary btn-large" id="mergeVideosBtn">Videolari Birlestir</button>
                  </div>

                  <div class="video-queue" id="mergeQueue"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- SEO Tools Page -->
          <div class="page-content" id="seoPage">
            <div class="content-wrapper">
              <h2>SEO Araclari</h2>
              <p>Anahtar kelimelerden etiket, slug ve hashtag olusturun</p>

              <div class="seo-container">
                <div class="seo-input-section">
                  <h3>SEO Anahtar Kelimeleri Girin</h3>
                  <p class="seo-hint"><strong>(her satir ayri metin)</strong><br>ornek: dijital pazarlama<br>sosyal medya<br>icerik stratejisi</p>
                  <textarea id="seoInputText" class="seo-textarea" placeholder="Her satira bir anahtar kelime yazin..."></textarea>

                  <div class="seo-options">
                    <label>SLUG icin MAX karakter:</label>
                    <input type="number" id="seoMaxLen" value="150" class="seo-number-input">
                    <button class="btn-primary" id="seoConvertBtn">Donustur</button>
                  </div>
                </div>

                <div class="seo-results">
                  <div class="seo-result-item">
                    <div class="seo-result-header">
                      <h3>Blog Hashtag</h3>
                      <span class="seo-format">key, key, key</span>
                    </div>
                    <textarea id="seoJoinedResult" class="seo-result-textarea" readonly></textarea>
                    <button class="btn-secondary btn-sm" data-copy-target="seoJoinedResult">Kopyala</button>
                  </div>

                  <div class="seo-result-item">
                    <div class="seo-result-header">
                      <h3>SLUG (URL)</h3>
                      <span class="seo-format">key-key-key</span>
                    </div>
                    <textarea id="seoUrlResult" class="seo-result-textarea" readonly></textarea>
                    <button class="btn-secondary btn-sm" data-copy-target="seoUrlResult">Kopyala</button>
                  </div>

                  <div class="seo-result-item">
                    <div class="seo-result-header">
                      <h3>Sosyal Medya Hashtag</h3>
                      <span class="seo-format">#key #key #key</span>
                    </div>
                    <textarea id="seoHashtagResult" class="seo-result-textarea" readonly></textarea>
                    <button class="btn-secondary btn-sm" data-copy-target="seoHashtagResult">Kopyala</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Photo Resize Page -->
          <div class="page-content" id="resizePage">
            <div class="content-wrapper">
              <h2>Fotograf Boyutlandirici</h2>
              <p>Fotograflarinizi istediginiz boyuta getirin</p>

              <div class="resize-container">
                <!-- Ust Kontrol Paneli -->
                <div class="resize-controls">
                  <div class="resize-dimensions">
                    <div class="dimension-input">
                      <label>Genislik:</label>
                      <input type="number" id="resizeWidth" value="350" class="dimension-number">
                    </div>
                    <div class="dimension-input">
                      <label>Yukseklik:</label>
                      <input type="number" id="resizeHeight" value="390" class="dimension-number">
                    </div>
                    <button class="btn-secondary" id="saveDimensionBtn">Olcu Kaydet</button>
                  </div>
                  <div class="resize-actions">
                    <button class="btn-primary" id="downloadAllBtn" disabled>Hepsini Indir</button>
                    <button class="btn-danger" id="clearResizeBtn" disabled>Temizle</button>
                  </div>
                </div>

                <!-- Kaydedilmis Olculer (Rozetler) -->
                <div class="resize-badges" id="resizeBadges"></div>

                <!-- Surukle Birak Alani -->
                <div class="resize-drop-zone" id="resizeDropZone">
                  <i data-lucide="maximize" class="drop-icon"></i>
                  <h3>Foto&#287;raf S&uuml;r&uuml;kle &amp; B&#305;rak</h3>
                  <p>veya tiklayarak dosya secin</p>
                  <input type="file" id="resizeFileInput" accept="image/*" multiple hidden>
                </div>

                <!-- Onizleme Galerisi -->
                <div class="resize-gallery" id="resizeGallery"></div>
              </div>
            </div>
          </div>

          <!-- Archive Page -->
          <div class="page-content" id="archivePage">
            <div class="content-wrapper">
              <div class="archive-header">
                <div>
                  <h2>Donusturulmus Fotograflar</h2>
                  <p>Gecmiste donusturdugunuz fotograflar</p>
                </div>
                <div class="archive-actions" id="archiveActions" style="display: none;">
                  <span class="selected-count" id="selectedCount">0 secili</span>
                  <button class="btn-danger" id="deleteSelectedBtn">Secilenleri Sil</button>
                  <button class="btn-secondary" id="cancelSelectionBtn">Iptal</button>
                </div>
              </div>

              <div class="archive-list" id="archiveList">
                <p class="empty-message">Henuz donusturulmus fotograf yok</p>
              </div>
            </div>
          </div>

          <!-- Photo Crop Page -->
          <div class="page-content" id="cropPage">
            <div class="content-wrapper">
              <h2>Fotograf Kirpma Editoru</h2>
              <p>Fotograflarinizi profesyonel sablonlarla kirpin ve duzenleyin</p>

              <div class="crop-container">
                <!-- Template Selection -->
                <div class="crop-templates">
                  <h3>Hazir Sablonlar</h3>
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
                      <small>1080x1080</small>
                    </button>
                    <button class="template-btn" data-ratio="4:5" data-width="1080" data-height="1350">
                      <div class="template-icon">
                        <div class="template-preview" style="aspect-ratio: 4/5; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);"></div>
                      </div>
                      <span>Instagram Portrait</span>
                      <small>1080x1350</small>
                    </button>
                    <button class="template-btn" data-ratio="9:16" data-width="1080" data-height="1920">
                      <div class="template-icon">
                        <div class="template-preview" style="aspect-ratio: 9/16; background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);"></div>
                      </div>
                      <span>Instagram Story</span>
                      <small>1080x1920</small>
                    </button>
                    <button class="template-btn" data-ratio="16:9" data-width="1920" data-height="1080">
                      <div class="template-icon">
                        <div class="template-preview" style="aspect-ratio: 16/9; background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);"></div>
                      </div>
                      <span>YouTube Thumbnail</span>
                      <small>1920x1080</small>
                    </button>
                    <button class="template-btn" data-ratio="1.91:1" data-width="1200" data-height="628">
                      <div class="template-icon">
                        <div class="template-preview" style="aspect-ratio: 1.91/1; background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);"></div>
                      </div>
                      <span>Facebook Post</span>
                      <small>1200x628</small>
                    </button>
                    <button class="template-btn" data-ratio="16:9" data-width="1200" data-height="675">
                      <div class="template-icon">
                        <div class="template-preview" style="aspect-ratio: 16/9; background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);"></div>
                      </div>
                      <span>Facebook Cover</span>
                      <small>1200x675</small>
                    </button>
                    <button class="template-btn" data-ratio="2:1" data-width="1500" data-height="500">
                      <div class="template-icon">
                        <div class="template-preview" style="aspect-ratio: 2/1; background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);"></div>
                      </div>
                      <span>Twitter Header</span>
                      <small>1500x500</small>
                    </button>
                  </div>
                </div>

                <!-- Editor Area -->
                <div class="crop-editor">
                  <div class="crop-upload-area" id="cropUploadArea">
                    <i data-lucide="crop" class="crop-upload-icon"></i>
                    <h3>Fotograf Yukle</h3>
                    <p>Kirpmak istediginiz fotografi surukleyin veya tiklayin</p>
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
                        <span id="cropDimensions">0 x 0</span>
                        <span id="cropRatio">Serbest</span>
                      </div>
                      <div class="crop-actions">
                        <button class="btn-secondary" id="cropResetBtn">Sifirla</button>
                        <button class="btn-secondary" id="cropRotateBtn">90 deg Dondur</button>
                        <button class="btn-primary" id="cropSaveBtn">Kirp ve Indir</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="page-content" id="hexFinderPage">
            <div class="content-wrapper">
              <h2>Hex Finder</h2>
              <p>Gorseli yukle, piksel sec, rengi yakala ve uyumlu palette ile kontrast skorunu aninda gor.</p>

              <div class="hex-finder-layout">
                <section class="hex-panel hex-control-panel">
                  <div class="hex-drop-zone" id="hexDropZone">
                    <i data-lucide="pipette" class="drop-icon"></i>
                    <h3>Fotograf Surukle &amp; Birak</h3>
                    <p>veya dosya secerek renk analizi baslat</p>
                    <button class="btn-primary" id="hexOpenBtn" type="button">Gorsel Sec</button>
                    <input type="file" id="hexFileInput" accept="image/*" hidden>
                  </div>

                  <div class="hex-info-card">
                    <div class="hex-swatch" id="hexSwatch"></div>
                    <div class="hex-code-list">
                      <div class="hex-code-item">
                        <span>HEX</span>
                        <strong id="hexCodeValue">-</strong>
                        <button class="btn-secondary btn-sm" type="button" data-copy-color="" id="hexCopyBtn">Copy</button>
                      </div>
                      <div class="hex-code-item">
                        <span>RGB</span>
                        <strong id="rgbCodeValue">-</strong>
                      </div>
                      <div class="hex-code-item">
                        <span>HSL</span>
                        <strong id="hslCodeValue">-</strong>
                      </div>
                      <div class="hex-code-item">
                        <span>Pixel</span>
                        <strong id="hexPixelCoords">-</strong>
                      </div>
                    </div>
                  </div>

                  <div class="hex-info-card">
                    <div class="hex-info-header">
                      <h3>WCAG / Google Readability</h3>
                      <span id="hexGoogleScore">-</span>
                    </div>
                    <div class="hex-contrast-grid" id="hexContrastGrid"></div>
                  </div>

                  <div class="hex-info-card">
                    <div class="hex-info-header">
                      <h3>Uyumlu Renkler</h3>
                      <i data-lucide="palette"></i>
                    </div>
                    <div class="hex-palette-grid" id="hexPaletteGrid"></div>
                  </div>
                </section>

                <section class="hex-panel hex-preview-panel">
                  <div class="hex-preview-meta">
                    <div>
                      <h3>Canli Ornekleyici</h3>
                      <span id="hexImageName">Gorsel secilmedi</span>
                    </div>
                    <div class="hex-hover-chip">
                      <span id="hexHoverCoords">0, 0</span>
                      <strong id="hexHoverValue">#000000</strong>
                    </div>
                  </div>

                  <div class="hex-preview-placeholder" id="hexPlaceholder">
                    <i data-lucide="image"></i>
                    <p>Gorsel yuklendiginde burada pixel secimi yapabileceksin.</p>
                  </div>

                  <div class="hex-preview-stage" id="hexPreview" hidden>
                    <div class="hex-canvas-wrap">
                      <canvas id="hexCanvas"></canvas>
                      <div class="hex-selection-marker" id="hexSelectionMarker" hidden></div>
                      <div class="hex-zoom-lens" id="hexZoomLens">
                        <canvas id="hexZoomCanvas"></canvas>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>

          <!-- SSL & Domain Monitor Page -->
          <div class="page-content" id="monitorPage">
            <div class="content-wrapper">
              <h2>SSL & Domain Takip</h2>
              <p>Domain'lerinizin SSL sertifikalarini ve sure bilgilerini takip edin</p>

              <div class="monitor-container">
                <div class="monitor-add-section">
                  <h3>Yeni Domain Ekle</h3>
                  <div class="monitor-input-group">
                    <input type="text" id="domainInput" class="monitor-input" placeholder="example.com" />
                    <button class="btn-primary" id="addDomainBtn">Ekle ve Sorgula</button>
                  </div>
                  <button class="btn-secondary" id="refreshAllDomainsBtn" style="margin-top: 10px; width: 100%;">Tumunu Guncelle</button>
                </div>

                <div class="monitor-list">
                  <h3>Domain Listesi</h3>
                  <div class="monitor-table-wrapper">
                    <table class="monitor-table">
                      <thead>
                        <tr>
                          <th>Domain</th>
                          <th>SSL Baslangic</th>
                          <th>SSL Bitis</th>
                          <th>SSL Kalan</th>
                          <th>SSL Durum</th>
                          <th>Domain Durum</th>
                          <th>Domain Baslangic</th>
                          <th>Domain Bitis</th>
                          <th>Domain Kalan</th>
                          <th>Yayinci</th>
                          <th>Islem</th>
                        </tr>
                      </thead>
                      <tbody id="domainTableBody">
                        <tr>
                          <td colspan="11" class="empty-message">Henuz domain eklenmedi.</td>
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
              <h2>Veritabani Takibi</h2>
              <p>Uygulama veritabani istatistikleri ve yonetimi</p>

              <div class="database-container">
                <div class="db-stats-grid">
                  <div class="db-stat-card">
                    <div class="db-stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                      <i data-lucide="image"></i>
                    </div>
                    <div class="db-stat-info">
                      <h3 id="dbImageCount">0</h3>
                      <p>Donusturulmus Fotograf</p>
                    </div>
                  </div>

                  <div class="db-stat-card">
                    <div class="db-stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                      <i data-lucide="video"></i>
                    </div>
                    <div class="db-stat-info">
                      <h3 id="dbVideoCount">0</h3>
                      <p>Optimize Edilmis Video</p>
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
                      <p>Veritabani Boyutu</p>
                    </div>
                  </div>
                </div>

                <div class="db-tables">
                  <h3>Tablo Detaylari</h3>
                  <div class="db-table-list">
                    <div class="db-table-item">
                      <div class="db-table-header">
                        <i data-lucide="table"></i>
                        <span>converted_images</span>
                      </div>
                      <div class="db-table-stats">
                        <span id="tableImageCount">0 kayit</span>
                      </div>
                    </div>

                    <div class="db-table-item">
                      <div class="db-table-header">
                        <i data-lucide="table"></i>
                        <span>converted_videos</span>
                      </div>
                      <div class="db-table-stats">
                        <span id="tableVideoCount">0 kayit</span>
                      </div>
                    </div>

                    <div class="db-table-item">
                      <div class="db-table-header">
                        <i data-lucide="table"></i>
                        <span>domains</span>
                      </div>
                      <div class="db-table-stats">
                        <span id="tableDomainCount">0 kayit</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="db-actions">
                  <button class="btn-secondary" id="refreshDbStatsBtn">
                    <i data-lucide="refresh-cw"></i>
                    <span>Istatistikleri Yenile</span>
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
      loadDomains,
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
    setupHexFinderPage();
    setupMonitorPage();
    setupArchivePage();
    setupDatabasePage();

    // Setup file drop handling
    await setupFileDrop(handleFilePaths, async (paths: string[]) => {
      const activePage = document.querySelector<HTMLElement>(".page-content.active");
      if (activePage.id === "videoPage") {
        const activeTab = document.querySelector<HTMLElement>(".tab-content.active");
        if (activeTab.id === "optimizeTab") {
          addVideosToSelection(paths);
        } else if (activeTab.id === "mergeTab") {
          addVideosToMerge(paths);
        }
      }
    }, handleHexFinderPaths);
  }
});

function setupUpdateChecker() {
  const updateStatusBtn = document.getElementById("updateStatusBtn");
  const updateText = updateStatusBtn.querySelector(".update-text");
  const updateIcon = updateStatusBtn.querySelector("i");

  async function checkUpdateStatus() {
    try {
      const { checkUpdateStatus: getUpdateStatus } = await import("./updater");
      const status = await getUpdateStatus();

      if (status.available && updateStatusBtn && updateText && updateIcon) {
        updateStatusBtn.classList.add("update-available");
        updateText.textContent = "Guncelleme mevcut";
        updateIcon.setAttribute("data-lucide", "download");
        initIcons();
      } else if (updateStatusBtn && updateText && updateIcon) {
        updateStatusBtn.classList.remove("update-available");
        updateText.textContent = "Uygulama guncel";
        updateIcon.setAttribute("data-lucide", "check-circle");
        initIcons();
      }
    } catch (error) {
      console.error("Guncelleme kontrolu hatasi:", error);
    }
  }

  // Ilk kontrol
  checkUpdateStatus();

  // Her 30 dakikada bir kontrol et
  setInterval(checkUpdateStatus, 30 * 60 * 1000);

  updateStatusBtn.addEventListener("click", async () => {
    const { checkForUpdates } = await import("./updater");
    await checkForUpdates(true);
    // Guncelleme kontrolunden sonra durumu yenile
    await checkUpdateStatus();
  });
}
