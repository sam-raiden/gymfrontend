Add-Type -AssemblyName System.Drawing

$src = "D:\retainr\retainr-frontend\assests\retainrlogo.png"
$outDir = "D:\retainr\retainr-frontend\public"

$srcImg = [System.Drawing.Bitmap]::FromFile($src)

# Crop bounding box of the actual logo content (computed earlier: x=144..370, y=120..332)
$cropX = 144
$cropY = 120
$cropW = 370 - 144
$cropH = 332 - 120

$cropRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
$cropped = New-Object System.Drawing.Bitmap($cropW, $cropH)
$g = [System.Drawing.Graphics]::FromImage($cropped)
$g.DrawImage($srcImg, (New-Object System.Drawing.Rectangle(0,0,$cropW,$cropH)), $cropRect, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()

function New-Icon {
    param(
        [int]$canvasSize,
        [double]$contentRatio,
        [System.Drawing.Color]$bgColor,
        [string]$outPath
    )
    $canvas = New-Object System.Drawing.Bitmap($canvasSize, $canvasSize)
    $gfx = [System.Drawing.Graphics]::FromImage($canvas)
    $gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gfx.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    if ($bgColor.A -gt 0) {
        $brush = New-Object System.Drawing.SolidBrush($bgColor)
        $gfx.FillRectangle($brush, 0, 0, $canvasSize, $canvasSize)
        $brush.Dispose()
    } else {
        $gfx.Clear([System.Drawing.Color]::Transparent)
    }

    $targetMax = $canvasSize * $contentRatio
    $scale = [Math]::Min($targetMax / $cropW, $targetMax / $cropH)
    $destW = $cropW * $scale
    $destH = $cropH * $scale
    $destX = ($canvasSize - $destW) / 2
    $destY = ($canvasSize - $destH) / 2

    $destRect = New-Object System.Drawing.RectangleF($destX, $destY, $destW, $destH)
    $gfx.DrawImage($cropped, $destRect)

    $gfx.Dispose()
    $canvas.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $canvas.Dispose()
}

$transparent = [System.Drawing.Color]::FromArgb(0,0,0,0)
$dark = [System.Drawing.Color]::FromArgb(255, 13, 13, 16)   # #0D0D10

New-Icon -canvasSize 512 -contentRatio 0.82 -bgColor $transparent -outPath "$outDir\icon-512.png"
New-Icon -canvasSize 192 -contentRatio 0.82 -bgColor $transparent -outPath "$outDir\icon-192.png"
New-Icon -canvasSize 512 -contentRatio 0.65 -bgColor $dark -outPath "$outDir\maskable-icon-512.png"
New-Icon -canvasSize 180 -contentRatio 0.75 -bgColor $dark -outPath "$outDir\apple-touch-icon.png"
New-Icon -canvasSize 32  -contentRatio 0.92 -bgColor $transparent -outPath "$outDir\favicon.png"

$cropped.Dispose()
$srcImg.Dispose()

Write-Host "Done. Generated icons in $outDir"
