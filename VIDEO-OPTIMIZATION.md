# Video Optimizasyon Rehberi

## Kalite Seçenekleri

### Ultra Kalite (CRF 15)
- **En yüksek kalite** - Neredeyse kayıpsız
- **Preset**: Slow (yavaş encode, en iyi sıkıştırma)
- **Tune**: Film (sinema kalitesi)
- **Kullanım**: Profesyonel işler, arşivleme
- **Dosya boyutu**: En büyük
- **Encode süresi**: En uzun

### Yüksek Kalite (CRF 18)
- **Çok iyi kalite** - Gözle fark edilmez kayıp
- **Preset**: Medium (dengeli)
- **Tune**: Film
- **Kullanım**: YouTube, sosyal medya paylaşımları
- **Dosya boyutu**: Büyük
- **Encode süresi**: Orta

### Orta Kalite (CRF 23) - ÖNERİLEN
- **İyi kalite** - Çoğu kullanım için yeterli
- **Preset**: Medium
- **Tune**: Film
- **Kullanım**: Genel amaçlı, web paylaşımı
- **Dosya boyutu**: Orta
- **Encode süresi**: Orta

### Düşük Kalite (CRF 28)
- **Kabul edilebilir kalite** - Küçük boyut öncelikli
- **Preset**: Fast (hızlı encode)
- **Kullanım**: Hızlı paylaşım, ön izleme
- **Dosya boyutu**: Küçük
- **Encode süresi**: Kısa

### Çok Düşük Kalite (CRF 32)
- **Düşük kalite** - Minimum boyut
- **Preset**: Very Fast (çok hızlı encode)
- **Kullanım**: Ön izleme, test videoları
- **Dosya boyutu**: En küçük
- **Encode süresi**: En kısa

## FFmpeg Optimizasyon Parametreleri

### Video Codec Ayarları
- **Codec**: H.264 (libx264) - En uyumlu format
- **Profile**: High - Modern cihazlar için optimize
- **Level**: 4.1 - 1080p desteği
- **Pixel Format**: yuv420p - Maksimum uyumluluk

### Audio Ayarları
- **Codec**: AAC - Evrensel destek
- **Bitrate**: 128k (optimize), 192k (birleştirme)
- **Sample Rate**: 48000 Hz - Profesyonel standart

### Web Optimizasyonu
- **faststart**: Metadata dosyanın başına taşınır
- Progressive download için gerekli
- Web player'larda anında oynatma

### CRF (Constant Rate Factor) Nedir?
- 0-51 arası değer (0 = kayıpsız, 51 = en düşük kalite)
- 15-28 arası önerilen aralık
- Her +6 CRF ≈ %50 dosya boyutu azalması
- Kalite/boyut dengesi için en iyi yöntem

## Video Birleştirme

Video birleştirme işlemi:
- **Re-encode** ile yapılır (copy değil)
- **CRF 18** ile yüksek kalite
- Farklı codec/çözünürlükteki videoları birleştirebilir
- Tüm videolar aynı formata dönüştürülür

## Performans İpuçları

1. **Hızlı test için**: "Çok Düşük" preset kullanın
2. **Paylaşım için**: "Orta Kalite" yeterli
3. **Arşivleme için**: "Ultra" veya "Yüksek" kullanın
4. **Büyük dosyalar**: Daha yüksek CRF seçin (28-32)
5. **Kısa videolar**: Düşük CRF kullanabilirsiniz (15-18)

## Teknik Detaylar

### Preset Karşılaştırması
- **ultrafast**: 10x hızlı, %50 daha büyük dosya
- **veryfast**: 5x hızlı, %30 daha büyük dosya
- **fast**: 2x hızlı, %15 daha büyük dosya
- **medium**: Dengeli (önerilen)
- **slow**: 2x yavaş, %10 daha küçük dosya
- **veryslow**: 5x yavaş, %15 daha küçük dosya

### Tune Parametresi
- **film**: Sinema içeriği için optimize
- Grain preservation (film tanesi koruma)
- Daha iyi detay koruması
- Yüksek kalite encode

## Öneriler

### Sosyal Medya
- **Instagram**: CRF 23, Medium preset
- **YouTube**: CRF 18-20, Medium preset
- **TikTok**: CRF 23-25, Fast preset
- **Twitter**: CRF 25-28, Fast preset

### Profesyonel Kullanım
- **Arşiv**: CRF 15-18, Slow preset
- **Editing**: CRF 15, Slow preset
- **Delivery**: CRF 18-20, Medium preset

### Kişisel Kullanım
- **Aile videoları**: CRF 20-23
- **Ekran kayıtları**: CRF 23-28
- **Ön izleme**: CRF 28-32
