# Quick analysis to find most problematic files without needing reports
# Save as quick-analysis.ps1 or run directly

Write-Host "🔍 QUICK FILE ANALYSIS - Finding Most Problematic Files" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# Get all TypeScript/JavaScript files
$Files = Get-ChildItem -Path "src" -Recurse -Include "*.tsx", "*.ts", "*.jsx", "*.js" | Where-Object { $_.Name -notlike "*.d.ts" }

Write-Host "📊 Analyzing $($Files.Count) files..." -ForegroundColor Green
Write-Host ""

# Define problematic patterns with severity weights
$Patterns = @{
    "Browser APIs" = @{ Pattern = "(window\.|document\.|navigator\.|localStorage\.|sessionStorage\.)"; Weight = 3; Severity = "HIGH" }
    "Date/Time Issues" = @{ Pattern = "(new Date\(\)\.toLocaleDateString|new Date\(\)\.toLocaleString|Date\.now\(\))"; Weight = 3; Severity = "HIGH" }
    "Auth State" = @{ Pattern = "(user\s*\?|!user\s*&&|isLoggedIn|isAuthenticated)"; Weight = 3; Severity = "HIGH" }
    "Math.random()" = @{ Pattern = "Math\.random\(\)"; Weight = 2; Severity = "MEDIUM" }
    "Conditional Rendering" = @{ Pattern = "(\?\s*<|&&\s*<)"; Weight = 2; Severity = "MEDIUM" }
    "Brand Hex Colors" = @{ Pattern = "(#60A875|#59B1E3)"; Weight = 1; Severity = "LOW" }
    "Generic Tailwind" = @{ Pattern = "(bg-green-[0-9]00|bg-blue-[0-9]00|text-green-[0-9]00|text-blue-[0-9]00)"; Weight = 1; Severity = "LOW" }
}

$FileScores = @{}

foreach ($File in $Files) {
    $Content = Get-Content $File.FullName -ErrorAction SilentlyContinue
    if (-not $Content) { continue }
    
    $TotalScore = 0
    $Issues = @{}
    
    foreach ($PatternName in $Patterns.Keys) {
        $Pattern = $Patterns[$PatternName].Pattern
        $Weight = $Patterns[$PatternName].Weight
        $Severity = $Patterns[$PatternName].Severity
        
        $Matches = ($Content | Where-Object { $_ -match $Pattern }).Count
        if ($Matches -gt 0) {
            $Issues[$PatternName] = @{ Count = $Matches; Severity = $Severity }
            $TotalScore += $Matches * $Weight
        }
    }
    
    if ($TotalScore -gt 0) {
        $RelativePath = $File.FullName.Replace($PWD.Path, "").TrimStart('\')
        $FileScores[$RelativePath] = @{
            Score = $TotalScore
            Issues = $Issues
            File = $File
        }
    }
}

# Sort by score and show top problematic files
$TopFiles = $FileScores.GetEnumerator() | Sort-Object { $_.Value.Score } -Descending | Select-Object -First 20

Write-Host "🎯 TOP 20 MOST PROBLEMATIC FILES:" -ForegroundColor Red
Write-Host "=================================" -ForegroundColor Red
Write-Host ""

$Rank = 1
foreach ($FileEntry in $TopFiles) {
    $FilePath = $FileEntry.Key
    $FileData = $FileEntry.Value
    
    Write-Host "$Rank. $FilePath" -ForegroundColor Yellow
    Write-Host "   📊 Priority Score: $($FileData.Score)" -ForegroundColor Red
    
    foreach ($IssueType in $FileData.Issues.Keys) {
        $IssueData = $FileData.Issues[$IssueType]
        $Color = switch ($IssueData.Severity) {
            "HIGH" { "Red" }
            "MEDIUM" { "Yellow" }  
            "LOW" { "Green" }
        }
        Write-Host "   $($IssueData.Severity): $IssueType ($($IssueData.Count) issues)" -ForegroundColor $Color
    }
    Write-Host ""
    $Rank++
}

# Generate quick fix recommendations
Write-Host "🎯 QUICK FIX STRATEGY:" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host ""

$TotalHigh = 0
$TotalMedium = 0 
$TotalLow = 0

foreach ($PatternName in $Patterns.Keys) {
    $Pattern = $Patterns[$PatternName].Pattern
    $Severity = $Patterns[$PatternName].Severity
    
    $TotalMatches = 0
    foreach ($File in $Files) {
        $Content = Get-Content $File.FullName -ErrorAction SilentlyContinue
        if ($Content) {
            $TotalMatches += ($Content | Where-Object { $_ -match $Pattern }).Count
        }
    }
    
    if ($TotalMatches -gt 0) {
        $Color = switch ($Severity) {
            "HIGH" { "Red"; $script:TotalHigh += $TotalMatches }
            "MEDIUM" { "Yellow"; $script:TotalMedium += $TotalMatches }
            "LOW" { "Green"; $script:TotalLow += $TotalMatches }
        }
        Write-Host "$Severity - $PatternName`: $TotalMatches issues" -ForegroundColor $Color
    }
}

Write-Host ""
Write-Host "📊 SUMMARY:" -ForegroundColor White
Write-Host "🔴 High Priority (Critical): $TotalHigh issues" -ForegroundColor Red
Write-Host "🟡 Medium Priority: $TotalMedium issues" -ForegroundColor Yellow  
Write-Host "🟢 Low Priority (Brand Colors): $TotalLow issues" -ForegroundColor Green
Write-Host "📊 TOTAL: $($TotalHigh + $TotalMedium + $TotalLow) issues" -ForegroundColor White

Write-Host ""
Write-Host "🎯 RECOMMENDED ACTION PLAN:" -ForegroundColor Cyan
Write-Host ""

if ($TopFiles.Count -gt 0) {
    Write-Host "PHASE 1 - Target these top 5 files first:" -ForegroundColor Yellow
    for ($i = 0; $i -lt [Math]::Min(5, $TopFiles.Count); $i++) {
        Write-Host "  $($i + 1). $($TopFiles[$i].Key) (Score: $($TopFiles[$i].Value.Score))" -ForegroundColor White
    }
    Write-Host ""
}

Write-Host "PHASE 2 - Batch fix patterns:" -ForegroundColor Yellow
Write-Host "  1. Brand colors (easiest wins): $TotalLow issues"
Write-Host "  2. Date/time formatting: Use batch script"
Write-Host "  3. Browser API wrapping: Use HydrationSafe component"
Write-Host "  4. Auth state: Use safe auth hook"
Write-Host ""

Write-Host "💡 NEXT STEPS:" -ForegroundColor Green
Write-Host "1. Focus on the top 5 files above"
Write-Host "2. Run: .\batch-fix-hydration.ps1 -Action fix-brand-colors -DryRun"
Write-Host "3. Create HydrationSafe wrapper component"
Write-Host "4. Test with: npm run build"