# Pre-Production Testing Script
# Run this script to verify backend and frontend before deployment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Fluxor News - Pre-Production Tests" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$backendUrl = "http://localhost:5000/api"
$frontendUrl = "http://localhost:3000"
$testResults = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$ExpectedStatus = "200"
    )
    
    Write-Host "Testing: $Name..." -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host " ✅ PASS" -ForegroundColor Green
            return @{ Test = $Name; Status = "PASS"; Details = "Status: $($response.StatusCode)" }
        } else {
            Write-Host " ⚠️  WARN" -ForegroundColor Yellow
            return @{ Test = $Name; Status = "WARN"; Details = "Expected $ExpectedStatus, got $($response.StatusCode)" }
        }
    } catch {
        Write-Host " ❌ FAIL" -ForegroundColor Red
        return @{ Test = $Name; Status = "FAIL"; Details = $_.Exception.Message }
    }
}

Write-Host "`n🔧 BACKEND API TESTS" -ForegroundColor Yellow
Write-Host "==================`n" -ForegroundColor Yellow

# Backend Health Check
$testResults += Test-Endpoint "Backend Health" "$backendUrl/health"

# Public API Endpoints
$testResults += Test-Endpoint "Get All Articles" "$backendUrl/articles"
$testResults += Test-Endpoint "Get Categories" "$backendUrl/categories"
$testResults += Test-Endpoint "Get Tags" "$backendUrl/tags"
$testResults += Test-Endpoint "Get Site Config" "$backendUrl/config"

# Check MongoDB Connection
Write-Host "Testing: MongoDB Connection..." -NoNewline
try {
    $health = Invoke-RestMethod -Uri "$backendUrl/health" -Method Get
    if ($health.data.mongodb -eq "connected") {
        Write-Host " ✅ PASS" -ForegroundColor Green
        $testResults += @{ Test = "MongoDB Connection"; Status = "PASS"; Details = "Connected" }
    } else {
        Write-Host " ❌ FAIL" -ForegroundColor Red
        $testResults += @{ Test = "MongoDB Connection"; Status = "FAIL"; Details = "Not connected" }
    }
} catch {
    Write-Host " ❌ FAIL" -ForegroundColor Red
    $testResults += @{ Test = "MongoDB Connection"; Status = "FAIL"; Details = $_.Exception.Message }
}

Write-Host "`n🎨 FRONTEND TESTS" -ForegroundColor Yellow
Write-Host "===============`n" -ForegroundColor Yellow

# Frontend Pages
$testResults += Test-Endpoint "Homepage" $frontendUrl
$testResults += Test-Endpoint "Admin Login" "$frontendUrl/admin/login"

# Check if Frontend is built for production
Write-Host "Testing: Frontend Build Mode..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri $frontendUrl -UseBasicParsing
    if ($response.Content -match "development") {
        Write-Host " ⚠️  WARN (Development Mode)" -ForegroundColor Yellow
        $testResults += @{ Test = "Frontend Build Mode"; Status = "WARN"; Details = "Running in development mode" }
    } else {
        Write-Host " ✅ PASS" -ForegroundColor Green
        $testResults += @{ Test = "Frontend Build Mode"; Status = "PASS"; Details = "Production ready" }
    }
} catch {
    Write-Host " ❌ FAIL" -ForegroundColor Red
    $testResults += @{ Test = "Frontend Build Mode"; Status = "FAIL"; Details = $_.Exception.Message }
}

Write-Host "`n🔐 SECURITY CHECKS" -ForegroundColor Yellow
Write-Host "================`n" -ForegroundColor Yellow

# Check Environment Variables
Write-Host "Testing: Backend Environment Variables..." -NoNewline
$requiredBackendEnvVars = @("MONGODB_URI", "JWT_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET")
$missingVars = @()

foreach ($var in $requiredBackendEnvVars) {
    $value = [Environment]::GetEnvironmentVariable($var)
    if (-not $value) {
        $missingVars += $var
    }
}

if ($missingVars.Count -eq 0) {
    Write-Host " ✅ PASS" -ForegroundColor Green
    $testResults += @{ Test = "Backend Environment Variables"; Status = "PASS"; Details = "All vars set" }
} else {
    Write-Host " ⚠️  WARN" -ForegroundColor Yellow
    $testResults += @{ Test = "Backend Environment Variables"; Status = "WARN"; Details = "Missing: $($missingVars -join ', ')" }
}

# Check if .env files are gitignored
Write-Host "Testing: .env files in .gitignore..." -NoNewline
try {
    $gitignore = Get-Content "..\frontend\.gitignore" -ErrorAction Stop
    if ($gitignore -match "\.env") {
        Write-Host " ✅ PASS" -ForegroundColor Green
        $testResults += @{ Test = ".env Gitignore"; Status = "PASS"; Details = ".env files protected" }
    } else {
        Write-Host " ❌ FAIL" -ForegroundColor Red
        $testResults += @{ Test = ".env Gitignore"; Status = "FAIL"; Details = ".env files not in .gitignore" }
    }
} catch {
    Write-Host " ⚠️  WARN" -ForegroundColor Yellow
    $testResults += @{ Test = ".env Gitignore"; Status = "WARN"; Details = "Could not verify" }
}

Write-Host "`n📊 TEST SUMMARY" -ForegroundColor Cyan
Write-Host "=============`n" -ForegroundColor Cyan

$passed = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$warned = ($testResults | Where-Object { $_.Status -eq "WARN" }).Count
$failed = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$total = $testResults.Count

Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Warnings: $warned" -ForegroundColor Yellow
Write-Host "Failed: $failed" -ForegroundColor Red

Write-Host "`n📝 DETAILED RESULTS`n" -ForegroundColor Cyan

$testResults | ForEach-Object {
    $color = switch ($_.Status) {
        "PASS" { "Green" }
        "WARN" { "Yellow" }
        "FAIL" { "Red" }
    }
    Write-Host "[$($_.Status)] $($_.Test)" -ForegroundColor $color
    Write-Host "   └─ $($_.Details)`n" -ForegroundColor Gray
}

# Final Verdict
Write-Host "`n========================================" -ForegroundColor Cyan
if ($failed -eq 0 -and $warned -le 2) {
    Write-Host "✅ READY FOR PRODUCTION DEPLOYMENT" -ForegroundColor Green
} elseif ($failed -eq 0) {
    Write-Host "⚠️  MOSTLY READY (Address Warnings)" -ForegroundColor Yellow
} else {
    Write-Host "❌ NOT READY (Fix Failures First)" -ForegroundColor Red
}
Write-Host "========================================`n" -ForegroundColor Cyan

# Recommendations
if ($failed -gt 0 -or $warned -gt 0) {
    Write-Host "📋 RECOMMENDATIONS:`n" -ForegroundColor Cyan
    if ($failed -gt 0) {
        Write-Host "1. Fix all FAILED tests before deploying" -ForegroundColor Red
    }
    if ($warned -gt 0) {
        Write-Host "2. Review WARNINGS and address if possible" -ForegroundColor Yellow
    }
    Write-Host "3. Run 'npm run build' on frontend to test production build" -ForegroundColor White
    Write-Host "4. Review PRODUCTION_CHECKLIST.md for complete deployment guide`n" -ForegroundColor White
}
