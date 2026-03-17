import { downloadCanvas, saveCanvasToOutput } from '../utils/helpers';

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
  const resizeDropZone = document.getElementById('resizeDropZone')!;
  const resizeFileInput = document.getElementById('resizeFileInput') as HTMLInputElement;

  resizeWidthInput.addEventListener('input', refreshResizeGallery);
  resizeHeightInput.addEventListener('input', refreshResizeGallery);

  resizeFileInput.addEventListener('change', (event) => {
    const files = (event.target as HTMLInputElement).files;
    if (files) {
      handleResizeFiles(files);
    }
  });

  resizeDropZone.addEventListener('click', () => {
    resizeFileInput.click();
  });

  resizeDropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    resizeDropZone.classList.add('drag-over');
  });

  resizeDropZone.addEventListener('dragleave', () => {
    resizeDropZone.classList.remove('drag-over');
  });

  resizeDropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    resizeDropZone.classList.remove('drag-over');
    const files = event.dataTransfer.files;
    if (files) {
      handleResizeFiles(files);
    }
  });

  document.getElementById('saveDimensionBtn')!.addEventListener('click', () => {
    const width = Number.parseInt(resizeWidthInput.value || '350', 10);
    const height = Number.parseInt(resizeHeightInput.value || '390', 10);
    resizeBadges.push({ w: width, h: height });
    renderResizeBadges();
  });

  document.getElementById('clearResizeBtn')!.addEventListener('click', () => {
    const resizeGallery = document.getElementById('resizeGallery');
    if (resizeGallery) {
      resizeGallery.innerHTML = '';
    }

    originalResizeImages = [];

    const downloadAllBtn = document.getElementById('downloadAllBtn') as HTMLButtonElement | null;
    const clearBtn = document.getElementById('clearResizeBtn') as HTMLButtonElement | null;
    if (downloadAllBtn) downloadAllBtn.disabled = true;
    if (clearBtn) clearBtn.disabled = true;
  });

  document.getElementById('downloadAllBtn')!.addEventListener('click', async () => {
    const resizeGallery = document.getElementById('resizeGallery');
    const canvases: HTMLCanvasElement[] = resizeGallery
      ? Array.from(resizeGallery.querySelectorAll<HTMLCanvasElement>('canvas'))
      : [];

    if (!canvases.length) {
      return;
    }

    let savedCount = 0;
    let fallbackCount = 0;

    for (const [index, canvas] of Array.from(canvases).entries()) {
      const fileName = buildResizeFileName(originalResizeImages[index].name);

      try {
        await saveCanvasToOutput(canvas, fileName, 'resized_images', 0.92);
        savedCount += 1;
      } catch (error) {
        console.error('Resize save error:', error);
        downloadCanvas(canvas, fileName, 0.92);
        fallbackCount += 1;
      }
    }

    if (fallbackCount === 0) {
      alert(`${savedCount} gorsel resized_images klasorune kaydedildi.`);
    } else {
      alert(`${savedCount} gorsel klasore kaydedildi, ${fallbackCount} gorsel icin tarayici indirmesi baslatildi.`);
    }
  });

  renderResizeBadges();
}

function refreshResizeGallery() {
  const resizeWidthInput = document.getElementById('resizeWidth') as HTMLInputElement;
  const resizeHeightInput = document.getElementById('resizeHeight') as HTMLInputElement;
  const resizeGallery = document.getElementById('resizeGallery');

  resizeW = Number.parseInt(resizeWidthInput.value || '350', 10);
  resizeH = Number.parseInt(resizeHeightInput.value || '390', 10);

  if (resizeGallery) {
    resizeGallery.innerHTML = '';
    originalResizeImages.forEach((item) => renderResizeCanvas(item.img, item.name));
  }

  renderResizeBadges();
}

function handleResizeFiles(files: FileList) {
  Array.from(files).forEach((file) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        originalResizeImages.push({ img, name: file.name });
        renderResizeCanvas(img, file.name);

        const downloadAllBtn = document.getElementById('downloadAllBtn') as HTMLButtonElement | null;
        const clearBtn = document.getElementById('clearResizeBtn') as HTMLButtonElement | null;
        if (downloadAllBtn) downloadAllBtn.disabled = false;
        if (clearBtn) clearBtn.disabled = false;
      };
      img.src = event.target.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function renderResizeCanvas(img: HTMLImageElement, name: string) {
  const resizeGallery = document.getElementById('resizeGallery');
  const canvas = document.createElement('canvas');
  canvas.width = resizeW;
  canvas.height = resizeH;

  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  const scale = Math.max(resizeW / img.width, resizeH / img.height);
  const x = resizeW / 2 - (img.width / 2) * scale;
  const y = resizeH / 2 - (img.height / 2) * scale;

  context.fillStyle = '#fff';
  context.fillRect(0, 0, resizeW, resizeH);
  context.drawImage(img, x, y, img.width * scale, img.height * scale);

  const wrapper = document.createElement('div');
  wrapper.className = 'resize-thumb';

  const fileName = document.createElement('div');
  fileName.className = 'resize-file-name';
  fileName.textContent = name;

  wrapper.append(fileName, canvas);

  const saveButton = document.createElement('button');
  saveButton.className = 'btn-secondary';
  saveButton.style.width = '100%';
  saveButton.textContent = 'Kaydet';
  saveButton.onclick = async () => {
    const outputFileName = buildResizeFileName(name);

    try {
      await saveCanvasToOutput(canvas, outputFileName, 'resized_images', 0.92);
      alert(`Kaydedildi: ${outputFileName}`);
    } catch (error) {
      console.error('Resize save error:', error);
      downloadCanvas(canvas, outputFileName, 0.92);
      alert('Dosya klasore kaydedilemedi, tarayici indirmesi baslatildi.');
    }
  };

  wrapper.appendChild(saveButton);
  resizeGallery.appendChild(wrapper);
}

function buildResizeFileName(name: string): string {
  const baseName = name.replace(/\.[^.]+$/, '');
  return `${resizeW}x${resizeH}-${baseName}.jpg`;
}

function renderResizeBadges() {
  const resizeWidthInput = document.getElementById('resizeWidth') as HTMLInputElement;
  const resizeHeightInput = document.getElementById('resizeHeight') as HTMLInputElement;
  const container = document.getElementById('resizeBadges');
  if (!container || !resizeWidthInput || !resizeHeightInput) return;

  container.innerHTML = '';
  resizeBadges.forEach((badge, index) => {
    const badgeElement = document.createElement('div');
    badgeElement.className = `resize-badge ${resizeW === badge.w && resizeH === badge.h ? 'active' : ''}`;

    badgeElement.innerHTML = `
      <span class="badge-text">${badge.w} x ${badge.h}</span>
      <span class="badge-remove">x</span>
    `;

    badgeElement.querySelector('.badge-text').addEventListener('click', () => {
      resizeWidthInput.value = badge.w.toString();
      resizeHeightInput.value = badge.h.toString();
      refreshResizeGallery();
    });

    badgeElement.querySelector('.badge-remove').addEventListener('click', (event) => {
      event.stopPropagation();
      resizeBadges.splice(index, 1);
      renderResizeBadges();
    });

    container.appendChild(badgeElement);
  });
}
