# Generate logo-64.png (small navbar/footer logo) and og-image.png (1200x630 social
# share image) from assets/logo.jpg.
# Requires:  pip install pillow
# Note: uses Windows system fonts (Segoe UI); falls back to a default font elsewhere.
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "..", "assets")
src = Image.open(os.path.join(ASSETS, "logo.jpg")).convert("RGB")

# 1) small logo (same image, lighter file)
src.resize((64, 64), Image.LANCZOS).save(os.path.join(ASSETS, "logo-64.png"))

# 2) social share image
SEGB = r"C:\Windows\Fonts\segoeuib.ttf"
SEG = r"C:\Windows\Fonts\segoeui.ttf"

def font(path, size):
    return ImageFont.truetype(path, size) if os.path.exists(path) else ImageFont.load_default()

W, H = 1200, 630
img = Image.new("RGB", (W, H), (0, 0, 0))
d = ImageDraw.Draw(img)
orange, white, mute = (249, 115, 22), (232, 234, 240), (135, 142, 161)

LS = 270
img.paste(src.resize((LS, LS), Image.LANCZOS), (118, (H - LS) // 2))

tx, right_limit = 415, W - 48

def fit(text, path, start):
    s = start
    f = font(path, s)
    while d.textlength(text, font=f) > (right_limit - tx) and s > 12:
        s -= 1
        f = font(path, s)
    return f

word_f = font(SEGB, 96)
tag = "Prove you finished the work. Hide who you are."
sub = "Nullifier-backed proof-of-completion   ·   settled on Base"
tag_f, sub_f = fit(tag, SEG, 34), fit(sub, SEG, 26)

ty = 208
d.text((tx, ty), "task", font=word_f, fill=orange)
d.text((tx + d.textlength("task", font=word_f), ty), "null", font=word_f, fill=white)
d.text((tx, ty + 132), tag, font=tag_f, fill=white)
d.text((tx, ty + 188), sub, font=sub_f, fill=mute)

img.save(os.path.join(ASSETS, "og-image.png"))
print("og.py: logo-64.png + og-image.png written")
