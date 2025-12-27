# 📊 PENJELASAN: Throughput, IOPS, dan Latency

## 🎯 OVERVIEW

Ada **3 kategori utama** performance metrics yang dimonitor:

1. **Network Throughput** (RX/TX) - Seberapa banyak data yang ditransfer per detik
2. **Disk IOPS** (Read/Write) - Seberapa cepat disk melakukan operasi I/O
3. **Network Latency** (Ping) - Seberapa lama waktu respon jaringan

---

## 1️⃣ NETWORK THROUGHPUT (RX/TX)

### 📖 Definisi
**Throughput** = Jumlah data yang berhasil ditransfer melalui network dalam satuan waktu

- **RX (Receive)**: Data yang **diterima** (download)
- **TX (Transmit)**: Data yang **dikirim** (upload)
- **Satuan**: Bytes per second → Convert ke KB/s, MB/s, GB/s

### 🔧 Cara Kerja Implementasi

**Query Command:**
```powershell
Get-Counter "\Network Interface(*)\Bytes Received/sec"
Get-Counter "\Network Interface(*)\Bytes Sent/sec"
```

**Flow:**
```
┌─────────────────────────────────────────────────────────────────┐
│ 1. PowerShell Get-Counter query semua network interfaces       │
│    - WiFi adapter                                               │
│    - Ethernet adapter                                           │
│    - Virtual adapters (VPN, Docker, etc)                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Windows Performance Counter menghitung dalam 1 detik:       │
│    - Hitung total bytes diterima semua interfaces              │
│    - Hitung total bytes dikirim semua interfaces               │
│    - Return nilai "Cooked" (sudah dikalkulasi per detik)       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. PHP parse hasil:                                             │
│    - Sum semua interfaces (multiple adapters)                   │
│    - Round ke 2 decimal                                         │
│    - Return sebagai bytes/sec                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Frontend convert ke format user-friendly:                   │
│    - < 1024 bytes   → "X bytes/s"                              │
│    - < 1 MB         → "X KB/s"                                  │
│    - < 1 GB         → "X MB/s"                                  │
│    - >= 1 GB        → "X GB/s"                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Implementasi Code:**
```php
private function getNetworkBytesReceived(): float
{
    try {
        $output = [];
        
        // Query ALL network interfaces dan SUM hasilnya
        exec('powershell -Command "(Get-Counter \"\\Network Interface(*)\\Bytes Received/sec\").CounterSamples | Measure-Object -Property CookedValue -Sum | Select-Object -ExpandProperty Sum"', $output);
        
        if (!empty($output) && is_numeric($output[0])) {
            return round((float) $output[0], 2); // Bytes per second
        }

        return 0.0;
    } catch (Exception $e) {
        return 0.0;
    }
}
```

### 📊 Contoh Real-World

**Idle System:**
```json
{
  "network_rx_bytes_per_sec": 4040.37,    // ~4 KB/s (background apps)
  "network_tx_bytes_per_sec": 5216.67     // ~5 KB/s (telemetry, sync)
}
```

**Downloading File 10 MB:**
```json
{
  "network_rx_bytes_per_sec": 10485760,   // 10 MB/s (download aktif)
  "network_tx_bytes_per_sec": 8192        // ~8 KB/s (ACK packets)
}
```

**Zoom Meeting:**
```json
{
  "network_rx_bytes_per_sec": 524288,     // 512 KB/s (video receive)
  "network_tx_bytes_per_sec": 262144      // 256 KB/s (video send)
}
```

### 🎯 Interpretasi

| RX/TX Value | Status | Aktivitas Umum |
|-------------|--------|----------------|
| **0-10 KB/s** | 🟢 Idle | Background sync, telemetry |
| **10-100 KB/s** | 🟢 Light | Web browsing, email |
| **100 KB-1 MB/s** | 🟡 Moderate | Video streaming (720p), file download |
| **1-10 MB/s** | 🟠 Active | Video streaming (1080p), large files |
| **10-100 MB/s** | 🔴 Heavy | 4K streaming, bulk downloads, backups |
| **> 100 MB/s** | 🔴 Very Heavy | Gigabit transfer, data center |

### ⚠️ Why Performance Counter vs Raw WMI?

**SALAH (Before Fix):**
```php
// WMI Raw Counter - Nilai kumulatif sejak boot
$wmiQuery = "SELECT BytesReceivedPersec FROM Win32_PerfRawData_Tcpip_NetworkInterface";
// Returns: 3,059,821,579 bytes (total sejak boot) ❌
```

**BENAR (After Fix):**
```powershell
# Performance Counter - Nilai real-time per detik
Get-Counter "\Network Interface(*)\Bytes Received/sec"
# Returns: 4040.37 bytes/sec (real-time rate) ✅
```

---

## 2️⃣ DISK IOPS (Input/Output Operations Per Second)

### 📖 Definisi
**IOPS** = Jumlah operasi baca/tulis yang diselesaikan disk per detik

- **Read IOPS**: Operasi **baca** dari disk
- **Write IOPS**: Operasi **tulis** ke disk
- **Satuan**: Operations per second (bukan bytes!)

### 🔧 Cara Kerja Implementasi

**Query Command:**
```powershell
Get-Counter "\PhysicalDisk(_Total)\Disk Reads/sec"
Get-Counter "\PhysicalDisk(_Total)\Disk Writes/sec"
```

**Flow:**
```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Aplikasi request baca file (e.g., open document.docx)       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Operating System translate ke disk I/O operations:          │
│    - File metadata read (1 operation)                           │
│    - File content read (multiple operations, depends on size)   │
│    - Each operation = 1 IOPS                                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Windows Performance Counter hitung dalam 1 detik:           │
│    - Total read operations: 15 ops                              │
│    - Total write operations: 8 ops                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Return sebagai float (e.g., 15.2 reads/sec, 8.5 writes/sec) │
└─────────────────────────────────────────────────────────────────┘
```

**Implementasi Code:**
```php
private function getDiskReadsPersec(): float
{
    try {
        $output = [];
        
        // Query physical disk total (all partitions combined)
        exec('powershell -Command "(Get-Counter \"\\PhysicalDisk(_Total)\\Disk Reads/sec\").CounterSamples.CookedValue"', $output);
        
        if (!empty($output) && is_numeric($output[0])) {
            return round((float) $output[0], 2); // Operations per second
        }

        return 0.0;
    } catch (Exception $e) {
        return 0.0;
    }
}
```

### 📊 Contoh Real-World

**Idle System:**
```json
{
  "disk_reads_per_sec": 0.99,   // ~1 IOPS (background indexing)
  "disk_writes_per_sec": 0      // No writes
}
```

**Opening Large File (500 MB):**
```json
{
  "disk_reads_per_sec": 450,    // 450 IOPS (intensive read)
  "disk_writes_per_sec": 2      // Minimal writes (metadata)
}
```

**Database Heavy Query:**
```json
{
  "disk_reads_per_sec": 1200,   // High random reads
  "disk_writes_per_sec": 350    // Frequent updates
}
```

**File Copy (10 GB):**
```json
{
  "disk_reads_per_sec": 800,    // Read from source
  "disk_writes_per_sec": 800    // Write to destination
}
```

### 🎯 Interpretasi

#### HDD (Mechanical Hard Drive)
| IOPS | Status | Performance |
|------|--------|-------------|
| **0-50** | 🟢 Normal | Idle/light use |
| **50-100** | 🟡 Moderate | Normal workload |
| **100-150** | 🟠 Busy | HDD limit approaching |
| **> 150** | 🔴 Bottleneck | HDD can't keep up! |

**Max IOPS:** 80-150 IOPS (7200 RPM HDD)

#### SSD (Solid State Drive)
| IOPS | Status | Performance |
|------|--------|-------------|
| **0-500** | 🟢 Normal | Light use |
| **500-5,000** | 🟡 Active | Moderate workload |
| **5,000-50,000** | 🟠 Heavy | Intensive operations |
| **> 50,000** | 🔴 Max | Near SSD limit |

**Max IOPS:** 50,000-100,000 IOPS (consumer SSD), 500,000+ (enterprise NVMe)

#### NVMe SSD (High-end)
| IOPS | Status | Performance |
|------|--------|-------------|
| **0-10,000** | 🟢 Normal | Light use |
| **10,000-100,000** | 🟡 Active | Normal workload |
| **100,000-500,000** | 🟠 Heavy | Intensive database/VM |
| **> 500,000** | 🔴 Max | Near hardware limit |

**Max IOPS:** 500,000-1,000,000+ IOPS

### 💡 IOPS vs Throughput - Apa Bedanya?

**IOPS** = Berapa **kali** operasi I/O (tidak peduli ukuran)
- Opening 1000 small files (1 KB each) = **High IOPS**, Low Throughput
- Each file open = 1 operation = 1 IOPS

**Throughput** = Berapa **banyak data** ditransfer (bytes/sec)
- Copying 1 large file (10 GB) = **Low IOPS**, High Throughput
- Only 1 file = Low IOPS, but 10 GB data = High Throughput

**Example:**
```
Scenario 1: Opening 500 JPG photos (each 10 KB)
- IOPS: 500 operations = HIGH ⬆️
- Throughput: 500 × 10 KB = 5 MB total = LOW ⬇️

Scenario 2: Copying 1 video (5 GB)
- IOPS: 1 operation = LOW ⬇️
- Throughput: 5 GB = VERY HIGH ⬆️
```

---

## 3️⃣ NETWORK LATENCY (Ping)

### 📖 Definisi
**Latency** = Waktu yang dibutuhkan data untuk travel dari A ke B dan kembali (round-trip time)

- **Satuan**: Milliseconds (ms)
- **Lower is better**: 1ms = excellent, 200ms = poor
- **Target**: Google DNS (8.8.8.8) - reliable global server

### 🔧 Cara Kerja Implementasi

**Query Command:**
```cmd
ping -n 1 8.8.8.8
```

**Flow:**
```
┌─────────────────────────────────────────────────────────────────┐
│ 1. PHP execute: ping -n 1 8.8.8.8                              │
│    (-n 1 = send only 1 packet, faster)                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Windows ICMP send packet:                                    │
│    T0: 12:00:00.000 → Send ECHO REQUEST to 8.8.8.8            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                  (Travel melalui internet)
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Google DNS (8.8.8.8) receive packet:                        │
│    T1: 12:00:00.026 → Immediately send ECHO REPLY              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                  (Travel kembali ke user)
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Windows receive reply:                                       │
│    T2: 12:00:00.027 → Reply received                           │
│    Round-trip time: T2 - T0 = 27ms                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Parse output dengan regex:                                  │
│    Output: "Reply from 8.8.8.8: bytes=32 time=27ms TTL=118"   │
│    Regex: /time=(\d+)ms/                                        │
│    Extract: 27                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Implementasi Code:**
```php
private function getNetworkLatency(): ?int
{
    try {
        $output = [];
        $returnCode = 0;

        // Execute ping: -n 1 = send only 1 packet
        exec('ping -n 1 8.8.8.8', $output, $returnCode);

        // Parse latency dari output
        if ($returnCode === 0 && !empty($output)) {
            foreach ($output as $line) {
                // Cari pattern: time=XXms
                if (preg_match('/time=(\d+)ms/', $line, $matches)) {
                    return (int) $matches[1]; // Return milliseconds
                }
            }
        }

        return null; // Ping failed
    } catch (Exception $e) {
        return null;
    }
}
```

### 📊 Sample Ping Output

**Successful Ping:**
```
Pinging 8.8.8.8 with 32 bytes of data:
Reply from 8.8.8.8: bytes=32 time=27ms TTL=118

Ping statistics for 8.8.8.8:
    Packets: Sent = 1, Received = 1, Lost = 0 (0% loss),
Approximate round trip times in milli-seconds:
    Minimum = 27ms, Maximum = 27ms, Average = 27ms
```

**Regex Match:**
- Pattern: `/time=(\d+)ms/`
- Match: `time=27ms`
- Captured: `27` (integer)

### 🎯 Interpretasi Latency

| Latency (ms) | Status | Quality | Use Case |
|--------------|--------|---------|----------|
| **< 10ms** | 🟢 Excellent | Ultra-low | Gaming (LAN), High-frequency trading |
| **10-30ms** | 🟢 Very Good | Low | Online gaming, VoIP, video calls |
| **30-50ms** | 🟡 Good | Acceptable | Web browsing, streaming |
| **50-100ms** | 🟡 Fair | Noticeable | Distant servers, mobile network |
| **100-200ms** | 🟠 Poor | Laggy | Satellite, congested network |
| **> 200ms** | 🔴 Very Poor | Unusable | Severe network issues |

### 🌍 Real-World Latency Examples

**Local Network (LAN):**
```json
{
  "latency_ms": 1  // 1ms (same building, wired)
}
```

**Same City (Fiber):**
```json
{
  "latency_ms": 5  // 5ms (Jakarta to Jakarta datacenter)
}
```

**Cross-Country:**
```json
{
  "latency_ms": 27  // 27ms (Jakarta to Singapore Google DNS)
}
```

**Cross-Continent:**
```json
{
  "latency_ms": 180  // 180ms (Jakarta to USA West Coast)
}
```

**Satellite Internet:**
```json
{
  "latency_ms": 600  // 600ms (geostationary satellite)
}
```

### ⚠️ Faktor yang Mempengaruhi Latency

1. **Distance (Physical)**: 
   - Speed of light limit: ~100ms per 10,000 km round-trip
   - Jakarta → Singapore (900km) = ~9ms minimum

2. **Routing (Network Hops)**:
   - Each router adds 1-5ms
   - More hops = higher latency

3. **Network Type**:
   - Fiber: Fastest (low latency)
   - Cable/DSL: Medium
   - 4G/5G: Variable (10-50ms)
   - Satellite: Very high (500-700ms)

4. **Congestion**:
   - Peak hours: +20-50ms
   - Router overload: +50-200ms

5. **WiFi vs Wired**:
   - Wired: +0-2ms
   - WiFi: +2-10ms (interference, signal strength)

### 🔧 Why Ping 8.8.8.8?

**Google Public DNS (8.8.8.8)** dipilih karena:

✅ **Global availability** - Always online, highly reliable
✅ **Fast response** - Optimized for low latency
✅ **Well-known** - Industry standard test target
✅ **Multiple locations** - Anycast routing to nearest server
✅ **Stable** - Consistent performance

**Alternative targets:**
- `1.1.1.1` - Cloudflare DNS (also good)
- `208.67.222.222` - OpenDNS
- Your gateway router - Test local network only

---

## 🧮 CALCULATION EXAMPLES

### Example 1: Download 100 MB File

**Metrics During Download:**
```json
{
  "network_rx_bytes_per_sec": 12500000,    // 12.5 MB/s download
  "network_tx_bytes_per_sec": 8192,        // 8 KB/s (ACK packets)
  "disk_writes_per_sec": 150,              // Writing chunks to disk
  "latency_ms": 28                         // Network round-trip
}
```

**Calculation:**
- **Time to download**: 100 MB ÷ 12.5 MB/s = **8 seconds**
- **Disk operations**: 150 IOPS × 8 sec = **1,200 total I/O ops**
- **TX overhead**: 8 KB/s × 8 sec = **64 KB sent** (TCP ACKs)

### Example 2: Opening 1000 Small Files

**Metrics:**
```json
{
  "network_rx_bytes_per_sec": 0,           // No network
  "network_tx_bytes_per_sec": 0,
  "disk_reads_per_sec": 850,               // HIGH! Random reads
  "disk_writes_per_sec": 5,                // Minimal (metadata)
  "latency_ms": 27
}
```

**Calculation:**
- **IOPS required**: 1000 files = **1000 operations**
- **Time on HDD** (100 IOPS max): 1000 ÷ 100 = **10 seconds** 🐢
- **Time on SSD** (50,000 IOPS): 1000 ÷ 50,000 = **0.02 seconds** ⚡

**Bottleneck**: HDD can't handle high IOPS!

### Example 3: Video Streaming (1080p)

**Metrics:**
```json
{
  "network_rx_bytes_per_sec": 524288,      // 512 KB/s sustained
  "network_tx_bytes_per_sec": 4096,        // 4 KB/s (minimal)
  "disk_writes_per_sec": 25,               // Buffering to cache
  "latency_ms": 35                         // Acceptable for streaming
}
```

**Quality Requirements:**
- **1080p**: 3-5 Mbps = 375-625 KB/s ✅ (512 KB/s meets requirement)
- **Latency**: < 50ms recommended ✅ (35ms is good)
- **Buffering**: If latency > 100ms → buffering occurs

---

## 🎓 KESIMPULAN

### Relationship Between Metrics

```
                    USER ACTION
                        ↓
        ┌───────────────┴───────────────┐
        ↓                               ↓
   NETWORK ACTIVITY              DISK ACTIVITY
        ↓                               ↓
┌───────────────────┐         ┌───────────────────┐
│ THROUGHPUT (RX/TX)│         │   IOPS (R/W)      │
│   How much data   │         │ How many ops      │
│   bytes/sec       │         │   ops/sec         │
└───────────────────┘         └───────────────────┘
        ↓                               ↓
┌───────────────────┐         ┌───────────────────┐
│  LATENCY (Ping)   │         │ DISK QUEUE LENGTH │
│  How fast respond │         │  Waiting ops      │
│   milliseconds    │         │   queue depth     │
└───────────────────┘         └───────────────────┘
```

### When to Worry

| Metric | Warning Sign | Action |
|--------|-------------|--------|
| **RX/TX** | Sustained > 80% bandwidth | Upgrade internet plan |
| **IOPS** | HDD > 100, SSD > 50K | Upgrade to faster disk |
| **Latency** | > 100ms consistently | Check network/ISP |
| **Disk Queue** | > 2 sustained | Disk bottleneck! |

### Performance Optimization Tips

1. **High Latency?**
   - Check WiFi signal strength
   - Switch to wired connection
   - Contact ISP if persistent

2. **Low Throughput?**
   - Check bandwidth usage (other apps?)
   - Test speed: speedtest.net
   - Upgrade plan if maxed out

3. **High IOPS?**
   - Close unnecessary programs
   - Upgrade HDD → SSD
   - Add more RAM (reduce disk swap)

---

**Dokumentasi:** Complete Technical Specification  
**Date:** December 25, 2025  
**System:** Windows Performance Monitoring
