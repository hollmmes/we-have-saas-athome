import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export async function checkForUpdates() {
  try {
    console.log('Güncelleme kontrolü başlıyor...');
    const update = await check();
    
    console.log('Update response:', update);
    
    if (update?.available) {
      console.log(`Update available: ${update.version}`);
      
      // Kullanıcıya güncelleme var mı diye sor
      const shouldUpdate = confirm(
        `Yeni versiyon mevcut: ${update.version}\n\nŞimdi güncellemek ister misiniz?`
      );
      
      if (shouldUpdate) {
        alert('Güncelleme indiriliyor...');
        console.log('Güncelleme indiriliyor...');
        
        // Güncellemeyi indir ve kur
        await update.downloadAndInstall((progress) => {
          if (progress.event === 'Started') {
            console.log('İndirme başladı...');
          } else if (progress.event === 'Progress') {
            console.log(`İndirme: ${progress.data.chunkLength} bytes`);
          } else if (progress.event === 'Finished') {
            console.log('İndirme tamamlandı!');
          }
        });
        
        // Uygulamayı yeniden başlat
        await relaunch();
      }
    } else {
      alert('Uygulama güncel! Mevcut versiyon: 0.1.0');
      console.log('Uygulama güncel');
    }
  } catch (error) {
    console.error('Güncelleme kontrolü hatası:', error);
    alert('Güncelleme kontrolü hatası: ' + error);
  }
}
