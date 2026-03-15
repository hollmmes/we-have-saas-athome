import { getImages, getVideos, getDomains } from '../database';
import { initIcons } from '../utils/icons';

export async function loadDatabaseStats() {
  try {
    const images = await getImages();
    const videos = await getVideos();
    const domains = await getDomains();
    
    document.getElementById('dbImageCount')!.textContent = images.length.toString();
    document.getElementById('dbVideoCount')!.textContent = videos.length.toString();
    document.getElementById('dbDomainCount')!.textContent = domains.length.toString();
    
    document.getElementById('tableImageCount')!.textContent = `${images.length} kayıt`;
    document.getElementById('tableVideoCount')!.textContent = `${videos.length} kayıt`;
    document.getElementById('tableDomainCount')!.textContent = `${domains.length} kayıt`;
    
    // Calculate database size
    const { invoke } = await import('@tauri-apps/api/core');
    try {
      const appDataDir = await invoke('get_default_output_path') as string;
      const dbPath = appDataDir.replace('converted_images', 'images.db');
      
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
        const estimatedSize = (images.length * 0.5) + (videos.length * 0.5) + (domains.length * 0.3);
        document.getElementById('dbSize')!.textContent = `~${estimatedSize.toFixed(1)} KB`;
      }
    } catch (error) {
      console.error('Database size calculation error:', error);
      document.getElementById('dbSize')!.textContent = 'Bilinmiyor';
    }
    
    initIcons();
  } catch (error) {
    console.error('Database stats error:', error);
  }
}

export function setupDatabasePage() {
  const refreshDbStatsBtn = document.getElementById('refreshDbStatsBtn');
  refreshDbStatsBtn?.addEventListener('click', async () => {
    await loadDatabaseStats();
    alert('İstatistikler güncellendi!');
  });
}
