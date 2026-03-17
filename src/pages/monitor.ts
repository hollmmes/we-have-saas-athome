import { deleteDomain as deleteDomainFromDB, getDomains, saveDomain } from '../database';
import type { DomainInfo } from '../types';
import { escapeAttribute, escapeHtml } from '../utils/helpers';

export function setupMonitorPage() {
  const addDomainBtn = document.getElementById('addDomainBtn')!;
  const refreshAllDomainsBtn = document.getElementById('refreshAllDomainsBtn')!;
  const domainTableBody = document.getElementById('domainTableBody')!;

  addDomainBtn.addEventListener('click', handleAddDomain);
  refreshAllDomainsBtn.addEventListener('click', handleRefreshAllDomains);

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
