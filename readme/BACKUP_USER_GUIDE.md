# PANDUAN PENGGUNAAN SISTEM BACKUP

**Sistem**: Backup & Restore di SuperAdminPengaturanPage  
**Tab**: "Backup Data"  
**Status**: ✅ Fully Operational

---

## 🎯 CARA MENGAKSES

### Langkah 1: Login & Navigasi
```
1. Login sebagai Super Admin
2. Sidebar → Klik "⚙️ Pengaturan"
3. Tab Menu → Klik "Backup Data"
```

**URL**: `http://localhost:3000/settings` (lalu pilih tab "Backup Data")

---

## 📦 MEMBUAT BACKUP MANUAL

### Langkah-langkah:

1. **Di bagian "Manajemen Backup"**
   ```
   Klik tombol: "🔄 Buat Backup Sekarang"
   ```

2. **Tunggu Proses**
   - Loading indicator muncul
   - Proses memakan waktu 10-60 detik (tergantung ukuran data)
   - Progress bar tidak ada, hanya loading spinner

3. **Selesai**
   - Notifikasi sukses muncul (hijau)
   - Backup muncul di "Daftar Backup"
   - File tersimpan di `Z:\backups\backup_YYYYMMDD_HHMMSS.zip`

### Isi Backup:
```
backup_20251227_150351.zip
├── database-dumps/
│   └── db-backup-20251227_150351.sql  (Database lengkap)
└── storage/app/uploads/
    └── [Semua file user dari semua divisi]
```

---

## ⚙️ MENGATUR LOKASI PENYIMPANAN BACKUP

### Default Location:
```
Z:\backups  (NAS Storage)
```

### Cara Mengubah Path:

1. **Di section "Pengaturan Backup"**
   ```
   Form "Backup Path": [_________________]
   ```

2. **Masukkan path baru**
   ```
   Contoh:
   - Z:\backups            (Default NAS)
   - D:\my-backups         (Local disk D:)
   - \\SERVER\backups      (Network share)
   ```

3. **Klik "Simpan Path"**
   - Notifikasi sukses muncul
   - Semua backup berikutnya akan tersimpan di path baru
   - Setting disimpan di database (persistent)

### Catatan Penting:
- ⚠️ Folder harus sudah ada dan writable
- ⚠️ Gunakan backslash `\` untuk Windows path
- ⚠️ Test write permission sebelum ubah path

---

## 🕐 MENGATUR JADWAL BACKUP OTOMATIS

### Opsi Frekuensi:
- **Nonaktif** - Tidak ada backup otomatis
- **Harian** - Setiap hari pada jam tertentu
- **Mingguan** - Setiap minggu pada hari & jam tertentu
- **Bulanan** - Setiap bulan pada tanggal & jam tertentu
- **Tahunan** - Setiap tahun pada bulan, tanggal & jam tertentu

### Contoh Konfigurasi:

#### **Daily Backup** (Setiap Hari Jam 2 Pagi)
```
Frekuensi: [Harian ▼]
Waktu: [02:00]
```
Klik "Simpan Jadwal"

#### **Weekly Backup** (Setiap Minggu Jam 3 Pagi)
```
Frekuensi: [Mingguan ▼]
Waktu: [03:00]
Hari: [Minggu ▼]  (0=Minggu, 1=Senin, ..., 6=Sabtu)
```

#### **Monthly Backup** (Setiap Tanggal 1 Jam 4 Pagi)
```
Frekuensi: [Bulanan ▼]
Waktu: [04:00]
Tanggal: [1]  (1-31)
```

#### **Yearly Backup** (Setiap 1 Januari Jam 5 Pagi)
```
Frekuensi: [Tahunan ▼]
Waktu: [05:00]
Tanggal: [1]
Bulan: [1]  (1=Januari, 2=Februari, ..., 12=Desember)
```

### Implementasi Teknis:
```bash
# Laravel Task Scheduler (via cron job)
# File: app/Console/Commands/CheckBackupSchedule.php

# Tambahkan di crontab server:
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

---

## 📊 MELIHAT DAFTAR BACKUP

### Tabel Backup Menampilkan:
```
┌──────────────────────────────┬────────┬─────────────────┬────────┐
│ Nama File                    │ Ukuran │ Tanggal         │ Aksi   │
├──────────────────────────────┼────────┼─────────────────┼────────┤
│ backup_20251227_150351.zip   │ 67 MB  │ 27/12/25 15:03  │ ⬇️ 🗑️  │
│ backup_20251226_020000.zip   │ 65 MB  │ 26/12/25 02:00  │ ⬇️ 🗑️  │
│ backup_20251225_020000.zip   │ 63 MB  │ 25/12/25 02:00  │ ⬇️ 🗑️  │
└──────────────────────────────┴────────┴─────────────────┴────────┘
```

### Informasi Kolom:
- **Nama File**: Format `backup_YYYYMMDD_HHMMSS.zip`
- **Ukuran**: Size dalam bytes/KB/MB/GB (auto format)
- **Tanggal**: Timestamp pembuatan backup
- **Aksi**: Tombol Download & Delete

### Pagination:
- Default: 10 backups per halaman
- Navigasi: Prev / Next buttons
- Sorting: Terbaru di atas (descending by created_at)

---

## ⬇️ DOWNLOAD BACKUP

### Cara Download:

1. **Di "Daftar Backup"**
   - Cari backup yang ingin didownload
   - Klik tombol **"⬇️ Download"**

2. **Proses Download**
   - File ZIP langsung ter-download
   - Nama file: `backup_YYYYMMDD_HHMMSS.zip`
   - Browser akan tanya lokasi save (atau auto-download)

3. **Verifikasi**
   - Check Downloads folder
   - Extract ZIP untuk lihat isi
   - Pastikan database & uploads ada

### Format File:
```
Type: ZIP Archive
Contains: 
  - SQL file (database dump)
  - User uploaded files (all divisions)
```

---

## 🗑️ HAPUS BACKUP

### Cara Menghapus:

1. **Di "Daftar Backup"**
   - Cari backup yang ingin dihapus
   - Klik tombol **"🗑️ Hapus"**

2. **Konfirmasi**
   ```
   Modal konfirmasi muncul:
   "Apakah Anda yakin ingin menghapus backup [nama file]?"
   
   [Batal]  [Hapus]
   ```

3. **Setelah Konfirmasi**
   - File fisik dihapus dari server (Z:\backups)
   - Record dihapus dari database (backups table)
   - Notifikasi sukses muncul
   - Tabel refresh otomatis

### ⚠️ PERHATIAN:
- **Tidak bisa di-undo!**
- File backup yang dihapus **HILANG PERMANEN**
- Pastikan sudah download jika perlu backup tersebut

---

## 🔧 TROUBLESHOOTING

### ❌ Backup Gagal: "Permission Denied"

**Penyebab**: Web server tidak punya akses write ke folder backup

**Solusi**:
```powershell
# Beri full permission ke folder Z:\backups
icacls Z:\backups /grant "Everyone:(OI)(CI)F" /T
```

### ❌ Backup Gagal: "MySQL Dump Error"

**Penyebab**: Path mysqldump tidak ditemukan

**Solusi**:
```env
# Tambahkan di .env
MYSQL_DUMP_PATH=C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\
```

### ❌ Backup Terlalu Besar

**Penyebab**: Banyak file besar di uploads

**Solusi**:
1. Bersihkan file tidak terpakai di storage/app/uploads
2. Exclude file besar dari backup (edit BackupController.php)
3. Gunakan compression level lebih tinggi

### ❌ Schedule Tidak Jalan

**Penyebab**: Laravel scheduler tidak aktif

**Solusi**:
```bash
# Tambahkan cron job di server
* * * * * cd /path-to-project && php artisan schedule:run >> /dev/null 2>&1

# Test manual:
php artisan backup:run
```

### ❌ Download Gagal

**Penyebab**: File backup sudah dihapus atau corrupt

**Solusi**:
1. Check apakah file masih ada di Z:\backups
2. Buat backup baru jika file hilang
3. Check disk space jika download terputus

---

## 📈 BEST PRACTICES

### 1. Retention Policy
```
Jangan simpan backup terlalu lama, gunakan aturan:
- Daily backups: Keep 7 hari
- Weekly backups: Keep 4 minggu
- Monthly backups: Keep 12 bulan
- Yearly backups: Keep 5 tahun
```

### 2. Backup Timing
```
Schedule backup saat traffic rendah:
- Recommended: 02:00 - 05:00 (dini hari)
- Avoid: 08:00 - 17:00 (jam kerja)
```

### 3. Storage Management
```
Monitor disk space Z:\backups:
- Check setiap minggu
- Alert jika > 80% full
- Hapus backup lama otomatis
```

### 4. Testing
```
Test restore backup secara berkala:
- Monthly: Restore backup ke test environment
- Verify: Database & files intact
- Document: Restore procedure
```

### 5. Security
```
Protect backup files:
- Folder Z:\backups: Private visibility
- Download: Authenticated users only
- Encryption: Consider encrypting sensitive backups
```

---

## 🎯 CHECKLIST BACKUP RUTIN

### ☑️ Harian
- [ ] Check backup otomatis berhasil
- [ ] Verify file size normal (tidak 0 bytes)

### ☑️ Mingguan
- [ ] Review daftar backup
- [ ] Hapus backup lama (> 7 hari untuk daily)
- [ ] Check disk space Z:\backups

### ☑️ Bulanan
- [ ] Test restore 1 backup random
- [ ] Verify schedule masih aktif
- [ ] Update retention policy jika perlu

### ☑️ Tahunan
- [ ] Archive backup penting ke external storage
- [ ] Review & update backup strategy
- [ ] Document restore procedures

---

## 💡 TIPS & TRICKS

### Tip 1: Multiple Backup Locations
Untuk keamanan ekstra, set 2 backup path:
```
1. Primary: Z:\backups (NAS)
2. Secondary: Manual download ke eksternal HDD
```

### Tip 2: Naming Convention
Filename sudah otomatis format `backup_YYYYMMDD_HHMMSS.zip`
```
Contoh: backup_20251227_150351.zip
         └─────┬──────┘ └──┬──┘
          Tanggal      Waktu
```

### Tip 3: Quick Restore
Untuk restore cepat:
```
1. Extract backup ZIP
2. Import SQL: mysql -u root database < db-backup.sql
3. Copy uploads: xcopy storage\app\uploads C:\laragon\...\storage\app\uploads /E /Y
```

### Tip 4: Monitoring via NAS Monitor
Backup di Z:\backups ter-track otomatis:
```
Tab "NAS Monitor":
- Storage Usage: Lihat total backup size
- File Count: Jumlah backup files
- IOPS: Backup activity
```

---

## ❓ FAQ

**Q: Berapa lama waktu backup?**  
A: Tergantung ukuran data. Rata-rata 10-60 detik untuk database + uploads 50-100MB.

**Q: Apakah backup bisa dijadwalkan multiple times per day?**  
A: Saat ini hanya 1 schedule. Untuk multiple, edit CheckBackupSchedule.php.

**Q: Apakah backup include .env file?**  
A: Tidak. Hanya database dump + storage/app/uploads. .env harus backup manual.

**Q: Bisa backup ke cloud storage (Google Drive, Dropbox)?**  
A: Belum. Saat ini local/NAS only. Bisa custom via Storage driver Laravel.

**Q: Apakah ada limit jumlah backup?**  
A: Tidak ada limit. Dibatasi hanya oleh disk space Z:\backups.

**Q: Backup corrupt, bagaimana?**  
A: Buat backup baru. Corrupt biasanya karena process interrupted.

---

**DOKUMENTASI LENGKAP**: BACKUP_SYSTEM_COMPARISON.md  
**SUPPORT**: Contact Super Admin atau IT Team
