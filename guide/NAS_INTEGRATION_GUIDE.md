# 📘 NAS Integration Setup Guide

## 🎯 Quick Start

Implementasi NAS (Network Attached Storage) sudah selesai! Berikut langkah-langkah untuk mengaktifkannya:

---

## 📋 Prerequisites

1. **NAS Windows** sudah setup dengan shared folder
2. **Network connectivity** antara Server dan NAS via LAN switch
3. **SMB/CIFS** service aktif di NAS
4. **Laragon** (Laravel + MySQL) sudah running

---

## 🚀 Setup Instructions

### **STEP 1: Konfigurasi NAS Windows**

Di **NAS Computer**, buat shared folder:

```powershell
# Buka PowerShell as Administrator di NAS

# 1. Buat folder
New-Item -Path "D:\LaravelStorage" -ItemType Directory -Force

# 2. Share folder
New-SmbShare -Name "LaravelStorage" `
    -Path "D:\LaravelStorage" `
    -FullAccess "Everyone"

# 3. Verifikasi
Get-SmbShare -Name "LaravelStorage"
```

---

### **STEP 2: Map Drive di Server**

Di **Server Laragon**, map NAS sebagai drive Z:

```powershell
# Buka PowerShell as Administrator di Server

# Map drive (persistent)
net use Z: \\192.168.1.100\LaravelStorage /persistent:yes

# Jika perlu credentials
net use Z: \\192.168.1.100\LaravelStorage /user:Administrator "password" /persistent:yes

# Verifikasi
dir Z:\
```

---

### **STEP 3: Update Environment Variables**

Edit file `.env` di Laravel:

```env
# Enable NAS
NAS_ENABLED=true

# NAS Configuration
NAS_IP=192.168.1.100
NAS_SHARE_NAME=LaravelStorage
NAS_DRIVE_LETTER=Z:
NAS_DRIVE_PATH=Z:\

# Optional: Use NAS as default storage
FILESYSTEM_DISK=nas
```

---

### **STEP 4: Run Database Migration**

```bash
cd sistem-manajeman-file

php artisan migrate
```

Expected output:
```
Migration table created successfully.
Migrating: 2025_12_27_000001_create_nas_metrics_table
Migrated:  2025_12_27_000001_create_nas_metrics_table
```

---

### **STEP 5: Test NAS Connection**

```bash
php test-nas-connection.php
```

Expected output:
```
╔══════════════════════════════════════════════════════════════════╗
║              NAS CONNECTION & CONFIGURATION TEST                 ║
╚══════════════════════════════════════════════════════════════════╝

✅ PASS - Network Connectivity
✅ PASS - SMB Service Available
✅ PASS - Drive Mapped
✅ PASS - NAS Monitoring Service Working
✅ PASS - Storage Capacity Retrieved
```

---

## 🧪 Testing

### **Test API Endpoints**

```bash
# Test connection
curl http://localhost:8000/api/admin/nas-metrics/test

# Poll metrics (save to database)
curl -X POST http://localhost:8000/api/admin/nas-metrics/poll

# Get latest metrics
curl http://localhost:8000/api/admin/nas-metrics/latest

# Get statistics
curl http://localhost:8000/api/admin/nas-metrics/stats
```

---

### **Test via Browser**

1. Login sebagai **Super Admin**
2. Navigate ke **Settings** atau **Dashboard**
3. Tambahkan NAS Monitor component:

```jsx
import NasMonitorDashboard from '../components/NasMonitor/NasMonitorDashboard';

// Di dalam component
<NasMonitorDashboard />
```

---

## 📊 Features Implemented

### **Backend:**
- ✅ `NasMonitoringService` - Service untuk monitoring NAS
- ✅ `NasMetricsController` - API endpoints
- ✅ `nas_metrics` table - Database untuk log metrics
- ✅ Migration untuk `storage_location` column di `files` table
- ✅ Config filesystems dengan disk `nas`, `nas_uploads`, `nas_backups`

### **Frontend:**
- ✅ `NasMonitorDashboard` - React component
- ✅ `useNasMetrics` - Custom hook dengan auto-polling
- ✅ Real-time monitoring dengan refresh otomatis

### **API Routes:**
```
GET  /api/admin/nas-metrics/test     - Test connection
POST /api/admin/nas-metrics/poll     - Poll & save metrics
GET  /api/admin/nas-metrics/latest   - Get latest metrics
GET  /api/admin/nas-metrics/history  - Get metrics history
GET  /api/admin/nas-metrics/stats    - Get statistics
```

---

## 🎯 Usage Examples

### **Upload File ke NAS**

```php
use Illuminate\Support\Facades\Storage;

// Upload ke NAS
Storage::disk('nas')->put('documents/file.pdf', $fileContent);

// Upload dengan original filename
$path = $request->file('upload')->store('uploads', 'nas');

// Check if file exists on NAS
if (Storage::disk('nas')->exists('documents/file.pdf')) {
    // File exists
}

// Download from NAS
return Storage::disk('nas')->download('documents/file.pdf');
```

---

### **Dual Storage (Local + NAS)**

```php
// Try NAS first, fallback to local
$disk = env('NAS_ENABLED', false) && Storage::disk('nas')->exists('.') 
    ? 'nas' 
    : 'local';

$path = $request->file('upload')->store('uploads', $disk);

// Save to database dengan storage location
File::create([
    'path_penyimpanan' => $path,
    'storage_location' => $disk, // 'local' atau 'nas'
]);
```

---

## 📈 Monitoring Metrics

Dashboard menampilkan:
- **Storage Capacity** - Free/Used/Total space
- **Network Latency** - Ping time ke NAS
- **Read Speed** - MB/s
- **Write Speed** - MB/s
- **File Count** - Total files di NAS
- **Status** - Healthy/Warning/Critical

---

## ⚠️ Troubleshooting

### **Drive not mapped?**
```powershell
net use Z: \\192.168.1.100\LaravelStorage /persistent:yes
```

### **Permission denied?**
```powershell
# Grant permissions
icacls Z:\ /grant "IIS_IUSRS:(OI)(CI)F" /T
icacls Z:\ /grant "IUSR:(OI)(CI)F" /T
```

### **Cannot ping NAS?**
- Check network cable
- Verify NAS IP address
- Check firewall settings

### **SMB port 445 blocked?**
```powershell
# Check firewall
netsh advfirewall firewall set rule group="File and Printer Sharing" new enable=Yes
```

---

## 🔄 Next Steps

1. ✅ Setup monitoring alert untuk low disk space
2. ✅ Implement backup schedule ke NAS
3. ✅ Add file sync mechanism (local ↔ NAS)
4. ✅ Setup RAID di NAS untuk redundancy
5. ✅ Configure automated backup retention policy

---

## 📚 Documentation

- **Config:** `config/filesystems.php`
- **Service:** `app/Services/NasMonitoringService.php`
- **Controller:** `app/Http/Controllers/Api/NasMetricsController.php`
- **Migration:** `database/migrations/2025_12_27_000001_create_nas_metrics_table.php`
- **Frontend:** `src/components/NasMonitor/NasMonitorDashboard.js`
- **Hook:** `src/hooks/useNasMetrics.js`

---

**Status:** ✅ **READY FOR PRODUCTION**

**Estimated Setup Time:** 15-20 minutes

**Last Updated:** December 27, 2025
