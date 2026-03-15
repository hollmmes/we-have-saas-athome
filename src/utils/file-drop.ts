export async function setupFileDrop(
  handleImagePaths: (paths: string[]) => Promise<void>,
  handleVideoPaths: (paths: string[]) => Promise<void>
) {
  const { listen } = await import('@tauri-apps/api/event');
  
  const dropZone = document.getElementById('dropZone');
  const videoDropZone = document.getElementById('videoDropZone');
  const mergeDropZone = document.getElementById('mergeDropZone');
  
  await listen('tauri://drag-over', () => {
    const activePage = document.querySelector('.page-content.active');
    const activePageId = activePage?.id;
    
    if (activePageId === 'converterPage') {
      dropZone?.classList.add('drag-over');
    } else if (activePageId === 'videoPage') {
      const activeTab = document.querySelector('.tab-content.active');
      if (activeTab?.id === 'optimizeTab') {
        videoDropZone?.classList.add('drag-over');
      } else if (activeTab?.id === 'mergeTab') {
        mergeDropZone?.classList.add('drag-over');
      }
    }
  });

  await listen('tauri://drag-drop', async (event: any) => {
    dropZone?.classList.remove('drag-over');
    videoDropZone?.classList.remove('drag-over');
    mergeDropZone?.classList.remove('drag-over');
    
    const paths = event.payload.paths as string[];
    if (paths && paths.length > 0) {
      const activePage = document.querySelector('.page-content.active');
      const activePageId = activePage?.id;
      
      if (activePageId === 'converterPage') {
        await handleImagePaths(paths);
      } else if (activePageId === 'videoPage') {
        await handleVideoPaths(paths);
      }
    }
  });

  await listen('tauri://drag-leave', () => {
    dropZone?.classList.remove('drag-over');
    videoDropZone?.classList.remove('drag-over');
    mergeDropZone?.classList.remove('drag-over');
  });
}
