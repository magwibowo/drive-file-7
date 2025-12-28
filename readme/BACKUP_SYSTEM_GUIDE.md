# 📦 Sistem Backup Terintegrasi - Panduan Lengkap

## 🎯 Overview
Sistem backup baru telah sepenuhnya terintegrasi ke dalam **SuperAdminPengaturanPage** sebagai tab "**Backup Data**". Sistem ini menggantikan SuperAdminBackupPage yang lama dengan arsitektur modular yang lebih maintainable.

---

## 🏗️ Arsitektur Sistem

### **Frontend Components** (React 18)
```
├── pages/
│   └── BackupPage.js                    # Main backup page (integrated in SuperAdminPengaturanPage)
│       ├── BackupToolbar.js             # Create manual backup button
│       ├── BackupSetting.js             # Path & schedule configuration
│       └── BackupTable.js               # List, download, delete backups
└── services/
    └── api.js                           # API methods for backup operations
```

### **Backend Components** (Laravel 10)
```
├── app/Http/Controllers/Api/
│   └── BackupController.php             # Handles all backup operations
├── app/Models/
│   ├── Backup.php                       # Backup metadata model
│   ├── BackupSetting.php                # Backup path configuration
│   └── BackupSchedule.php               # Automated backup schedule
└── routes/
    └── api.php                          # RESTful API routes
```

### **Database Tables**
```sql
1. backups               → Stores backup file metadata (filename, size, created_at)
2. backup_settings       → Stores backup path configuration (default: Z:\backups)
3. backup_schedules      → Stores automated backup schedules (frequency, time, day)
```

---

## 🔧 Fitur-Fitur Utama

### 1️⃣ **Manual Backup Creation**
- **Komponen**: BackupToolbar.js
- **Fungsi**: Create backup on-demand via button click
- **Process**:
  1. User clicks "➕ Buat Backup Manual"
  2. Frontend calls `POST /api/backups/run`
  3. Backend creates ZIP containing:
     - Database dump (MySQL export)
     - Uploaded files from `storage/app/uploads`
  4. ZIP saved to configured backup path (default: `Z:\backups`)
  5. Metadata saved to `backups` table
  6. Success notification shown

**Backend Logic** (BackupController.php):
```php
public function run(Request $request) {
    // 1. Get backup path from database (default: Z:\backups)
    $setting = BackupSetting::first();
    $defaultPath = env('NAS_DRIVE_PATH', 'Z:\\') . 'backups';
    $backupPath = $setting ? trim($setting->backup_path) : $defaultPath;

    // 2. Create backup directory if not exists
    if (!file_exists($backupPath)) {
        mkdir($backupPath, 0755, true);
    }

    // 3. Generate filename: backup_YYYYMMDD_HHMMSS.zip
    $timestamp = date('Ymd_His');
    $zipFilename = 'backup_' . $timestamp . '.zip';
    $zipFilePath = $backupPath . DIRECTORY_SEPARATOR . $zipFilename;

    // 4. Dump database using Spatie DbDumper
    $dbDumpFile = storage_path('app/db-backup-' . $timestamp . '.sql');
    MySql::create()
        ->setDbName(config('database.connections.mysql.database'))
        ->setUserName(config('database.connections.mysql.username'))
        ->setPassword(config('database.connections.mysql.password'))
        ->dumpToFile($dbDumpFile);

    // 5. Create ZIP archive
    $zip = new ZipArchive();
    $zip->open($zipFilePath, ZipArchive::CREATE | ZipArchive::OVERWRITE);
    
    // Add database dump
    $zip->addFile($dbDumpFile, 'database.sql');
    
    // Add uploaded files
    $uploadsDir = storage_path('app/uploads');
    if (is_dir($uploadsDir)) {
        $files = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($uploadsDir)
        );
        foreach ($files as $file) {
            if (!$file->isDir()) {
                $filePath = $file->getRealPath();
                $relativePath = 'uploads/' . substr($filePath, strlen($uploadsDir) + 1);
                $zip->addFile($filePath, $relativePath);
            }
        }
    }
    
    $zip->close();

    // 6. Save metadata to database
    Backup::create([
        'filename' => $zipFilename,
        'size' => filesize($zipFilePath),
        'path' => $zipFilePath
    ]);

    return response()->json([
        'message' => 'Backup berhasil dibuat',
        'filename' => $zipFilename
    ]);
}
```

---

### 2️⃣ **Backup Path Configuration**
- **Komponen**: BackupSetting.js
- **Fungsi**: Configure custom backup storage location
- **Default Path**: `Z:\backups` (NAS storage)
- **API Endpoints**:
  - `GET /api/backups/settings` → Get current path
  - `POST /api/backups/settings` → Update path

**Usage**:
1. Navigate to **Pengaturan** → **Backup Data** tab
2. Find "Lokasi Backup" section
3. Enter custom path (e.g., `D:\MyBackups` or `Z:\backups`)
4. Click "Simpan Pengaturan"
5. All future backups will use new path

**Backend Validation**:
```php
public function updateSettings(Request $request): JsonResponse {
    $request->validate([
        'backup_path' => 'required|string'
    ]);

    $path = str_replace('"', '', $request->backup_path); // Clean quotes
    
    $setting = BackupSetting::first();
    if ($setting) {
        $setting->update(['backup_path' => $path]);
    } else {
        BackupSetting::create(['backup_path' => $path]);
    }

    return response()->json([
        'message' => 'Backup path updated successfully',
        'backup_path' => $setting->backup_path
    ]);
}
```

---

### 3️⃣ **Automated Backup Scheduling**
- **Komponen**: BackupSetting.js (schedule section)
- **Fungsi**: Schedule automatic backups
- **Frequencies**: Daily, Weekly, Monthly, Yearly, Off
- **API Endpoints**:
  - `GET /api/backups/schedule` → Get current schedule
  - `POST /api/backups/schedule` → Update schedule

**Schedule Options**:
- **Daily**: Run at specific time (e.g., 02:00 AM)
- **Weekly**: Run on specific day + time (e.g., Monday 02:00 AM)
- **Monthly**: Run on specific day of month + time (e.g., 1st day 02:00 AM)
- **Yearly**: Run on specific month + day + time (e.g., January 1st 02:00 AM)
- **Off**: Disable automated backups

**Implementation** (Backend):
```php
public function updateSchedule(Request $request): JsonResponse {
    $request->validate([
        'frequency'    => 'required|string|in:off,daily,weekly,monthly,yearly',
        'time'         => 'nullable|string',
        'day_of_week'  => 'nullable|string',
        'day_of_month' => 'nullable|integer|min:1|max:31',
        'month'        => 'nullable|integer|min:1|max:12',
    ]);

    $data = $request->only([
        'frequency', 'time', 'day_of_week', 'day_of_month', 'month'
    ]);

    $schedule = BackupSchedule::first();
    if ($schedule) {
        $schedule->update($data);
    } else {
        BackupSchedule::create($data);
    }

    return response()->json([
        'message' => 'Schedule updated successfully',
        'schedule' => $schedule
    ]);
}
```

**Note**: Untuk automated execution, perlu setup Laravel Task Scheduling:
```bash
# Add to crontab (Linux/Mac) or Task Scheduler (Windows)
* * * * * cd /path-to-project && php artisan schedule:run >> /dev/null 2>&1
```

Create command in `app/Console/Commands/BackupCommand.php`:
```php
<?php
namespace App\Console\Commands;
use Illuminate\Console\Command;
use App\Http\Controllers\Api\BackupController;

class BackupCommand extends Command {
    protected $signature = 'backup:run';
    protected $description = 'Run automatic backup';

    public function handle() {
        $controller = new BackupController();
        $controller->run(request());
        $this->info('Backup completed successfully!');
    }
}
```

Register in `app/Console/Kernel.php`:
```php
protected function schedule(Schedule $schedule) {
    $backupSchedule = \App\Models\BackupSchedule::first();
    
    if ($backupSchedule && $backupSchedule->frequency !== 'off') {
        $time = $backupSchedule->time ?? '02:00';
        
        switch ($backupSchedule->frequency) {
            case 'daily':
                $schedule->command('backup:run')->dailyAt($time);
                break;
            case 'weekly':
                $schedule->command('backup:run')
                    ->weeklyOn($backupSchedule->day_of_week, $time);
                break;
            case 'monthly':
                $schedule->command('backup:run')
                    ->monthlyOn($backupSchedule->day_of_month, $time);
                break;
            case 'yearly':
                $schedule->command('backup:run')
                    ->yearlyOn($backupSchedule->month, $backupSchedule->day_of_month, $time);
                break;
        }
    }
}
```

---

### 4️⃣ **Backup List & Management**
- **Komponen**: BackupTable.js
- **Fungsi**: Display all backups with actions
- **Columns**:
  - Nama File (e.g., `backup_20250127_083212.zip`)
  - Ukuran (formatted: 67.85 MB)
  - Tanggal (formatted: 27-01-2025 08:32:12)
  - Aksi (Download, Delete)

**API Endpoints**:
- `GET /api/backups` → List all backups
- `GET /api/backups/{id}/download` → Download specific backup
- `DELETE /api/backups/{id}` → Delete specific backup

**Download Implementation**:
```javascript
const handleDownload = async (id) => {
    const backup = backups.find((b) => b.id === id);
    try {
        const res = await downloadBackup(id);
        const url = window.URL.createObjectURL(
            new Blob([res.data], { type: "application/zip" })
        );
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", backup.filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        console.error("Gagal mengunduh backup:", error);
    }
};
```

**Delete Implementation**:
```javascript
const handleDelete = async (id) => {
    const backup = backups.find((b) => b.id === id);
    if (window.confirm(`Apakah Anda yakin ingin menghapus backup ${backup.filename}?`)) {
        try {
            await deleteBackup(id);
            await loadBackups(); // Refresh list
            setNotification({
                visible: true,
                message: "Backup berhasil dihapus.",
                type: "success",
            });
        } catch (err) {
            setNotification({
                visible: true,
                message: "Gagal menghapus backup!",
                type: "error",
            });
        }
    }
};
```

---

## 🚀 Cara Penggunaan

### **Mengakses Halaman Backup**
1. Login sebagai **Super Admin**
2. Navigate: **Sidebar** → **Pengaturan**
3. Click tab **"Backup Data"**
4. Halaman BackupPage akan muncul dengan 3 sections:
   - Manual Backup Toolbar
   - Pengaturan Backup (Path & Schedule)
   - Daftar Backup

### **Membuat Backup Manual**
1. Di halaman Backup Data, cari toolbar section
2. Click button **"➕ Buat Backup Manual"**
3. Button akan berubah jadi **"⏳ Membuat Backup..."**
4. Tunggu proses selesai (biasanya 10-30 detik)
5. Notification muncul: **"Backup manual berhasil dibuat."**
6. Backup baru muncul di tabel dengan nama `backup_YYYYMMDD_HHMMSS.zip`

### **Mengatur Path Backup**
1. Scroll ke section **"Pengaturan Backup"**
2. Find input field **"Lokasi Backup"**
3. Enter custom path:
   - **NAS Storage**: `Z:\backups` (default)
   - **Local Disk**: `D:\MyBackups`
   - **Network Share**: `\\ServerName\Backups`
4. Click **"Simpan Pengaturan"**
5. Notification: **"Backup path berhasil disimpan!"**

### **Mengatur Jadwal Otomatis**
1. Scroll ke section **"Jadwal Backup Otomatis"**
2. Select **Frekuensi**:
   - Off, Daily, Weekly, Monthly, Yearly
3. Configure additional fields based on frequency:
   - **Daily**: Only set **Waktu** (e.g., 02:00)
   - **Weekly**: Set **Waktu** + **Hari dalam Minggu** (e.g., Monday)
   - **Monthly**: Set **Waktu** + **Tanggal** (e.g., 1st day)
   - **Yearly**: Set **Waktu** + **Tanggal** + **Bulan** (e.g., January 1st)
4. Click **"Simpan Jadwal"**
5. Notification: **"Jadwal backup berhasil disimpan!"**

### **Download Backup**
1. Find backup file in table (section "Daftar Backup")
2. Click **"⬇️ Download"** button on desired backup row
3. Browser will download ZIP file automatically
4. Save to desired location

### **Hapus Backup**
1. Find backup file in table
2. Click **"🗑️ Hapus"** button
3. Confirmation dialog appears: **"Apakah Anda yakin ingin menghapus backup {filename}?"**
4. Click **"OK"** to confirm
5. Backup removed from table and physical file deleted
6. Notification: **"Backup berhasil dihapus."**

---

## 📊 API Endpoints

### **Backup Operations**
| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/backups` | List all backups | - | `{data: [{id, filename, size, created_at}]}` |
| POST | `/api/backups/run` | Create manual backup | - | `{message: "Backup berhasil dibuat", filename: "backup_20250127_083212.zip"}` |
| GET | `/api/backups/{id}/download` | Download specific backup | - | Binary ZIP file |
| DELETE | `/api/backups/{id}` | Delete specific backup | - | `{message: "Backup deleted successfully"}` |

### **Settings Operations**
| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/backups/settings` | Get backup path | - | `{status: "success", backup_path: "Z:\\backups"}` |
| POST | `/api/backups/settings` | Update backup path | `{backup_path: "D:\\MyBackups"}` | `{message: "Backup path updated successfully", backup_path: "D:\\MyBackups"}` |

### **Schedule Operations**
| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/backups/schedule` | Get current schedule | - | `{status: "success", schedule: {frequency, time, day_of_week, day_of_month, month}}` |
| POST | `/api/backups/schedule` | Update schedule | `{frequency: "daily", time: "02:00", day_of_week: null, day_of_month: null, month: null}` | `{message: "Schedule updated successfully", schedule: {...}}` |

---

## 🔍 Troubleshooting

### **Problem 1: Backup Creation Failed**
**Symptoms**: Notification "Gagal membuat backup manual" muncul
**Possible Causes**:
1. Backup path tidak memiliki write permission
2. Disk space tidak cukup
3. MySQL dump binary tidak ditemukan

**Solutions**:
1. Check folder permission:
   ```bash
   # Windows (PowerShell as Admin)
   icacls "Z:\backups" /grant Users:F
   ```
2. Check disk space:
   ```bash
   # PowerShell
   Get-PSDrive Z | Select-Object Used,Free
   ```
3. Set MySQL dump path di `.env`:
   ```env
   MYSQL_DUMP_PATH=C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin
   ```

### **Problem 2: Download Not Working**
**Symptoms**: Click download tapi file tidak terdownload
**Possible Causes**:
1. File tidak ada di server
2. Browser blocked download

**Solutions**:
1. Check file exists:
   ```bash
   # PowerShell
   Test-Path "Z:\backups\backup_20250127_083212.zip"
   ```
2. Check browser download settings (allow downloads from localhost)

### **Problem 3: Schedule Not Running**
**Symptoms**: Jadwal sudah dibuat tapi backup tidak jalan otomatis
**Possible Causes**:
1. Laravel scheduler belum di-setup
2. Cron job belum dibuat

**Solutions**:
1. **Windows**: Setup Task Scheduler
   - Open Task Scheduler
   - Create Basic Task
   - Name: "Laravel Scheduler"
   - Trigger: Daily at 00:00
   - Action: Start a program
   - Program: `C:\laragon\bin\php\php-8.3.17-Win32-vs16-x64\php.exe`
   - Arguments: `artisan schedule:run`
   - Start in: `C:\laragon\www\drive-file-7\sistem-manajeman-file`

2. **Linux/Mac**: Add crontab
   ```bash
   crontab -e
   # Add this line:
   * * * * * cd /path-to-project && php artisan schedule:run >> /dev/null 2>&1
   ```

### **Problem 4: Large Database Timeout**
**Symptoms**: Backup gagal untuk database besar (>1GB)
**Solution**: Increase PHP timeout in `php.ini`:
```ini
max_execution_time = 600  ; 10 minutes
memory_limit = 1024M      ; 1GB
```

---

## 🎨 UI/UX Features

### **Notifications**
- **Success**: Green notification with ✅ icon
- **Error**: Red notification with ❌ icon
- **Auto-dismiss**: 5 seconds
- **Position**: Top-right corner

### **Loading States**
- **Creating Backup**: Button shows "⏳ Membuat Backup..." with disabled state
- **Loading Table**: Shows "Memuat data..." in table row

### **Pagination**
- **Items per page**: 10 backups
- **Navigation**: Numbered buttons (1, 2, 3, ...)
- **Active page**: Highlighted with blue background

### **Date Formatting**
- **Format**: DD-MM-YYYY HH:MM:SS
- **Locale**: Indonesian (id-ID)
- **Example**: 27-01-2025 08:32:12

### **File Size Formatting**
- **Units**: B, KB, MB, GB, TB
- **Precision**: 2 decimal places
- **Example**: 67.85 MB

---

## 🔒 Security

### **Access Control**
- Only **Super Admin** role can access backup page
- Middleware: `auth:sanctum` + `role:super-admin`

### **Path Validation**
- Strip quotes from user input
- Validate directory exists before creation
- Prevent directory traversal attacks

### **File Download Security**
- Stream files instead of direct path exposure
- Validate backup ownership before download
- Set proper Content-Type headers

**Backend Implementation**:
```php
public function download($id) {
    $backup = Backup::findOrFail($id);
    
    if (!file_exists($backup->path)) {
        return response()->json(['message' => 'File not found'], 404);
    }
    
    return response()->download(
        $backup->path,
        $backup->filename,
        ['Content-Type' => 'application/zip']
    );
}
```

---

## 📝 Database Schema

### **backups** table
```sql
CREATE TABLE backups (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    size BIGINT UNSIGNED NOT NULL,
    path TEXT NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
```

### **backup_settings** table
```sql
CREATE TABLE backup_settings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    backup_path TEXT NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

-- Default data
INSERT INTO backup_settings (backup_path, created_at, updated_at) 
VALUES ('Z:\\backups', NOW(), NOW());
```

### **backup_schedules** table
```sql
CREATE TABLE backup_schedules (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    frequency ENUM('off', 'daily', 'weekly', 'monthly', 'yearly') NOT NULL DEFAULT 'off',
    time VARCHAR(10) NULL,           -- e.g., "02:00"
    day_of_week VARCHAR(10) NULL,    -- e.g., "monday"
    day_of_month INT NULL,           -- e.g., 1-31
    month INT NULL,                  -- e.g., 1-12
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
```

---

## ✅ Migration Checklist

### **✅ Completed**
- [x] Removed old SuperAdminBackupPage.js and CSS
- [x] Removed /pengaturan/backup route from App.js
- [x] Fixed component import naming (BackupSettings → BackupSetting)
- [x] Refactored BackupToolbar to use props instead of duplicate logic
- [x] Verified all API routes registered in api.php
- [x] Verified BackupController has all required methods
- [x] Verified database migrations executed
- [x] Verified default backup_settings record exists (Z:\backups)
- [x] Verified no compilation errors

### **⚠️ Pending (Optional)**
- [ ] Setup Laravel Task Scheduling for automated backups
- [ ] Create BackupCommand for artisan command
- [ ] Register schedule in Kernel.php
- [ ] Setup Windows Task Scheduler or Linux crontab
- [ ] Add backup restoration feature
- [ ] Add backup encryption option
- [ ] Add email notification on backup completion

---

## 📞 Support

**Issues?**
1. Check browser console for errors (F12)
2. Check Laravel logs: `storage/logs/laravel.log`
3. Verify NAS drive mounted: `Test-Path Z:\`
4. Check disk space: `Get-PSDrive Z`

**Contact**: System Administrator

---

**Last Updated**: 2025-01-27  
**Version**: 2.0 (New Integrated System)  
**Author**: Development Team
