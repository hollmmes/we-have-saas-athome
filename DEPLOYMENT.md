# Deployment Guide - v0.3.0

## Build Tamamlandı ✓

Build başarıyla tamamlandı ve imzalandı.

### Build Dosyaları

- **NSIS Installer**: `src-tauri/target/release/bundle/nsis/We Have SaaS at Home_0.3.0_x64-setup.exe`
- **MSI Installer**: `src-tauri/target/release/bundle/msi/We Have SaaS at Home_0.3.0_x64_en-US.msi`
- **İmza Dosyası**: `src-tauri/target/release/bundle/nsis/We Have SaaS at Home_0.3.0_x64-setup.exe.sig`

### İmza Bilgisi

```
dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVUYlZVaG4yY1hhY0lwNUpYOFZyUGxjNEQ0UFd6ZmgzT1JKS3duZWVxNXN4T3pZZ3hhTHZCcGdRV21rdGlzcmpPY2pGUzlPU0xPdnpqS2V4T0lrcEcxK2phbXZDUVpGa0FnPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzczNTI2NjUzCWZpbGU6V2UgSGF2ZSBTYWFTIGF0IEhvbWVfMC4zLjBfeDY0LXNldHVwLmV4ZQpOSHA3LzI1bi9mRytINmhycUtvZmJoZzNPUGY2Y3dHN3RhSVpVSUhHM1lZckMxYjNqRWJMd2haVjlVdkdiOERjZmtkMTcyUEN6NW9vamlybm13MkFCQT09Cg==
```

## Sonraki Adımlar

### 1. GitHub Release Oluştur

GitHub'da yeni bir release oluştur:

1. GitHub repository'ye git: https://github.com/hollmmes/we-have-saas-athome
2. "Releases" sekmesine tıkla
3. "Create a new release" butonuna tıkla
4. Tag version: `v0.3.0`
5. Release title: `v0.3.0 - Fotoğraf Dönüştürme Servisi`
6. Release notes:
```
## Yeni Özellikler

### Fotoğraf Dönüştürme Servisi
- 7 farklı format desteği: PNG, JPG, WebP, GIF, BMP, ICO, TIFF
- Sürükle-bırak ile kolay dosya yükleme
- Dosya seçici dialog desteği
- Çoklu dosya dönüştürme kuyruğu
- Dönüştürülen fotoğrafları arşivleme
- Özel çıktı klasörü seçimi
- Dosya konumunu açma özelliği
- SQLite ile veri saklama

## Kurulum

Windows için `.exe` dosyasını indirip çalıştırın.
```

7. **Önemli**: Dosya adını şu formatta yükle:
   - `We.Have.SaaS.at.Home_0.3.0_x64-setup.exe` (boşlukları nokta ile değiştir)
   - Dosya yolu: `src-tauri/target/release/bundle/nsis/We Have SaaS at Home_0.3.0_x64-setup.exe`

8. "Publish release" butonuna tıkla

### 2. latest.json'u Commit ve Push Et

```bash
cd we-have-saas-athome
git add latest.json
git commit -m "Update to v0.3.0 - Image Converter Service"
git push origin main
```

### 3. Test Et

1. Eski versiyonu (v0.2.4) çalıştır
2. Header'daki güncelleme ikonuna tıkla
3. Güncelleme bildirimini kontrol et
4. "Güncelle ve Yeniden Başlat" butonuna tıkla
5. Uygulama yeniden başladığında v0.3.0 olduğunu doğrula

## Yeni Özellikler (v0.3.0)

### Fotoğraf Dönüştürme
- Rust tabanlı hızlı dönüştürme
- 7 format desteği
- Sürükle-bırak arayüzü
- Dönüştürme kuyruğu

### Arşiv Yönetimi
- Tüm dönüştürülmüş fotoğrafları görüntüleme
- Dosya silme
- Dosya konumunu açma
- SQLite ile kalıcı veri saklama

### Ayarlar
- Özel çıktı klasörü seçimi
- Varsayılan klasöre dönme

## Teknik Detaylar

### Yeni Rust Komutları
- `convert_image`: Fotoğraf dönüştürme
- `delete_converted_image`: Dosya silme
- `open_file_location`: Dosya konumunu açma
- `get_default_output_path`: Varsayılan klasör yolu

### Yeni Bağımlılıklar
- `image = "0.25"`: Fotoğraf işleme
- `uuid = "1.0"`: Benzersiz ID oluşturma
- `chrono = "0.4"`: Zaman damgası
- `tauri-plugin-sql`: SQLite desteği
- `tauri-plugin-dialog`: Dosya seçici
- `tauri-plugin-fs`: Dosya sistemi

### Veritabanı
- SQLite: `$APPDATA/images.db`
- Tablo: `converted_images`
- Alanlar: id, original_name, converted_name, formats, file_size, output_path, created_at

## Notlar

- `.sig` dosyasını GitHub'a yükleme, imza `latest.json` içinde
- Dosya adındaki boşlukları nokta ile değiştir
- Private key (`myapp.key`) asla commit etme
- Build her zaman `npm run tauri build` ile yap
- İmzalama her build sonrası gerekli
