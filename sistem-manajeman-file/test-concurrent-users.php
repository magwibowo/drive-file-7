<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Carbon\Carbon;

echo "=== CONCURRENT USERS DEMO ===\n\n";

// Cek berapa users di database
$totalUsers = User::count();
echo "📊 Total users in database: $totalUsers\n\n";

if ($totalUsers == 0) {
    echo "❌ No users found! Please seed database first.\n";
    echo "Run: php artisan db:seed\n";
    exit(1);
}

// List all users
echo "👥 Users list:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
User::orderBy('id')->get()->each(function($user) {
    $lastActivity = $user->last_activity_at ? $user->last_activity_at->diffForHumans() : 'Never';
    echo "  ID: {$user->id} | {$user->name} | Last activity: {$lastActivity}\n";
});
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

// Simulate users login
echo "🔄 Simulating user logins...\n";
$activeUserIds = [1, 2, 3]; // First 3 users

foreach ($activeUserIds as $userId) {
    $user = User::find($userId);
    if ($user) {
        $user->last_activity_at = Carbon::now();
        $user->save(['timestamps' => false]);
        echo "  ✅ User #{$userId} ({$user->name}) marked as active\n";
    }
}

echo "\n";

// Test concurrent users dengan berbagai time windows
echo "📊 Testing concurrent users with different time windows:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

foreach ([5, 10, 15, 30] as $minutes) {
    $count = User::getConcurrentUsers($minutes);
    echo "  Last {$minutes} min: {$count} concurrent users\n";
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

// Get full metrics from service
echo "🎯 Full Server Metrics (including concurrent_users):\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

$service = new App\Services\WindowsMetricsService();
$metrics = $service->getMetrics();

echo "  Concurrent Users: " . $metrics['concurrent_users'] . "\n";
echo "  TCP Total: " . $metrics['tcp_connections_total'] . "\n";
echo "  TCP External: " . $metrics['tcp_connections_external'] . "\n";
echo "  CPU Usage: " . $metrics['cpu_usage_percent'] . "%\n";
echo "  Memory Usage: " . $metrics['memory_usage_percent'] . "%\n";

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

// Cleanup demo - mark users as inactive
echo "🧹 Cleanup: Marking users as inactive (1 hour ago)...\n";
foreach ($activeUserIds as $userId) {
    $user = User::find($userId);
    if ($user) {
        $user->last_activity_at = Carbon::now()->subHour();
        $user->save(['timestamps' => false]);
    }
}

$cleanCount = User::getConcurrentUsers(15);
echo "  After cleanup: {$cleanCount} concurrent users (should be 0)\n\n";

echo "✅ Demo complete!\n";
