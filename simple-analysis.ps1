# simple-analysis.ps1
# Quick analysis script for Daily Tidbit hydration issues

param(
    [string]$Path = "src/"
)

Write-Host "=== Daily Tidbit Hydration Issue Analysis ===" -ForegroundColor Cyan

# Get all relevant files
$files = Get-ChildItem -Path $Path -Recurse -Include "*.tsx","*.ts","*.jsx","*.js","*.css" | 
         Where-Object { $_.FullName -notmatch "node_modules|\.next|dist|build" }

Write-Host "Analyzing $($files.Count) files..." -ForegroundColor Green

$issues = @{
    'Brand Colors (Hex)' = 0
    'Tailwind Generic Colors' = 0  
    'Date Patterns' = 0
    'Browser APIs' = 0
    'Random Values' = 0
}

foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -ErrorAction SilentlyContinue
        if (-not $content) { continue }
        
        $fileContent = $content -join " "
        
        # Count brand color hex issues
        $hexMatches = ($fileContent | Select-String "#60A875|#4e8e61|#7bc190|#59B1E3|#4791bf|#7cc4eb" -AllMatches).Matches.Count
        $issues['Brand Colors (Hex)'] += $hexMatches
        
        # Count Tailwind generic color issues
        $tailwindMatches = ($fileContent | Select-String "\bbg-green-[456]00\b|\bbg-blue-[456]00\b|\btext-green-[456]00\b|\btext-blue-[456]00\b" -AllMatches).Matches.Count
        $issues['Tailwind Generic Colors'] += $tailwindMatches
        
        # Count date issues
        $dateMatches = ($fileContent | Select-String "new Date\(\)\.getFullYear\(\)|\.toLocaleDateString\(\)|\.toLocaleTimeString\(\)" -AllMatches).Matches.Count
        $issues['Date Patterns'] += $dateMatches
        
        # Count browser API issues
        $browserMatches = ($fileContent | Select-String "\blocalStorage\.\w+|\bsessionStorage\.\w+|\bnavigator\.\w+|\bwindow\.gtag" -AllMatches).Matches.Count
        $issues['Browser APIs'] += $browserMatches
        
        # Count random value issues
        $randomMatches = ($fileContent | Select-String "Math\.random\(\)|Date\.now\(\)" -AllMatches).Matches.Count
        $issues['Random Values'] += $randomMatches
        
    } catch {
        # Skip files that can&apos;t be read
        continue
    }
}

# Display results
$total = 0
foreach ($category in $issues.Keys) {
    $count = $issues[$category]
    $total += $count
    $color = if ($count -gt 0) { "Yellow" } else { "Green" }
    Write-Host "$category`: $count issues" -ForegroundColor $color
}

$totalColor = if ($total -gt 0) { "Red" } else { "Green" }
Write-Host "Total Issues: $total" -ForegroundColor $totalColor

if ($total -gt 0) {
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Fix brand colors first (biggest impact)" -ForegroundColor White
    Write-Host "2. Update date patterns with SafeDate components" -ForegroundColor White  
    Write-Host "3. Replace browser APIs with safe wrappers" -ForegroundColor White
    Write-Host "4. Fix random values in components" -ForegroundColor White
} else {
    Write-Host "No hydration issues detected! 🎉" -ForegroundColor Green
}