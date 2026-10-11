# Media

`toran-explainer.mp4` — 28-second animated explainer for sharing in group
chats. Portrait 1080×1920, H.264 + AAC, about 2.8 MB.

The soundtrack is original and synthesised in code (tanpura drone, santoor
in Raag Bhupali, synth tabla, temple bell, interface sounds), so there is
nothing to license.

## Re-rendering

Source is in `source/`:

- `scene.html` — the animation; `render(t)` draws the frame at time `t`
- `render.mjs` — Playwright script that screenshots every frame
- `soundtrack.py` — synthesises `soundtrack.wav` (needs numpy and scipy)

Steps: put Bricolage Grotesque and Figtree (Google Fonts, latin) in
`source/fonts/` with a `local.css`, render frames to `source/frames/`, run
`python3 soundtrack.py`, then:

```bash
ffmpeg -framerate 30 -i frames/%04d.png -i soundtrack.wav -map 0:v -map 1:a \
  -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -c:a aac -b:a 160k \
  -shortest -movflags +faststart toran-explainer.mp4
```
