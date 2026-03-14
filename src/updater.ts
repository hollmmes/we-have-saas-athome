import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export async function checkForUpdates() {
  try {
    const update = await check();
    
    if (update?.available) {
      console.log(`Update available: ${update.version}`);
      
      // Kullanıcıya güncelleme var mı diye sor
      const shouldUpdate = confirm(
        `Yeni versiyon mevcut: ${update.version}\n\nŞimdi güncellemek ister misiniz?`
      );
      
      if (shouldUpdate) {
        console.log('Güncelleme indiriliyor...');
        
        // Güncellemeyi indir ve kur
        await update.downloadAndInstall((progress) => {
          console.log(`İndirme: ${progress.downloaded} / ${progress.total}`);
        });
        
        // Uygulamayı yeniden başlat
        await relaunch();
      }
    } else {
      console.log('Uygulama güncel');
    }
  } catch (error) {
    console.error('Güncelleme kontrolü hatası:', error);
  }
}
