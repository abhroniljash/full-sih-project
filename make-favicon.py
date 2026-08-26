"""
Generate the favicon assets from teajas.jpeg.

Two problems with pointing <link rel="icon"> straight at the source file:

  1. It is 1280x720. A favicon is painted into a SQUARE slot, so the browser
     squashes a 16:9 image horizontally. Fixed by trimming the white margin to
     the ink, then letterboxing that onto a square canvas -- same artwork,
     right proportions.

  2. At 16x16 the whole "tejas" wordmark cannot physically resolve; every
     treatment tried (including contrast + unsharp) came out an illegible
     smear. So the 16px slot gets the leading glyph only, scaled to fill.
     32px and 48px keep the full wordmark, which reads fine at those sizes.
     Size-specific artwork inside one .ico is exactly what the format is for.

Run from the repo root:  python make-favicon.py backend/public
"""
import os
import sys

from PIL import Image, ImageEnhance, ImageFilter

pub = sys.argv[1] if len(sys.argv) > 1 else "backend/public"
src = os.path.join(pub, "teajas.jpeg")

im = Image.open(src).convert("RGB")
print("source          %dx%d" % im.size)

# --- trim the white margin -------------------------------------------------
# Thresholded rather than plain getbbox(): the source is a progressive JPEG, so
# its "white" runs 250-255 with ringing round the strokes, never a flat 255.
NEAR_WHITE = 244
mask = im.convert("L").point(lambda v: 0 if v > NEAR_WHITE else 255)
box = mask.getbbox()
if box is None:
    raise SystemExit("no ink found -- is the image blank?")
ink = im.crop(box)
print("ink bbox        %s -> %dx%d" % (box, ink.width, ink.height))

# The leading glyph, for the 16px slot. 36% of the trimmed width covers it
# together with its flag-like flourishes.
glyph = ink.crop((0, 0, int(ink.width * 0.36), ink.height))

# White, not transparent: the wordmark is dark green at one end, so a
# transparent icon would vanish against a dark tab strip. White also matches
# the source background, so nothing about the artwork changes.
BG = (255, 255, 255)


def square(src_img, pad):
    """Letterbox onto a square canvas with `pad` fraction of breathing room."""
    side = int(max(src_img.size) * pad)
    canvas = Image.new("RGB", (side, side), BG)
    canvas.paste(src_img, ((side - src_img.width) // 2, (side - src_img.height) // 2))
    return canvas


def punch(img, color, contrast, sharpen=0):
    """Downscaling thin strokes averages them with white, which washes the
    colour out. Restore it, and optionally re-crisp the edges."""
    img = ImageEnhance.Color(img).enhance(color)
    img = ImageEnhance.Contrast(img).enhance(contrast)
    if sharpen:
        img = img.filter(ImageFilter.UnsharpMask(radius=1, percent=sharpen, threshold=0))
    return img


# --- favicon.ico: 16 / 32 / 48 --------------------------------------------
# Pillow's ICO writer walks `sizes`, and for each one takes the image out of
# [base] + append_images whose dimensions match exactly, downscaling the base
# only as a fallback. So every size has to be listed here or it is dropped --
# and the base must be the largest, since bigger-than-base sizes are skipped.
ico_16 = punch(square(glyph, 1.04).resize((16, 16), Image.LANCZOS), 1.35, 1.25)
ico_32 = punch(square(ink, 1.06).resize((32, 32), Image.LANCZOS), 1.30, 1.20, sharpen=110)
ico_48 = punch(square(ink, 1.06).resize((48, 48), Image.LANCZOS), 1.20, 1.12, sharpen=80)

ico = os.path.join(pub, "favicon.ico")
ico_48.save(
    ico,
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48)],
    append_images=[ico_32, ico_16],
)
print("wrote %-28s %d bytes" % (ico, os.path.getsize(ico)))

# --- favicon-32.png -------------------------------------------------------
# Browsers that prefer an explicit PNG hint over the .ico.
p32 = os.path.join(pub, "favicon-32.png")
ico_32.save(p32, format="PNG", optimize=True)
print("wrote %-28s %d bytes" % (p32, os.path.getsize(p32)))

# --- apple-touch-icon.png -------------------------------------------------
# 180x180, no alpha (iOS composites transparency onto black) and a wider pad
# because iOS rounds the corners off the icon.
atc = os.path.join(pub, "apple-touch-icon.png")
square(ink, 1.30).resize((180, 180), Image.LANCZOS).save(atc, format="PNG", optimize=True)
print("wrote %-28s %d bytes" % (atc, os.path.getsize(atc)))
