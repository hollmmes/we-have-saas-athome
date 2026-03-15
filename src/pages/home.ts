import { initIcons } from '../utils/icons';

export async function checkOutputFolder(): Promise<boolean> {
  const savedPath = localStorage.getItem('outputPath');
  const folderPath = document.getElementById('folderPath');
  const folderStructure = document.getElementById('folderStructure');
  const setupCard = document.getElementById('setupCard');
  
  if (savedPath && folderPath) {
    folderPath.textContent = savedPath;
    folderStructure!.style.display = 'block';
    setupCard?.classList.add('setup-complete');
    return true;
  }
  return false;
}

export function setupHomePage() {
  const selectFolderBtn = document.getElementById('selectFolderBtn');
  const folderPath = document.getElementById('folderPath');
  const folderStructure = document.getElementById('folderStructure');
  const setupCard = document.getElementById('setupCard');

  selectFolderBtn?.addEventListener('click', async () => {
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
      setupCard?.classList.add('setup-complete');
      
      // Create subfolders
      try {
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
        initIcons();
      } catch (error) {
        console.error('Folder creation error:', error);
      }
    }
  });

  // Check folder on load
  checkOutputFolder();
}
