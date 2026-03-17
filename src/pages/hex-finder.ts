import { fileNameFromPath, isImagePath } from "../utils/helpers";
import { initIcons } from "../utils/icons";

type RgbColor = {
  r: number;
  g: number;
  b: number;
};

type SamplePoint = {
  x: number;
  y: number;
  color: RgbColor;
};

let currentImage: HTMLImageElement | null = null;
let selectedSample: SamplePoint | null = null;
const pixelCanvas = document.createElement("canvas");
const pixelContext = pixelCanvas.getContext("2d", { willReadFrequently: true });

export function setupHexFinderPage() {
  const dropZone = document.getElementById("hexDropZone")!;
  const fileInput = document.getElementById("hexFileInput") as HTMLInputElement;
  const canvas = document.getElementById("hexCanvas") as HTMLCanvasElement;
  const preview = document.getElementById("hexPreview");
  const placeholder = document.getElementById("hexPlaceholder");
  const zoomLens = document.getElementById("hexZoomLens")!;
  const openBtn = document.getElementById("hexOpenBtn")!;

  openBtn.addEventListener("click", () => fileInput.click());
  dropZone.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && file.type.startsWith("image/")) {
      await loadImageFromFile(file);
    }
  });

  dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.classList.add("drag-over");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("drag-over");
  });

  dropZone.addEventListener("drop", async (event) => {
    event.preventDefault();
    dropZone.classList.remove("drag-over");
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      await loadImageFromFile(file);
    }
  });

  canvas.addEventListener("mousemove", (event) => {
    if (!currentImage || !canvas || !zoomLens) {
      return;
    }

    const sample = sampleCanvasAtEvent(canvas, event);
    if (!sample) {
      zoomLens.style.opacity = "0";
      return;
    }

    renderZoomLens(canvas, zoomLens, sample, event);
    updateHoverReadout(sample.color, sample.x, sample.y);
  });

  canvas.addEventListener("mouseleave", () => {
    if (zoomLens) {
      zoomLens.style.opacity = "0";
    }
  });

  canvas.addEventListener("click", (event) => {
    if (!canvas) {
      return;
    }

    const sample = sampleCanvasAtEvent(canvas, event);
    if (!sample) {
      return;
    }

    selectedSample = sample;
    renderSelection(sample);
    drawImageToCanvas();
  });

  if (preview && placeholder) {
    preview.setAttribute("hidden", "");
    placeholder.removeAttribute("hidden");
  }
}

export async function handleHexFinderPaths(paths: string[]) {
  const imagePath = paths.find(isImagePath);
  if (!imagePath) {
    return;
  }

  await loadImageFromPath(imagePath);
}

async function loadImageFromPath(path: string) {
  const { invoke } = await import("@tauri-apps/api/core");
  const dataUrl = await invoke<string>("get_image_data_url", { filePath: path });
  await loadImageFromSource(dataUrl, fileNameFromPath(path));
}

async function loadImageFromFile(file: File) {
  const fileData = await readFileAsDataUrl(file);
  await loadImageFromSource(fileData, file.name);
}

async function loadImageFromSource(source: string, fileName: string) {
  const preview = document.getElementById("hexPreview");
  const placeholder = document.getElementById("hexPlaceholder");
  const imageName = document.getElementById("hexImageName");

  currentImage = await createImage(source);
  const centerSample = getCenterSample();
  selectedSample = centerSample;
  pixelCanvas.width = 0;
  pixelCanvas.height = 0;
  drawImageToCanvas();
  renderSelection(centerSample);

  if (preview && placeholder) {
    preview.removeAttribute("hidden");
    placeholder.setAttribute("hidden", "");
  }

  if (imageName) {
    imageName.textContent = fileName;
  }
}

function drawImageToCanvas() {
  const canvas = document.getElementById("hexCanvas") as HTMLCanvasElement;
  const marker = document.getElementById("hexSelectionMarker");
  if (!canvas || !currentImage || !marker) {
    return;
  }

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const container = canvas.parentElement;
  const maxWidth = Math.max(container.clientWidth || 800, 320);
  const maxHeight = 520;
  const scale = Math.min(maxWidth / currentImage.width, maxHeight / currentImage.height, 1);

  canvas.width = Math.max(Math.round(currentImage.width * scale), 1);
  canvas.height = Math.max(Math.round(currentImage.height * scale), 1);

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = false;
  context.drawImage(currentImage, 0, 0, canvas.width, canvas.height);

  if (selectedSample) {
    const markerSize = 14;
    marker.style.left = `${canvas.offsetLeft + selectedSample.x / currentImage.width * canvas.width}px`;
    marker.style.top = `${canvas.offsetTop + selectedSample.y / currentImage.height * canvas.height}px`;
    marker.style.width = `${markerSize}px`;
    marker.style.height = `${markerSize}px`;
    marker.removeAttribute("hidden");
  } else {
    marker.setAttribute("hidden", "");
  }
}

function getCenterSample(): SamplePoint {
  if (!currentImage) {
    return {
      x: 0,
      y: 0,
      color: { r: 0, g: 0, b: 0 }
    };
  }

  const x = Math.floor(currentImage.width / 2);
  const y = Math.floor(currentImage.height / 2);
  return {
    x,
    y,
    color: readImagePixel(x, y)
  };
}

function sampleCanvasAtEvent(canvas: HTMLCanvasElement, event: MouseEvent): SamplePoint | null {
  if (!currentImage) {
    return null;
  }

  const rect = canvas.getBoundingClientRect();
  const relativeX = (event.clientX - rect.left) / rect.width;
  const relativeY = (event.clientY - rect.top) / rect.height;

  const x = clamp(Math.round(relativeX * currentImage.width), 0, currentImage.width - 1);
  const y = clamp(Math.round(relativeY * currentImage.height), 0, currentImage.height - 1);

  return {
    x,
    y,
    color: readImagePixel(x, y)
  };
}

function readImagePixel(x: number, y: number): RgbColor {
  if (!currentImage || !pixelContext) {
    return { r: 0, g: 0, b: 0 };
  }

  if (pixelCanvas.width !== currentImage.width || pixelCanvas.height !== currentImage.height) {
    pixelCanvas.width = currentImage.width;
    pixelCanvas.height = currentImage.height;
    pixelContext.clearRect(0, 0, pixelCanvas.width, pixelCanvas.height);
    pixelContext.drawImage(currentImage, 0, 0);
  }

  const pixel = pixelContext.getImageData(x, y, 1, 1).data;
  return {
    r: pixel[0],
    g: pixel[1],
    b: pixel[2]
  };
}

function renderZoomLens(
  canvas: HTMLCanvasElement,
  lens: HTMLElement,
  sample: SamplePoint,
  event: MouseEvent
) {
  const zoomCanvas = document.getElementById("hexZoomCanvas") as HTMLCanvasElement | null;
  if (!zoomCanvas || !currentImage) {
    return;
  }

  const context = zoomCanvas.getContext("2d");
  if (!context) {
    return;
  }

  const region = 11;
  const zoom = 12;
  zoomCanvas.width = region * zoom;
  zoomCanvas.height = region * zoom;
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, zoomCanvas.width, zoomCanvas.height);

  for (let offsetY = -5; offsetY <= 5; offsetY += 1) {
    for (let offsetX = -5; offsetX <= 5; offsetX += 1) {
      const pixelX = clamp(sample.x + offsetX, 0, currentImage.width - 1);
      const pixelY = clamp(sample.y + offsetY, 0, currentImage.height - 1);
      const pixel = readImagePixel(pixelX, pixelY);
      context.fillStyle = rgbToCss(pixel);
      context.fillRect((offsetX + 5) * zoom, (offsetY + 5) * zoom, zoom, zoom);
    }
  }

  context.strokeStyle = "rgba(255,255,255,0.9)";
  context.lineWidth = 2;
  context.strokeRect(5 * zoom, 5 * zoom, zoom, zoom);
  context.strokeStyle = "rgba(117, 255, 214, 0.9)";
  context.beginPath();
  context.moveTo(0, zoomCanvas.height / 2);
  context.lineTo(zoomCanvas.width, zoomCanvas.height / 2);
  context.moveTo(zoomCanvas.width / 2, 0);
  context.lineTo(zoomCanvas.width / 2, zoomCanvas.height);
  context.stroke();

  const rect = canvas.getBoundingClientRect();
  const left = clamp(canvas.offsetLeft + event.clientX - rect.left + 24, 12, canvas.offsetLeft + rect.width - 180);
  const top = clamp(canvas.offsetTop + event.clientY - rect.top - 180, 12, canvas.offsetTop + rect.height - 180);

  lens.style.left = `${left}px`;
  lens.style.top = `${top}px`;
  lens.style.opacity = "1";
}

function updateHoverReadout(color: RgbColor, x: number, y: number) {
  const hoverCoords = document.getElementById("hexHoverCoords");
  const hoverValue = document.getElementById("hexHoverValue");

  if (hoverCoords) {
    hoverCoords.textContent = `${x}, ${y}`;
  }

  if (hoverValue) {
    hoverValue.textContent = rgbToHex(color);
  }
}

function renderSelection(sample: SamplePoint) {
  const hexValue = rgbToHex(sample.color);
  const rgbValue = `${sample.color.r}, ${sample.color.g}, ${sample.color.b}`;
  const hsl = rgbToHsl(sample.color);
  const hslValue = `${Math.round(hsl.h)} deg, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%`;

  setText("hexCodeValue", hexValue);
  setText("rgbCodeValue", `rgb(${rgbValue})`);
  setText("hslCodeValue", `hsl(${hslValue})`);
  setText("hexPixelCoords", `${sample.x}, ${sample.y}`);

  const swatch = document.getElementById("hexSwatch");
  if (swatch) {
    swatch.setAttribute("style", `background:${hexValue}`);
  }

  const copyButton = document.getElementById("hexCopyBtn");
  if (copyButton) {
    copyButton.setAttribute("data-copy-color", hexValue);
  }

  renderPalette(sample.color);
  renderContrast(sample.color);
}

function renderPalette(color: RgbColor) {
  const container = document.getElementById("hexPaletteGrid");
  if (!container) {
    return;
  }

  const palette = buildPalette(color);
  container.innerHTML = palette
    .map((item) => `
      <button class="hex-palette-card" type="button" data-hex-color="${item.hex}">
        <span class="hex-palette-swatch" style="background:${item.hex}"></span>
        <strong>${item.label}</strong>
        <span>${item.hex}</span>
      </button>
    `)
    .join("");

  container.querySelectorAll<HTMLButtonElement>("[data-hex-color]").forEach((button) => {
    button.addEventListener("click", () => {
      const hex = button.dataset.hexColor;
      if (!hex) {
        return;
      }

      const rgb = hexToRgb(hex);
      selectedSample = {
        x: selectedSample.x || 0,
        y: selectedSample.y || 0,
        color: rgb
      };
      renderSelection({
        x: selectedSample.x,
        y: selectedSample.y,
        color: rgb
      });
    });
  });
}

function renderContrast(color: RgbColor) {
  const contrastGrid = document.getElementById("hexContrastGrid");
  const googleScore = document.getElementById("hexGoogleScore");
  if (!contrastGrid || !googleScore) {
    return;
  }

  const whiteContrast = getContrastRatio(color, { r: 255, g: 255, b: 255 });
  const blackContrast = getContrastRatio(color, { r: 17, g: 24, b: 39 });
  const bestContrast = Math.max(whiteContrast, blackContrast);

  const checks = [
    createContrastRow("Beyaz metin", whiteContrast),
    createContrastRow("Koyu metin", blackContrast),
    createContrastRow("AA normal", bestContrast, 4.5),
    createContrastRow("AAA normal", bestContrast, 7),
    createContrastRow("AA large", bestContrast, 3)
  ];

  contrastGrid.innerHTML = checks
    .map((check) => `
      <div class="contrast-card ${check.pass ? "pass" : "warn"}">
        <strong>${check.label}</strong>
        <span>${check.value}</span>
      </div>
    `)
    .join("");

  const googleRating =
    bestContrast >= 7 ? "Mukemmel" :
    bestContrast >= 4.5 ? "Iyi" :
    bestContrast >= 3 ? "Sinirda" :
    "Zayif";

  googleScore.textContent = `${googleRating} - Kontrast ${bestContrast.toFixed(2)}:1`;
}

function createContrastRow(label: string, value: number, threshold?: number) {
  const pass = threshold ? value >= threshold : true;
  return {
    label,
    value: `${value.toFixed(2)}:1`,
    pass
  };
}

function buildPalette(color: RgbColor) {
  const hsl = rgbToHsl(color);

  return [
    { label: "Secilen", hex: rgbToHex(color) },
    { label: "Tamamlayici", hex: hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l) },
    { label: "Analog 1", hex: hslToHex((hsl.h + 24) % 360, hsl.s, clamp(hsl.l + 4, 0, 100)) },
    { label: "Analog 2", hex: hslToHex((hsl.h + 336) % 360, hsl.s, clamp(hsl.l + 4, 0, 100)) },
    { label: "Acik ton", hex: hslToHex(hsl.h, clamp(hsl.s - 6, 0, 100), clamp(hsl.l + 18, 0, 100)) },
    { label: "Koyu ton", hex: hslToHex(hsl.h, clamp(hsl.s + 4, 0, 100), clamp(hsl.l - 18, 0, 100)) }
  ];
}

function rgbToHex(color: RgbColor): string {
  return `#${[color.r, color.g, color.b]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function hexToRgb(hex: string): RgbColor {
  const normalized = hex.replace("#", "");
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16)
  };
}

function rgbToCss(color: RgbColor): string {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

function rgbToHsl(color: RgbColor) {
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  if (delta !== 0) {
    if (max === r) {
      h = 60 * (((g - b) / delta) % 6);
    } else if (max === g) {
      h = 60 * ((b - r) / delta + 2);
    } else {
      h = 60 * ((r - g) / delta + 4);
    }
  }

  return {
    h: (h + 360) % 360,
    s: s * 100,
    l: l * 100
  };
}

function hslToHex(h: number, s: number, l: number) {
  const saturation = s / 100;
  const lightness = l / 100;
  const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = lightness - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  return rgbToHex({
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  });
}

function getContrastRatio(first: RgbColor, second: RgbColor) {
  const firstLuminance = getLuminance(first);
  const secondLuminance = getLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function getLuminance(color: RgbColor) {
  const channels = [color.r, color.g, color.b].map((value) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function setText(id: string, value: string) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function createImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Gorsel yuklenemedi."));
    image.src = source;
  });
}

window.addEventListener("resize", () => {
  if (currentImage) {
    drawImageToCanvas();
  }
});

document.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-copy-color]");
  const value = button.dataset.copyColor;
  if (!value) {
    return;
  }

  void navigator.clipboard.writeText(value);
  if (button) {
    button.textContent = "Copied";
    setTimeout(() => {
      button.textContent = "Copy";
    }, 1200);
  }
});

initIcons();
