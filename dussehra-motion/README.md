# Dussehra motion poster (Remotion)

Animates the RedKarpet "Happy Dussehra" poster into a 10s, 1080x1920 vertical video.

- `scripts/make_plates.py` splits `public/poster.jpg` into a clean background plate and
  transparent layers (logo, Durga's eyes, title, quote) in `public/layers/`.
- `src/DussehraPoster.tsx` animates them: camera push-in, logo drop + blur-in, eyes
  spring-in with a glow pulse, title wipe, quote reveal, gold shine sweeps, rotating
  sun rays, flickering diyas, a pulsing aura behind Durga, rising embers and a vignette.

```
npm install
npm run studio   # preview
npm run render   # -> out/dussehra.mp4
```

In environments where Chrome's old headless mode is unavailable, add
`--browser-executable=<path to chrome-headless-shell>` to the render command.
