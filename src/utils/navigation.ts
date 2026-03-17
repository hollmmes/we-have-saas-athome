import { initIcons } from './icons';

export async function checkOutputFolder(): Promise<boolean> {
  const savedPath = localStorage.getItem('outputPath');
  return !!savedPath;
}

export function setupNavigation(
  loadArchive: () => Promise<void>,
  loadConvertedResults: () => Promise<void>,
  loadDatabaseStats: () => Promise<void>,
  loadDomains: () => Promise<void>
) {
  const navItems = document.querySelectorAll('.nav-item');
  const pages = document.querySelectorAll('.page-content');
  const sidebar = document.getElementById('sidebar')!;

  navItems.forEach(item => {
    item.addEventListener('click', async (e) => {
      e.preventDefault();
      const pageName = (item as HTMLElement).dataset.page;

      // Check if output folder is required for this page
      const allowedPages = ['home', 'archive', 'settings', 'monitor', 'hexFinder'];

      if (!allowedPages.includes(pageName || '')) {
        const hasFolder = await checkOutputFolder();
        if (!hasFolder) {
          alert('Lutfen once anasayfadan cikti klasorunu ayarlayin!');

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

        // Refresh page-specific data
        if (pageName === 'archive') {
          await loadArchive();
        } else if (pageName === 'converter') {
          await loadConvertedResults();
        } else if (pageName === 'settings') {
          await loadDatabaseStats();
        } else if (pageName === 'monitor') {
          await loadDomains();
        }
      }

      // Reinitialize icons
      initIcons();

      // Close sidebar on mobile
      if (window.innerWidth < 768) {
        sidebar.classList.remove('open');
      }
    });
  });
}

export function setupSidebarToggle() {
  const menuToggle = document.getElementById("menuToggle")!;
  const sidebar = document.getElementById("sidebar")!;
  const pinToggle = document.getElementById("sidebarPinToggle")!;
  const desktopMedia = window.matchMedia("(min-width: 769px)");

  const applyPinnedState = () => {
    const isPinned = localStorage.getItem("sidebarPinned") === "true";
    sidebar.classList.toggle("pinned", isPinned);
    pinToggle.setAttribute("data-pinned", String(isPinned));

    const icon = pinToggle.querySelector("i");
    if (icon) {
      icon.setAttribute("data-lucide", isPinned ? "panel-left-close" : "panel-left-open");
      initIcons();
    }
  };

  applyPinnedState();

  menuToggle.addEventListener("click", () => {
    if (desktopMedia.matches) {
      const nextPinned = !(localStorage.getItem("sidebarPinned") === "true");
      localStorage.setItem("sidebarPinned", String(nextPinned));
      applyPinnedState();
      return;
    }

    sidebar.classList.toggle("open");
  });

  pinToggle.addEventListener("click", () => {
    const nextPinned = !(localStorage.getItem("sidebarPinned") === "true");
    localStorage.setItem("sidebarPinned", String(nextPinned));
    applyPinnedState();
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
}
