# Hydration Issues Detection Script for Windows/VS Code
# Run this in VS Code terminal: .\detect-hydration.ps1

param(
    [string]$ProjectPath = ".",
    [switch]$OpenInVSCode = $false
)

Write-Host "🔍 HYDRATION ISSUES DETECTION SCRIPT" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Create reports directory
$ReportsDir = "hydration-reports"
if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
}

$TimeStamp = Get-Date -Format "yyyyMMdd-HHmmss"
$ReportFile = "$ReportsDir\hydration-issues-$TimeStamp.txt"
$JsonReport = "$ReportsDir\hydration-issues-$TimeStamp.json"

Write-Host "📊 Report will be saved to: $ReportFile" -ForegroundColor Green
Write-Host ""

# Initialize results array for structured data
$AllIssues = @()

# Function to search and report issues
function Search-And-Report {
    param(
        [string]$Title,
        [string]$Pattern,
        [string]$Description,
        [string]$Category,
        [string]$Severity = "Medium",
        [string]$Fix = ""
    )
    
    Write-Host "🔎 $Title" -ForegroundColor Yellow
    Write-Host "Description: $Description" -ForegroundColor Gray
    Write-Host "----------------------------------------" -ForegroundColor Gray
    
    Add-Content -Path $ReportFile -Value "🔎 $Title"
    Add-Content -Path $ReportFile -Value "Description: $Description"
    Add-Content -Path $ReportFile -Value "Category: $Category | Severity: $Severity"
    Add-Content -Path $ReportFile -Value "Suggested Fix: $Fix"
    Add-Content -Path $ReportFile -Value "----------------------------------------"
    
    $FileTypes = @("*.tsx", "*.ts", "*.jsx", "*.js")
    $Results = @()
    
    foreach ($FileType in $FileTypes) {
        $Files = Get-ChildItem -Path "$ProjectPath\src" -Recurse -Include $FileType -ErrorAction SilentlyContinue
        foreach ($File in $Files) {
            $LineNumber = 1
            $Content = Get-Content $File.FullName -ErrorAction SilentlyContinue
            if ($Content) {
                foreach ($Line in $Content) {
                    if ($Line -match $Pattern) {
                        $Match = @{
                            File = $File.FullName.Replace($PWD.Path, "").TrimStart('\')
                            Line = $LineNumber
                            Content = $Line.Trim()
                            Category = $Category
                            Severity = $Severity
                            Fix = $Fix
                        }
                        $Results += $Match
                        $RelativePath = $File.FullName.Replace($PWD.Path, "").TrimStart('\')
                        Write-Host "$RelativePath`:$LineNumber`: $($Line.Trim())" -ForegroundColor White
                        Add-Content -Path $ReportFile -Value "$RelativePath`:$LineNumber`: $($Line.Trim())"
                    }
                    $LineNumber++
                }
            }
        }
    }
    
    if ($Results.Count -eq 0) {
        Write-Host "✅ No issues found" -ForegroundColor Green
        Add-Content -Path $ReportFile -Value "✅ No issues found"
    } else {
        Write-Host "❌ Found $($Results.Count) issues" -ForegroundColor Red
        Add-Content -Path $ReportFile -Value "❌ Found $($Results.Count) issues"
    }
    
    Add-Content -Path $ReportFile -Value ""
    Add-Content -Path $ReportFile -Value ""
    Write-Host ""
    
    return $Results
}

Write-Host "Starting hydration issues scan..." -ForegroundColor Cyan
Write-Host ""

# 1. Date/Time Hydration Issues
$Issues1 = Search-And-Report `
    -Title "DATE/TIME HYDRATION ISSUES" `
    -Pattern "(new Date\(\)\.toLocaleDateString|new Date\(\)\.toLocaleString|new Date\(\)\.toString|Date\.now\(\)|toLocaleTimeString)" `
    -Description "Components using date/time methods that differ between server and client" `
    -Category "Date/Time" `
    -Severity "High" `
    -Fix "Use fixed timezone, wrap in mounted check, or use date-fns with consistent formatting"

# 2. Browser API Usage
$Issues2 = Search-And-Report `
    -Title "BROWSER API HYDRATION ISSUES" `
    -Pattern "(window\.|document\.|navigator\.|localStorage\.|sessionStorage\.)" `
    -Description "Direct browser API usage without mounted state protection" `
    -Category "Browser APIs" `
    -Severity "High" `
    -Fix "Wrap in mounted state check or use useEffect"

# 3. Math rand() Usage
$Issues3 = Search-And-Report `
    -Title "RANDOM VALUE HYDRATION ISSUES" `
    -Pattern "Math\.random\(\)" `
    -Description "Random values causing different renders on server vs client" `
    -Category "Random Values" `
    -Severity "Medium" `
    -Fix "Generate random values in useEffect or use deterministic alternatives"

# 4. Missing Mounted State Protection
$Issues4 = Search-And-Report `
    -Title "MISSING MOUNTED STATE PATTERNS" `
    -Pattern "useState.*false.*setMounted" `
    -Description "Components that might need mounted state protection" `
    -Category "State Management" `
    -Severity "Medium" `
    -Fix "Add mounted state pattern with loading skeleton"

# 5. Conditional Rendering Without Guards
$Issues5 = Search-And-Report `
    -Title "UNSAFE CONDITIONAL RENDERING" `
    -Pattern "(\?\s*<|\&\&\s*<)" `
    -Description "Conditional rendering that might behave differently on server vs client" `
    -Category "Conditional Rendering" `
    -Severity "Medium" `
    -Fix "Ensure conditions are deterministic or wrap in mounted check"

# 6. Brand Color Issues - Hex Colors
$Issues6 = Search-And-Report `
    -Title "BRAND COLOR INCONSISTENCIES (HEX)" `
    -Pattern "(#60A875|#59B1E3)" `
    -Description "Hard-coded brand colors that should use Tailwind utilities" `
    -Category "Brand Colors" `
    -Severity "Low" `
    -Fix "Replace with bg-brand-green or bg-brand-blue utilities"

# 7. Brand Color Issues - Generic Tailwind
$Issues7 = Search-And-Report `
    -Title "GENERIC TAILWIND COLORS (SHOULD BE BRAND)" `
    -Pattern "(bg-green-[0-9]00|text-green-[0-9]00|border-green-[0-9]00|bg-blue-[0-9]00|text-blue-[0-9]00|border-blue-[0-9]00)" `
    -Description "Generic green/blue colors that should use brand colors" `
    -Category "Brand Colors" `
    -Severity "Low" `
    -Fix "Replace with appropriate brand color utilities"

# 8. Auth State Without Mounted Check
$Issues8 = Search-And-Report `
    -Title "AUTH STATE HYDRATION ISSUES" `
    -Pattern "(user\s*\?\s*|!user\s*\&\&|isLoggedIn|isAuthenticated)" `
    -Description "Authentication state checks that might cause hydration issues" `
    -Category "Authentication" `
    -Severity "High" `
    -Fix "Ensure auth state is stable during hydration or use loading states"

# 9. Dynamic Imports Without Proper SSR Handling
$Issues9 = Search-And-Report `
    -Title "DYNAMIC IMPORTS POTENTIAL ISSUES" `
    -Pattern "dynamic\(.*import|lazy\(" `
    -Description "Dynamic imports that might need SSR configuration" `
    -Category "Dynamic Imports" `
    -Severity "Medium" `
    -Fix "Ensure ssr: false is set if component uses browser APIs"

# 10. useEffect Missing Dependency Arrays
$Issues10 = Search-And-Report `
    -Title "USEEFFECT DEPENDENCY ISSUES" `
    -Pattern "useEffect\([^)]*\)\s*(?!\s*,)" `
    -Description "useEffect calls without dependency arrays that might cause hydration issues" `
    -Category "Hooks" `
    -Severity "Medium" `
    -Fix "Add proper dependency arrays to useEffect calls"

# Combine all issues
$AllIssues = $Issues1 + $Issues2 + $Issues3 + $Issues4 + $Issues5 + $Issues6 + $Issues7 + $Issues8 + $Issues9 + $Issues10

# Generate summary
$Summary = @{
    TotalIssues = $AllIssues.Count
    HighSeverity = ($AllIssues | Where-Object { $_.Severity -eq "High" }).Count
    MediumSeverity = ($AllIssues | Where-Object { $_.Severity -eq "Medium" }).Count
    LowSeverity = ($AllIssues | Where-Object { $_.Severity -eq "Low" }).Count
    Categories = ($AllIssues | Group-Object Category | ForEach-Object { @{ Category = $_.Name; Count = $_.Count } })
    Timestamp = Get-Date
    ProjectPath = $PWD.Path
}

# Save JSON report
$JsonData = @{
    Summary = $Summary
    Issues = $AllIssues
} | ConvertTo-Json -Depth 4

$JsonData | Out-File -FilePath $JsonReport -Encoding UTF8

# Display summary
Write-Host "📊 HYDRATION SCAN SUMMARY" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host "Total Issues Found: $($Summary.TotalIssues)" -ForegroundColor $(if($Summary.TotalIssues -gt 0) { "Red" } else { "Green" })
Write-Host "  🔴 High Severity: $($Summary.HighSeverity)"
Write-Host "  🟡 Medium Severity: $($Summary.MediumSeverity)"
Write-Host "  🟢 Low Severity: $($Summary.LowSeverity)"
Write-Host ""

Write-Host "📁 Reports Generated:" -ForegroundColor Green
Write-Host "  📄 Text Report: $ReportFile"
Write-Host "  📊 JSON Report: $JsonReport"
Write-Host ""

if ($Summary.TotalIssues -gt 0) {
    Write-Host "🎯 NEXT STEPS:" -ForegroundColor Yellow
    Write-Host "1. Review the detailed report: $ReportFile"
    Write-Host "2. Start with HIGH SEVERITY issues first"
    Write-Host "3. Use the suggested fixes for each category"
    Write-Host "4. Test hydration after each fix with: npm run build"
    Write-Host ""
    
    # Offer to open in VS Code
    if ($OpenInVSCode) {
        Write-Host "Opening reports in VS Code..." -ForegroundColor Green
        code $ReportFile
        code $JsonReport
    } else {
        Write-Host "💡 Tip: Run with -OpenInVSCode to automatically open reports in VS Code" -ForegroundColor Cyan
    }
}

Write-Host "✅ Hydration scan complete!" -ForegroundColor Green