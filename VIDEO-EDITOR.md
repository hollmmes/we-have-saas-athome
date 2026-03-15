# Video Editör Kullanım Kılavuzu

## Genel Bakış

Basit ama güçlü bir video editör. CapCut tarzı timeline tabanlı düzenleme ile videolarınızı kesip birleştirebilirsiniz.

## Özellikler

### ✅ Mevcut Özellikler (v1.0)

1. **Medya Kütüphanesi**
   - Video ve ses dosyaları import
   - Thumbnail önizleme
   - Süre gösterimi
   - Drag & drop desteği

2. **Timeline Düzenleme**
   - Video track
   - Ses track
   - Drag & drop ile clip ekleme
   - Clip seçme ve silme

3. **Video Önizleme**
   - Gerçek zamanlı oynatma
   - Play/Pause kontrolleri
   - Zaman göstergesi
   - Timeline scrubber

4. **Clip Özellikleri**
   - Trim (kesme) - başlangıç/bitiş ayarlama
   - Süre gösterimi
   - Clip silme

5. **Dışa Aktarma**
   - 4 kalite seviyesi (Ultra, Yüksek, Orta, Düşük)
   - H.264 codec
   - AAC audio
   - Web optimize (faststart)

## Kullanım

### 1. Medya İçe Aktarma

1. Sol üstteki **+** butonuna tıklayın
2. Video veya ses dosyalarını seçin
3. Dosyalar medya kütüphanesine eklenecek

**Desteklenen Formatlar:**
- Video: MP4, AVI, MOV, MKV, WebM
- Ses: MP3, WAV, AAC

### 2. Timeline'a Ekleme

1. Medya kütüphanesinden bir dosya seçin
2. Sürükleyip timeline'daki track'e bırakın
   - Videolar → Video track
   - Sesler → Ses track
3. Clipler otomatik olarak sırayla eklenir

### 3. Clip Düzenleme

1. Timeline'da bir clip'e tıklayın
2. Sağ panelde özellikler görünür
3. **Trim sliderları** ile başlangıç/bitiş ayarlayın
4. Değişiklikler anında uygulanır

### 4. Önizleme

- **Play/Pause**: Videoyu oynat/duraklat
- **Scrubber**: İstediğiniz noktaya atlayın
- **Zaman**: Mevcut/toplam süre gösterilir

### 5. Dışa Aktarma

1. **Dışa Aktar** butonuna tıklayın
2. Kalite seviyesi seçin
3. **Dışa Aktar** ile işlemi başlatın
4. Video `exported_videos` klasörüne kaydedilir

## Kalite Seçenekleri

| Seviye | CRF | Preset | Kullanım |
|--------|-----|--------|----------|
| Ultra | 15 | Slow | En yüksek kalite |
| Yüksek | 18 | Medium | YouTube, sosyal medya |
| Orta | 23 | Medium | Genel kullanım (önerilen) |
| Düşük | 28 | Fast | Hızlı paylaşım |

## Kısayollar

- **Space**: Play/Pause (yakında)
- **Delete**: Seçili clip'i sil (yakında)
- **Ctrl+Z**: Geri al (yakında)

## İpuçları

1. **Sıralı Ekleme**: Clipler timeline'a sırayla eklenir
2. **Trim Kullanımı**: Gereksiz kısımları kesmek için trim kullanın
3. **Önizleme**: Değişiklikleri önizlemede kontrol edin
4. **Kalite**: Orta kalite çoğu kullanım için yeterli

## Gelecek Özellikler (Roadmap)

### Yakında (v1.1)
- [ ] Clip'leri timeline'da sürükleyip taşıma
- [ ] Clip'leri yeniden sıralama
- [ ] Fade in/out efektleri
- [ ] Ses seviyesi ayarlama
- [ ] Video hızı değiştirme (slow-mo, fast-forward)

### Orta Vadede (v1.2)
- [ ] Geçiş efektleri (transitions)
- [ ] Metin ekleme
- [ ] Filtreler (renk düzeltme)
- [ ] Kırpma (crop)
- [ ] Döndürme (rotate)

### Uzun Vadede (v2.0)
- [ ] Çoklu video track
- [ ] Keyframe animasyonları
- [ ] Chroma key (green screen)
- [ ] Ses efektleri
- [ ] Şablonlar
- [ ] Otomatik altyazı

## Teknik Detaylar

### FFmpeg İşlemleri

**Trim (Kesme):**
```bash
ffmpeg -ss [start] -i input.mp4 -t [duration] -c copy output.mp4
```

**Birleştirme:**
```bash
ffmpeg -f concat -safe 0 -i list.txt -c:v libx264 -crf [quality] output.mp4
```

**Export Parametreleri:**
- Video Codec: H.264 (libx264)
- Audio Codec: AAC, 192k bitrate
- Pixel Format: yuv420p
- Faststart: Web optimize

### Performans

- **Trim**: Çok hızlı (copy codec)
- **Export**: Kaliteye bağlı
  - Ultra: En yavaş, en iyi kalite
  - Düşük: En hızlı, düşük kalite
- **Önizleme**: Gerçek zamanlı

### Dosya Konumları

- **Medya**: Kullanıcı seçimi
- **Temp**: `app_data/temp/`
- **Export**: `app_data/exported_videos/`
- **Thumbnails**: `app_data/thumbnails/`

## Sorun Giderme

### Video önizlemede görünmüyor
- Dosya formatını kontrol edin
- Codec desteğini kontrol edin
- Tarayıcı konsolunu kontrol edin

### Export çok yavaş
- Daha düşük kalite seçin
- Daha kısa videolar kullanın
- Preset'i "fast" yapın

### Ses senkronizasyon sorunu
- Tüm videoların aynı frame rate'e sahip olduğundan emin olun
- Re-encode ile export yapın

## Sınırlamalar

- Maksimum clip sayısı: Sınırsız (performansa bağlı)
- Desteklenen çözünürlük: 4K'ya kadar
- Timeline uzunluğu: Sınırsız
- Tek video/ses track (şimdilik)

## Destek

Sorun bildirmek veya öneride bulunmak için:
- GitHub Issues
- Discord
- Email: support@example.com
