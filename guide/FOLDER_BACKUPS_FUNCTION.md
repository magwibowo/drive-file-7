# Fungsi Folder Z:\backups

## Overview

Folder **`Z:\backups`** adalah storage untuk **system backup files** yang dibuat oleh fitur Backup & Restore sistem.

---

## Konfigurasi

### 1. Filesystem Disk (`config/filesystems.php`)

```php
'nas_backups' => [
    'driver' => 'local',
    'root' => env('NAS_DRIVE_PATH', 'Z:\\').'backups',
    'visibility' => 'private',  // ❗ Private - tidak bisa diakses via URL
    'throw' => false,
],
```

**Karakteristik:**
- **Location**: `Z:\backups`
- **Visibility**: Private (secure, tidak exposed ke public)
- **Usage**: System backup storage (BELUM digunakan saat ini)

---

## Status Implementasi

### ❌ BELUM AKTIF - Sistem Masih Menggunakan Path Dinamis

**Current Behavior**: 
- Backup files **TIDAK disimpan** di `Z:\backups`
- Path ditentukan dari **database** (`backup_settings` table)
- Default path: `storage/app/backups` (local storage)

### Kode di BackupController.php (Line 93-94):

```php
$setting = BackupSetting::first();
$backupPath = $setting ? trim($setting->backup_path, "\" \t\n\r\0\x0B") 
                       : storage_path('app/backups');
```

**Artinya**: Super Admin bisa set custom path via UI, tidak otomatis ke `Z:\backups`.

---

## Cara Kerja Sistem Backup Saat Ini

### 1. **User Interface** (SuperAdminBackupPage.js)
```
┌─────────────────────────────────────┐
│   Super Admin Backup Page           │
│                                     │
│  1. Backup Path Setting             │
│     [________________] Simpan Path  │
│                                     │
│  2. Jadwal Otomatis                 │
│     Frequency: [Daily ▼]            │
│     Time: [HH:MM]                   │
│                                     │
│  3. Manual Backup                   │
│     [Create Backup Now]             │
│                                     │
│  4. Daftar Backup                   │
│     - backup_20251227_143015.zip    │
│     - backup_20251226_120000.zip    │
└─────────────────────────────────────┘
```

### 2. **Database Tables**

#### `backup_settings` - Path Configuration
```sql
CREATE TABLE backup_settings (
    id BIGINT PRIMARY KEY,
    backup_path VARCHAR(255),  -- Custom path dari user
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### `backup_schedules` - Jadwal Otomatis
```sql
CREATE TABLE backup_schedules (
    id BIGINT PRIMARY KEY,
    frequency ENUM('off', 'daily', 'weekly', 'monthly', 'yearly'),
    time TIME,
    day_of_week INT,
    day_of_month INT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### `backups` - Metadata Backup Files
```sql
CREATE TABLE backups (
    id BIGINT PRIMARY KEY,
    filename VARCHAR(255),
    path VARCHAR(255),  -- Full path ke file ZIP
    schedule ENUM('manual', 'auto', ...),
    size BIGINT,  -- File size in bytes
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### 3. **Backup Process Flow**

```
User Click "Create Backup"
        ↓
BackupController::run()
        ↓
1. Get backup_path from database
   Default: storage/app/backups
        ↓
2. Create folder if not exists
        ↓
3. Dump MySQL database to .sql
   (using Spatie\DbDumper)
        ↓
4. Create ZIP file
        ↓
5. Add to ZIP:
   - database-dumps/db-backup.sql
   - storage/app/uploads/*
        ↓
6. Save metadata to `backups` table
        ↓
7. Return success response
```

### 4. **Backup File Contents**

```
backup_20251227_143015.zip
├── database-dumps/
│   └── db-backup-20251227_143015.sql  (MySQL dump)
└── storage/
    └── app/
        └── uploads/
            ├── division-name-1/
            │   ├── file1.pdf
            │   └── file2.xlsx
            └── division-name-2/
                └── document.docx
```

---

## API Endpoints

### Backup Routes (`routes/api.php`)

```php
Route::prefix('backups')->group(function () {
    // List all backups
    Route::get('/', [BackupController::class, 'index']);
    
    // Create manual backup
    Route::post('/run', [BackupController::class, 'run']);
    
    // Get/Update backup path settings
    Route::get('/settings', [BackupController::class, 'getSettings']);
    Route::post('/settings', [BackupController::class, 'updateSettings']);
    
    // Get/Update schedule
    Route::get('/schedule', [BackupController::class, 'getSchedule']);
    Route::post('/schedule', [BackupController::class, 'updateSchedule']);
    
    // Download specific backup
    Route::get('/{backup}/download', [BackupController::class, 'download']);
    
    // Delete specific backup
    Route::delete('/{backup}', [BackupController::class, 'destroy']);
});
```

---

## Mengaktifkan Z:\backups sebagai Default Storage

Jika ingin **SEMUA backup otomatis tersimpan di Z:\backups**, modifikasi BackupController:

### Option 1: Hard-code ke Z:\backups

```php
// Line 93-94 di BackupController.php
// SEBELUM:
$setting = BackupSetting::first();
$backupPath = $setting ? trim($setting->backup_path, "\" \t\n\r\0\x0B") 
                       : storage_path('app/backups');

// SESUDAH:
$backupPath = env('NAS_DRIVE_PATH', 'Z:\\') . 'backups';
```

### Option 2: Set Default di Database

```sql
-- Insert default setting ke database
INSERT INTO backup_settings (backup_path, created_at, updated_at)
VALUES ('Z:\\backups', NOW(), NOW());
```

### Option 3: Update via UI

1. Login sebagai Super Admin
2. Buka **Backup & Restore** page
3. Di form "Backup Path", masukkan: `Z:\backups`
4. Klik "Simpan Path"

---

## Keuntungan Menggunakan Z:\backups (NAS)

### ✅ Advantages:

1. **Centralized Storage** - Backup tidak di local server, aman dari disk failure
2. **Large Capacity** - NAS punya storage lebih besar dari local disk
3. **Network Access** - Bisa diakses dari multiple servers (clustering)
4. **Disaster Recovery** - Backup terpisah dari aplikasi server
5. **NAS Metrics Tracking** - Ukuran backup ter-monitor di NAS Monitor dashboard

### ⚠️ Considerations:

1. **Network Dependency** - Butuh koneksi stabil ke NAS
2. **Speed** - Backup via network lebih lambat dari local disk
3. **Permissions** - Ensure web server has write access to Z:\backups

---

## Testing

### Manual Test - Buat Backup ke Z:\backups

```php
// test-backup-to-nas.php
<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\BackupSetting;

// Set backup path ke Z:\backups
$setting = BackupSetting::first();
if ($setting) {
    $setting->update(['backup_path' => 'Z:\\backups']);
} else {
    BackupSetting::create(['backup_path' => 'Z:\\backups']);
}

echo "✅ Backup path set to: Z:\\backups\n";
echo "Now create a backup via UI or run: php artisan backup:run\n";
```

---

## Current vs Proposed Architecture

### SAAT INI:
```
User Upload → storage/app/uploads/ (Local)
Backup Files → Custom path dari database (bisa local, bisa external)
```

### JIKA DIAKTIFKAN:
```
User Upload → Z:\uploads (NAS) ✅ SUDAH AKTIF
Backup Files → Z:\backups (NAS) ⚠️ PERLU AKTIVASI
```

### Fully Integrated NAS Architecture:
```
Z:\
├── uploads\          ✅ User files (AKTIF)
│   ├── uploads\
│   │   ├── division-1\
│   │   └── division-2\
│   └── ...
│
└── backups\          ⚠️ System backups (BELUM AKTIF)
    ├── backup_20251227.zip
    └── backup_20251226.zip
```

---

## Summary

| Aspect | Status | Details |
|--------|--------|---------|
| **Disk Configuration** | ✅ Configured | `nas_backups` disk ready |
| **Folder Existence** | ✅ Created | `Z:\backups` exists |
| **Active Usage** | ❌ Not Used | System uses dynamic path from DB |
| **Default Path** | `storage/app/backups` | Local storage |
| **Recommendation** | 🔄 Activate Now | Set as default for centralized backup |

---

**Apakah ingin saya aktifkan sekarang? Sama seperti uploads, saya bisa set Z:\backups sebagai default backup location.**
