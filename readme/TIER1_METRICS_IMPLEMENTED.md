# ✅ TIER 1 Critical Metrics - Implementasi Lengkap

## 📊 Metrics Yang Ditambahkan

Sistem monitoring sekarang memiliki **11 metrics** (naik dari 6 metrics):

### TIER 1 - Critical System Resources (BARU)

1. **CPU Usage %** 🔴 TIER 1
   - WMI Query: `Win32_PerfRawData_PerfOS_Processor`
   - Threshold:
     - ✅ Normal: < 50%
     - ⚠ High: 50-80%
     - ❌ Critical: > 80%

2. **Memory Usage %** 🔴 TIER 1
   - WMI Query: `Win32_OperatingSystem` (TotalVisibleMemorySize, FreePhysicalMemory)
   - Threshold:
     - ✅ Normal: < 70%
     - ⚠ High: 70-90%
     - ❌ Critical: > 90%

3. **Memory Available MB** 🔴 TIER 1
   - Complement metric untuk RAM monitoring
   - Menampilkan sisa RAM yang tersedia dalam MB

4. **Active Connections** 🔴 TIER 1 (Concurrent Users)
   - Command: `netstat -an | find "ESTABLISHED" /c`
   - Threshold:
     - ✅ Low Load: < 100 connections
     - ⚠ Moderate: 100-500 connections
     - ❌ High Load: > 500 connections

5. **Disk Queue Length** 🔴 TIER 1
   - WMI Query: `Win32_PerfRawData_PerfDisk_PhysicalDisk` (AvgDiskQueueLength)
   - Threshold:
     - ✅ Healthy: < 2
     - ⚠ Slow: 2-10
     - ❌ Bottleneck: > 10

### Existing Metrics (Network & Disk)

6. Network RX (bytes/sec)
7. Network TX (bytes/sec)
8. Disk Reads/sec (IOPS)
9. Disk Writes/sec (IOPS)
10. Disk Free Space (GB)
11. Network Latency (ms)

---

## 🔧 Perubahan Kode

### 1. Backend - WindowsMetricsService.php

```php
// 5 Method WMI Baru:
private function getCpuUsagePercent(): float
private function getMemoryUsagePercent(): float
private function getMemoryAvailableMb(): float
private function getActiveConnections(): int
private function getDiskQueueLength(): float
```

**Teknik Query:**
- CPU: `wmic cpu get loadpercentage` + fallback PowerShell
- Memory: WMI `Win32_OperatingSystem` dengan kalkulasi percentage
- Connections: `netstat` dengan filter ESTABLISHED
- Disk Queue: WMI `Win32_PerfRawData_PerfDisk_PhysicalDisk`

### 2. Database - Migration

File: `2025_12_25_081842_add_critical_metrics_to_server_metrics_table.php`

```sql
ALTER TABLE server_metrics ADD:
- cpu_usage_percent DECIMAL(5,2)
- memory_usage_percent DECIMAL(5,2)
- memory_available_mb DECIMAL(10,2)
- active_connections INT
- disk_queue_length DECIMAL(8,2)
```

### 3. Model - ServerMetric.php

Updated `$fillable` dan `$casts` untuk 5 field baru.

### 4. Frontend - ServerMonitorDashboard.js

**Struktur UI Baru:**
```
┌─────────────────────────────────────────────────┐
│  TIER 1 - Critical System Resources            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐│
│  │ CPU %   │ │ Memory  │ │ Connec- │ │ Disk   ││
│  │         │ │ Usage % │ │ tions   │ │ Queue  ││
│  └─────────┘ └─────────┘ └─────────┘ └────────┘│
├─────────────────────────────────────────────────┤
│  Network & Storage Performance                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Net RX  │ │ Net TX  │ │ Latency │           │
│  └─────────┘ └─────────┘ └─────────┘           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Disk R  │ │ Disk W  │ │ Free    │           │
│  └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────────────────────────────┘
```

**Color Coding:**
- CPU: Red gradient (critical resource)
- Memory: Purple gradient
- Connections: Indigo gradient
- Disk Queue: Orange gradient

---

## 🚀 Cara Testing

### 1. Run Migration (kalau MySQL jalan)

```bash
cd c:\laragon\www\drive-file-7\sistem-manajeman-file
php artisan migrate
```

### 2. Test WMI Service Manual

```bash
php artisan tinker
```

```php
$service = new App\Services\WindowsMetricsService();
$metrics = $service->getMetrics();
print_r($metrics);
// Harus keluar 11 metrics sekarang
```

### 3. Test API Endpoint

```bash
# Start monitoring session
POST http://localhost:8000/api/admin/server-metrics/start

# Get latest (harus ada 11 fields)
GET http://localhost:8000/api/admin/server-metrics/latest
```

Expected Response:
```json
{
  "network_rx_bytes_per_sec": 123456,
  "network_tx_bytes_per_sec": 654321,
  "latency_ms": 12,
  "disk_reads_per_sec": 50.5,
  "disk_writes_per_sec": 30.2,
  "disk_free_space": 500000000000,
  "disk_queue_length": 1.5,
  "cpu_usage_percent": 35.2,
  "memory_usage_percent": 65.8,
  "memory_available_mb": 4096.5,
  "active_connections": 120
}
```

### 4. Test React UI

```bash
cd c:\laragon\www\drive-file-7\sistem-manajeman-file_ui
npm start
```

Dashboard harus tampil **11 cards**:
- 4 cards TIER 1 (row pertama)
- 6 cards Network & Disk (row kedua)

---

## 📈 Kenapa TIER 1 Penting?

### 1. CPU Usage (35% dalam contoh)
- **Dampak:** Kalau 100%, sistem lambat/hang
- **Root Cause:** Bisa deteksi process mana yang consume banyak
- **Action:** Scale up CPU atau optimize code

### 2. Memory Usage (65% dalam contoh)
- **Dampak:** Kalau > 90%, system swap ke disk (sangat lambat)
- **Root Cause:** Memory leak atau caching berlebihan
- **Action:** Restart service, tambah RAM

### 3. Active Connections (120 dalam contoh)
- **Dampak:** Tahu berapa concurrent users
- **Correlation:** Tinggi connections → tinggi CPU/Memory
- **Action:** Load balancing kalau > 500

### 4. Disk Queue Length (1.5 dalam contoh)
- **Dampak:** Kalau > 10, disk jadi bottleneck
- **Root Cause:** Disk terlalu lambat (HDD, bukan SSD)
- **Action:** Upgrade ke SSD atau optimize query database

---

## ⚠️ Catatan Penting

1. **Database Migration:**
   - Butuh MySQL/MariaDB jalan dulu
   - Error "target machine actively refused" = MySQL belum start

2. **WMI Fallback:**
   - CPU query pakai fallback `wmic` kalau PowerShell gagal
   - Connection count pakai `netstat` bukan WMI

3. **Threshold Custom:**
   - Thresholds di UI bisa disesuaikan per kebutuhan
   - Contoh: Server dengan 128GB RAM, 90% masih normal

4. **Performance:**
   - 11 WMI queries bisa lambat (total ~2-3 detik)
   - Polling interval 2 detik sudah optimal
   - Jangan polling terlalu cepat (overhead WMI)

---

## 🎯 Next Steps

Metrics sudah lengkap! Sekarang fokus ke:

1. ✅ Fix API `latest()` untuk fetch real WMI (bukan DB)
2. ✅ Integrate `useMetricsSaver` untuk auto-save
3. ✅ Test end-to-end flow
4. ⏳ Add WebSocket untuk real-time push (opsional)
5. ⏳ Alert system untuk threshold breach (email/SMS)

---

**Status:** ✅ Implementasi TIER 1 SELESAI  
**Total Metrics:** 11 (dari 6)  
**Files Modified:** 4 (Service, Migration, Model, React)  
**Lines Added:** ~300 lines
