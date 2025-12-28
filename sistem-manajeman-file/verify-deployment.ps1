# ========================================
# DEPLOYMENT VERIFICATION SCRIPT
# ========================================
# Script untuk verify deployment setelah deploy-to-nas.ps1

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          DEPLOYMENT VERIFICATION SCRIPT                   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$passed = 0
$failed = 0
$warnings = 0

# ========================================
# 1. CHECK .ENV FILE
# ========================================
Write-Host "📋 1. Checking .env configuration..." -ForegroundColor Yellow

if (Test-Path .env) {
    $envContent = Get-Content .env -Raw
    
    # Check APP_ENV
    if ($envContent -match 'APP_ENV=production') {
        Write-Host "   ✅ APP_ENV = production" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "   ❌ APP_ENV bukan production" -ForegroundColor Red
        $failed++
    }
    
    # Check APP_DEBUG
    if ($envContent -match 'APP_DEBUG=false') {
        Write-Host "   ✅ APP_DEBUG = false" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "   ⚠️  APP_DEBUG masih true (berbahaya di production)" -ForegroundColor Yellow
        $warnings++
    }
    
    # Check NAS_IP
    if ($envContent -match 'NAS_IP=(\d+\.\d+\.\d+\.\d+)') {
        $nasIp = $matches[1]
        if ($nasIp -ne '127.0.0.1') {
            Write-Host "   ✅ NAS_IP = $nasIp (bukan localhost)" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "   ⚠️  NAS_IP masih 127.0.0.1 (gunakan IP real)" -ForegroundColor Yellow
            $warnings++
        }
    }
    
    # Check DB_PASSWORD
    if ($envContent -match 'DB_PASSWORD=(.+)') {
        $dbPass = $matches[1].Trim()
        if ($dbPass -ne '' -and $dbPass -ne 'DB_PASSWORD=') {
            Write-Host "   ✅ DB_PASSWORD sudah diisi" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "   ⚠️  DB_PASSWORD kosong (gunakan password kuat)" -ForegroundColor Yellow
            $warnings++
        }
    }
} else {
    Write-Host "   ❌ File .env tidak ditemukan" -ForegroundColor Red
    $failed++
}

# ========================================
# 2. CHECK COMPOSER DEPENDENCIES
# ========================================
Write-Host "`n📦 2. Checking Composer dependencies..." -ForegroundColor Yellow

if (Test-Path vendor) {
    Write-Host "   ✅ Vendor folder exists" -ForegroundColor Green
    $passed++
    
    # Check autoload
    if (Test-Path vendor\autoload.php) {
        Write-Host "   ✅ Autoload file exists" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "   ❌ Autoload file missing, run: composer install" -ForegroundColor Red
        $failed++
    }
} else {
    Write-Host "   ❌ Vendor folder missing, run: composer install" -ForegroundColor Red
    $failed++
}

# ========================================
# 3. CHECK LARAVEL CACHE
# ========================================
Write-Host "`n🚀 3. Checking Laravel optimization..." -ForegroundColor Yellow

$cacheFiles = @(
    @{File='bootstrap\cache\config.php'; Name='Config cache'},
    @{File='bootstrap\cache\routes-v7.php'; Name='Route cache'},
    @{File='bootstrap\cache\packages.php'; Name='Package cache'}
)

foreach ($cache in $cacheFiles) {
    if (Test-Path $cache.File) {
        Write-Host "   ✅ $($cache.Name) exists" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "   ⚠️  $($cache.Name) missing (run: php artisan cache)" -ForegroundColor Yellow
        $warnings++
    }
}

# ========================================
# 4. CHECK FILE PERMISSIONS
# ========================================
Write-Host "`n🔐 4. Checking file permissions..." -ForegroundColor Yellow

$writableDirs = @('storage', 'bootstrap\cache')

foreach ($dir in $writableDirs) {
    if (Test-Path $dir) {
        # Try to create test file
        $testFile = Join-Path $dir "test-write-$(Get-Random).tmp"
        try {
            "test" | Out-File $testFile -ErrorAction Stop
            Remove-Item $testFile -ErrorAction SilentlyContinue
            Write-Host "   ✅ $dir is writable" -ForegroundColor Green
            $passed++
        } catch {
            Write-Host "   ❌ $dir tidak writable" -ForegroundColor Red
            $failed++
        }
    } else {
        Write-Host "   ❌ $dir tidak ada" -ForegroundColor Red
        $failed++
    }
}

# ========================================
# 5. CHECK DATABASE CONNECTION
# ========================================
Write-Host "`n🗄️  5. Checking database connection..." -ForegroundColor Yellow

try {
    $dbCheck = php artisan db:show --json 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Database connection successful" -ForegroundColor Green
        $passed++
        
        # Check if migrations ran
        $tables = php artisan db:table --json 2>&1
        if ($tables -match 'users' -and $tables -match 'folders' -and $tables -match 'files') {
            Write-Host "   ✅ Required tables exist" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "   ⚠️  Some tables missing, run: php artisan migrate" -ForegroundColor Yellow
            $warnings++
        }
    } else {
        Write-Host "   ❌ Database connection failed" -ForegroundColor Red
        Write-Host "      Error: $dbCheck" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host "   ❌ Cannot check database: $_" -ForegroundColor Red
    $failed++
}

# ========================================
# 6. CHECK NAS CONNECTION
# ========================================
Write-Host "`n🌐 6. Checking NAS connection..." -ForegroundColor Yellow

# Get NAS IP from .env
$envContent = Get-Content .env -Raw
if ($envContent -match 'NAS_IP=(\d+\.\d+\.\d+\.\d+)') {
    $nasIp = $matches[1]
    
    # Ping test
    $pingResult = Test-Connection -ComputerName $nasIp -Count 1 -Quiet
    if ($pingResult) {
        $ping = Test-Connection -ComputerName $nasIp -Count 1
        Write-Host "   ✅ NAS accessible at $nasIp (Latency: $($ping.ResponseTime)ms)" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "   ❌ Cannot reach NAS at $nasIp" -ForegroundColor Red
        $failed++
    }
}

# Check drive mapping
if (Test-Path Z:\) {
    Write-Host "   ✅ Drive Z:\ is mapped" -ForegroundColor Green
    $passed++
    
    # Check uploads folder
    if (Test-Path Z:\uploads) {
        Write-Host "   ✅ Z:\uploads folder exists" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "   ⚠️  Z:\uploads folder missing" -ForegroundColor Yellow
        $warnings++
    }
    
    # Check backups folder
    if (Test-Path Z:\backups) {
        Write-Host "   ✅ Z:\backups folder exists" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "   ⚠️  Z:\backups folder missing" -ForegroundColor Yellow
        $warnings++
    }
    
    # Test write permission
    $testFile = "Z:\test-verify-$(Get-Random).tmp"
    try {
        "test" | Out-File $testFile -ErrorAction Stop
        Remove-Item $testFile -ErrorAction SilentlyContinue
        Write-Host "   ✅ Write permission to Z:\ works" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "   ❌ No write permission to Z:\" -ForegroundColor Red
        $failed++
    }
} else {
    Write-Host "   ❌ Drive Z:\ not mapped" -ForegroundColor Red
    Write-Host "      Run: net use Z: \\$nasIp\share /persistent:yes" -ForegroundColor Yellow
    $failed++
}

# ========================================
# 7. CHECK REACT FRONTEND
# ========================================
Write-Host "`n🎨 7. Checking React frontend..." -ForegroundColor Yellow

$reactPath = "..\sistem-manajeman-file_ui"
if (Test-Path $reactPath) {
    # Check .env
    if (Test-Path "$reactPath\.env") {
        $reactEnv = Get-Content "$reactPath\.env" -Raw
        if ($reactEnv -match 'REACT_APP_API_URL=(.+)') {
            Write-Host "   ✅ React .env exists" -ForegroundColor Green
            $passed++
        }
    } else {
        Write-Host "   ⚠️  React .env missing" -ForegroundColor Yellow
        $warnings++
    }
    
    # Check node_modules
    if (Test-Path "$reactPath\node_modules") {
        Write-Host "   ✅ node_modules exists" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "   ⚠️  node_modules missing, run: npm install" -ForegroundColor Yellow
        $warnings++
    }
    
    # Check build folder (for production)
    if (Test-Path "$reactPath\build") {
        Write-Host "   ✅ Production build exists" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "   ⚠️  Production build missing, run: npm run build" -ForegroundColor Yellow
        $warnings++
    }
} else {
    Write-Host "   ❌ React folder not found" -ForegroundColor Red
    $failed++
}

# ========================================
# 8. CHECK TASK SCHEDULER
# ========================================
Write-Host "`n⏰ 8. Checking Task Scheduler..." -ForegroundColor Yellow

$scheduledTasks = Get-ScheduledTask -TaskName "*Laravel*" -ErrorAction SilentlyContinue
if ($scheduledTasks) {
    foreach ($task in $scheduledTasks) {
        if ($task.State -eq 'Ready') {
            Write-Host "   ✅ Task '$($task.TaskName)' is ready" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "   ⚠️  Task '$($task.TaskName)' is $($task.State)" -ForegroundColor Yellow
            $warnings++
        }
    }
} else {
    Write-Host "   ⚠️  No Laravel scheduled tasks found" -ForegroundColor Yellow
    Write-Host "      Setup Task Scheduler untuk backup otomatis" -ForegroundColor Cyan
    $warnings++
}

# ========================================
# 9. TEST NAS MONITORING SERVICE
# ========================================
Write-Host "`n🔍 9. Testing NAS Monitoring Service..." -ForegroundColor Yellow

try {
    $testScript = @"
require __DIR__ . '/vendor/autoload.php';
`$app = require __DIR__ . '/bootstrap/app.php';
`$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

`$service = new App\Services\NasMonitoringService();
`$metrics = `$service->getMetrics();

echo json_encode([
    'nas_available' => `$metrics['nas_available'],
    'nas_latency' => `$metrics['nas_network_latency'],
    'concurrent_users' => `$metrics['nas_concurrent_users'],
    'read_iops' => `$metrics['nas_read_iops'],
    'write_iops' => `$metrics['nas_write_iops']
]);
"@
    
    $testScript | Out-File -FilePath "test-nas-verify.php" -Encoding UTF8
    $result = php test-nas-verify.php 2>&1
    Remove-Item test-nas-verify.php -ErrorAction SilentlyContinue
    
    if ($result -match '\{') {
        $metrics = $result | ConvertFrom-Json
        
        if ($metrics.nas_available) {
            Write-Host "   ✅ NAS Service working" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "   ❌ NAS Service reports NAS unavailable" -ForegroundColor Red
            $failed++
        }
        
        if ($metrics.nas_latency -gt 0 -and $metrics.nas_latency -lt 1000) {
            Write-Host "   ✅ Latency: $($metrics.nas_latency)ms (realistic)" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "   ⚠️  Latency: $($metrics.nas_latency)ms (check network)" -ForegroundColor Yellow
            $warnings++
        }
        
        if ($null -ne $metrics.concurrent_users) {
            Write-Host "   ✅ Concurrent users: $($metrics.concurrent_users)" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "   ⚠️  Concurrent users tracking not working" -ForegroundColor Yellow
            $warnings++
        }
    } else {
        Write-Host "   ❌ NAS Service test failed: $result" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host "   ❌ Cannot test NAS Service: $_" -ForegroundColor Red
    $failed++
}

# ========================================
# SUMMARY
# ========================================
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                   VERIFICATION SUMMARY                     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$total = $passed + $failed + $warnings
$passPercent = [math]::Round(($passed / $total) * 100, 1)

Write-Host "📊 Results:" -ForegroundColor Cyan
Write-Host "   ✅ Passed:   $passed" -ForegroundColor Green
Write-Host "   ❌ Failed:   $failed" -ForegroundColor Red
Write-Host "   ⚠️  Warnings: $warnings" -ForegroundColor Yellow
Write-Host "   📈 Success Rate: $passPercent%`n"

if ($failed -eq 0 -and $warnings -eq 0) {
    Write-Host "🎉 DEPLOYMENT PERFECT! Aplikasi siap production!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "   1. Start Laravel: php artisan serve --host=[IP] --port=8000"
    Write-Host "   2. Start React: cd ..\sistem-manajeman-file_ui; npm start"
    Write-Host "   3. Access: http://[IP]:3000`n"
} elseif ($failed -eq 0) {
    Write-Host "✅ DEPLOYMENT OK dengan beberapa warning" -ForegroundColor Yellow
    Write-Host "`nPeriksa warnings di atas dan perbaiki jika perlu.`n" -ForegroundColor Cyan
} else {
    Write-Host "❌ DEPLOYMENT BELUM SIAP" -ForegroundColor Red
    Write-Host "`nPerbaiki error di atas sebelum menjalankan aplikasi.`n" -ForegroundColor Cyan
}

# Save report
$reportFile = "deployment-verification-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
$report = @"
DEPLOYMENT VERIFICATION REPORT
Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

Total Checks: $total
Passed: $passed
Failed: $failed
Warnings: $warnings
Success Rate: $passPercent%

Status: $(if ($failed -eq 0 -and $warnings -eq 0) { "READY" } elseif ($failed -eq 0) { "OK WITH WARNINGS" } else { "NOT READY" })
"@

$report | Out-File $reportFile
Write-Host "📄 Report saved to: $reportFile`n" -ForegroundColor Cyan
