"""Split the flat poster into a clean background plate + transparent graphic layers.

The text/graphics on the right sit on a soft sky, so we detect them by colour,
inpaint them out of the background, and recover each layer's alpha from the
difference between the original and the cleaned plate.
"""
import json
import cv2
import numpy as np

SRC = "public/poster.jpg"
OUT = "public/layers"

# name: (x0, y0, x1, y1) in poster pixels (900x1600)
BOXES = {
    "logo": (436, 98, 884, 366),
    "face": (472, 386, 850, 662),
    "title": (518, 686, 884, 842),
    "quote": (520, 846, 888, 994),
}

img = cv2.imread(SRC)
h, w = img.shape[:2]
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
b, g, r = [img[..., i].astype(int) for i in range(3)]
lum = 0.299 * r + 0.587 * g + 0.114 * b

# Foreground: dark strokes, deep reds, saturated gold ornaments.
fg = (lum < 150) | ((r - g) > 85) | ((hsv[..., 1] > 170) & (hsv[..., 2] < 215))
fg = fg.astype(np.uint8) * 255

mask = np.zeros((h, w), np.uint8)
for name, (x0, y0, x1, y1) in BOXES.items():
    m = fg[y0:y1, x0:x1].copy()
    if name == "face":
        # Eye whites are bright: close + fill enclosed holes so they are removed too.
        m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
        cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(m, cnts, -1, 255, -1)
    mask[y0:y1, x0:x1] = m
mask = cv2.dilate(mask, np.ones((7, 7), np.uint8))

clean = cv2.inpaint(img, mask, 9, cv2.INPAINT_TELEA)
# Soften inpaint streaks a little inside the masked area only.
blur = cv2.GaussianBlur(clean, (0, 0), 6)
soft = cv2.GaussianBlur(mask, (0, 0), 3).astype(np.float32)[..., None] / 255
clean = (clean * (1 - soft) + blur * soft).astype(np.uint8)
cv2.imwrite(f"{OUT}/background.jpg", clean, [cv2.IMWRITE_JPEG_QUALITY, 95])

meta = {}
for name, (x0, y0, x1, y1) in BOXES.items():
    o = img[y0:y1, x0:x1].astype(np.float32)
    c = clean[y0:y1, x0:x1].astype(np.float32)
    diff = np.linalg.norm(o - c, axis=2)
    a = np.clip((diff - 10) / 45, 0, 1)
    a *= mask[y0:y1, x0:x1].astype(np.float32) / 255
    a = cv2.GaussianBlur(a, (0, 0), 0.6)
    # Un-premultiply so semi-transparent edges keep the true stroke colour.
    safe = np.maximum(a, 1e-3)[..., None]
    col = np.clip((o - c * (1 - a[..., None])) / safe, 0, 255)
    col = np.where(a[..., None] > 0.02, col, o)
    rgba = np.dstack([col, a * 255]).astype(np.uint8)
    cv2.imwrite(f"{OUT}/{name}.png", rgba)
    meta[name] = {"x": x0, "y": y0, "w": x1 - x0, "h": y1 - y0}

with open("src/layers.json", "w") as f:
    json.dump(meta, f, indent=2)
print(json.dumps(meta))
