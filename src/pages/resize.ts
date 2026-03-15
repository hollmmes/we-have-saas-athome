let resizeW = 350;
let resizeH = 390;
let resizeBadges = [
  { w: 350, h: 390 },
  { w: 1200, h: 1200 },
  { w: 480, h: 600 }
];
let originalResizeImages: Array<{ img: HTMLImageElement; name: string }> = [];

export function setupResizePage() {
  const resizeWidthInput = document.getElementById('resizeWidth') as HTMLInputElement;
  const resizeHeightInput = document.getElementById('resizeHeight') as HTMLInputElement;
  const resizeDropZone = document.getElementById('resizeDropZone');
  const resizeFileInput = document.getElementById('resizeFileInput') as HTMLInputElement;

  resizeWidthInput?.addEventListener('input', refreshResizeGallery);
  resizeHeightInput?.addEventListener('input', refreshResizeGallery);

  // File input
  resizeFileInput?.addEventListener('change', (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (files) handleResizeFiles(files);
  });

  // Drop zone click
  resizeDropZone?.addEventListener('click', () => {
    resizeFileInput?.click();
  });

  // Drag & drop
  resizeDropZone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    resizeDropZone.classList.add('drag-over');
  });

  resizeDropZone?.addEventListener('dragleave', () => {
    resizeDropZone.classList.remove('drag-over');
  });

  resizeDropZone?.addEventListener('drop', (e) => {
    e.preventDefault();
    resizeDropZone.classList.remove('drag-over');
    const files = e.dataTransfer?.files;
    if (files) handleResizeFiles(files);
  });

  // Save dimension button
  document.getElementById('saveDimensionBtn')?.addEventListener('click', () => {
    const w = parseInt(resizeWidthInput?.value || '350');
    const h = parseInt(resizeHeightInput?.value || '390');
    resizeBadges.push({ w, h });
    renderResizeBadges();
  });

  // Clear button
  document.getElementById('clearResizeBtn')?.addEventListener('click', () => {
    const resizeGallery = document.getElementById('resizeGallery');
    if (resizeGallery) resizeGallery.innerHTML = '';
    originalResizeImages = [];
    
    const downloadAllBtn = document.getElementById('downloadAllBtn') as HTMLButtonElement;
    const clearBtn = document.getElementById('clearResizeBtn') as HTMLButtonElement;
    if (downloadAllBtn) downloadAllBtn.disabled = true;
    if (clearBtn) clearBtn.disabled = true;
  });

  // Download all button
  document.getElementById('downloadAllBtn')?.addEventListener('click', () => {
    const resizeGallery = document.getElementById('resizeGallery');
    const canvases = resizeGallery?.querySelectorAll('canvas');
    canvases?.forEach((canvas, i) => {
      const a = document.createElement('a');
      a.download = `${resizeW}x${resizeH}-${originalResizeImages[i].name}.jpg`;
      a.href = canvas.toDataURL('image/jpeg', 0.92);
      a.click();
    });
  });

  // Initialize badges
  renderResizeBadges();
}

function refreshResizeGallery() {
  const resizeWidthInput = document.getElementById('resizeWidth') as HTMLInputElement;
  const resizeHeightInput = document.getElementById('resizeHeight') as HTMLInputElement;
  const resizeGallery = document.getElementById('resizeGallery');
  
  resizeW = parseInt(resizeWidthInput?.value || '350');
  resizeH = parseInt(resizeHeightInput?.value || '390');
  
  if (resizeGallery) {
    resizeGallery.innerHTML = '';
    originalResizeImages.forEach(item => renderResizeCanvas(item.img, item.name));
  }
  renderResizeBadges();
}

function handleResizeFiles(files: FileList) {
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => {
        originalResizeImages.push({ img, name: file.name });
        renderResizeCanvas(img, file.name);
        
        const downloadAllBtn = document.getElementById('downloadAllBtn') as HTMLButtonElement;
        const clearBtn = document.getElementById('clearResizeBtn') as HTMLButtonElement;
        if (downloadAllBtn) downloadAllBtn.disabled = false;
        if (clearBtn) clearBtn.disabled = false;
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function renderResizeCanvas(img: HTMLImageElement, name: string) {
  const resizeGallery = document.getElementById('resizeGallery');
  const canvas = document.createElement('canvas');
  canvas.width = resizeW;
  canvas.height = resizeH;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const scale = Math.max(resizeW / img.width, resizeH / img.height);
  const x = (resizeW / 2) - (img.width / 2) * scale;
  const y = (resizeH / 2) - (img.height / 2) * scale;

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, resizeW, resizeH);
  ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

  const wrap = document.createElement('div');
  wrap.className = 'resize-thumb';
  
  const fileName = document.createElement('div');
  fileName.className = 'resize-file-name';
  fileName.textContent = name;
  
  wrap.appendChild(fileName);
  wrap.appendChild(canvas);

  const btn = document.createElement('button');
  btn.className = 'btn-secondary';
  btn.style.width = '100%';
  btn.textContent = 'İndir';
  btn.onclick = () => {
    const a = document.createElement('a');
    a.download = `${resizeW}x${resizeH}-${name}.jpg`;
    a.href = canvas.toDataURL('image/jpeg', 0.92);
    a.click();
  };
  
  wrap.appendChild(btn);
  resizeGallery?.appendChild(wrap);
}

function renderResizeBadges() {
  const resizeWidthInput = document.getElementById('resizeWidth') as HTMLInputElement;
  const resizeHeightInput = document.getElementById('resizeHeight') as HTMLInputElement;
  const container = document.getElementById('resizeBadges');
  if (!container) return;

  container.innerHTML = '';
  resizeBadges.forEach((badge, index) => {
    const badgeEl = document.createElement('div');
    badgeEl.className = `resize-badge ${resizeW === badge.w && resizeH === badge.h ? 'active' : ''}`;
    
    badgeEl.innerHTML = `
      <span class="badge-text">${badge.w} × ${badge.h}</span>
      <span class="badge-remove">×</span>
    `;
    
    badgeEl.querySelector('.badge-text')?.addEventListener('click', () => {
      resizeWidthInput.value = badge.w.toString();
      resizeHeightInput.value = badge.h.toString();
      refreshResizeGallery();
    });
    
    badgeEl.querySelector('.badge-remove')?.addEventListener('click', (e) => {
      e.stopPropagation();
      resizeBadges.splice(index, 1);
      renderResizeBadges();
    });
    
    container.appendChild(badgeEl);
  });
}
