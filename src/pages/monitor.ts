import { deleteDomain as deleteDomainFromDB, getDomains, saveDomain } from '../database';
import type { DomainInfo } from '../types';
import { escapeAttribute, escapeHtml } from '../utils/helpers';
import { getNotificationSettings, notifyApp } from '../workflow';

export function setupMonitorPage() {
  ensureMonitorWorkflowUi();
  const addDomainBtn = document.getElementById('addDomainBtn')!;
  const refreshAllDomainsBtn = document.getElementById('refreshAllDomainsBtn')!;
  const domainTableBody = document.getElementById('domainTableBody')!;
  const exportDomainsBtn = document.getElementById('exportDomainsBtn');
  const importDomainsInput = document.getElementById('importDomainsInput') as HTMLInputElement | null;

  addDomainBtn.addEventListener('click', handleAddDomain);
  refreshAllDomainsBtn.addEventListener('click', handleRefreshAllDomains);
  exportDomainsBtn?.addEventListener('click', handleExportDomains);
  importDomainsInput?.addEventListener('change', () => {
    void handleImportDomains(importDomainsInput);
  });

  domainTableBody.addEventListener('click', async (event) => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-delete-domain]');
    const domain = target.dataset.deleteDomain;

    if (target && domain) {
      await deleteDomainEntry(domain);
    }
  });
}

export async function loadDomains() {
  const domainTableBody = document.getElementById('domainTableBody')!;
  if (!domainTableBody) return;

  try {
    const domains = await getDomains();

    if (domains.length === 0) {
      domainTableBody.innerHTML = '<tr><td colspan="11" class="empty-message">Henuz domain eklenmedi.</td></tr>';
      return;
    }

    domainTableBody.innerHTML = domains
      .map((domain) => {
        const sslStatusClass = domain.ssl_days > 0 ? 'success' : 'danger';
        const domainStatusClass = domain.domain_days > 1 ? 'success' : 'danger';

        return `
          <tr>
            <td><strong>${escapeHtml(domain.domain)}</strong></td>
            <td style="color:#888;">${escapeHtml(domain.ssl_start)}</td>
            <td>${escapeHtml(domain.ssl_end)}</td>
            <td><span class="day-info">${domain.ssl_days} Gun</span></td>
            <td><span class="badge ${sslStatusClass}">${escapeHtml(domain.ssl_status)}</span></td>
            <td><span class="badge ${domainStatusClass}">${escapeHtml(domain.domain_status)}</span></td>
            <td style="color:#888;">${escapeHtml(domain.domain_start)}</td>
            <td>${escapeHtml(domain.domain_end)}</td>
            <td><span class="day-info">${domain.domain_days} Gun</span></td>
            <td style="font-size: 11px; color:#666;">${escapeHtml(domain.ssl_issuer)}</td>
            <td>
              <button class="btn-danger btn-sm" data-delete-domain="${escapeAttribute(domain.domain)}">Sil</button>
            </td>
          </tr>
        `;
      })
      .join('');

    renderDomainAlerts(domains);
  } catch (error) {
    console.error('Domain listesi yuklenemedi:', error);
    domainTableBody.innerHTML = '<tr><td colspan="11" class="empty-message">Domain listesi yuklenirken hata olustu</td></tr>';
  }
}

async function handleAddDomain() {
  const domainInput = document.getElementById('domainInput') as HTMLInputElement | null;
  const addDomainBtn = document.getElementById('addDomainBtn')!;
  const domain = domainInput.value.trim();

  if (!domain) {
    alert('Lutfen bir domain girin!');
    return;
  }

  if (addDomainBtn) {
    addDomainBtn.textContent = 'Sorgulaniyor...';
    addDomainBtn.setAttribute('disabled', 'true');
  }

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const result = await invoke<DomainInfo>('check_ssl_certificate', { domain });

    await saveDomain(result);
    await loadDomains();

    if (domainInput) {
      domainInput.value = '';
    }

    alert('Domain basariyla eklendi!');
    notifyDomainThresholds([result], true);
  } catch (error) {
    console.error('Domain kontrol hatasi:', error);
    alert(`Hata: ${String(error)}`);
  } finally {
    if (addDomainBtn) {
      addDomainBtn.textContent = 'Ekle ve Sorgula';
      addDomainBtn.removeAttribute('disabled');
    }
  }
}

async function handleRefreshAllDomains() {
  const refreshAllDomainsBtn = document.getElementById('refreshAllDomainsBtn')!;
  const domains = await getDomains();

  if (domains.length === 0) {
    alert('Guncellenecek domain yok!');
    return;
  }

  if (refreshAllDomainsBtn) {
    refreshAllDomainsBtn.textContent = 'Guncelleniyor...';
    refreshAllDomainsBtn.setAttribute('disabled', 'true');
  }

  try {
    const { invoke } = await import('@tauri-apps/api/core');

    for (const domain of domains) {
      try {
        const result = await invoke<DomainInfo>('check_ssl_certificate', { domain: domain.domain });
        await saveDomain(result);
      } catch (error) {
        console.error(`${domain.domain} guncellenemedi:`, error);
      }
    }

    await loadDomains();
    alert('Tum domain\'ler guncellendi!');
    notifyDomainThresholds(await getDomains(), false);
  } catch (error) {
    console.error('Toplu guncelleme hatasi:', error);
    alert(`Hata: ${String(error)}`);
  } finally {
    if (refreshAllDomainsBtn) {
      refreshAllDomainsBtn.textContent = 'Tumunu Guncelle';
      refreshAllDomainsBtn.removeAttribute('disabled');
    }
  }
}

async function deleteDomainEntry(domain: string) {
  if (!confirm(`${domain} domain'ini silmek istediginizden emin misiniz?`)) {
    return;
  }

  try {
    await deleteDomainFromDB(domain);
    await loadDomains();
  } catch (error) {
    console.error('Domain silinemedi:', error);
    alert('Domain silinemedi!');
  }
}

function ensureMonitorWorkflowUi() {
  const addSection = document.querySelector('#monitorPage .monitor-add-section');
  const monitorList = document.querySelector('#monitorPage .monitor-list');
  if (!addSection || !monitorList) {
    return;
  }

  if (!document.getElementById('exportDomainsBtn')) {
    const tools = document.createElement('div');
    tools.className = 'tool-toolbar';
    tools.innerHTML = `
      <div class="tool-toolbar-group">
        <button class="btn-secondary btn-sm" id="exportDomainsBtn" type="button">Export CSV</button>
        <label class="btn-secondary btn-sm tool-file-label" for="importDomainsInput">Import CSV</label>
        <input id="importDomainsInput" type="file" accept=".csv,text/csv" hidden>
      </div>
      <div class="tool-toolbar-group tool-toolbar-note">
        <span>Notifications follow SSL and domain expiry thresholds from Workflow Center.</span>
      </div>
    `;

    addSection.appendChild(tools);
  }

  if (!document.getElementById('monitorAlerts')) {
    const alerts = document.createElement('div');
    alerts.id = 'monitorAlerts';
    alerts.className = 'monitor-alerts';
    monitorList.insertBefore(alerts, monitorList.firstChild?.nextSibling || null);
  }
}

function renderDomainAlerts(domains: DomainInfo[]) {
  const alerts = document.getElementById('monitorAlerts');
  if (!alerts) {
    return;
  }

  const settings = getNotificationSettings();
  const sslAlerts = domains.filter((domain) => domain.ssl_days <= settings.sslThresholdDays);
  const domainAlerts = domains.filter((domain) => domain.domain_days <= settings.domainThresholdDays);

  if (sslAlerts.length === 0 && domainAlerts.length === 0) {
    alerts.innerHTML = '<p class="empty-message">No active SSL or domain alerts.</p>';
    return;
  }

  alerts.innerHTML = `
    <div class="workflow-alert-grid">
      <div class="workflow-alert-card">
        <strong>SSL threshold</strong>
        <span>${settings.sslThresholdDays} days</span>
        <p>${sslAlerts.length} domain(s) are at or below threshold.</p>
      </div>
      <div class="workflow-alert-card">
        <strong>Domain threshold</strong>
        <span>${settings.domainThresholdDays} days</span>
        <p>${domainAlerts.length} domain(s) are at or below threshold.</p>
      </div>
    </div>
  `;
}

function notifyDomainThresholds(domains: DomainInfo[], onlyImmediate: boolean) {
  const settings = getNotificationSettings();
  const expiring = domains.filter(
    (domain) =>
      domain.ssl_days <= settings.sslThresholdDays ||
      domain.domain_days <= settings.domainThresholdDays,
  );

  if (expiring.length === 0) {
    return;
  }

  if (onlyImmediate || settings.enabled) {
    notifyApp(
      'warning',
      `${expiring.length} domain(s) are close to SSL or registration expiry.`,
    );
  }
}

async function handleExportDomains() {
  const domains = await getDomains();
  if (domains.length === 0) {
    alert('Export icin domain bulunamadi.');
    return;
  }

  const csv = [
    'domain,ssl_days,domain_days,ssl_end,domain_end,last_checked',
    ...domains.map((domain) =>
      [
        domain.domain,
        domain.ssl_days,
        domain.domain_days,
        domain.ssl_end,
        domain.domain_end,
        domain.last_checked,
      ].join(','),
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'domains-export.csv';
  link.click();
  URL.revokeObjectURL(link.href);
}

async function handleImportDomains(input: HTMLInputElement | null) {
  const file = input?.files?.[0];
  if (!file) {
    return;
  }

  const content = await file.text();
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(1);

  for (const line of lines) {
    const [domain] = line.split(',');
    if (!domain) {
      continue;
    }

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const result = await invoke<DomainInfo>('check_ssl_certificate', { domain });
      await saveDomain(result);
    } catch (error) {
      console.error(`Failed to import domain ${domain}:`, error);
    }
  }

  await loadDomains();
  notifyApp('success', `Imported ${lines.length} domain row(s).`);
  input.value = '';
}
