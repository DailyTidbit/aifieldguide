# supabase-auth-hydration-search.ps1
# Find Supabase SSR authentication hydration issues

Write-Host "Searching for Supabase auth hydration issues..." -ForegroundColor Cyan
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

# 1. Direct auth state usage in render
Show-Matches "Direct auth state usage in render" '\{.*user.*\?'

# 2. Conditional rendering based on auth
Show-Matches "Conditional rendering based on auth state" '(?:user|authState|isAuthenticated|isLoggedIn).*\?'

# 3. useAuth hook usage without hydration safety
Show-Matches "useAuth hook usage" 'useAuth\(\)'

# 4. Supabase client creation
Show-Matches "Supabase client creation" 'createClient|supabase\.auth'

# 5. Auth state initialization
Show-Matches "Auth state initialization" 'useState.*(?:user|auth|login|session)'

# 6. Cookie-based auth patterns
Show-Matches "Cookie-based auth patterns" '(?:cookies|cookie).*(?:auth|session|user)'

# 7. SSR auth checks
Show-Matches "SSR auth checks" 'getServerSideProps|getStaticProps.*auth'

# 8. Middleware auth
Show-Matches "Middleware auth usage" 'middleware.*auth|auth.*middleware'

# 9. Auth redirects that might cause hydration issues
Show-Matches "Auth redirects" 'redirect.*auth|auth.*redirect'

# 10. Session management
Show-Matches "Session management" 'getSession|session\.|\.session'

# 11. Auth loading states
Show-Matches "Auth loading states" '(?:loading|isLoading).*(?:auth|user|session)'

# 12. Protected routes
Show-Matches "Protected route patterns" 'protected.*route|route.*protected|ProtectedRoute'

# 13. User profile conditional rendering
Show-Matches "User profile conditional rendering" 'user\?.*(profile|avatar|name|email)'

# 14. Company/membership conditional rendering  
Show-Matches "Company/membership conditional rendering" '(?:company|membership).*\?'

# 15. Auth context providers
Show-Matches "Auth context providers" 'AuthProvider|AuthContext'

Write-Host "`n=== HIGH PRIORITY FIXES ===" -ForegroundColor Red
Write-Host "Look for these patterns in the results above:" -ForegroundColor Yellow
Write-Host "1. Direct {user ? ... : ...} in JSX" -ForegroundColor White
Write-Host "2. useAuth() without mounted checks" -ForegroundColor White  
Write-Host "3. Auth state in useState initial values" -ForegroundColor White
Write-Host "4. Conditional rendering of different components based on auth" -ForegroundColor White

Write-Host "`nSearch complete!" -ForegroundColor Green