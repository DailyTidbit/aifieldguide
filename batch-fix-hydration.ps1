# batch-fix-hydration.ps1
# Daily Tidbit Hydration & Brand Color Batch Fix Script (Compatible Version)
[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("fix-brand-colors", "fix-tailwind-colors", "fix-date-patterns", "fix-browser-apis", "test-issues")]
    [string]$Action,
    
    [Parameter()]
    [bool]$DryRun = $true,
    
    [Parameter()]
    [string]$Path = "src/",
    
    [Parameter()]
    [string]$BackupDir = "hydration-backups"
)

# Color definitions based on your Tailwind config
$BrandColors = @{
    '#60A875' = 'brand-green'
    '#4e8e61' = 'brand-greenDark' 
    '#7bc190' = 'brand-greenLight'
    '#59B1E3' = 'brand-blue'
    '#4791bf' = 'brand-blueDark'
    '#7cc4eb' = 'brand-blueLight'
}

$TailwindColors = @{
    'bg-green-500' = 'bg-brand-green'
    'bg-green-600' = 'bg-brand-greenDark'
    'bg-green-400' = 'bg-brand-greenLight'
    'text-green-500' = 'text-brand-green'
    'text-green-600' = 'text-brand-greenDark'
    'border-green-500' = 'border-brand-green'
    'ring-green-500' = 'ring-brand-green'
    'focus:ring-green-500' = 'focus:ring-brand-green'
    'hover:bg-green-600' = 'hover:bg-brand-greenDark'
    'bg-blue-500' = 'bg-brand-blue'
    'bg-blue-600' = 'bg-brand-blueDark' 
    'bg-blue-400' = 'bg-brand-blueLight'
    'text-blue-500' = 'text-brand-blue'
    'text-blue-600' = 'text-brand-blueDark'
    'border-blue-500' = 'border-brand-blue'
    'ring-blue-500' = 'ring-brand-blue'
    'focus:ring-blue-500' = 'focus:ring-brand-blue'
    'hover:bg-blue-600' = 'hover:bg-brand-blueDark'
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
        # Most conservative approach - minimal parameters
        if (Test-Path $FilePath) {
            $contentLines = Get-Content $FilePath
            if ($contentLines) {
                return ($contentLines -join "`n")
            }
        }
        return $null
    } catch {
        return $null
    }
}

function Set-FileContentSafe {
    param([string]$FilePath, [string]$Content)
    
    try {
        # Split content into lines for Set-Content
        $lines = $Content -split "`n"
        Set-Content $FilePath -Value $lines
        return $true
    } catch {
        Write-Status "Failed to write: $FilePath" "Error"
        return $false
    }
}

function Get-FilesToProcess {
    $extensions = @("*.tsx", "*.ts", "*.jsx", "*.js", "*.css")
    $files = @()
    
    foreach ($ext in $extensions) {
        $foundFiles = Get-ChildItem -Path $Path -Filter $ext -Recurse -ErrorAction SilentlyContinue | 
                     Where-Object { 
                         $_.FullName -notmatch "node_modules" -and
                         $_.FullName -notmatch "\.next" -and
                         $_.FullName -notmatch "\\dist\\" -and
                         $_.FullName -notmatch "\\build\\" -and
                         $_.FullName -notmatch "\\hydration-backups\\" -and
                         $_.FullName -notmatch "hydration-backups"
                     }
        $files += $foundFiles
    }
    
    return $files
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

function Update-BrandColors {
    param([array]$Files)
    
    $changesCount = 0
    
    foreach ($file in $Files) {
        $content = Get-FileContentSafe $file.FullName
        if (-not $content) { continue }
        
        $originalContent = $content
        
        # Fix hex colors in CSS files
        if ($file.Extension -eq ".css") {
            # CSS custom properties and values
            $content = $content -replace '#60A875', 'var(--brand-green)'
            $content = $content -replace '#60a875', 'var(--brand-green)'
            $content = $content -replace '#4e8e61', 'var(--brand-greenDark)'
            $content = $content -replace '#4E8E61', 'var(--brand-greenDark)'
            $content = $content -replace '#59B1E3', 'var(--brand-blue)'
            $content = $content -replace '#59b1e3', 'var(--brand-blue)'
            $content = $content -replace '#4791bf', 'var(--brand-blueDark)'
            $content = $content -replace '#4791BF', 'var(--brand-blueDark)'
        } else {
            # Fix in TSX/JSX files - multiple patterns
            
            # Pattern 1: className with hex colors (shouldn't happen but just in case)
            $content = $content -replace '#60A875', 'brand-green'
            $content = $content -replace '#60a875', 'brand-green'
            $content = $content -replace '#59B1E3', 'brand-blue'
            $content = $content -replace '#59b1e3', 'brand-blue'
            
            # Pattern 2: Style objects
            $content = $content -replace 'backgroundColor:\s*["`'']#60A875["`'']', 'backgroundColor: "rgb(96 168 117)"'
            $content = $content -replace 'backgroundColor:\s*["`'']#60a875["`'']', 'backgroundColor: "rgb(96 168 117)"'
            $content = $content -replace 'backgroundColor:\s*["`'']#59B1E3["`'']', 'backgroundColor: "rgb(89 177 227)"'
            $content = $content -replace 'backgroundColor:\s*["`'']#59b1e3["`'']', 'backgroundColor: "rgb(89 177 227)"'
            
            $content = $content -replace 'color:\s*["`'']#60A875["`'']', 'color: "rgb(96 168 117)"'
            $content = $content -replace 'color:\s*["`'']#60a875["`'']', 'color: "rgb(96 168 117)"'
            $content = $content -replace 'color:\s*["`'']#59B1E3["`'']', 'color: "rgb(89 177 227)"'
            $content = $content -replace 'color:\s*["`'']#59b1e3["`'']', 'color: "rgb(89 177 227)"'
            
            # Pattern 3: Template literals and other formats
            $content = $content -replace '`#60A875`', 'rgb(96 168 117)'
            $content = $content -replace '`#60a875`', 'rgb(96 168 117)'
            $content = $content -replace '`#59B1E3`', 'rgb(89 177 227)'
            $content = $content -replace '`#59b1e3`', 'rgb(89 177 227)'
        }
        
        if ($content -ne $originalContent) {
            if (-not $DryRun) {
                $success = Set-FileContentSafe $file.FullName $content
                if (-not $success) { continue }
            }
            $changesCount++
            Write-Status "Updated brand colors in: $($file.Name)"
        }
    }
    
    Write-Status "Brand colors updated in $changesCount files" "Success"
}

function Update-TailwindColors {
    param([array]$Files)
    
    $changesCount = 0
    
    foreach ($file in $Files) {
        if ($file.Extension -notin @('.tsx', '.ts', '.jsx', '.js')) { continue }
        
        $content = Get-FileContentSafe $file.FullName
        if (-not $content) { continue }
        
        $originalContent = $content
        
        foreach ($oldClass in $TailwindColors.Keys) {
            $newClass = $TailwindColors[$oldClass]
            $escapedClass = [regex]::Escape($oldClass)
            $pattern = "\b$escapedClass\b"
            $content = $content -replace $pattern, $newClass
        }
        
        if ($content -ne $originalContent) {
            if (-not $DryRun) {
                $success = Set-FileContentSafe $file.FullName $content
                if (-not $success) { continue }
            }
            $changesCount++
            Write-Status "Updated Tailwind colors in: $($file.Name)"
        }
    }
    
    Write-Status "Tailwind colors updated in $changesCount files" "Success"
}

function Test-HydrationIssues {
    param([array]$Files)
    
    $issueCounters = @{
        'Brand Colors (Hex)' = 0
        'Tailwind Generic Colors' = 0  
        'Date Patterns' = 0
        'Browser APIs' = 0
        'Random Values' = 0
    }
    
    foreach ($file in $Files) {
        $content = Get-FileContentSafe $file.FullName
        if (-not $content) { continue }
        
        # Count brand color issues
        foreach ($hex in $BrandColors.Keys) {
            $escapedHex = [regex]::Escape($hex)
            $regexMatches = [regex]::Matches($content, $escapedHex)
            $issueCounters['Brand Colors (Hex)'] += $regexMatches.Count
        }
        
        # Count Tailwind color issues
        foreach ($class in $TailwindColors.Keys) {
            $escapedClass = [regex]::Escape($class)
            $pattern = "\b$escapedClass\b"
            $regexMatches = [regex]::Matches($content, $pattern)
            $issueCounters['Tailwind Generic Colors'] += $regexMatches.Count
        }
        
        # Count date issues
        $dateMatches = [regex]::Matches($content, 'new Date\(\)\.getFullYear\(\)|\.toLocaleDateString\(\)|\.toLocaleTimeString\(\)')
        $issueCounters['Date Patterns'] += $dateMatches.Count
        
        # Count browser API issues
        $browserMatches = [regex]::Matches($content, '\blocalStorage\.\w+|\bsessionStorage\.\w+|\bnavigator\.\w+|\bwindow\.gtag')
        $issueCounters['Browser APIs'] += $browserMatches.Count
        
        # Count random value issues
        $randomMatches = [regex]::Matches($content, 'Math\.random\(\)|Date\.now\(\)')
        $issueCounters['Random Values'] += $randomMatches.Count
    }
    
    Write-Status "=== Daily Tidbit Hydration Issue Analysis ===" "Info"
    $total = 0
    foreach ($category in $issueCounters.Keys) {
        $count = $issueCounters[$category]
        $total += $count
        $status = if ($count -gt 0) { "Warning" } else { "Success" }
        Write-Status "$category`: $count issues" $status
    }
    
    $totalStatus = if ($total -gt 0) { "Error" } else { "Success" }
    Write-Status "Total Issues: $total" $totalStatus
    
    if ($total -gt 0) {
        Write-Status "Run with -DryRun:`$false to apply fixes" "Info"
    } else {
        Write-Status "No hydration issues detected!" "Success"
    }
}

# Main execution
try {
    Write-Status "Daily Tidbit Hydration Fix Script" "Info"
    Write-Status "Action: $Action" "Info"
    Write-Status "DryRun: $DryRun" "Info"
    Write-Status "Path: $Path" "Info"
    
    $files = Get-FilesToProcess
    Write-Status "Processing $($files.Count) files..."
    
    if (-not $DryRun -and $Action -ne "test-issues") {
        $backupPath = Backup-Files -Files $files
        Write-Status "Backup created at: $backupPath" "Success"
    }
    
    switch ($Action) {
        "fix-brand-colors" { Update-BrandColors -Files $files }
        "fix-tailwind-colors" { Update-TailwindColors -Files $files }
        "test-issues" { Test-HydrationIssues -Files $files }
    }
    
    Write-Status "Script completed successfully!" "Success"
    
    if ($DryRun -and $Action -ne "test-issues") {
        Write-Status "This was a dry run. Use -DryRun:`$false to apply changes." "Info"
    }
    
} catch {
    Write-Status "Script failed: $($_.Exception.Message)" "Error"
    Write-Status "Stack trace: $($_.ScriptStackTrace)" "Error"
    exit 1
}