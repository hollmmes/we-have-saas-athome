export async function setupFileDrop(
  handleImagePaths: (paths: string[]) => Promise<void>,
  handleVideoPaths: (paths: string[]) => Promise<void>,
  handleHexPaths: (paths: string[]) => Promise<void>
) {
  const { listen } = await import('@tauri-apps/api/event');

  const dropZone = document.getElementById('dropZone')!;
  const videoDropZone = document.getElementById('videoDropZone')!;
  const mergeDropZone = document.getElementById('mergeDropZone')!;
  const hexDropZone = document.getElementById('hexDropZone')!;

  await listen('tauri://drag-over', () => {
    const activePage = document.querySelector<HTMLElement>('.page-content.active');
    const activePageId = activePage?.id;

    if (activePageId === 'converterPage') {
      dropZone.classList.add('drag-over');
    } else if (activePageId === 'videoPage') {
      const activeTab = document.querySelector<HTMLElement>('.tab-content.active');
      if (activeTab?.id === 'optimizeTab') {
        videoDropZone.classList.add('drag-over');
      } else if (activeTab?.id === 'mergeTab') {
        mergeDropZone.classList.add('drag-over');
      }
    } else if (activePageId === 'hexFinderPage') {
      hexDropZone.classList.add('drag-over');
    }
  });

  await listen('tauri://drag-drop', async (event: any) => {
    dropZone.classList.remove('drag-over');
    videoDropZone.classList.remove('drag-over');
    mergeDropZone.classList.remove('drag-over');
    hexDropZone.classList.remove('drag-over');

    const paths = event.payload.paths as string[];
    if (paths && paths.length > 0) {
      const activePage = document.querySelector<HTMLElement>('.page-content.active');
      const activePageId = activePage?.id;

      if (activePageId === 'converterPage') {
        await handleImagePaths(paths);
      } else if (activePageId === 'videoPage') {
        await handleVideoPaths(paths);
      } else if (activePageId === 'hexFinderPage' && handleHexPaths) {
        await handleHexPaths(paths);
      }
    }
  });

  await listen('tauri://drag-leave', () => {
    dropZone.classList.remove('drag-over');
    videoDropZone.classList.remove('drag-over');
    mergeDropZone.classList.remove('drag-over');
    hexDropZone.classList.remove('drag-over');
  });
}
