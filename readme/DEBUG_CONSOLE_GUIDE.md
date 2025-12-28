# 🔧 Debug Guide: Console Logs untuk Server Monitor

## 📋 Langkah-langkah Debugging

### 1. Buka Browser DevTools
```
Tekan: F12
atau
Klik kanan → Inspect → Console tab
```

### 2. Clear Console
```
Klik icon 🚫 (Clear console) atau tekan Ctrl+L
```

### 3. Refresh Halaman
```
Tekan F5 atau Ctrl+R
```

### 4. Login & Navigasi
1. Login sebagai Super Admin
2. Buka **Pengaturan → Tab Server Monitor**

### 5. Klik "Start Monitoring"

---

## ✅ Expected Console Output (Jika Bekerja dengan Baik)

```
🚀 Starting monitoring...
🔑 Token: Found
✅ START response: { success: true, message: "Monitoring started", data: {...} }
📊 Baseline snapshot: { network_rx_bytes_per_sec: 80970903637, ... }
⏱️ Starting polling interval...
✅ Polling interval started (every 2 seconds)

--- Wait 2 seconds ---

⏱️ Poll tick...
📡 Sending POLL request with previous_snapshot: {...}
✅ POLL response received
📊 Delta metrics: { network_rx_bytes_per_sec: 11008, ... }
📊 Current snapshot: { network_rx_bytes_per_sec: 80970914645, ... }
✨ Updating UI with delta: { network_rx_bytes_per_sec: 11008, ... }

--- Wait 2 seconds (repeat) ---

⏱️ Poll tick...
📡 Sending POLL request with previous_snapshot: {...}
✅ POLL response received
📊 Delta metrics: { network_rx_bytes_per_sec: 26382, ... }
...
```

---

## ❌ Common Error Messages & Solutions

### Error #1: Token NOT FOUND
```
🚀 Starting monitoring...
🔑 Token: NOT FOUND!
❌ START ERROR: Request failed with status code 401
```

**Problem:** Tidak login atau token expired

**Solution:**
```javascript
// Di Console browser
localStorage.clear();
// Kemudian login ulang
```

---

### Error #2: No Previous Snapshot
```
⏱️ Poll tick...
⚠️ No previous snapshot, skipping poll
⏱️ Poll tick...
⚠️ No previous snapshot, skipping poll
```

**Problem:** START request gagal atau state tidak tersimpan

**Check:**
1. Apakah ada error di START request sebelumnya?
2. Refresh halaman dan coba lagi

---

### Error #3: 404 Not Found
```
❌ START ERROR: Request failed with status code 404
Response: { message: "Not Found" }
```

**Problem:** API path salah

**Check:**
```javascript
// Di Console
console.log(process.env.REACT_APP_API_URL || 'http://localhost:8000/api');
// Expected: http://localhost:8000/api
```

**Solution:** Pastikan .env file berisi:
```
REACT_APP_API_URL=http://localhost:8000/api
```

---

### Error #4: 403 Forbidden
```
❌ START ERROR: Request failed with status code 403
Response: { message: "Forbidden" }
```

**Problem:** User bukan Super Admin

**Solution:** Login dengan akun yang memiliki role `super_admin`

---

### Error #5: CORS Error
```
Access to XMLHttpRequest at 'http://localhost:8000/api/admin/server-metrics/start' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Problem:** CORS tidak dikonfigurasi

**Solution:** Edit `config/cors.php` di Laravel:
```php
'allowed_origins' => ['http://localhost:3000'],
```

Restart Laravel server:
```bash
php artisan serve
```

---

### Error #6: Network Error
```
❌ POLL ERROR: Network Error
```

**Problem:** Backend tidak running

**Check:**
```bash
# Cek apakah Laravel running di port 8000
netstat -ano | Select-String ":8000"
```

**Solution:**
```bash
cd c:\laragon\www\drive-file-7\sistem-manajeman-file
php artisan serve
```

---

## 🔍 Additional Debugging Commands

### Check Token
```javascript
// Run di Console browser
const token = localStorage.getItem('authToken');
console.log('Token exists:', !!token);
console.log('Token length:', token?.length);
console.log('Token preview:', token?.substring(0, 20) + '...');
```

### Test API Directly
```javascript
// Run di Console browser
fetch('http://localhost:8000/api/admin/server-metrics/latest', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    'Accept': 'application/json'
  }
})
.then(r => r.json())
.then(d => console.log('✅ API Test:', d))
.catch(e => console.error('❌ API Test:', e));
```

### Check Component State
```javascript
// Gunakan React DevTools
// 1. Install React DevTools extension
// 2. Buka tab Components
// 3. Find ServerMonitor component
// 4. Check state:
//    - isMonitoring: true/false
//    - previousSnapshot: should be object
//    - currentMetrics: should update every 2s
```

---

## 📊 Verify Data in Database

### Option 1: Tinker
```bash
cd c:\laragon\www\drive-file-7\sistem-manajeman-file
php artisan tinker --execute="echo App\Models\ServerMetric::count();"
```

### Option 2: Watch Live
```bash
# Run this in loop to see data increasing
cd c:\laragon\www\drive-file-7\sistem-manajeman-file
while ($true) {
    php artisan tinker --execute="echo App\Models\ServerMetric::count();"
    Start-Sleep -Seconds 2
}
```

### Option 3: MySQL Client
```sql
USE your_database_name;
SELECT COUNT(*) FROM server_metrics;
SELECT * FROM server_metrics ORDER BY created_at DESC LIMIT 5;
```

---

## 🎯 Checklist sebelum Report Issue

- [ ] Browser console terbuka (F12)
- [ ] Console di-clear sebelum test
- [ ] Login dengan Super Admin
- [ ] Klik "Start Monitoring"
- [ ] Screenshot console log error (jika ada)
- [ ] Screenshot Network tab (jika request gagal)
- [ ] Cek backend running: `netstat -ano | Select-String ":8000"`
- [ ] Cek frontend running: `netstat -ano | Select-String ":3000"`
- [ ] Run backend test: `php test-monitoring-flow.php`

---

## 📸 Screenshot Areas

Jika masih tidak bekerja, ambil screenshot dari:

1. **Console Tab** - Semua output log
2. **Network Tab** - Filter: XHR, show failed requests
3. **Application Tab** → Local Storage → authToken value
4. **Metrics Display** - Showing 0.00 atau error message

---

## 🚀 Quick Test Script

Paste ini di Console browser untuk test lengkap:

```javascript
console.clear();
console.log('=== SERVER MONITOR DEBUG ===\n');

// 1. Check token
const token = localStorage.getItem('authToken');
console.log('1. Token Check:', token ? '✅ Found' : '❌ NOT FOUND');

// 2. Check API URL
const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
console.log('2. API URL:', apiUrl);

// 3. Test START endpoint
console.log('3. Testing START endpoint...');
fetch(`${apiUrl}/admin/server-metrics/start`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  body: '{}'
})
.then(async r => {
  const data = await r.json();
  if (r.ok) {
    console.log('   ✅ START:', data);
    
    // 4. Wait 2s then test POLL
    console.log('4. Waiting 2 seconds...');
    setTimeout(() => {
      console.log('5. Testing POLL endpoint...');
      fetch(`${apiUrl}/admin/server-metrics/poll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          previous_snapshot: data.data.baseline
        })
      })
      .then(async r2 => {
        const data2 = await r2.json();
        if (r2.ok) {
          console.log('   ✅ POLL:', data2);
          console.log('\n✅ ALL TESTS PASSED!');
          console.log('👉 If UI still not working, check React component mounting');
        } else {
          console.error('   ❌ POLL failed:', r2.status, data2);
        }
      })
      .catch(e => console.error('   ❌ POLL error:', e));
    }, 2000);
    
  } else {
    console.error('   ❌ START failed:', r.status, data);
  }
})
.catch(e => console.error('   ❌ START error:', e));
```

---

## 📞 Support

Jika setelah mengikuti guide ini masih tidak bekerja:

1. Copy **semua output console** (Ctrl+A di Console tab, Ctrl+C)
2. Screenshot **Network tab** menunjukkan failed requests
3. Report dengan informasi:
   - Error messages dari console
   - HTTP status codes dari Network tab
   - Apakah backend test (`php test-monitoring-flow.php`) berhasil?

**Remember:** Backend sudah terbukti 100% working. Masalah pasti di:
- Frontend tidak memanggil API
- Authentication issue
- Component mounting issue
- State management issue
