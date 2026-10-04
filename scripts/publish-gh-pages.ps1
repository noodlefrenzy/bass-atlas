$ErrorActionPreference = 'Stop'

$repoRoot = (& git rev-parse --show-toplevel).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Run this script inside the Bass Atlas repository.' }
Set-Location -LiteralPath $repoRoot

$tree = (& git rev-parse 'main:dist').Trim()
if ($LASTEXITCODE -ne 0) { throw 'The main branch must contain the dist directory.' }

$parent = & git rev-parse --verify gh-pages 2>$null
if ($LASTEXITCODE -eq 0) {
  $commit = (& git commit-tree $tree -p $parent.Trim() -m 'Publish Bass Atlas').Trim()
} else {
  $commit = (& git commit-tree $tree -m 'Publish Bass Atlas').Trim()
}
if ($LASTEXITCODE -ne 0) { throw 'Could not create the Pages commit.' }

& git update-ref refs/heads/gh-pages $commit
if ($LASTEXITCODE -ne 0) { throw 'Could not update the gh-pages branch.' }

& git push origin gh-pages
if ($LASTEXITCODE -ne 0) { throw 'Could not push the gh-pages branch.' }

Write-Host "Published $commit from main:dist to gh-pages."
