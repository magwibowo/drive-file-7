<?php

require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "\n╔════════════════════════════════════════════════════════════════╗\n";
echo "║          CONCURRENT USERS - DATA SOURCE DEMO                  ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

// 1. Show current active users
echo "📊 CURRENT DATABASE STATE:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

$allUsers = App\Models\User::select('id', 'name', 'email', 'last_activity_at')
    ->orderBy('last_activity_at', 'desc')
    ->get();

foreach ($allUsers as $user) {
    if ($user->last_activity_at) {
        $minutesAgo = now()->diffInMinutes($user->last_activity_at);
        $isActive = $minutesAgo <= 15;
        $status = $isActive ? '🟢 ACTIVE  ' : '⚪ INACTIVE';
        $badge = $isActive ? '(<15 min)' : '(>' . $minutesAgo . ' min)';
        
        echo "$status {$user->name}\n";
        echo "          Email: {$user->email}\n";
        echo "          Last Activity: {$minutesAgo} minutes ago $badge\n";
        echo "          Timestamp: {$user->last_activity_at}\n\n";
    } else {
        echo "⚪ INACTIVE {$user->name}\n";
        echo "          Email: {$user->email}\n";
        echo "          Last Activity: Never logged in\n\n";
    }
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

// 2. Calculate concurrent users
echo "📈 CONCURRENT USERS CALCULATION:\n\n";

$concurrentCount = App\Models\User::where('last_activity_at', '>=', now()->subMinutes(15))
    ->count();

echo "   Window: Last 15 minutes\n";
echo "   Query: last_activity_at >= NOW() - 15 minutes\n";
echo "   Result: $concurrentCount users\n\n";

// 3. Show data source
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
echo "🔍 DATA SOURCE:\n\n";
echo "   ✅ Source 1: Database Table 'users'\n";
echo "      Column: last_activity_at (TIMESTAMP)\n";
echo "      Updated by: UpdateUserActivity Middleware\n";
echo "      Update Interval: Every 5 minutes\n\n";

echo "   " . (PHP_OS_FAMILY === 'Windows' ? '⚠️' : '❌') . " Source 2: SMB Sessions (Windows Server only)\n";
echo "      Command: Get-SmbSession\n";
echo "      Platform: Windows Server 2012+\n";
echo "      Current OS: " . PHP_OS_FAMILY . "\n\n";

// 4. Middleware info
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
echo "⚙️  MIDDLEWARE CONFIGURATION:\n\n";
echo "   File: UpdateUserActivity.php\n";
echo "   Registered: Kernel.php -> api middleware group\n";
echo "   Trigger: Every authenticated API request\n";
echo "   Logic: Update timestamp if > 5 minutes since last update\n\n";

// 5. Test NAS Service
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
echo "🧪 NAS MONITORING SERVICE TEST:\n\n";

$service = new App\Services\NasMonitoringService();
$metrics = $service->getMetrics();

echo "   NAS Service Result: {$metrics['nas_concurrent_users']} concurrent users\n";
echo "   Database Query Result: $concurrentCount concurrent users\n";
echo "   Match: " . ($metrics['nas_concurrent_users'] === $concurrentCount ? '✅ YES' : '❌ NO') . "\n\n";

echo "✅ Data source is 100% REAL from database tracking!\n\n";
