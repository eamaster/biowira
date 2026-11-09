# PowerShell script to push BioWira to GitHub in small chunks to prevent HTTP 408 / connection timeout

$ErrorActionPreference = "Stop"

Write-Host "=== Chunk 1: Pushing Core Source Code & Backend (~6 MB) ===" -ForegroundColor Cyan
git push -u origin master --force

Write-Host "=== Chunk 2: Staging & Pushing Dev Tools & Tests (< 1 MB) ===" -ForegroundColor Cyan
git add .github/ .vscode/ e2e/ scripts/ playwright.config.ts vitest.config.ts vitest.setup.ts
git commit -m "chore: dev tools, scripts, and tests" --allow-empty
git push origin master

Write-Host "=== Chunk 3: Staging & Pushing Branding & Icons (~7 MB) ===" -ForegroundColor Cyan
git add public/branding/ public/icons/ public/home-page/ public/*.png public/*.svg public/*.ico public/*.webp
git commit -m "feat(assets): branding and icons" --allow-empty
git push origin master

Write-Host "=== Chunk 4: Staging & Pushing Backgrounds & Audio (~7 MB) ===" -ForegroundColor Cyan
git add public/backgrounds/ public/audio/
git commit -m "feat(assets): audio and backgrounds" --allow-empty
git push origin master

Write-Host "=== Chunk 5: Staging & Pushing Explorer Rescue Game (~10 MB) ===" -ForegroundColor Cyan
git add public/games/explorer-rescue/
git commit -m "feat(games): explorer rescue assets" --allow-empty
git push origin master

Write-Host "=== Chunk 6: Staging & Pushing Eco-Comics & Journal Assets (~15 MB) ===" -ForegroundColor Cyan
git add public/games/
git commit -m "feat(games): eco-comics and journal assets" --allow-empty
git push origin master

Write-Host "=== SUCCESS: All chunks pushed to https://github.com/eamaster/biowira! ===" -ForegroundColor Green

