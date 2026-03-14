# Git Nasıl Kullanılır?

Kapsamlı Git rehberi - Temel komutlardan ileri seviyeye

## İçindekiler
1. [Git Nedir?](#git-nedir)
2. [İlk Kurulum](#ilk-kurulum)
3. [Temel Komutlar](#temel-komutlar)
4. [Branch (Dal) Yönetimi](#branch-dal-yönetimi)
5. [GitHub ile Çalışma](#github-ile-çalışma)
6. [Sık Kullanılan Senaryolar](#sık-kullanılan-senaryolar)
7. [Hata Çözümleri](#hata-çözümleri)

---

## Git Nedir?

Git, kodunuzun versiyonlarını takip eden bir sistemdir. Her değişikliği kaydeder, geri dönmenizi sağlar ve ekip çalışmasını kolaylaştırır.

**Neden Git?**
- ✅ Değişiklikleri takip eder
- ✅ Geri dönüş yapabilirsiniz
- ✅ Ekip çalışması için idealdir
- ✅ Yedekleme sağlar

---

## İlk Kurulum

### Git Yapılandırması
```bash
# Adınızı ayarlayın
git config --global user.name "İsminiz"

# Email'inizi ayarlayın
git config --global user.email "email@example.com"

# Ayarları kontrol edin
git config --list
```

### Yeni Proje Başlatma
```bash
# Mevcut klasörde Git başlat
git init

# Veya GitHub'dan klonla
git clone https://github.com/kullanici/repo.git
```

---

## Temel Komutlar

### 1. Durum Kontrolü
```bash
# Değişiklikleri gör
git status

# Kısa format
git status -s
```

### 2. Değişiklikleri Ekleme (Staging)
```bash
# Tek dosya ekle
git add dosya.txt

# Tüm değişiklikleri ekle
git add .

# Belirli uzantıdaki dosyaları ekle
git add *.js

# Klasör ekle
git add src/
```

### 3. Commit (Kaydetme)
```bash
# Commit yap
git commit -m "Açıklayıcı mesaj"

# Add + commit birlikte
git commit -am "Mesaj"

# Detaylı commit mesajı
git commit
# (Editör açılır, detaylı yazabilirsiniz)
```

**İyi Commit Mesajları:**
```bash
✅ git commit -m "Add user login feature"
✅ git commit -m "Fix navbar responsive bug"
✅ git commit -m "Update README with installation steps"

❌ git commit -m "update"
❌ git commit -m "fix"
❌ git commit -m "asdasd"
```

### 4. Geçmiş Görüntüleme
```bash
# Commit geçmişi
git log

# Kısa format
git log --oneline

# Grafik görünüm
git log --graph --oneline --all

# Son 5 commit
git log -5

# Belirli dosyanın geçmişi
git log dosya.txt
```

### 5. Değişiklikleri Görme
```bash
# Henüz add edilmemiş değişiklikler
git diff

# Add edilmiş değişiklikler
git diff --staged

# İki commit arası fark
git diff commit1 commit2

# Belirli dosya
git diff dosya.txt
```

---

## Branch (Dal) Yönetimi

Branch'ler, ana koddan bağımsız çalışmanızı sağlar.

### Branch Komutları
```bash
# Mevcut branch'leri listele
git branch

# Yeni branch oluştur
git branch yeni-ozellik

# Branch'e geç
git checkout yeni-ozellik

# Oluştur ve geç (kısayol)
git checkout -b yeni-ozellik

# Veya yeni komut (Git 2.23+)
git switch -c yeni-ozellik

# Branch sil
git branch -d yeni-ozellik

# Zorla sil
git branch -D yeni-ozellik
```

### Branch Birleştirme (Merge)
```bash
# main branch'e geç
git checkout main

# Diğer branch'i birleştir
git merge yeni-ozellik

# Merge iptal et (conflict durumunda)
git merge --abort
```

### Conflict (Çakışma) Çözme
```bash
# 1. Conflict olan dosyaları düzenle
# 2. Düzeltilmiş dosyaları ekle
git add cakisan-dosya.txt

# 3. Merge'i tamamla
git commit
```

---

## GitHub ile Çalışma

### Remote (Uzak Repo) Yönetimi
```bash
# Remote ekle
git remote add origin https://github.com/kullanici/repo.git

# Remote'ları listele
git remote -v

# Remote değiştir
git remote set-url origin https://github.com/yeni-url.git

# Remote sil
git remote remove origin
```

### Push (Gönderme)
```bash
# İlk push
git push -u origin main

# Normal push
git push

# Belirli branch
git push origin feature-branch

# Tüm branch'leri push
git push --all

# Tag'leri push
git push --tags

# Zorla push (DİKKATLİ!)
git push -f
```

### Pull (Çekme)
```bash
# Değişiklikleri çek ve birleştir
git pull

# Belirli branch'ten çek
git pull origin main

# Rebase ile çek
git pull --rebase
```

### Fetch (Sadece İndirme)
```bash
# Remote'daki değişiklikleri indir (birleştirme)
git fetch

# Tüm remote'ları fetch
git fetch --all

# Fetch sonrası merge
git merge origin/main
```

---

## Sık Kullanılan Senaryolar

### Senaryo 1: Yeni Özellik Ekleme
```bash
# 1. Yeni branch oluştur
git checkout -b yeni-ozellik

# 2. Kod yaz, değişiklik yap

# 3. Değişiklikleri kaydet
git add .
git commit -m "Add new feature"

# 4. GitHub'a gönder
git push -u origin yeni-ozellik

# 5. GitHub'da Pull Request aç

# 6. Merge edildikten sonra main'e geç
git checkout main
git pull

# 7. Branch'i sil
git branch -d yeni-ozellik
```

### Senaryo 2: Hata Düzeltme
```bash
# 1. Hotfix branch oluştur
git checkout -b hotfix-bug-123

# 2. Hatayı düzelt

# 3. Commit
git commit -am "Fix bug #123"

# 4. Push
git push -u origin hotfix-bug-123

# 5. Pull Request ve merge
```

### Senaryo 3: Başkasının Kodunu Çekme
```bash
# 1. Remote ekle (bir kere)
git remote add upstream https://github.com/orjinal-repo.git

# 2. Değişiklikleri çek
git fetch upstream

# 3. Main branch'e merge et
git checkout main
git merge upstream/main

# 4. Kendi repo'nuza push
git push origin main
```

### Senaryo 4: Son Commit'i Düzeltme
```bash
# Dosyaları düzenle

# Son commit'e ekle
git add .
git commit --amend

# Sadece mesajı değiştir
git commit --amend -m "Yeni mesaj"

# Push (eğer daha önce push ettiyseniz)
git push -f
```

### Senaryo 5: Geri Alma İşlemleri
```bash
# Henüz commit edilmemiş değişiklikleri geri al
git checkout -- dosya.txt

# Tüm değişiklikleri geri al
git checkout -- .

# Add'i geri al (unstage)
git reset dosya.txt

# Son commit'i geri al (değişiklikler kalır)
git reset --soft HEAD~1

# Son commit'i tamamen geri al
git reset --hard HEAD~1

# Belirli commit'e dön
git reset --hard commit-hash

# Yeni commit ile geri al (güvenli)
git revert commit-hash
```

---

## Tag (Etiket) Yönetimi

Tag'ler, belirli commit'leri işaretler (genellikle versiyonlar için).

```bash
# Tag oluştur
git tag v1.0.0

# Açıklamalı tag
git tag -a v1.0.0 -m "Version 1.0.0 release"

# Tag'leri listele
git tag

# Tag'i push et
git push origin v1.0.0

# Tüm tag'leri push et
git push --tags

# Tag sil (local)
git tag -d v1.0.0

# Tag sil (remote)
git push origin :refs/tags/v1.0.0

# Belirli commit'e tag
git tag v1.0.0 commit-hash
```

---

## .gitignore Kullanımı

`.gitignore` dosyası, Git'in görmezden geleceği dosyaları belirtir.

```bash
# .gitignore dosyası oluştur
touch .gitignore
```

**Örnek .gitignore:**
```
# Node modules
node_modules/

# Build dosyaları
dist/
build/

# Log dosyaları
*.log

# Environment dosyaları
.env
.env.local

# IDE ayarları
.vscode/
.idea/

# OS dosyaları
.DS_Store
Thumbs.db

# Tauri signing keys
*.key
!*.key.pub
```

---

## Hata Çözümleri

### "Permission denied" Hatası
```bash
# SSH key oluştur
ssh-keygen -t ed25519 -C "email@example.com"

# Public key'i kopyala
cat ~/.ssh/id_ed25519.pub

# GitHub Settings > SSH Keys'e ekle
```

### "Merge Conflict" Hatası
```bash
# 1. Conflict olan dosyaları aç
# 2. <<<<<<, ======, >>>>>> işaretlerini bul
# 3. Doğru kodu seç, işaretleri sil
# 4. Kaydet

# 5. Add ve commit
git add .
git commit -m "Resolve merge conflict"
```

### "Detached HEAD" Durumu
```bash
# Yeni branch oluştur
git checkout -b yeni-branch

# Veya main'e dön
git checkout main
```

### Yanlış Branch'te Çalıştım
```bash
# Değişiklikleri sakla
git stash

# Doğru branch'e geç
git checkout dogru-branch

# Değişiklikleri geri getir
git stash pop
```

### Push Reddedildi
```bash
# Önce pull yap
git pull --rebase

# Sonra push
git push
```

---

## Git Stash (Geçici Saklama)

Değişiklikleri geçici olarak saklar.

```bash
# Değişiklikleri sakla
git stash

# Mesajlı sakla
git stash save "WIP: new feature"

# Stash listesi
git stash list

# Son stash'i geri getir
git stash pop

# Belirli stash'i geri getir
git stash apply stash@{0}

# Stash'i sil
git stash drop stash@{0}

# Tüm stash'leri sil
git stash clear
```

---

## İleri Seviye Komutlar

### Rebase
```bash
# Branch'i rebase et
git rebase main

# İnteraktif rebase (son 3 commit)
git rebase -i HEAD~3

# Rebase iptal
git rebase --abort

# Rebase devam
git rebase --continue
```

### Cherry-pick
```bash
# Belirli commit'i mevcut branch'e al
git cherry-pick commit-hash

# Birden fazla commit
git cherry-pick commit1 commit2
```

### Reflog (Kayıp Commit'leri Bulma)
```bash
# Tüm işlemleri göster
git reflog

# Kayıp commit'e dön
git reset --hard HEAD@{2}
```

---

## Günlük İş Akışı

### Sabah (İşe Başlarken)
```bash
git checkout main
git pull
git checkout -b yeni-ozellik
```

### Gün İçinde (Düzenli Kayıt)
```bash
git add .
git commit -m "Progress on feature"
git push
```

### Akşam (İş Bitiminde)
```bash
git add .
git commit -m "Complete feature implementation"
git push
# Pull Request aç
```

---

## Faydalı Git Alias'ları

`.gitconfig` dosyanıza ekleyin:

```bash
[alias]
    st = status
    co = checkout
    br = branch
    ci = commit
    unstage = reset HEAD --
    last = log -1 HEAD
    visual = log --graph --oneline --all
    amend = commit --amend --no-edit
```

Kullanım:
```bash
git st          # git status yerine
git co main     # git checkout main yerine
git visual      # güzel log görünümü
```

---

## Kaynaklar

- **Resmi Dokümantasyon**: https://git-scm.com/doc
- **GitHub Guides**: https://guides.github.com
- **Git Cheat Sheet**: https://education.github.com/git-cheat-sheet-education.pdf
- **Interactive Tutorial**: https://learngitbranching.js.org

---

## Hızlı Referans

```bash
# Başlangıç
git init                    # Yeni repo
git clone <url>             # Repo klonla

# Temel
git status                  # Durum
git add .                   # Tümünü ekle
git commit -m "msg"         # Commit
git push                    # Gönder
git pull                    # Çek

# Branch
git branch                  # Listele
git checkout -b <name>      # Oluştur ve geç
git merge <branch>          # Birleştir

# Geri Alma
git checkout -- <file>      # Dosyayı geri al
git reset --soft HEAD~1     # Son commit'i geri al
git revert <commit>         # Commit'i geri al

# Remote
git remote -v               # Remote'ları göster
git push origin <branch>    # Branch push
git pull origin <branch>    # Branch pull
```

---

**by hollmmes**
