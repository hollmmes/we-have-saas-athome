import { metinToUrl } from '../utils/helpers';

export function setupSeoPage() {
  const seoConvertBtn = document.getElementById('seoConvertBtn');
  seoConvertBtn?.addEventListener('click', convertSeoKeywords);
  
  // Make copyToClipboard global
  (window as any).copyToClipboard = copyToClipboard;
}

function convertSeoKeywords() {
  const input = (document.getElementById('seoInputText') as HTMLTextAreaElement)?.value || '';
  const lines = input.split('\n').filter(l => l.trim() !== '');

  if (lines.length === 0) {
    alert('Lütfen anahtar kelime girin!');
    return;
  }

  // Blog Hashtag
  const joined = lines.join(', ') + ',';
  (document.getElementById('seoJoinedResult') as HTMLTextAreaElement).value = joined;

  // SLUG
  const maxLen = parseInt((document.getElementById('seoMaxLen') as HTMLInputElement)?.value || '150');
  let urlLines = lines.map(l => metinToUrl(l));
  let urlJoined = urlLines.join('-');
  
  if (urlJoined.length > maxLen) {
    urlJoined = urlJoined.substring(0, maxLen);
    if (urlJoined.endsWith('-')) {
      urlJoined = urlJoined.slice(0, -1);
    }
  }
  (document.getElementById('seoUrlResult') as HTMLTextAreaElement).value = urlJoined;

  // Sosyal Medya Hashtag
  const hashtags = lines.map(line => {
    return `#${line.trim().replace(/\s+/g, '')}`;
  }).join(' ');
  (document.getElementById('seoHashtagResult') as HTMLTextAreaElement).value = hashtags;
}

async function copyToClipboard(elementId: string) {
  const textarea = document.getElementById(elementId) as HTMLTextAreaElement;
  if (textarea && textarea.value) {
    try {
      await navigator.clipboard.writeText(textarea.value);
      alert('Kopyalandı!');
    } catch (err) {
      textarea.select();
      document.execCommand('copy');
      alert('Kopyalandı!');
    }
  }
}
