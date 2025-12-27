# Test Backup API Endpoints
# Run this in PowerShell to test backup API

Write-Host "`n=== Testing Backup API ===" -ForegroundColor Cyan

# 1. Login to get token
Write-Host "`n1. Login as Super Admin..." -ForegroundColor Yellow
$loginBody = @{
    login = "admin@contoh.com"
    password = "password"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json"
    
    if ($loginResponse.access_token) {
        $token = $loginResponse.access_token
        Write-Host "✅ Login successful! Token: $($token.Substring(0,20))..." -ForegroundColor Green
    } else {
        Write-Host "❌ Login failed: No token received" -ForegroundColor Red
        Write-Host "Response: $($loginResponse | ConvertTo-Json)" -ForegroundColor Gray
        exit
    }
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    }
    exit
}

# 2. Test GET /api/backups
Write-Host "`n2. Testing GET /api/backups..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Accept" = "application/json"
    }
    
    $backups = Invoke-RestMethod -Uri "http://localhost:8000/api/backups" `
        -Method Get `
        -Headers $headers
    
    Write-Host "✅ GET /api/backups successful!" -ForegroundColor Green
    Write-Host "Found $($backups.Count) backup(s)" -ForegroundColor Cyan
    $backups | Select-Object -First 3 | Format-Table filename, @{N='Size(MB)';E={[math]::Round($_.size/1MB,2)}}, created_at
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

# 3. Test POST /api/backups/run
Write-Host "`n3. Testing POST /api/backups/run (Create Manual Backup)..." -ForegroundColor Yellow
Write-Host "⏳ This may take 10-30 seconds..." -ForegroundColor Gray

try {
    $createResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/backups/run" `
        -Method Post `
        -Headers $headers `
        -TimeoutSec 60
    
    Write-Host "✅ Backup created successfully!" -ForegroundColor Green
    Write-Host "Message: $($createResponse.message)" -ForegroundColor Cyan
    Write-Host "File: $($createResponse.file)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

# 4. Test GET /api/backups/settings
Write-Host "`n4. Testing GET /api/backups/settings..." -ForegroundColor Yellow
try {
    $settings = Invoke-RestMethod -Uri "http://localhost:8000/api/backups/settings" `
        -Method Get `
        -Headers $headers
    
    Write-Host "✅ Settings retrieved!" -ForegroundColor Green
    Write-Host "Backup Path: $($settings.backup_path)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Test GET /api/backups/schedule
Write-Host "`n5. Testing GET /api/backups/schedule..." -ForegroundColor Yellow
try {
    $schedule = Invoke-RestMethod -Uri "http://localhost:8000/api/backups/schedule" `
        -Method Get `
        -Headers $headers
    
    Write-Host "✅ Schedule retrieved!" -ForegroundColor Green
    Write-Host "Frequency: $($schedule.schedule.frequency)" -ForegroundColor Cyan
    Write-Host "Time: $($schedule.schedule.time)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
