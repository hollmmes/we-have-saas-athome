import { createIcons, LayoutDashboard, Users, Settings, TrendingUp, MessageSquare, Menu, Info, Download } from 'lucide';
import { checkForUpdates } from './updater';

window.addEventListener("DOMContentLoaded", () => {
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
        </header>

        <!-- Sidebar -->
        <aside class="sidebar" id="sidebar">
          <div class="sidebar-header">
            <h2>Admin Panel</h2>
          </div>
          <nav class="sidebar-nav">
            <a href="#" class="nav-item active">
              <i data-lucide="layout-dashboard" class="nav-icon"></i>
              <span class="nav-text">Dashboard</span>
            </a>
            <a href="#" class="nav-item">
              <i data-lucide="users" class="nav-icon"></i>
              <span class="nav-text">Users</span>
            </a>
            <a href="#" class="nav-item">
              <i data-lucide="settings" class="nav-icon"></i>
              <span class="nav-text">Settings</span>
            </a>
            <a href="#" class="nav-item">
              <i data-lucide="trending-up" class="nav-icon"></i>
              <span class="nav-text">Analytics</span>
            </a>
            <a href="#" class="nav-item">
              <i data-lucide="message-square" class="nav-icon"></i>
              <span class="nav-text">Messages</span>
            </a>
          </nav>
          <div class="sidebar-footer">
            <div class="version-info">
              <i data-lucide="info" class="version-icon"></i>
              <span class="version-text">v0.2.4</span>
            </div>
            <button class="check-update-btn" id="checkUpdateBtn">
              <i data-lucide="download" class="update-icon"></i>
              <span>Güncelleme Kontrol</span>
            </button>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
          <div class="content-wrapper">
            <h2>Hoş Geldiniz! 🎉</h2>
            <p>Admin panelinize hoş geldiniz. Tüm işlemlerinizi buradan kolayca yönetebilirsiniz.</p>
          </div>
        </main>
      </div>
    `;

    // Initialize Lucide icons
    createIcons({
      icons: {
        LayoutDashboard,
        Users,
        Settings,
        TrendingUp,
        MessageSquare,
        Menu,
        Info,
        Download
      },
      attrs: {
        width: '20',
        height: '20',
        'stroke-width': '2'
      }
    });

    // Manuel güncelleme kontrolü butonu
    const checkUpdateBtn = document.getElementById("checkUpdateBtn");
    checkUpdateBtn?.addEventListener("click", () => {
      checkForUpdates();
    });

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

    // Uygulama başladığında güncelleme kontrolü yap
    checkForUpdates();
  }
});
