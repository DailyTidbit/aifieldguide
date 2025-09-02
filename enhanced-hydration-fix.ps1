# clean-hydration-fix.ps1
# Daily Tidbit Clean Hydration Fix Script - No warnings, optimized performance
[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("fix-browser-apis", "fix-random-values", "fix-all-hydration", "test-issues", "analyze-detailed")]
    [string]$Action,
    
    [Parameter()]
    [bool]$DryRun = $true,
    
    [Parameter()]
    [string]$Path = "src/",
    
    [Parameter()]
    [string]$BackupDir = "hydration-backups"
)

# Browser API patterns that cause hydration issues - mapped to YOUR existing utilities
$BrowserAPIPatterns = @{
    'localStorage\.getItem\(' = 'safeLocalStorage.getItem('
    'localStorage\.setItem\(' = 'safeLocalStorage.setItem('
    'localStorage\.removeItem\(' = 'safeLocalStorage.removeItem('
    'localStorage\.clear\(\)' = 'safeLocalStorage.clear()'
    'sessionStorage\.getItem\(' = 'safeWindow.sessionStorage.getItem('
    'sessionStorage\.setItem\(' = 'safeWindow.sessionStorage.setItem('
    'window\.localStorage\.getItem\(' = 'safeWindow.localStorage.getItem('
    'window\.localStorage\.setItem\(' = 'safeWindow.localStorage.setItem('
    'window\.localStorage\.removeItem\(' = 'safeWindow.localStorage.removeItem('
    'window\.sessionStorage\.getItem\(' = 'safeWindow.sessionStorage.getItem('
    'window\.sessionStorage\.setItem\(' = 'safeWindow.sessionStorage.setItem('
    'navigator\.userAgent' = 'safeWindow.navigator.userAgent()'
    'navigator\.share\(' = 'safeWindow.navigator.share('
    'window\.gtag\(' = 'safeWindow.gtag('
}

# Random value patterns - mapped to YOUR existing utilities
$RandomValuePatterns = @{
    'Math\.random\(\)' = 'safeRandom.number()'
    'Date\.now\(\)' = 'getCurrentYear()'
    'new Date\(\)\.getTime\(\)' = 'Date.now()'
    '\+new Date\(\)' = 'Date.now()'
}

function Write-Status {
    param([string]$Message, [string]$Type = "Info")
    
    $color = switch ($Type) {
        "Success" { "Green" }
        "Warning" { "Yellow" }
        "Error" { "Red" }
        default { "Cyan" }
    }
    
    Write-Host "[$Type] $Message" -ForegroundColor $color
}

function Get-FileContentSafe {
    param([string]$FilePath)
    
    try {
        if (Test-Path $FilePath) {
            return Get-Content $FilePath -Raw
        }
        return $null
    } catch {
        return $null
    }
}

function Set-FileContentSafe {
    param([string]$FilePath, [string]$Content)
    
    try {
        Set-Content $FilePath -Value $Content -NoNewline
        return $true
    } catch {
        Write-Status "Failed to write: $FilePath" "Error"
        return $false
    }
}

function Get-FilesToProcess {
    $extensions = @("*.tsx", "*.ts", "*.jsx", "*.js")
    $allFiles = @()
    
    foreach ($ext in $extensions) {
        $files = Get-ChildItem -Path $Path -Filter $ext -Recurse -ErrorAction SilentlyContinue | 
                 Where-Object { 
                     $_.FullName -notmatch "node_modules" -and
                     $_.FullName -notmatch "\.next" -and
                     $_.FullName -notmatch "\\dist\\" -and
                     $_.FullName -notmatch "\\build\\" -and
                     $_.FullName -notmatch "\\hydration-backups\\" -and
                     $_.FullName -notmatch "hydration-backups"
                 }
        $allFiles += $files
    }
    
    return $allFiles
}

function Backup-Files {
    param([array]$Files)
    
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir | Out-Null
        Write-Status "Created backup directory: $BackupDir"
    }
    
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupPath = Join-Path $BackupDir $timestamp
    New-Item -ItemType Directory -Path $backupPath | Out-Null
    
    foreach ($file in $Files) {
        try {
            $relativePath = $file.FullName.Replace((Get-Location).Path, "").TrimStart('\')
            $backupFilePath = Join-Path $backupPath $relativePath
            $backupFileDir = Split-Path $backupFilePath -Parent
            
            if (-not (Test-Path $backupFileDir)) {
                New-Item -ItemType Directory -Path $backupFileDir -Force | Out-Null
            }
            
            Copy-Item $file.FullName $backupFilePath -ErrorAction Stop
        } catch {
            Write-Status "Failed to backup: $($file.Name)" "Warning"
        }
    }
    
    Write-Status "Files backed up to: $backupPath" "Success"
    return $backupPath
}

function Test-NeedsImport {
    param([string]$Content, [hashtable]$Patterns)
    
    foreach ($pattern in $Patterns.Keys) {
        if ($Content -match $pattern) {
            return $true
        }
    }
    return $false
}

function Add-ImportStatement {
    param([string]$Content, [string]$ImportStatement)
    
    if ($Content -match $ImportStatement) {
        return $Content
    }
    
    $importRegex = "(?s)((?:^import.*?;[\r\n]+)*)"
    if ($Content -match $importRegex) {
        $importSection = $Matches[1]
        return $Content -replace $importRegex, "$importSection$ImportStatement`r`n"
    }
    
    return "$ImportStatement`r`n$Content"
}

function Update-BrowserAPIs {
    param([array]$Files)
    
    $changesCount = 0
    # Updated to use YOUR existing utility files
    $safeUtilsImport = "import { safeLocalStorage } from '../lib/safeUtils';"
    $clientUtilsImport = "import { safeWindow } from '../lib/clientUtils';"
    
    foreach ($file in $Files) {
        $content = Get-FileContentSafe $file.FullName
        if (-not $content) { continue }
        
        $fileChanged = $false
        $needsSafeUtils = $false
        $needsClientUtils = $false
        
        # Check what imports are needed based on patterns found
        if ($content -match 'localStorage\.') { $needsSafeUtils = $true }
        if ($content -match 'sessionStorage\.|navigator\.|window\.gtag') { $needsClientUtils = $true }
        
        # Add appropriate imports
        if ($needsSafeUtils -and $content -notmatch "import.*safeLocalStorage.*from.*safeUtils") {
            $content = Add-ImportStatement $content $safeUtilsImport
            $fileChanged = $true
        }
        
        if ($needsClientUtils -and $content -notmatch "import.*safeWindow.*from.*clientUtils") {
            $content = Add-ImportStatement $content $clientUtilsImport
            $fileChanged = $true
        }
        
        # Apply pattern replacements
        foreach ($pattern in $BrowserAPIPatterns.Keys) {
            $replacement = $BrowserAPIPatterns[$pattern]
            if ($content -match $pattern) {
                $content = $content -replace $pattern, $replacement
                $fileChanged = $true
            }
        }
        
        if ($fileChanged) {
            if (-not $DryRun) {
                if (-not (Set-FileContentSafe $file.FullName $content)) { 
                    continue 
                }
            }
            $changesCount++
            Write-Status "Updated browser APIs in: $($file.Name)"
        }
    }
    
    Write-Status "Browser API issues fixed in $changesCount files" "Success"
}

function Update-RandomValues {
    param([array]$Files)
    
    $changesCount = 0
    $clientUtilsImport = "import { safeRandom } from '../lib/clientUtils';"
    $dateUtilsImport = "import { getCurrentYear } from '../lib/dateUtils';"
    
    foreach ($file in $Files) {
        $content = Get-FileContentSafe $file.FullName
        if (-not $content) { continue }
        
        $fileChanged = $false
        $needsClientUtils = $false
        $needsDateUtils = $false
        
        # Check what imports are needed
        if ($content -match 'Math\.random\(\)') { $needsClientUtils = $true }
        if ($content -match 'Date\.now\(\)|new Date\(\)\.getTime\(\)|\+new Date\(\)') { $needsDateUtils = $true }
        
        # Add appropriate imports
        if ($needsClientUtils -and $content -notmatch "import.*safeRandom.*from.*clientUtils") {
            $content = Add-ImportStatement $content $clientUtilsImport
            $fileChanged = $true
        }
        
        if ($needsDateUtils -and $content -notmatch "import.*getCurrentYear.*from.*dateUtils") {
            $content = Add-ImportStatement $content $dateUtilsImport
            $fileChanged = $true
        }
        
        # Apply pattern replacements
        foreach ($pattern in $RandomValuePatterns.Keys) {
            $replacement = $RandomValuePatterns[$pattern]
            if ($content -match $pattern) {
                $content = $content -replace $pattern, $replacement
                $fileChanged = $true
            }
        }
        
        if ($fileChanged) {
            if (-not $DryRun) {
                if (-not (Set-FileContentSafe $file.FullName $content)) { 
                    continue 
                }
            }
            $changesCount++
            Write-Status "Updated random values in: $($file.Name)"
        }
    }
    
    Write-Status "Random value issues fixed in $changesCount files" "Success"
}

function Test-HydrationIssues {
    param([array]$Files)
    
    $browserAPICount = 0
    $randomValueCount = 0
    $detailedIssues = @{
        'Browser APIs' = @()
        'Random Values' = @()
    }
    
    foreach ($file in $Files) {
        $content = Get-FileContentSafe $file.FullName
        if (-not $content) { continue }
        
        foreach ($pattern in $BrowserAPIPatterns.Keys) {
            $regexMatches = [regex]::Matches($content, $pattern)
            if ($regexMatches.Count -gt 0) {
                $browserAPICount += $regexMatches.Count
                $detailedIssues['Browser APIs'] += "$($file.Name): $($regexMatches.Count) matches of '$pattern'"
            }
        }
        
        foreach ($pattern in $RandomValuePatterns.Keys) {
            $regexMatches = [regex]::Matches($content, $pattern)
            if ($regexMatches.Count -gt 0) {
                $randomValueCount += $regexMatches.Count
                $detailedIssues['Random Values'] += "$($file.Name): $($regexMatches.Count) matches of '$pattern'"
            }
        }
    }
    
    Write-Status "=== Daily Tidbit Hydration Analysis ===" "Info"
    $total = $browserAPICount + $randomValueCount
    
    $browserStatus = if ($browserAPICount -gt 0) { "Warning" } else { "Success" }
    $randomStatus = if ($randomValueCount -gt 0) { "Warning" } else { "Success" }
    $totalStatus = if ($total -gt 0) { "Error" } else { "Success" }
    
    Write-Status "Browser APIs: $browserAPICount issues" $browserStatus
    Write-Status "Random Values: $randomValueCount issues" $randomStatus
    Write-Status "Total Issues: $total" $totalStatus
    
    return @{
        'BrowserAPIs' = $browserAPICount
        'RandomValues' = $randomValueCount
        'Details' = $detailedIssues
        'Total' = $total
    }
}

function Show-DetailedAnalysis {
    param([array]$Files)
    
    $results = Test-HydrationIssues -Files $Files
    
    Write-Status "`n=== DETAILED BREAKDOWN ===" "Info"
    
    foreach ($category in $results.Details.Keys) {
        $issues = $results.Details[$category]
        if ($issues.Count -gt 0) {
            Write-Status "`n--- $category ---" "Warning"
            foreach ($issue in $issues) {
                Write-Host "  • $issue" -ForegroundColor Yellow
            }
        }
    }
    
    if ($results.Total -gt 0) {
        Write-Status "`nRecommended Actions:" "Info"
        Write-Host "1. Create utils file: src/utils/browser-safe.ts" -ForegroundColor Cyan
        Write-Host "2. Run: .\clean-hydration-fix.ps1 -Action fix-all-hydration -DryRun:`$false" -ForegroundColor Cyan
        Write-Host "3. Test: npm run dev" -ForegroundColor Cyan
    } else {
        Write-Status "🎉 No hydration issues found! Your app should be hydration-safe." "Success"
    }
}

# Main execution
try {
    Write-Status "Daily Tidbit Clean Hydration Fix" "Info"
    Write-Status "Action: $Action | DryRun: $DryRun | Path: $Path" "Info"
    
    $files = Get-FilesToProcess
    Write-Status "Processing $($files.Count) files..."
    
    if (-not $DryRun -and $Action -notin @("test-issues", "analyze-detailed")) {
        Backup-Files -Files $files | Out-Null
    }
    
    switch ($Action) {
        "fix-browser-apis" { 
            Update-BrowserAPIs -Files $files 
            Write-Status "Browser API fixes applied using your existing safeUtils and clientUtils!" "Success"
        }
        "fix-random-values" { 
            Update-RandomValues -Files $files 
            Write-Status "Random value fixes applied using your existing clientUtils and dateUtils!" "Success"
        }
        "fix-all-hydration" { 
            Update-BrowserAPIs -Files $files 
            Update-RandomValues -Files $files
            Write-Status "All hydration fixes applied using your existing utility files!" "Success"
        }
        "test-issues" { 
            Test-HydrationIssues -Files $files | Out-Null
        }
        "analyze-detailed" { 
            Show-DetailedAnalysis -Files $files 
        }
    }
    
    Write-Status "Script completed successfully!" "Success"
    
    if ($DryRun -and $Action -notin @("test-issues", "analyze-detailed")) {
        Write-Status "This was a dry run. Use -DryRun:`$false to apply changes." "Info"
    }
    
} catch {
    Write-Status "Script failed: $($_.Exception.Message)" "Error"
    exit 1
}