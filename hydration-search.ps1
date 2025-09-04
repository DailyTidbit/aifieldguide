# hydration-search-best.ps1
# Robust hydration issue detection for Daily Tidbit

Write-Host "Searching for hydration issues..." -ForegroundColor Cyan
$searchPath = "src\*"
$files = Get-ChildItem -Path $searchPath -Recurse -File -Include *.tsx,*.ts,*.jsx,*.js -ErrorAction SilentlyContinue

function Show-Matches($title, $pattern, [ScriptBlock]$where = { $true }) {
    Write-Host "`n=== $title ===" -ForegroundColor Yellow
    $results = $files |
        ForEach-Object {
            Select-String -Path $_.FullName -Pattern $pattern -SimpleMatch:$false -ErrorAction SilentlyContinue
        } |
        Where-Object $where
    
    if ($results) {
        $results | ForEach-Object {
            Write-Host ("  {0}:{1} - {2}" -f $_.Filename, $_.LineNumber, $_.Line.Trim()) -ForegroundColor White
        }
    } else {
        Write-Host "  No matches found" -ForegroundColor Green
    }
}

# 1. Math.random() - primary hydration culprit
Show-Matches "Math.random() usage" 'Math\.random\(\)'

# 2. Date.now() - can cause timing mismatches
Show-Matches "Date.now() usage" 'Date\.now\(\)'

# 3. new Date() with no args - different timestamps
Show-Matches "new Date() usage" 'new\s+Date\(\)'

# 4. typeof window checks - server/client branching
Show-Matches "typeof window !== 'undefined' checks" "typeof\s+window\s*!==\s*[`'`"]undefined[`'`"]"

# 5. Direct localStorage/sessionStorage (excluding safe wrappers)
Show-Matches "Direct localStorage/sessionStorage usage" '(?:^|[^A-Za-z_])(localStorage|sessionStorage)\.' {
    $_.Line -notmatch 'safe(Local|Session)Storage'
}

# 6. navigator usage (excluding wrapper)
Show-Matches "Direct navigator usage" '(?:^|[^A-Za-z_])navigator\.' {
    $_.Line -notmatch 'safeWindow\.navigator'
}

# 7. Conditional rendering via 'mounted' ternaries - major hydration issue
Show-Matches "Conditional rendering patterns" '\bmounted\b.*\?'

# 8. useState with dynamic initial values
Show-Matches "useState with potentially dynamic initial values" 'useState\([^)]*(?:new\s+Date\(|Date\.now\(|Math\.random\(|window\.)'

# 9. suppressHydrationWarning usage - indicates known issues
Show-Matches "suppressHydrationWarning usage" 'suppressHydrationWarning'

# 10. Direct window access patterns
Show-Matches "Direct window property access" '(?:^|[^A-Za-z_])window\.' {
    $_.Line -notmatch 'typeof window|safeWindow'
}

# 11. document access - server unavailable
Show-Matches "Direct document access" '(?:^|[^A-Za-z_])document\.' {
    $_.Line -notmatch 'typeof document'
}

# 12. Crypto usage for randomness
Show-Matches "Crypto.getRandomValues usage" 'crypto\.getRandomValues'

Write-Host "`n=== SUMMARY ===" -ForegroundColor Magenta
Write-Host "Priority fixes:" -ForegroundColor Yellow
Write-Host "1. Math.random() - replace with safeRandom" -ForegroundColor White
Write-Host "2. Conditional rendering with 'mounted' - causes server/client mismatch" -ForegroundColor White
Write-Host "3. Direct browser API usage - wrap with safe utilities" -ForegroundColor White
Write-Host "4. Dynamic useState initial values - use static defaults" -ForegroundColor White

Write-Host "`nSearch complete!" -ForegroundColor Green