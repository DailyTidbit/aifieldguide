# hydration-structure-search.ps1
# Search for patterns that cause server/client DOM structure differences

Write-Host "Searching for server/client structure differences..." -ForegroundColor Cyan
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

# 1. Conditional rendering that returns different JSX structures
Show-Matches "Conditional rendering with different structures" '\breturn\s+.*\?\s*<' 

# 2. Early returns based on mounted state
Show-Matches "Early returns based on mounted/loading state" 'if\s*\([^)]*mounted[^)]*\)\s*return'

# 3. Different components returned in conditionals
Show-Matches "Different components in conditionals" 'return.*<\w+.*\?.*<\w+'

# 4. Skeleton components or loading states
Show-Matches "Skeleton/Loading component usage" '(Skeleton|Loading|skeleton|loading).*Component'

# 5. useState with different initial values on server vs client
Show-Matches "useState with potentially different server/client values" 'useState\([^)]*(?:typeof window|mounted|isBrowser|isClient)'

# 6. Conditional JSX that changes DOM structure
Show-Matches "Conditional JSX changing DOM structure" '\{[^}]*mounted[^}]*\?\s*<[^:]*:\s*<'

# 7. Dynamic className based on client state
Show-Matches "Dynamic className based on client state" 'className.*\{[^}]*(?:mounted|isBrowser|typeof window)'

# 8. useEffect with empty dependency causing structure changes
Show-Matches "useEffect with empty deps that might change structure" 'useEffect\([^,]*,\s*\[\]\)'

# 9. Conditional wrapping elements
Show-Matches "Conditional wrapper elements" '\{[^}]*&&\s*<[^>]*>'

# 10. Different element types in conditionals
Show-Matches "Different element types in conditionals" '(?:div|span|p|h[1-6]|section|article).*\?.*(?:div|span|p|h[1-6]|section|article)'

# 11. Portal usage that might differ
Show-Matches "Portal usage" 'createPortal|Portal'

# 12. Dynamic component rendering
Show-Matches "Dynamic component rendering" '(?:React\.createElement|createElement)'

# 13. Fragment usage that might cause issues
Show-Matches "Fragment usage" '(?:React\.Fragment|<>|</>)'

# 14. Text content that might differ
Show-Matches "Text interpolation that might differ server/client" '\{[^}]*(?:Date|Math|window|document)[^}]*\}'

# 15. List rendering with keys that might differ
Show-Matches "List rendering with potentially unstable keys" '\.map\([^)]*(?:Math\.random|Date\.now|index)'

Write-Host "`n=== ANALYSIS ===" -ForegroundColor Magenta
Write-Host "High-risk patterns for hydration mismatches:" -ForegroundColor Yellow
Write-Host "1. Early returns based on mounted state" -ForegroundColor White
Write-Host "2. Different JSX structures in conditionals" -ForegroundColor White
Write-Host "3. Skeleton components vs full components" -ForegroundColor White
Write-Host "4. Dynamic className based on client-only state" -ForegroundColor White
Write-Host "5. Text content with time/random values" -ForegroundColor White

Write-Host "`nSearch complete!" -ForegroundColor Green