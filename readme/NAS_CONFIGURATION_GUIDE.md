# 📡 NAS Configuration Guide

## ⚠️ Masalah yang Sering Terjadi

### 1. **Latency Selalu 1 ms (Development)**
**Penyebab:**
```env
NAS_IP=127.0.0.1  # ❌ Ini localhost, bukan IP NAS sebenarnya!
```

**Hasil:** Latency akan selalu ~1ms karena ping ke loopback interface, bukan ke NAS device.

---

## ✅ Konfigurasi yang Benar

### **Development Mode (Z:\ adalah Mapped Drive)**

Jika Z:\ sudah di-map ke NAS server (contoh: `\\192.168.1.100\storage`), update `.env`:

```env
# NAS Configuration - PRODUCTION
NAS_ENABLED=true
NAS_IP=192.168.1.100          # ✅ IP NAS yang sebenarnya
NAS_DRIVE_LETTER=Z
NAS_DRIVE_PATH=Z:\
NAS_UPLOADS_PATH=Z:\uploads
NAS_BACKUPS_PATH=Z:\backups
```

**Cara cek IP NAS dari Z:\ drive:**
```powershell
# Windows Command
net use Z:

# Output example:
# Local name        Z:
# Remote name       \\192.168.1.100\storage  👈 Ini IP NAS Anda!
# Resource type     Disk
```

---

### **Production Mode (NAS Server)**

Di server NAS Windows, pastikan konfigurasi:

```env
# NAS Configuration - PRODUCTION SERVER
NAS_ENABLED=true
NAS_IP=192.168.1.100          # IP NAS ini sendiri (bukan 127.0.0.1)
NAS_DRIVE_LETTER=C            # Atau drive lokal di server NAS
NAS_DRIVE_PATH=D:\storage\    # Path lokal di NAS server
NAS_UPLOADS_PATH=D:\storage\uploads
NAS_BACKUPS_PATH=D:\storage\backups
```

---

## 🔧 Deteksi Otomatis (Sudah Diimplementasi)

Service sekarang memiliki **auto-detection** untuk IP NAS:

```php
// app/Services/NasMonitoringService.php

private function detectNasIpFromDrive(): ?string
{
    // Otomatis extract IP dari 'net use Z:' command
    // Contoh: \\192.168.1.100\share → 192.168.1.100
    $command = "net use {$this->nasDrive} 2>nul | findstr /i \"Remote\"";
    $output = shell_exec($command);
    
    if (preg_match('/\\\\\\\\([0-9.]+)\\\\/', $output, $matches)) {
        return $matches[1]; // Return IP real
    }
    
    return null; // Fallback ke NAS_IP dari .env
}
```

---

## 📊 Concurrent Users - Hybrid Approach

Service sekarang menggunakan **2 metode tracking**:

### **Method 1: Database-based (✅ Works on all platforms)**
```php
// Hitung user aktif dalam 15 menit terakhir
$dbUsers = User::where('last_activity_at', '>=', now()->subMinutes(15))
    ->count();
```

**Kapan digunakan:**
- ✅ Development (Windows 10/11)
- ✅ Production (semua OS)
- ✅ Lebih akurat untuk aplikasi web

---

### **Method 2: SMB Sessions (Windows Server only)**
```php
// Hitung SMB network sessions (hanya Windows Server)
$command = 'powershell -Command "(Get-SmbSession | Measure-Object).Count"';
$smbUsers = (int) shell_exec($command);
```

**Kapan digunakan:**
- ✅ Windows Server (2012+)
- ❌ Windows 10/11 (command tidak tersedia)
- ✅ Menghitung koneksi file sharing aktual

---

### **Final Decision Logic**
```php
// Gunakan nilai tertinggi dari kedua metode
return max($dbUsers, $smbUsers);
```

**Kenapa max()?** 
- Database tracking = user login via web app
- SMB sessions = user akses via file explorer
- Max = total user unik dari kedua sumber

---

## 🧪 Testing

### **Test 1: Concurrent Users**
```bash
cd C:\laragon\www\drive-file-7\sistem-manajeman-file
php artisan tinker
```

```php
// Set 3 user sebagai aktif
$users = User::limit(3)->get();
foreach ($users as $user) {
    $user->last_activity_at = now();
    $user->save(['timestamps' => false]);
}

// Test service
$service = new App\Services\NasMonitoringService();
$metrics = $service->getMetrics();

echo $metrics['nas_concurrent_users']; // Output: 3 ✅
```

---

### **Test 2: Real NAS Latency**

**Before fix:**
```
NAS_IP=127.0.0.1
Latency: 1 ms (always) ❌ Tidak realistis
```

**After fix:**
```
NAS_IP=192.168.1.100
Latency: 5-15 ms (varies) ✅ Realistis untuk network
```

**Cara test manual:**
```powershell
# Ping ke IP NAS real
ping 192.168.1.100

# Output:
# Reply from 192.168.1.100: bytes=32 time=8ms TTL=128 ✅
# Reply from 192.168.1.100: bytes=32 time=7ms TTL=128 ✅
# Reply from 192.168.1.100: bytes=32 time=9ms TTL=128 ✅
```

Variasi 7-9 ms = **NORMAL** untuk jaringan LAN.

---

## 📈 Expected Values (Production NAS)

| Metric | Development (localhost) | Production (LAN) | Production (WiFi) |
|--------|------------------------|------------------|-------------------|
| **Latency** | ~1 ms | 5-15 ms | 15-50 ms |
| **Read Speed** | 1000-2000 MB/s | 100-120 MB/s | 20-80 MB/s |
| **Write Speed** | 800-1500 MB/s | 80-100 MB/s | 15-50 MB/s |
| **Read IOPS** | 5000-10000 | 500-2000 | 100-500 |
| **Write IOPS** | 1000-2000 | 200-800 | 50-200 |
| **Concurrent Users** | 0-5 (dev) | 10-50 (real) | 10-50 (real) |

---

## ⚙️ Configuration Checklist

### **Sebelum Deploy ke Production:**

- [ ] Update `NAS_IP` dengan IP NAS sebenarnya (bukan 127.0.0.1)
- [ ] Verify dengan `ping <NAS_IP>` (latency harus 5-50 ms)
- [ ] Test `net use Z:` untuk confirm UNC path
- [ ] Pastikan `UpdateUserActivity` middleware aktif di routes
- [ ] Test concurrent users dengan multiple browser sessions
- [ ] Monitor latency variance (harus bervariasi, tidak selalu sama)

---

## 🔍 Troubleshooting

### **Latency selalu 1 ms**
```bash
# Check .env
NAS_IP=?  # Harus IP real, bukan 127.0.0.1

# Manual test
ping 192.168.1.100  # Ganti dengan IP NAS Anda

# Check drive mapping
net use Z:
```

---

### **Concurrent users selalu 0**
```bash
# Check database
SELECT COUNT(*) FROM users WHERE last_activity_at >= NOW() - INTERVAL 15 MINUTE;

# Check middleware
# Pastikan UpdateUserActivity ada di Kernel.php
```

---

### **Auto-detection tidak jalan**
```powershell
# Test manual
net use Z: 2>nul | findstr /i "Remote"

# Output harus menampilkan:
# Remote name       \\192.168.1.100\storage
```

---

## 📚 References

- **NasMonitoringService.php** - Lines 152-225 (Latency detection)
- **NasMonitoringService.php** - Lines 404-450 (Concurrent users)
- **UpdateUserActivity.php** - Middleware untuk tracking user activity
- **User.php** - getConcurrentUsers() method

---

**Updated:** 2025-12-28  
**Version:** 2.0 (Hybrid concurrent users + Auto IP detection)
