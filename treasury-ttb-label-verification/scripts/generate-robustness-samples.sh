#!/bin/sh
set -eu

sample_dir="public/samples"

command -v convert >/dev/null 2>&1 || {
  echo "ImageMagick 'convert' is required." >&2
  exit 1
}

# Perspective and glare on a neutral photographic-style background.
convert -size 1200x1200 gradient:'#d8d2c8-#4a4642' \
  \( "$sample_dir/01-old-tom-bourbon-match.png" -resize 610x820 -alpha set \
     -virtual-pixel transparent -distort Perspective '0,0 55,18 609,0 552,72 0,819 18,775 609,819 578,805' \) \
  -gravity center -composite \
  \( -size 95x760 xc:white -alpha set -channel A -evaluate set 13% +channel -background none -rotate 18 \) \
  -gravity center -geometry +165-20 -composite \
  -strip -depth 8 \
  "$sample_dir/11-old-tom-perspective-glare-robust.png"

# Label wrapped onto a shaded can silhouette.
convert -size 1200x1200 radial-gradient:'#f4f6f8-#687584' \
  -fill '#c5cbd2' -stroke '#5f6974' -strokewidth 5 -draw 'roundrectangle 245,70 955,1130 110,110' \
  \( "$sample_dir/02-river-bend-ipa-match.png" -resize 565x790! -virtual-pixel background \
     -background none -wave 12x500 -trim \) \
  -gravity center -geometry +0+25 -composite \
  \( -size 80x920 gradient:'rgba(255,255,255,0.36)-rgba(255,255,255,0.02)' \) \
  -gravity center -geometry -210+0 -composite \
  -strip -depth 8 \
  "$sample_dir/12-river-bend-curved-can-robust.png"

# Low-light phone-style capture with mild noise and rotation.
convert -size 1200x1200 gradient:'#171b22-#3a2f2b' \
  \( "$sample_dir/03-casa-verde-wine-match.png" -resize 630x840 -brightness-contrast -22x8 \
     -attenuate 0.055 +noise Gaussian -rotate -7 \) \
  -gravity center -composite \
  -strip -depth 8 \
  "$sample_dir/13-casa-verde-low-light-robust.png"

# Cropped capture that deliberately omits the Government Warning panel.
convert -size 1200x1200 gradient:'#8f775f-#2c2520' \
  \( "$sample_dir/04-harbor-light-rum-match.png" -crop 900x900+0+0 +repage -resize 650x760! -rotate 4 \) \
  -gravity center -geometry +0-40 -composite \
  -strip -depth 8 \
  "$sample_dir/14-harbor-light-warning-cropped-robust.png"

# Low-resolution, mildly blurred capture that remains complete.
convert -size 1200x1200 gradient:'#c4c8cc-#626a72' \
  \( "$sample_dir/05-north-star-vodka-match.png" -resize 315x420! -blur 0x0.9 -colors 96 \
     -resize 650x865! -rotate 2 \) \
  -gravity center -composite \
  -strip -depth 8 \
  "$sample_dir/15-north-star-low-resolution-robust.png"

# Strong rotation with the complete label still inside the frame.
convert -size 1200x1200 gradient:'#d7c9ae-#735f45' \
  \( "$sample_dir/07-blue-canyon-tequila-match.png" -resize 530x705! -rotate 31 \) \
  -gravity center -composite \
  -strip -depth 8 \
  "$sample_dir/16-blue-canyon-rotated-robust.png"

# Address-only obstruction to test required-field handling.
convert -size 1200x1200 gradient:'#d5d9d0-#5b665b' \
  \( "$sample_dir/08-prairie-gin-match.png" -fill 'rgba(245,245,242,0.96)' \
     -stroke 'rgba(180,180,175,0.7)' -strokewidth 2 -draw 'rectangle 0,700 900,755' \
     -resize 650x865! -rotate -3 \) \
  -gravity center -composite \
  -strip -depth 8 \
  "$sample_dir/17-prairie-gin-address-occluded-robust.png"

# Simulated front/back panel capture in one photograph.
convert -size 1400x1200 gradient:'#bbc4cc-#39424b' \
  \( "$sample_dir/09-redwood-lager-match.png" -crop 900x850+0+0 +repage -resize 560x620! \
     -alpha set -virtual-pixel transparent -distort Perspective '0,0 30,18 559,0 525,0 0,619 0,600 559,619 548,610' \) \
  -gravity west -geometry +95-90 -composite \
  \( "$sample_dir/09-redwood-lager-match.png" -gravity northwest -crop 900x340+0+860 +repage -resize 650x340! \
     -bordercolor '#dfe7f0' -border 10 -rotate 3 \) \
  -gravity southeast -geometry +80+100 -composite \
  -strip -depth 8 \
  "$sample_dir/18-redwood-lager-split-panels-robust.png"
