// Helper functions used across the application

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'tiff', 'tif', 'ico']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv']);
const INVALID_FILE_NAME_CHARS = /[<>:"/\\|?*\u0000-\u001f]/g;

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeAttribute(text: string): string {
  return escapeHtml(text).replace(/`/g, '&#96;');
}

export function turkceToAscii(text: string): string {
  const chars: Record<string, string> = {
    '\u00e7': 'c',
    '\u011f': 'g',
    '\u0131': 'i',
    '\u00f6': 'o',
    '\u015f': 's',
    '\u00fc': 'u',
    '\u00c7': 'C',
    '\u011e': 'G',
    '\u0130': 'I',
    '\u00d6': 'O',
    '\u015e': 'S',
    '\u00dc': 'U',
    '\u00c3\u00a7': 'c',
    '\u00c3\u0087': 'C',
    '\u00c3\u00b6': 'o',
    '\u00c3\u0096': 'O',
    '\u00c3\u00bc': 'u',
    '\u00c3\u009c': 'U',
    '\u00c4\u009f': 'g',
    '\u00c4\u009e': 'G',
    '\u00c4\u00b1': 'i',
    '\u00c4\u00b0': 'I',
    '\u00c5\u0178': 's',
    '\u00c5\u017d': 'S'
  };

  return text.split('').map((char) => chars[char] || char).join('');
}

export function metinToUrl(metin: string): string {
  let txt = turkceToAscii(metin);
  txt = txt.toLowerCase();
  txt = txt.trim().replace(/\s+/g, '-');
  txt = txt.replace(/[^a-z0-9\-]/g, '');
  return txt;
}

export function fileNameFromPath(path: string): string {
  return path.split(/[\\/]/).pop() || 'unknown';
}

export function joinPath(...segments: string[]): string {
  return segments
    .filter(Boolean)
    .map((segment, index) => {
      if (index === 0) {
        return segment.replace(/[\\/]+$/, '');
      }

      return segment.replace(/^[\\/]+|[\\/]+$/g, '');
    })
    .join('/');
}

export function sanitizeFileName(fileName: string): string {
  const sanitized = fileName
    .replace(INVALID_FILE_NAME_CHARS, '_')
    .replace(/\s+/g, ' ')
    .trim();

  return sanitized || 'output.jpg';
}

export function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

export function isImagePath(path: string): boolean {
  const extension = path.split('.').pop()?.toLowerCase();
  return extension ? IMAGE_EXTENSIONS.has(extension) : false;
}

export function isVideoPath(path: string): boolean {
  const extension = path.split('.').pop()?.toLowerCase();
  return extension ? VIDEO_EXTENSIONS.has(extension) : false;
}

export function getConfiguredOutputRoot(): string | null {
  return localStorage.getItem('outputPath');
}

export async function ensureOutputSubfolder(subfolder: string): Promise<string> {
  const rootPath = getConfiguredOutputRoot();
  if (!rootPath) {
    throw new Error('Cikti klasoru ayarlanmamis.');
  }

  const targetPath = joinPath(rootPath, subfolder);
  const fs = await import('@tauri-apps/plugin-fs');
  await fs.mkdir(targetPath, { recursive: true });
  return targetPath;
}

async function resolveUniqueOutputPath(directory: string, fileName: string): Promise<string> {
  const fs = await import('@tauri-apps/plugin-fs');
  const safeFileName = sanitizeFileName(fileName);
  const extensionIndex = safeFileName.lastIndexOf('.');
  const baseName = extensionIndex === -1 ? safeFileName : safeFileName.slice(0, extensionIndex);
  const extension = extensionIndex === -1 ? '' : safeFileName.slice(extensionIndex);

  let counter = 0;
  let candidate = joinPath(directory, safeFileName);

  while (await fs.exists(candidate)) {
    counter += 1;
    candidate = joinPath(directory, `${baseName}-${counter}${extension}`);
  }

  return candidate;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas verisi olusturulamadi.'));
        }
      },
      'image/jpeg',
      quality
    );
  });
}

export async function saveCanvasToOutput(
  canvas: HTMLCanvasElement,
  fileName: string,
  subfolder: string,
  quality = 0.92
): Promise<string> {
  const outputDirectory = await ensureOutputSubfolder(subfolder);
  const outputPath = await resolveUniqueOutputPath(outputDirectory, fileName);
  const blob = await canvasToBlob(canvas, quality);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const fs = await import('@tauri-apps/plugin-fs');

  await fs.writeFile(outputPath, bytes);
  return outputPath;
}

export function downloadCanvas(canvas: HTMLCanvasElement, fileName: string, quality = 0.92): void {
  const link = document.createElement('a');
  link.download = sanitizeFileName(fileName);
  link.href = canvas.toDataURL('image/jpeg', quality);
  link.click();
}

export async function openFileLocation(filePath: string) {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('open_file_location', { filePath });
  } catch (error) {
    console.error('Failed to open file location:', error);
    alert('Dosya konumu acilamadi');
  }
}
