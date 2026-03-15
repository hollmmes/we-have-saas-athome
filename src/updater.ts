import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export async function checkForUpdates(forcePrompt: boolean = false) {
  try {
    console.log('Güncelleme kontrolü başlıyor...');
    const update = await check();
    
    console.log('Update response:', update);
    
    if (update?.available) {
      console.log(`Update available: ${update.version}`);
      
      const shouldUpdate = confirm(
        `Yeni versiyon mevcut: ${update.version}\n\nŞimdi güncellemek ister misiniz?`
      );
      
      if (shouldUpdate) {
        console.log('Güncelleme indiriliyor...');
        
        await update.downloadAndInstall((progress) => {
          if (progress.event === 'Started') {
            console.log('İndirme başladı...');
          } else if (progress.event === 'Progress') {
            console.log(`İndirme: ${progress.data.chunkLength} bytes`);
          } else if (progress.event === 'Finished') {
            console.log('İndirme tamamlandı!');
          }
        });
        
        await relaunch();
      }
    } else if (forcePrompt) {
      alert('Uygulama güncel. Yeni bir güncelleme bulunmuyor.');
    }
  } catch (error) {
    console.error('Güncelleme kontrolü hatası:', error);
    if (forcePrompt) {
      alert('Güncelleme kontrolü sırasında bir hata oluştu.');
    }
  }
}

export async function checkUpdateStatus(): Promise<{ available: boolean; version?: string }> {
  try {
    const update = await check();
    return {
      available: update?.available || false,
      version: update?.version
    };
  } catch (error) {
    console.error('Güncelleme durumu kontrolü hatası:', error);
    return { available: false };
  }
}
