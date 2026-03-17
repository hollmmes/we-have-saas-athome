import { metinToUrl } from '../utils/helpers';

export function setupSeoPage() {
  const seoConvertBtn = document.getElementById('seoConvertBtn')!;
  const seoResults = document.querySelector('.seo-results')!;

  seoConvertBtn.addEventListener('click', convertSeoKeywords);
  seoResults.addEventListener('click', async (event) => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-copy-target]');
    const elementId = target.dataset.copyTarget;

    if (target && elementId) {
      await copyToClipboard(elementId);
    }
  });
}

function convertSeoKeywords() {
  const input = (document.getElementById('seoInputText') as HTMLTextAreaElement | null).value || '';
  const lines = input.split('\n').filter((line) => line.trim() !== '');

  if (lines.length === 0) {
    alert('Lutfen anahtar kelime girin!');
    return;
  }

  const joined = `${lines.join(', ')},`;
  (document.getElementById('seoJoinedResult') as HTMLTextAreaElement).value = joined;

  const maxLen = Number.parseInt((document.getElementById('seoMaxLen') as HTMLInputElement | null).value || '150', 10);
  let urlJoined = lines.map((line) => metinToUrl(line)).join('-');

  if (urlJoined.length > maxLen) {
    urlJoined = urlJoined.substring(0, maxLen);
    if (urlJoined.endsWith('-')) {
      urlJoined = urlJoined.slice(0, -1);
    }
  }

  (document.getElementById('seoUrlResult') as HTMLTextAreaElement).value = urlJoined;

  const hashtags = lines.map((line) => `#${line.trim().replace(/\s+/g, '')}`).join(' ');
  (document.getElementById('seoHashtagResult') as HTMLTextAreaElement).value = hashtags;
}

async function copyToClipboard(elementId: string) {
  const textarea = document.getElementById(elementId) as HTMLTextAreaElement | null;
  if (!textarea.value) {
    return;
  }

  try {
    await navigator.clipboard.writeText(textarea.value || '');
    alert('Kopyalandi!');
  } catch (error) {
    textarea.select();
    document.execCommand('copy');
    alert('Kopyalandi!');
  }
}
