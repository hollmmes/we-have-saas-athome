// Helper functions used across the application

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export function turkceToAscii(text: string): string {
  const chars: { [key: string]: string } = {
    'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
    'Ç': 'C', 'Ğ': 'G', 'İ': 'I', 'Ö': 'O', 'Ş': 'S', 'Ü': 'U'
  };
  return text.split('').map(c => chars[c] || c).join('');
}

export function metinToUrl(metin: string): string {
  let txt = turkceToAscii(metin);
  txt = txt.toLowerCase();
  txt = txt.trim().replace(/\s+/g, '-');
  txt = txt.replace(/[^a-z0-9\-]/g, '');
  return txt;
}

export async function openFileLocation(filePath: string) {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('open_file_location', { filePath });
  } catch (error) {
    console.error('Failed to open file location:', error);
    alert('Dosya konumu açılamadı');
  }
}
