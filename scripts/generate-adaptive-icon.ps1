Add-Type -AssemblyName System.Drawing

# ───────────────────────────────────────────
# Config
# ───────────────────────────────────────────
$canvasSize  = 1024
$safeZone    = 0.66          # text must live within 66% of canvas (safe zone)
$lineOne     = "My"
$lineTwo     = "Banks"
$fontName    = "Arial"       # Falls back to system bold font
$textColor   = [System.Drawing.Color]::FromArgb(255, 0, 0, 0)

# Output paths
$outDir      = "d:\App development\my-banks\assets"
$fgPath      = Join-Path $outDir "adaptive-icon-foreground.png"
$monoPath    = Join-Path $outDir "adaptive-icon-monochrome.png"

function Generate-Foreground($textHex, $bgAlpha, $outputPath) {

    $bmp = New-Object System.Drawing.Bitmap($canvasSize, $canvasSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)

    # Transparent background
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # Target safe zone size (pixels)
    $safeSize = [int]($canvasSize * $safeZone)   # 676px

    # Start with a large font and binary-search down until text fits safe zone
    $fontSize = 280.0

    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, $textHex[0], $textHex[1], $textHex[2]))

    # Find the right font size so "Banks" (widest) fits within safeSize
    while ($fontSize -gt 10) {
        $font    = New-Object System.Drawing.Font($fontName, $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
        $sizeTwo = $g.MeasureString($lineTwo, $font)
        if ($sizeTwo.Width -le ($safeSize * 0.85)) { break }
        $fontSize -= 5
        $font.Dispose()
    }

    $font    = New-Object System.Drawing.Font($fontName, $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $sizeOne = $g.MeasureString($lineOne, $font)
    $sizeTwo = $g.MeasureString($lineTwo, $font)

    # Line gap: 10% of font size
    $lineGap    = $fontSize * 0.08
    $blockH     = $sizeOne.Height + $lineGap + $sizeTwo.Height
    $blockW     = [Math]::Max($sizeOne.Width, $sizeTwo.Width)

    # Center block on canvas
    $blockLeft  = ($canvasSize - $blockW) / 2
    $blockTop   = ($canvasSize - $blockH) / 2

    # Draw line 1 (left-aligned within block)
    $x1 = $blockLeft
    $y1 = $blockTop
    $g.DrawString($lineOne, $font, $brush, [float]$x1, [float]$y1)

    # Draw line 2
    $x2 = $blockLeft
    $y2 = $blockTop + $sizeOne.Height + $lineGap
    $g.DrawString($lineTwo, $font, $brush, [float]$x2, [float]$y2)

    $g.Dispose()
    $brush.Dispose()
    $font.Dispose()

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()

    Write-Host "✅ Saved: $outputPath"
}

# Generate foreground (black text on transparent)
Generate-Foreground @(0, 0, 0) 0 $fgPath

# Generate monochrome (same — white text on transparent works better for
# themed icons, but black is fine; Android will tint it anyway)
Generate-Foreground @(0, 0, 0) 0 $monoPath

Write-Host ""
Write-Host "Done! Both files written to: $outDir"
Write-Host ""
Write-Host "Now update app.json android.adaptiveIcon to:"
Write-Host '  "foregroundImage": "./assets/adaptive-icon-foreground.png"'
Write-Host '  "backgroundColor": "#B7FF2A"'
Write-Host "  (remove backgroundImage line)"
