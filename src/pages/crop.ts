import { initIcons } from '../utils/icons';

let cropImage: HTMLImageElement | null = null;
let cropCtx: CanvasRenderingContext2D | null = null;
let cropState = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  aspectRatio: 0,
  targetWidth: 0,
  targetHeight: 0,
  rotation: 0,
  isDragging: false,
  isResizing: false,
  resizeHandle: '',
  startX: 0,
  startY: 0,
  startCropX: 0,
  startCropY: 0,
  startCropWidth: 0,
  startCropHeight: 0
};

export function setupCropPage() {
  const cropFileInput = document.getElementById('cropFileInput') as HTMLInputElement;
  const cropUploadArea = document.getElementById('cropUploadArea');
  const cropResetBtn = document.getElementById('cropResetBtn');
  const cropRotateBtn = document.getElementById('cropRotateBtn');
  const cropSaveBtn = document.getElementById('cropSaveBtn');
  const templateBtns = document.querySelectorAll('.template-btn');
  const cropBox = document.getElementById('cropBox');

  // Template selection
  templateBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      templateBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const ratio = btn.getAttribute('data-ratio') || 'free';
      const width = parseInt(btn.getAttribute('data-width') || '0');
      const height = parseInt(btn.getAttribute('data-height') || '0');
      
      if (ratio === 'free') {
        cropState.aspectRatio = 0;
        cropState.targetWidth = 0;
        cropState.targetHeight = 0;
      } else {
        cropState.aspectRatio = width / height;
        cropState.targetWidth = width;
        cropState.targetHeight = height;
      }
      
      if (cropImage) {
        resetCropBox();
      }
    });
  });

  // File upload
  cropUploadArea?.addEventListener('click', () => {
    cropFileInput?.click();
  });

  cropFileInput?.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) loadCropImage(file);
  });

  // Drag & drop
  cropUploadArea?.addEventListener('dragover', (e) => {
    e.preventDefault();
    cropUploadArea.classList.add('drag-over');
  });

  cropUploadArea?.addEventListener('dragleave', () => {
    cropUploadArea.classList.remove('drag-over');
  });

  cropUploadArea?.addEventListener('drop', (e) => {
    e.preventDefault();
    cropUploadArea.classList.remove('drag-over');
    const file = e.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) {
      loadCropImage(file);
    }
  });

  // Crop box dragging and resizing
  cropBox?.addEventListener('mousedown', (e) => {
    const target = e.target as HTMLElement;
    
    if (target.classList.contains('crop-handle')) {
      cropState.isResizing = true;
      cropState.resizeHandle = target.className.split(' ')[1];
    } else if (target === cropBox) {
      cropState.isDragging = true;
    }
    
    cropState.startX = e.clientX;
    cropState.startY = e.clientY;
    cropState.startCropX = cropState.x;
    cropState.startCropY = cropState.y;
    cropState.startCropWidth = cropState.width;
    cropState.startCropHeight = cropState.height;
    
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!cropState.isDragging && !cropState.isResizing) return;
    
    const cropCanvas = document.getElementById('cropCanvas') as HTMLCanvasElement;
    const cropOverlay = document.getElementById('cropOverlay');
    if (!cropCanvas || !cropOverlay) return;
    
    const canvasRect = cropCanvas.getBoundingClientRect();
    const overlayRect = cropOverlay.getBoundingClientRect();
    
    const offsetX = canvasRect.left - overlayRect.left;
    const offsetY = canvasRect.top - overlayRect.top;
    
    const dx = e.clientX - cropState.startX;
    const dy = e.clientY - cropState.startY;
    
    if (cropState.isDragging) {
      const minX = offsetX;
      const minY = offsetY;
      const maxX = offsetX + canvasRect.width - cropState.width;
      const maxY = offsetY + canvasRect.height - cropState.height;
      
      cropState.x = Math.max(minX, Math.min(maxX, cropState.startCropX + dx));
      cropState.y = Math.max(minY, Math.min(maxY, cropState.startCropY + dy));
      updateCropBox();
    } else if (cropState.isResizing) {
      handleResize(dx, dy, canvasRect, offsetX, offsetY);
    }
  });

  document.addEventListener('mouseup', () => {
    cropState.isDragging = false;
    cropState.isResizing = false;
  });

  // Reset button
  cropResetBtn?.addEventListener('click', () => {
    resetCropBox();
  });

  // Rotate button
  cropRotateBtn?.addEventListener('click', () => {
    cropState.rotation = (cropState.rotation + 90) % 360;
    drawCropCanvas();
  });

  // Save button
  cropSaveBtn?.addEventListener('click', saveCroppedImage);
}

function loadCropImage(file: File) {
  const cropUploadArea = document.getElementById('cropUploadArea');
  const cropCanvasWrapper = document.getElementById('cropCanvasWrapper');
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new window.Image();
    img.onload = () => {
      cropImage = img;
      cropState.rotation = 0;
      initCropCanvas();
      cropUploadArea!.style.display = 'none';
      cropCanvasWrapper!.style.display = 'block';
      initIcons();
    };
    img.src = e.target?.result as string;
  };
  reader.readAsDataURL(file);
}

function initCropCanvas() {
  const cropCanvas = document.getElementById('cropCanvas') as HTMLCanvasElement;
  if (!cropImage || !cropCanvas) return;
  
  const container = cropCanvas.parentElement!;
  
  // Wait for container to have proper dimensions
  setTimeout(() => {
    const containerRect = container.getBoundingClientRect();
    const maxWidth = containerRect.width || 800;
    const maxHeight = containerRect.height || 600;
    
    // Calculate scale to fit image in container
    let scale = Math.min(maxWidth / cropImage!.width, maxHeight / cropImage!.height, 1);
    
    // Ensure minimum size
    if (scale < 0.1) scale = 0.5;
    
    cropCanvas.width = cropImage!.width * scale;
    cropCanvas.height = cropImage!.height * scale;
    
    cropCtx = cropCanvas.getContext('2d');
    drawCropCanvas();
    
    // Wait a bit more for canvas to render
    setTimeout(() => {
      resetCropBox();
    }, 50);
  }, 100);
}

function drawCropCanvas() {
  const cropCanvas = document.getElementById('cropCanvas') as HTMLCanvasElement;
  if (!cropCtx || !cropImage || !cropCanvas) return;
  
  cropCtx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
  
  if (cropState.rotation === 0) {
    cropCtx.drawImage(cropImage, 0, 0, cropCanvas.width, cropCanvas.height);
  } else {
    const centerX = cropCanvas.width / 2;
    const centerY = cropCanvas.height / 2;
    
    cropCtx.save();
    cropCtx.translate(centerX, centerY);
    cropCtx.rotate((cropState.rotation * Math.PI) / 180);
    cropCtx.drawImage(cropImage, -cropCanvas.width / 2, -cropCanvas.height / 2, cropCanvas.width, cropCanvas.height);
    cropCtx.restore();
  }
}

function resetCropBox() {
  const cropCanvas = document.getElementById('cropCanvas') as HTMLCanvasElement;
  const cropBox = document.getElementById('cropBox');
  const cropOverlay = document.getElementById('cropOverlay');
  if (!cropCanvas || !cropBox || !cropOverlay) return;
  
  // Get canvas position relative to overlay
  const canvasRect = cropCanvas.getBoundingClientRect();
  const overlayRect = cropOverlay.getBoundingClientRect();
  
  // Calculate offset
  const offsetX = canvasRect.left - overlayRect.left;
  const offsetY = canvasRect.top - overlayRect.top;
  
  if (cropState.aspectRatio > 0) {
    const canvasAspect = canvasRect.width / canvasRect.height;
    
    if (cropState.aspectRatio > canvasAspect) {
      cropState.width = canvasRect.width * 0.8;
      cropState.height = cropState.width / cropState.aspectRatio;
    } else {
      cropState.height = canvasRect.height * 0.8;
      cropState.width = cropState.height * cropState.aspectRatio;
    }
  } else {
    cropState.width = canvasRect.width * 0.8;
    cropState.height = canvasRect.height * 0.8;
  }
  
  // Position relative to canvas
  cropState.x = offsetX + (canvasRect.width - cropState.width) / 2;
  cropState.y = offsetY + (canvasRect.height - cropState.height) / 2;
  
  updateCropBox();
}

function updateCropBox() {
  const cropCanvas = document.getElementById('cropCanvas') as HTMLCanvasElement;
  const cropBox = document.getElementById('cropBox');
  const cropDimensions = document.getElementById('cropDimensions');
  const cropRatio = document.getElementById('cropRatio');
  const cropOverlay = document.getElementById('cropOverlay');
  if (!cropBox) return;
  
  cropBox.style.left = cropState.x + 'px';
  cropBox.style.top = cropState.y + 'px';
  cropBox.style.width = cropState.width + 'px';
  cropBox.style.height = cropState.height + 'px';
  
  if (cropImage && cropCanvas && cropOverlay) {
    const canvasRect = cropCanvas.getBoundingClientRect();
    const overlayRect = cropOverlay.getBoundingClientRect();
    
    const offsetX = canvasRect.left - overlayRect.left;
    const offsetY = canvasRect.top - overlayRect.top;
    
    // Calculate crop area relative to canvas
    const cropX = cropState.x - offsetX;
    const cropY = cropState.y - offsetY;
    
    const scaleX = cropImage.width / cropCanvas.width;
    const scaleY = cropImage.height / cropCanvas.height;
    const actualWidth = Math.round(cropState.width * scaleX);
    const actualHeight = Math.round(cropState.height * scaleY);
    
    if (cropDimensions) {
      cropDimensions.textContent = `${actualWidth} × ${actualHeight}`;
    }
    
    if (cropRatio) {
      if (cropState.aspectRatio > 0) {
        const activeTemplate = document.querySelector('.template-btn.active');
        cropRatio.textContent = activeTemplate?.querySelector('span')?.textContent || 'Sabit Oran';
      } else {
        cropRatio.textContent = 'Serbest';
      }
    }
  }
}

function handleResize(dx: number, dy: number, canvasRect: DOMRect, offsetX: number, offsetY: number) {
  const handle = cropState.resizeHandle;
  let newX = cropState.startCropX;
  let newY = cropState.startCropY;
  let newWidth = cropState.startCropWidth;
  let newHeight = cropState.startCropHeight;
  
  if (handle.includes('e')) {
    newWidth = cropState.startCropWidth + dx;
  }
  if (handle.includes('w')) {
    newWidth = cropState.startCropWidth - dx;
    newX = cropState.startCropX + dx;
  }
  if (handle.includes('s')) {
    newHeight = cropState.startCropHeight + dy;
  }
  if (handle.includes('n')) {
    newHeight = cropState.startCropHeight - dy;
    newY = cropState.startCropY + dy;
  }
  
  // Apply aspect ratio constraint
  if (cropState.aspectRatio > 0) {
    if (handle.includes('e') || handle.includes('w')) {
      newHeight = newWidth / cropState.aspectRatio;
      if (handle.includes('n')) {
        newY = cropState.startCropY + cropState.startCropHeight - newHeight;
      }
    } else {
      newWidth = newHeight * cropState.aspectRatio;
      if (handle.includes('w')) {
        newX = cropState.startCropX + cropState.startCropWidth - newWidth;
      }
    }
  }
  
  // Bounds checking relative to canvas
  const minX = offsetX;
  const minY = offsetY;
  const maxX = offsetX + canvasRect.width;
  const maxY = offsetY + canvasRect.height;
  
  if (newWidth < 50) newWidth = 50;
  if (newHeight < 50) newHeight = 50;
  if (newX < minX) { newWidth += (newX - minX); newX = minX; }
  if (newY < minY) { newHeight += (newY - minY); newY = minY; }
  if (newX + newWidth > maxX) newWidth = maxX - newX;
  if (newY + newHeight > maxY) newHeight = maxY - newY;
  
  cropState.x = newX;
  cropState.y = newY;
  cropState.width = newWidth;
  cropState.height = newHeight;
  
  updateCropBox();
}

function saveCroppedImage() {
  const cropCanvas = document.getElementById('cropCanvas') as HTMLCanvasElement;
  const cropOverlay = document.getElementById('cropOverlay');
  if (!cropImage || !cropCanvas || !cropOverlay) return;
  
  const canvasRect = cropCanvas.getBoundingClientRect();
  const overlayRect = cropOverlay.getBoundingClientRect();
  
  const offsetX = canvasRect.left - overlayRect.left;
  const offsetY = canvasRect.top - overlayRect.top;
  
  // Calculate crop area relative to canvas
  const cropX = cropState.x - offsetX;
  const cropY = cropState.y - offsetY;
  
  const scaleX = cropImage.width / cropCanvas.width;
  const scaleY = cropImage.height / cropCanvas.height;
  
  const sourceX = cropX * scaleX;
  const sourceY = cropY * scaleY;
  const sourceWidth = cropState.width * scaleX;
  const sourceHeight = cropState.height * scaleY;
  
  const outputCanvas = document.createElement('canvas');
  const outputWidth = cropState.targetWidth || Math.round(sourceWidth);
  const outputHeight = cropState.targetHeight || Math.round(sourceHeight);
  
  outputCanvas.width = outputWidth;
  outputCanvas.height = outputHeight;
  
  const outputCtx = outputCanvas.getContext('2d')!;
  
  outputCtx.drawImage(
    cropImage,
    sourceX, sourceY, sourceWidth, sourceHeight,
    0, 0, outputWidth, outputHeight
  );
  
  const link = document.createElement('a');
  link.download = `cropped-${outputWidth}x${outputHeight}.jpg`;
  link.href = outputCanvas.toDataURL('image/jpeg', 0.95);
  link.click();
  
  alert('Fotoğraf başarıyla kırpıldı ve indirildi!');
}
