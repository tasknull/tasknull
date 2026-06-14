# Generate assets/banner.svg — the animated header used in README.md.
# The project's real logo (assets/logo-64.png) is embedded as a data URI so the
# SVG is fully self-contained (required for GitHub to render it).
# Usage:  python banner.py
import os, base64, random

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "..", "assets")

with open(os.path.join(ASSETS, "logo.jpg"), "rb") as f:
    b64 = base64.b64encode(f.read()).decode()

random.seed(7)
parts = []
for _ in range(20):
    x, y = random.randint(40, 1160), random.randint(28, 332)
    r = random.choice([1.5, 2, 2.5, 3])
    col = random.choice(["#f2b441", "#f97316", "#63cad6", "#f6c869"])
    dur = round(random.uniform(2.4, 5.5), 1)
    beg = round(random.uniform(0, 3), 1)
    parts.append(
        f'<circle cx="{x}" cy="{y}" r="{r}" fill="{col}">'
        f'<animate attributeName="opacity" values="0.12;0.95;0.12" dur="{dur}s" begin="{beg}s" repeatCount="indefinite"/></circle>'
    )
particles = "\n  ".join(parts)

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 360" width="1200" height="360" font-family="'Segoe UI',Helvetica,Arial,sans-serif">
<defs>
  <radialGradient id="bg" cx="50%" cy="34%" r="85%">
    <stop offset="0%" stop-color="#0c0e15"/><stop offset="62%" stop-color="#07080c"/><stop offset="100%" stop-color="#040506"/>
  </radialGradient>
  <radialGradient id="lglow" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#f2b441" stop-opacity="0.42"/><stop offset="70%" stop-color="#f97316" stop-opacity="0.10"/><stop offset="100%" stop-color="#f2b441" stop-opacity="0"/>
  </radialGradient>
  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
    <path d="M40 0H0V40" fill="none" stroke="#131a28" stroke-width="1"/>
  </pattern>
</defs>

<rect width="1200" height="360" fill="url(#bg)"/>
<rect width="1200" height="360" fill="url(#grid)" opacity="0.30"/>

<!-- twinkling particles -->
<g>
  {particles}
</g>

<!-- orbital system (pseudo-3D) + logo -->
<g transform="translate(212,180)">
  <circle r="134" fill="url(#lglow)">
    <animate attributeName="opacity" values="0.6;1;0.6" dur="4.5s" repeatCount="indefinite"/>
  </circle>
  <ellipse rx="130" ry="50" fill="none" stroke="#f2b441" stroke-opacity="0.55" stroke-width="2">
    <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="16s" repeatCount="indefinite"/>
  </ellipse>
  <ellipse rx="130" ry="50" fill="none" stroke="#63cad6" stroke-opacity="0.45" stroke-width="2">
    <animateTransform attributeName="transform" type="rotate" from="60" to="420" dur="21s" repeatCount="indefinite"/>
  </ellipse>
  <ellipse rx="130" ry="50" fill="none" stroke="#f97316" stroke-opacity="0.40" stroke-width="2">
    <animateTransform attributeName="transform" type="rotate" from="120" to="-240" dur="27s" repeatCount="indefinite"/>
  </ellipse>
  <circle r="94" fill="#000000"/>
  <image href="data:image/jpeg;base64,{b64}" x="-60" y="-60" width="120" height="120"/>
</g>

<!-- wordmark + copy -->
<text x="430" y="166" font-size="86" font-weight="700" letter-spacing="-2">
  <tspan fill="#f97316">task</tspan><tspan fill="#e8eaf0">null</tspan>
</text>
<text x="433" y="212" font-size="26" font-weight="500" fill="#aeb4c4">Prove you finished the work. Hide who you are.</text>
<text x="433" y="250" font-size="19" fill="#6b7287" font-family="'SFMono-Regular',Consolas,monospace">nullifier-backed proof-of-completion &#183; settled on Base</text>
</svg>
'''

with open(os.path.join(ASSETS, "banner.svg"), "w", encoding="utf-8") as f:
    f.write(svg)
print("banner.py: banner.svg written")
