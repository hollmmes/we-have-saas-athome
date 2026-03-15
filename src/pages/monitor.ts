import { saveDomain, getDomains, deleteDomain as deleteDomainFromDB } from '../database';

export function setupMonitorPage() {
  const addDomainBtn = document.getElementById('addDomainBtn');
  const refreshAllDomainsBtn = document.getElementById('refreshAllDomainsBtn');

  addDomainBtn?.addEventListener('click', handleAddDomain);
  refreshAllDomainsBtn?.addEventListener('click', handleRefreshAllDomains);
  
  // Make delete function global
  (window as any).deleteDomainEntry = deleteDomainEntry;
}

export async function loadDomains() {
  const domainTableBody = document.getElementById('domainTableBody');
  if (!domainTableBody) return;

  try {
    const domains = await getDomains();
    
    if (domains.length === 0) {
      domainTableBody.innerHTML = '<tr><td colspan="11" class="empty-message">Henüz domain eklenmedi.</td></tr>';
      return;
    }

    domainTableBody.innerHTML = domains.map(domain => {
      const sslStatusClass = domain.ssl_status.includes('✅') ? 'success' : 'danger';
      const domainStatusClass = domain.domain_status.includes('✅') ? 'success' : 'danger';
      
      return `
        <tr>
          <td><strong>${domain.domain}</strong></td>
          <td style="color:#888;">${domain.ssl_start}</td>
          <td>${domain.ssl_end}</td>
          <td><span class="day-info">${domain.ssl_days} Gün</span></td>
          <td><span class="badge ${sslStatusClass}">${domain.ssl_status}</span></td>
          <td><span class="badge ${domainStatusClass}">${domain.domain_status}</span></td>
          <td style="color:#888;">${domain.domain_start}</td>
          <td>${domain.domain_end}</td>
          <td><span class="day-info">${domain.domain_days} Gün</span></td>
          <td style="font-size: 11px; color:#666;">${domain.ssl_issuer}</td>
          <td>
            <button class="btn-danger btn-sm" onclick="deleteDomainEntry('${domain.domain}')">SİL</button>
          </td>
        </tr>
      `;
    }).join('');

  } catch (error) {
    console.error('Domain listesi yüklenemedi:', error);
    domainTableBody.innerHTML = '<tr><td colspan="11" class="empty-message">Domain listesi yüklenirken hata oluştu</td></tr>';
  }
}

async function handleAddDomain() {
  const domainInput = document.getElementById('domainInput') as HTMLInputElement;
  const addDomainBtn = document.getElementById('addDomainBtn');
  const domain = domainInput?.value.trim();
  
  if (!domain) {
    alert('Lütfen bir domain girin!');
    return;
  }

  if (addDomainBtn) {
    addDomainBtn.textContent = 'Sorgulanıyor...';
    addDomainBtn.setAttribute('disabled', 'true');
  }

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const result = await invoke('check_ssl_certificate', { domain }) as any;
    
    await saveDomain(result);
    await loadDomains();
    
    if (domainInput) domainInput.value = '';
    
    alert('Domain başarıyla eklendi!');
  } catch (error) {
    console.error('Domain kontrol hatası:', error);
    alert(`Hata: ${error}`);
  } finally {
    if (addDomainBtn) {
      addDomainBtn.textContent = 'Ekle ve Sorgula';
      addDomainBtn.removeAttribute('disabled');
    }
  }
}

async function handleRefreshAllDomains() {
  const refreshAllDomainsBtn = document.getElementById('refreshAllDomainsBtn');
  const domains = await getDomains();
  
  if (domains.length === 0) {
    alert('Güncellenecek domain yok!');
    return;
  }

  if (refreshAllDomainsBtn) {
    refreshAllDomainsBtn.textContent = 'Güncelleniyor...';
    refreshAllDomainsBtn.setAttribute('disabled', 'true');
  }

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    
    for (const domain of domains) {
      try {
        const result = await invoke('check_ssl_certificate', { domain: domain.domain }) as any;
        await saveDomain(result);
      } catch (error) {
        console.error(`${domain.domain} güncellenemedi:`, error);
      }
    }
    
    await loadDomains();
    alert('Tüm domain\'ler güncellendi!');
  } catch (error) {
    console.error('Toplu güncelleme hatası:', error);
    alert(`Hata: ${error}`);
  } finally {
    if (refreshAllDomainsBtn) {
      refreshAllDomainsBtn.textContent = 'Tümünü Güncelle';
      refreshAllDomainsBtn.removeAttribute('disabled');
    }
  }
}

async function deleteDomainEntry(domain: string) {
  if (!confirm(`${domain} domain'ini silmek istediğinizden emin misiniz?`)) {
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
