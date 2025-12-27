# 🎯 IMPLEMENTASI: Concurrent Users Tracking

## 📋 OVERVIEW

Implementasi **real concurrent users** berdasarkan login session di aplikasi, berbeda dengan TCP connections yang hanya track koneksi jaringan.

## 🔍 PROBLEM STATEMENT

**SEBELUMNYA:**
- Metric "Active Connections" menghitung **TCP connections** (browser tabs, services, apps)
- User bingung: "75 connections" bukan berarti 75 user login
- Tidak ada cara track **berapa user yang benar-benar login** ke aplikasi

**YANG DIBUTUHKAN:**
- Track **real logged-in users** yang aktif di aplikasi
- Berbeda dari TCP connections
- Update otomatis setiap user melakukan aktivitas
- Configurable time window (default: 15 menit)

## ✅ SOLUTION ARCHITECTURE

### 1. Database Schema
**Tabel `users`** - Tambah kolom untuk track activity:
```sql
ALTER TABLE users 
ADD COLUMN last_activity_at TIMESTAMP NULL,
ADD INDEX idx_last_activity (last_activity_at);
```

**Tabel `server_metrics`** - Tambah kolom untuk store metric:
```sql
ALTER TABLE server_metrics 
ADD COLUMN concurrent_users INT DEFAULT 0;
```

### 2. Middleware Auto-Tracking
Setiap request dari user yang login akan auto-update `last_activity_at`:
```php
// UpdateUserActivity Middleware
if (Auth::check()) {
    $user = Auth::user();
    
    // Update hanya setiap 5 menit (reduce DB writes)
    if (!$lastActivity || $lastActivity->diffInMinutes(now()) >= 5) {
        $user->last_activity_at = now();
        $user->save(['timestamps' => false]);
    }
}
```

**Optimization:** Update interval 5 menit untuk kurangi database writes.

### 3. User Model Method
```php
// app/Models/User.php
public static function getConcurrentUsers(int $minutes = 15): int
{
    return static::where('last_activity_at', '>', now()->subMinutes($minutes))
                ->whereNull('deleted_at')
                ->distinct('id')
                ->count('id');
}
```

**Parameters:**
- `$minutes`: Time window untuk consider user sebagai "active" (default: 15 menit)

### 4. Metrics Service Integration
```php
// WindowsMetricsService.php
private function getConcurrentUsers(): int
{
    try {
        $userModel = app(\App\Models\User::class);
        return $userModel::getConcurrentUsers(15);
    } catch (Exception $e) {
        return 0; // Silent fail
    }
}
```

## 📊 IMPLEMENTATION DETAILS

### Database Migrations

#### Migration 1: `add_last_activity_to_users_table.php`
```php
public function up(): void
{
    Schema::table('users', function (Blueprint $table) {
        // Track user activity untuk concurrent user metrics
        $table->timestamp('last_activity_at')->nullable()->after('updated_at');
        
        // Index untuk query performance
        $table->index('last_activity_at');
    });
}
```

**Purpose:** Track kapan terakhir kali user aktif

#### Migration 2: `add_concurrent_users_to_server_metrics_table.php`
```php
public function up(): void
{
    Schema::table('server_metrics', function (Blueprint $table) {
        // REAL concurrent users (aplikasi login sessions)
        $table->integer('concurrent_users')->default(0)
              ->after('tcp_connections_external');
    });
}
```

**Purpose:** Store concurrent users metric untuk historical analysis

### Middleware Registration

**File:** `app/Http/Kernel.php`

```php
protected $middlewareGroups = [
    'web' => [
        // ... existing middleware
        \App\Http\Middleware\UpdateUserActivity::class, // ✅ Added
    ],
    
    'api' => [
        // ... existing middleware
        \App\Http\Middleware\UpdateUserActivity::class, // ✅ Added
    ],
];
```

**Why both web & api?**
- **web**: Livewire/Blade requests
- **api**: React SPA API calls via Sanctum

### Model Updates

#### User.php
```php
protected $fillable = [
    // ... existing fields
    'last_activity_at', // ✅ Added
];

protected $casts = [
    // ... existing casts
    'last_activity_at' => 'datetime', // ✅ Added - Cast to Carbon
];

// ✅ Added: Static method untuk count concurrent users
public static function getConcurrentUsers(int $minutes = 15): int
{
    return static::where('last_activity_at', '>', now()->subMinutes($minutes))
                ->whereNull('deleted_at')
                ->distinct('id')
                ->count('id');
}
```

#### ServerMetric.php
```php
protected $fillable = [
    // ... existing fields
    'tcp_connections_total',
    'tcp_connections_external',
    'concurrent_users', // ✅ Added
    // ...
];

protected $casts = [
    // ... existing casts
    'concurrent_users' => 'integer', // ✅ Added
];
```

### Service Layer

**File:** `app/Services/WindowsMetricsService.php`

```php
public function getMetrics(): array
{
    return [
        // ... existing metrics
        
        // Application Metrics (NEW - TIER 1)
        'concurrent_users' => $this->getConcurrentUsers(),
    ];
}

private function getConcurrentUsers(): int
{
    try {
        $userModel = app(\App\Models\User::class);
        return $userModel::getConcurrentUsers(15); // 15 minutes window
    } catch (Exception $e) {
        return 0;
    }
}
```

## 🧪 TESTING & VALIDATION

### Test Script: `test-concurrent-users.php`

**Features:**
1. List all users dan last_activity status
2. Simulate user logins (update last_activity_at)
3. Test dengan berbagai time windows (5, 10, 15, 30 menit)
4. Get full server metrics including concurrent_users
5. Cleanup demo data

**Sample Output:**
```
=== CONCURRENT USERS DEMO ===

📊 Total users in database: 3

👥 Users list:
  ID: 1 | Admin Utama | Last activity: Never
  ID: 2 | Saya Admin | Last activity: Never
  ID: 3 | Saya User | Last activity: Never

🔄 Simulating user logins...
  ✅ User #1 (Admin Utama) marked as active
  ✅ User #2 (Saya Admin) marked as active
  ✅ User #3 (Saya User) marked as active

📊 Testing concurrent users with different time windows:
  Last 5 min: 3 concurrent users ✅
  Last 10 min: 3 concurrent users ✅
  Last 15 min: 3 concurrent users ✅
  Last 30 min: 3 concurrent users ✅

🎯 Full Server Metrics (including concurrent_users):
  Concurrent Users: 3 ✅
  TCP Total: 58
  TCP External: 28
  CPU Usage: 34%

🧹 Cleanup: Marking users as inactive (1 hour ago)...
  After cleanup: 0 concurrent users ✅
```

### Test Output Validation

| Metric | Value | Status | Explanation |
|--------|-------|--------|-------------|
| **Concurrent Users** | 3 → 0 | ✅ | After simulating 3 logins, then cleanup → 0 |
| **TCP External** | 28 | ✅ | Tetap sama (bukan user count) |
| **Time Window 5min** | 3 | ✅ | All 3 users active in last 5 min |
| **Time Window 15min** | 3 | ✅ | All 3 users active in last 15 min |
| **After Cleanup** | 0 | ✅ | Users marked inactive 1 hour ago |

## 🎨 FRONTEND INTEGRATION

### React Component Updates

#### ServerMonitor.js

**State Initialization:**
```javascript
const [currentMetrics, setCurrentMetrics] = useState({
  // ... existing metrics
  tcp_connections_total: 0,
  tcp_connections_external: 0,
  concurrent_users: 0, // ✅ Added
  // ...
});
```

**UI Card (TIER 1 Section):**
```jsx
{/* Concurrent Users - REAL app users! */}
<div className="metric-card card-purple">
  <div className="metric-header">
    <h3 className="metric-title">Concurrent Users</h3>
    <svg className="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  </div>
  <p className="metric-value">
    {currentMetrics.concurrent_users || 0}
  </p>
  <p className="metric-label">
    Logged-in Active Users
  </p>
</div>
```

**Card Styling:** Uses existing `.card-purple` class:
```css
.card-purple {
  background-color: #faf5ff;
  border-color: #e9d5ff;
}

.card-purple .metric-title {
  color: #7c3aed;
}

.card-purple .metric-icon {
  color: #a855f7;
}
```

## 📊 METRICS COMPARISON

### Before vs After

| Aspect | Before (TCP Connections) | After (Concurrent Users) |
|--------|-------------------------|-------------------------|
| **What's Counted** | All TCP ESTABLISHED connections | Logged-in users with recent activity |
| **Includes** | Browser tabs, services, apps, localhost | Only authenticated application users |
| **Value Range** | 30-100 (typical desktop) | 0-50 (typical small org) |
| **Updates** | Real-time per netstat | Every 5 min per user request |
| **Label** | "External TCP Connections" | "Logged-in Active Users" |
| **User Confusion** | ❌ "75 connections = users?" | ✅ "3 users logged in" |

### Metric Interpretation

| Concurrent Users | Status | Interpretation |
|-----------------|--------|----------------|
| **0-5** | 🟢 Normal | Small team, low activity hours |
| **5-20** | 🟢 Active | Regular business hours |
| **20-50** | 🟡 Busy | Peak hours, high usage |
| **50-100** | 🟠 Heavy | Large organization, many departments |
| **100+** | 🔴 Alert | Investigate: license limits, performance |

## 🔧 CONFIGURATION OPTIONS

### Adjust Activity Window

**Default: 15 minutes** (user inactive after 15 min idle)

To change:
```php
// In WindowsMetricsService.php
return $userModel::getConcurrentUsers(30); // 30 minutes window
```

**Recommendations:**
- **5 min**: Very strict (realtime accuracy, but users drop quickly)
- **15 min**: Balanced (default)
- **30 min**: Lenient (includes users who stepped away)
- **60 min**: Very lenient (includes lunch breaks)

### Adjust Middleware Update Interval

**Default: 5 minutes** (reduce DB writes)

To change:
```php
// In UpdateUserActivity middleware
if (!$lastActivity || $lastActivity->diffInMinutes(now()) >= 10) {
    // Update every 10 minutes instead
}
```

**Trade-offs:**
- **Lower interval (1-2 min)**: More accurate, MORE database writes
- **Higher interval (10-15 min)**: Less accurate, LESS database writes

## 📝 FILES MODIFIED

### Backend
1. **Migration**: `2025_12_25_092616_add_last_activity_to_users_table.php`
   - Added: `last_activity_at` timestamp column
   - Added: Index on `last_activity_at` for performance

2. **Migration**: `2025_12_25_092751_add_concurrent_users_to_server_metrics_table.php`
   - Added: `concurrent_users` integer column

3. **Middleware**: `app/Http/Middleware/UpdateUserActivity.php`
   - Created: Auto-update user activity on each request
   - Optimization: Update only every 5 minutes

4. **Kernel**: `app/Http/Kernel.php`
   - Registered: UpdateUserActivity in both 'web' and 'api' groups

5. **Model**: `app/Models/User.php`
   - Added: `last_activity_at` to $fillable and $casts
   - Added: `getConcurrentUsers()` static method

6. **Model**: `app/Models/ServerMetric.php`
   - Added: `concurrent_users` to $fillable and $casts

7. **Service**: `app/Services/WindowsMetricsService.php`
   - Added: `getConcurrentUsers()` method
   - Updated: `getMetrics()` to include concurrent_users

### Frontend
8. **Component**: `src/components/ServerMonitor/ServerMonitor.js`
   - Added: `concurrent_users` to state (3 locations)
   - Added: Purple card for Concurrent Users display

9. **CSS**: `src/components/ServerMonitor/ServerMonitor.css`
   - Already had: `.card-purple` styling (no changes needed)

### Testing
10. **Script**: `test-concurrent-users.php`
    - Created: Demo script untuk test tracking
    - Features: Simulate logins, test time windows, cleanup

11. **Script**: `test-tier1-metrics.php`
    - Updated: Display concurrent_users in output

## 🎯 REAL-WORLD SCENARIOS

### Scenario 1: Morning Login Rush
**Time:** 08:00 - 09:00
```
08:00: 0 users
08:15: 5 users (early birds)
08:30: 15 users (most staff arriving)
08:45: 25 users (peak)
09:00: 22 users (some stepped away)
```

### Scenario 2: Lunch Break
**Time:** 12:00 - 13:00
```
12:00: 30 users (working)
12:15: 20 users (some at lunch)
12:30: 10 users (lunch peak)
12:45: 15 users (returning)
13:00: 28 users (back to work)
```

### Scenario 3: End of Day
**Time:** 17:00 - 18:00
```
17:00: 25 users (wrapping up)
17:15: 15 users (leaving)
17:30: 8 users (overtime)
17:45: 3 users (late workers)
18:00: 1 user (admin)
```

## 🚀 FUTURE ENHANCEMENTS

### 1. User Activity Details API
```php
GET /api/admin/concurrent-users/details

Response:
{
  "concurrent_count": 12,
  "active_users": [
    {"id": 1, "name": "Admin", "last_activity": "2 min ago"},
    {"id": 2, "name": "User1", "last_activity": "5 min ago"}
  ]
}
```

### 2. Historical Concurrent Users Chart
- Track peak hours
- Compare weekday vs weekend
- Monthly trends

### 3. Department-Level Breakdown
```php
'concurrent_users_by_department' => [
  'IT' => 5,
  'Finance' => 3,
  'HR' => 2
]
```

### 4. Alert Thresholds
```php
if ($concurrentUsers > config('monitoring.max_users')) {
    event(new ConcurrentUsersExceededEvent($concurrentUsers));
}
```

### 5. Session Management
- Force logout idle users after X minutes
- Display "You will be logged out in Y minutes" warning

## ✅ VERIFICATION CHECKLIST

- [x] Database migration successful (users.last_activity_at)
- [x] Database migration successful (server_metrics.concurrent_users)
- [x] Middleware registered in Kernel (web + api)
- [x] User model has getConcurrentUsers() method
- [x] WindowsMetricsService returns concurrent_users
- [x] ServerMetric model includes concurrent_users field
- [x] Frontend displays concurrent users card
- [x] Test script validates tracking (0 → 3 → 0)
- [x] Metrics API returns concurrent_users in JSON
- [x] Auto-update works on user requests

## 📚 REFERENCES

- **Activity Tracking Pattern**: Common in analytics platforms (Google Analytics, Mixpanel)
- **Session Management**: Similar to Laravel's session table approach
- **Time Window Concept**: Used by Slack, Discord for "active now" status
- **Performance Optimization**: Update throttling reduces DB load (5-min interval)

---

**Implemented by:** AI Assistant  
**Date:** 2025-12-25  
**Feature:** Real Concurrent Users Tracking (Login Session Based)  
**Impact:** Users can now see **actual logged-in users** instead of misleading TCP connection count
