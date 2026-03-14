# Dağıtım ve Güncelleme Rehberi

## 1. İlk Kurulum

### Güvenlik Anahtarı Oluşturma
```bash
npm run tauri signer generate -- -w ~/.tauri/myapp.key
```

Bu komut iki dosya oluşturur:
- `myapp.key` - Private key (GİZLİ TUTUN!)
- `myapp.key.pub` - Public key (tauri.conf.json'a eklenecek)

Public key'i kopyalayıp `src-tauri/tauri.conf.json` dosyasındaki `pubkey` alanına yapıştırın.

## 2. Build Yapma

### Windows için:
```bash
npm run tauri build
```

Build dosyaları: `src-tauri/target/release/bundle/`

### Çıktılar:
- **Windows**: `.msi` ve `.exe` installer
- **macOS**: `.dmg` ve `.app`
- **Linux**: `.deb`, `.AppImage`

## 3. GitHub Releases ile Otomatik Güncelleme

### Adım 1: GitHub Repository Oluştur
1. GitHub'da yeni repo oluştur
2. Kodu push'la

### Adım 2: GitHub Actions Workflow Ekle

`.github/workflows/release.yml` dosyası oluştur:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    strategy:
      matrix:
        platform: [windows-latest, ubuntu-latest, macos-latest]
    
    runs-on: ${{ matrix.platform }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      
      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        env:
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
        run: npm run tauri build
      
      - name: Upload Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            src-tauri/target/release/bundle/**/*.msi
            src-tauri/target/release/bundle/**/*.exe
            src-tauri/target/release/bundle/**/*.dmg
            src-tauri/target/release/bundle/**/*.deb
            src-tauri/target/release/bundle/**/*.AppImage
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Adım 3: GitHub Secrets Ekle
Repository Settings > Secrets and variables > Actions:

1. `TAURI_SIGNING_PRIVATE_KEY`: Private key içeriği
2. `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: Key şifresi (varsa)

### Adım 4: tauri.conf.json'u Güncelle

```json
"endpoints": [
  "https://github.com/KULLANICI_ADI/REPO_ADI/releases/latest/download/latest.json"
]
```

## 4. Yeni Versiyon Yayınlama

### Adım 1: Versiyon Numarasını Güncelle
`src-tauri/tauri.conf.json` ve `src-tauri/Cargo.toml`:
```json
"version": "0.2.0"
```

### Adım 2: Git Tag Oluştur
```bash
git add .
git commit -m "Release v0.2.0"
git tag v0.2.0
git push origin main
git push origin v0.2.0
```

### Adım 3: GitHub Actions Otomatik Build Yapar
- Tag push'landığında otomatik build başlar
- Tüm platformlar için installer oluşturulur
- GitHub Releases'e yüklenir
- `latest.json` otomatik oluşturulur

## 5. Kullanıcılar Nasıl Günceller?

### Otomatik:
- Uygulama her açıldığında güncelleme kontrolü yapar
- Güncelleme varsa kullanıcıya sorar
- Onaylarsa otomatik indirir ve kurar

### Manuel:
- Settings > Check for Updates butonu eklenebilir

## 6. Alternatif Dağıtım Yöntemleri

### A. Kendi Sunucunuz
`latest.json` dosyasını kendi sunucunuzda host edin:

```json
{
  "version": "0.2.0",
  "notes": "Yeni özellikler eklendi",
  "pub_date": "2024-03-14T12:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "...",
      "url": "https://yourserver.com/releases/app-0.2.0-setup.exe"
    }
  }
}
```

### B. Cloudflare R2 / AWS S3
- Ücretsiz/ucuz object storage
- CDN ile hızlı dağıtım

## 7. Test Etme

### Local Test:
```bash
npm run tauri build
# Installer'ı çalıştır ve test et
```

### Güncelleme Test:
1. v0.1.0 build'ini kur
2. v0.2.0 release yap
3. Uygulamayı aç, güncelleme geldiğini gör

## Notlar

- Private key'i asla paylaşmayın
- Her release için versiyon numarasını artırın
- Semantic versioning kullanın (0.1.0, 0.2.0, 1.0.0)
- Breaking changes için major version artırın
