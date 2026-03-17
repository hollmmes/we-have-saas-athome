import { metinToUrl } from '../utils/helpers';
import {
  createPresetId,
  getActiveProfile,
  getPresets,
  notifyApp,
  savePreset,
  subscribeWorkflowChanges,
} from '../workflow';
import type { SeoPreset } from '../types';

export function setupSeoPage() {
  ensureSeoEnhancements();
  const seoConvertBtn = document.getElementById('seoConvertBtn')!;
  const seoResults = document.querySelector('.seo-results')!;
  const saveSeoPresetBtn = document.getElementById('saveSeoPresetBtn');

  seoConvertBtn.addEventListener('click', convertSeoKeywords);
  saveSeoPresetBtn?.addEventListener('click', saveCurrentSeoPreset);
  seoResults.addEventListener('click', async (event) => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-copy-target]');
    const elementId = target?.dataset.copyTarget;

    if (target && elementId) {
      await copyToClipboard(elementId);
    }
  });

  const unsubscribe = subscribeWorkflowChanges((section) => {
    if (section === 'presets' || section === 'profiles') {
      populateSeoPresetSelect();
    }
  });

  window.addEventListener('beforeunload', unsubscribe, { once: true });
  populateSeoPresetSelect();
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

  const preset = getSelectedSeoPreset();
  const maxLen = Number.parseInt((document.getElementById('seoMaxLen') as HTMLInputElement | null).value || String(preset?.maxLength || 150), 10);
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

  const profile = getActiveProfile();
  const primary = lines[0] || '';
  const secondary = lines[1] || lines[0] || '';
  const keywordBlob = lines.join(', ');

  const title = applyTemplate(
    preset?.titleTemplate || '{primary} | {secondary}',
    profile?.watermarkText ? `${primary} | ${profile.watermarkText}` : primary,
    secondary,
    keywordBlob,
  );

  const description = applyTemplate(
    preset?.descriptionTemplate || '{primary}, {secondary}, {keywords}',
    primary,
    secondary,
    keywordBlob,
  );

  (document.getElementById('seoMetaTitleResult') as HTMLTextAreaElement).value = title.slice(0, 70);
  (document.getElementById('seoMetaDescriptionResult') as HTMLTextAreaElement).value = description.slice(0, 160);
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

function ensureSeoEnhancements() {
  const seoInputSection = document.querySelector('#seoPage .seo-input-section');
  const seoResults = document.querySelector('#seoPage .seo-results');
  if (!seoInputSection || !seoResults) {
    return;
  }

  if (!document.getElementById('seoPresetSelect')) {
    const toolbar = document.createElement('div');
    toolbar.className = 'tool-toolbar';
    toolbar.innerHTML = `
      <div class="tool-toolbar-group">
        <label for="seoPresetSelect">SEO preset</label>
        <select id="seoPresetSelect" class="tool-select"></select>
        <button class="btn-secondary btn-sm" id="saveSeoPresetBtn" type="button">Save Preset</button>
      </div>
    `;

    seoInputSection.insertBefore(toolbar, seoInputSection.querySelector('.seo-options'));
  }

  if (!document.getElementById('seoMetaTitleResult')) {
    const metaTitle = document.createElement('div');
    metaTitle.className = 'seo-result-item';
    metaTitle.innerHTML = `
      <div class="seo-result-header">
        <h3>Meta Title</h3>
        <span class="seo-format">search result title</span>
      </div>
      <textarea id="seoMetaTitleResult" class="seo-result-textarea" readonly></textarea>
      <button class="btn-secondary btn-sm" data-copy-target="seoMetaTitleResult">Kopyala</button>
    `;

    const metaDescription = document.createElement('div');
    metaDescription.className = 'seo-result-item';
    metaDescription.innerHTML = `
      <div class="seo-result-header">
        <h3>Meta Description</h3>
        <span class="seo-format">search result description</span>
      </div>
      <textarea id="seoMetaDescriptionResult" class="seo-result-textarea" readonly></textarea>
      <button class="btn-secondary btn-sm" data-copy-target="seoMetaDescriptionResult">Kopyala</button>
    `;

    seoResults.append(metaTitle, metaDescription);
  }
}

function populateSeoPresetSelect() {
  const presetSelect = document.getElementById('seoPresetSelect') as HTMLSelectElement | null;
  if (!presetSelect) {
    return;
  }

  const presets = getPresets('seo');
  const activeProfile = getActiveProfile();
  const activePreset = presets.find((preset) => preset.id === activeProfile?.seoPresetId) || presets[0];

  presetSelect.innerHTML = presets
    .map((preset) => `
      <option value="${preset.id}" ${preset.id === activePreset?.id ? 'selected' : ''}>
        ${preset.name} - ${preset.maxLength}
      </option>
    `)
    .join('');
}

function getSelectedSeoPreset(): SeoPreset | null {
  const presetSelect = document.getElementById('seoPresetSelect') as HTMLSelectElement | null;
  const presets = getPresets('seo');
  return presets.find((preset) => preset.id === presetSelect?.value) || presets[0] || null;
}

function saveCurrentSeoPreset() {
  const presetName = window.prompt('Preset name', 'SEO Preset');
  if (!presetName) {
    return;
  }

  const maxLength = Number.parseInt((document.getElementById('seoMaxLen') as HTMLInputElement | null).value || '150', 10);
  savePreset({
    id: createPresetId('seo'),
    type: 'seo',
    name: presetName.trim(),
    maxLength,
    titleTemplate: '{primary} | {secondary}',
    descriptionTemplate: '{primary}, {secondary}, {keywords}',
  });

  populateSeoPresetSelect();
  notifyApp('success', `Saved SEO preset: ${presetName.trim()}`);
}

function applyTemplate(template: string, primary: string, secondary: string, keywords: string) {
  return template
    .replace(/\{primary\}/g, primary)
    .replace(/\{secondary\}/g, secondary)
    .replace(/\{keywords\}/g, keywords)
    .replace(/\s+\|\s+$/, '')
    .trim();
}
