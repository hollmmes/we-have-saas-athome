# We Have SaaS at Home

Modern masaüstü uygulaması - Tauri ile geliştirildi

## Özellikler

- Otomatik güncelleme sistemi
- Responsive admin paneli
- Cross-platform (Windows, macOS, Linux)
- Modern UI/UX
- Hafif ve hızlı

## Geliştirme

### Gereksinimler
- Node.js 20+
- Rust
- npm veya yarn

### Kurulum
```bash
npm install
```

### Geliştirme Modu
```bash
npm run tauri dev
```

### Build
```bash
npm run tauri build
```

Build dosyaları: `src-tauri/target/release/bundle/`

## Otomatik Güncelleme Sistemi

Uygulama otomatik güncelleme özelliğine sahiptir. Kullanıcılar uygulamayı açtığında veya "Güncelleme Kontrol" butonuna tıkladığında yeni versiyon kontrolü yapılır.

### Güncelleme Nasıl Çalışır?

1. Uygulama `latest.json` dosyasını kontrol eder
2. Mevcut versiyondan yeni versiyon varsa kullanıcıya bildirim gösterir
3. Kullanıcı onaylarsa güncelleme otomatik indirilir ve kurulur
4. Uygulama yeniden başlatılır

### Yeni Versiyon Yayınlama

#### 1. Versiyon Numarasını Güncelle

Üç dosyada versiyon numarasını artır:

**src-tauri/tauri.conf.json:**
```json
{
  "version": "0.2.5"
}
```

**src-tauri/Cargo.toml:**
```toml
[package]
version = "0.2.5"
```

**src/main.ts:**
```typescript
<span class="version-text">v0.2.5</span>
```

#### 2. Build Yap

```bash
npm run tauri build
```

#### 3. Installer'ı İmzala

```bash
# PowerShell'de ortam değişkenlerini ayarla
$env:TAURI_SIGNING_PRIVATE_KEY = "PRIVATE_KEY_CONTENT"
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "YOUR_PASSWORD"

# İmzala
npm run tauri signer sign "src-tauri/target/release/bundle/nsis/We Have SaaS at Home_0.2.5_x64-setup.exe"
```

Çıktıdaki "Public signature" değerini kopyala.

#### 4. latest.json Güncelle

```json
{
  "version": "0.2.5",
  "notes": "Yeni özellikler ve düzeltmeler",
  "pub_date": "2024-03-14T23:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "BURAYA_SIGNATURE_YAPISTIR",
      "url": "https://github.com/KULLANICI/REPO/releases/download/v0.2.5/We.Have.SaaS.at.Home_0.2.5_x64-setup.exe"
    }
  }
}
```

#### 5. GitHub'a Yükle

```bash
git add .
git commit -m "Release v0.2.5"
git push
git tag v0.2.5
git push origin v0.2.5
```

GitHub'da release oluştur ve installer'ı yükle:
- https://github.com/KULLANICI/REPO/releases/new
- Tag: v0.2.5
- Dosya: `We Have SaaS at Home_0.2.5_x64-setup.exe`

#### 6. Test Et

Eski versiyonu aç, "Güncelleme Kontrol" butonuna tıkla. Yeni versiyon bildirimi gelecek.

### Güvenlik

**Önemli Dosyalar:**
- `myapp.key` - Private key (GİZLİ - asla paylaşma!)
- `myapp.key.pub` - Public key (güvenli, paylaşılabilir)
- Şifre - Private key şifresi (GİZLİ)

**Güvenlik Kontrolleri:**
- Private key `.gitignore`'da ve Git'e yüklenmez
- Sadece imzalı güncellemeler kabul edilir
- Signature doğrulaması otomatik yapılır

### Sorun Giderme

**"Invalid encoding in minisign data" hatası:**
- Signature doğru kopyalanmamış olabilir
- `latest.json`'da signature alanını kontrol et

**"Download request failed with status: 404" hatası:**
- GitHub release'de dosya adı yanlış olabilir
- URL'de boşluklar nokta ile değiştirilmeli: `We.Have.SaaS.at.Home_0.2.5_x64-setup.exe`

**Güncelleme bulunamıyor:**
- `latest.json` GitHub'a push edildi mi kontrol et
- Versiyon numarası mevcut versiyondan büyük mü kontrol et

## Teknolojiler

- Frontend: TypeScript, Vite, Lucide Icons
- Backend: Rust, Tauri
- Güncelleme: Tauri Updater Plugin
- CI/CD: GitHub Actions (opsiyonel)

## Lisans

Bu proje GNU General Public License v3.0 ile lisanslanmıştır.

Bu, şu anlama gelir:
- Kodu özgürce kullanabilir, değiştirebilir ve dağıtabilirsiniz
- Ticari amaçlarla kullanabilirsiniz
- Değişikliklerinizi de GPL ile paylaşmalısınız
- Kaynak kodu açık kalmalıdır

Detaylar için [LICENSE](./LICENSE) dosyasına bakın.

---

**by hollmmes**
