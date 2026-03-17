import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export async function checkForUpdates(forcePrompt: boolean = false) {
  try {
    console.log('Guncelleme kontrolu basliyor...');
    const update = await check();

    console.log('Update response:', update);

    if (update.available) {
      console.log(`Update available: ${update.version}`);

      const shouldUpdate = confirm(
        `Yeni versiyon mevcut: ${update.version}\n\nSimdi guncellemek ister misiniz?`
      );

      if (shouldUpdate) {
        console.log('Guncelleme indiriliyor...');

        await update.downloadAndInstall((progress) => {
          if (progress.event === 'Started') {
            console.log('Indirme basladi...');
          } else if (progress.event === 'Progress') {
            console.log(`Indirme: ${progress.data.chunkLength} bytes`);
          } else if (progress.event === 'Finished') {
            console.log('Indirme tamamlandi!');
          }
        });

        await relaunch();
      }
    } else if (forcePrompt) {
      alert('Uygulama guncel. Yeni bir guncelleme bulunmuyor.');
    }
  } catch (error) {
    console.error('Guncelleme kontrolu hatasi:', error);
    if (forcePrompt) {
      alert('Guncelleme kontrolu sirasinda bir hata olustu.');
    }
  }
}

export async function checkUpdateStatus(): Promise<{ available: boolean; version: string }> {
  try {
    const update = await check();
    return {
      available: update.available || false,
      version: update.version || ''
    };
  } catch (error) {
    console.error('Guncelleme durumu kontrolu hatasi:', error);
    return { available: false, version: '' };
  }
}
