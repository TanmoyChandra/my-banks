Add-Type -AssemblyName System.Drawing

# ────────────────────────────────────────────────────────────────
# Takes the original foreground.png (user's designed logo)
# and places it centered within a 1024x1024 transparent canvas,
# scaled to fit within the central 50% safe zone.
#
# Android safe zone rules:
#   Full canvas : 1024 x 1024 px
#   Visible     : central 66%  = 676 x 676 px
#   Safe target : central 50%  = 512 x 512 px  (generous padding)
# ────────────────────────────────────────────────────────────────

$srcPath    = "d:\App development\my-banks\foreground.png"
$outDir     = "d:\App development\my-banks\assets"
$fgPath     = Join-Path $outDir "adaptive-icon-foreground.png"
$monoPath   = Join-Path $outDir "adaptive-icon-monochrome.png"

$canvasSize = 1024
$safeSize   = [int]($canvasSize * 0.50)   # 512px — text lives within this

# Load original PNG
$src = [System.Drawing.Image]::FromFile($srcPath)

# Scale source to fit within safeSize x safeSize, preserving aspect ratio
$srcW = $src.Width
$srcH = $src.Height
$scale = [Math]::Min($safeSize / $srcW, $safeSize / $srcH)
$drawW = [int]($srcW * $scale)
$drawH = [int]($srcH * $scale)

# Center the scaled image on the 1024x1024 canvas
$offsetX = ($canvasSize - $drawW) / 2
$offsetY = ($canvasSize - $drawH) / 2

function Generate-Canvas($outputPath) {
    $bmp = New-Object System.Drawing.Bitmap($canvasSize, $canvasSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $gfx = [System.Drawing.Graphics]::FromImage($bmp)

    $gfx.Clear([System.Drawing.Color]::Transparent)
    $gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gfx.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    $destRect = New-Object System.Drawing.Rectangle([int]$offsetX, [int]$offsetY, $drawW, $drawH)
    $gfx.DrawImage($src, $destRect)

    $gfx.Dispose()
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()

    Write-Host "Saved: $outputPath"
    Write-Host "  Source size : ${srcW} x ${srcH} px"
    Write-Host "  Drawn size  : ${drawW} x ${drawH} px  (scale=$([Math]::Round($scale,3)))"
    Write-Host "  Canvas      : ${canvasSize} x ${canvasSize} px"
    Write-Host "  Offset      : x=$([int]$offsetX), y=$([int]$offsetY)"
    Write-Host ""
}

Generate-Canvas $fgPath
Generate-Canvas $monoPath

$src.Dispose()

Write-Host "Done! Your original foreground.png has been used and properly safe-zoned."
