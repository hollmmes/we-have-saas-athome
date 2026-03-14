# We Have SaaS at Home

Modern masaüstü uygulaması - Tauri ile geliştirildi

## Özellikler

- ✅ Otomatik güncelleme sistemi
- ✅ Responsive admin paneli
- ✅ Cross-platform (Windows, macOS, Linux)
- ✅ Modern UI/UX
- ✅ Hafif ve hızlı

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

## Dağıtım ve Güncelleme

Detaylı dağıtım rehberi için [DEPLOYMENT.md](./DEPLOYMENT.md) dosyasına bakın.

### Hızlı Başlangıç

1. **Güvenlik Anahtarı Oluştur:**
```bash
npm run tauri signer generate -- -w ~/.tauri/myapp.key
```

2. **Public Key'i Config'e Ekle:**
`src-tauri/tauri.conf.json` dosyasındaki `pubkey` alanını güncelle

3. **GitHub'a Push:**
```bash
git add .
git commit -m "Initial release"
git tag v0.1.0
git push origin main
git push origin v0.1.0
```

4. **GitHub Secrets Ekle:**
- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

5. **Endpoint Güncelle:**
`tauri.conf.json` içinde GitHub repo URL'ini güncelle

## Yeni Versiyon Yayınlama

1. Versiyon numarasını güncelle (`tauri.conf.json` ve `Cargo.toml`)
2. Git tag oluştur:
```bash
git tag v0.2.0
git push origin v0.2.0
```
3. GitHub Actions otomatik build yapar ve release oluşturur
4. Kullanıcılar uygulamayı açtığında otomatik güncelleme alır

## Teknolojiler

- **Frontend**: TypeScript, Vite, Lucide Icons
- **Backend**: Rust, Tauri
- **Güncelleme**: Tauri Updater Plugin
- **CI/CD**: GitHub Actions

## Lisans

MIT

---

**by hollmmes**
