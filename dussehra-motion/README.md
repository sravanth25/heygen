# Dussehra motion poster (Remotion)

Animates the RedKarpet "Happy Dussehra" poster into a 12s, 1080x1920 vertical video with sound.

- `scripts/make_plates.py` splits `public/poster.jpg` into a clean background plate and
  transparent layers (logo, Durga's eyes, title, quote) in `public/layers/`.
  Durga and the lion are cut out with BiRefNet (`pip install "rembg[cpu]" opencv-python-headless`)
  and the flags are isolated so they can ripple.
- `scripts/make_audio.py` synthesises `public/soundtrack.wav` (tanpura drone, temple bells,
  chimes, arrow whoosh and impact) on the cues in `src/timeline.ts`.
- `src/DussehraPoster.tsx` tells the story: Durga's eyes open in the dark, a burst of light
  reveals the scene, the logo/title/quote animate in, Rama's arrow strikes Ravana, and a
  golden light sweep closes it. Throughout: depth parallax on Durga, waving flags, jewellery
  sparkles, rotating sun rays and aura, flickering diyas and rising embers.

```
npm install
npm run studio   # preview
npm run render   # -> out/dussehra.mp4
```

In environments where Chrome's old headless mode is unavailable, add
`--browser-executable=<path to chrome-headless-shell>` to the render command.
