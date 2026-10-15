# Media

`toran-explainer.mp4` — 60-second animated explainer for sharing in group
chats. Portrait 1080×1920, 30 fps, H.264 + AAC. (The earlier 28-second
version is in the git history.)

The soundtrack is original and synthesised in code (tanpura drone, santoor
in Raag Bhupali, synth tabla, temple bell, interface sounds), so there is
nothing to license.

## Storyboard

100 BPM, so a beat is 0.6 s and a bar is 2.4 s. Every scene starts on a bar.

| Time | Scene |
| --- | --- |
| 0:00 | "Ever missed a mandir event because the details were buried in a WhatsApp group?" Group chat floods, 47 → 412 unread, the Garba poster scrolls past, Mum: "Garba was last night 😔" |
| 0:09.6 | "Or struggled to find volunteers for an upcoming celebration?" Committee asks for 20 volunteers; replies trail off; rota 11 short, "Night 3 is tomorrow." |
| 0:19.2 | "Mandir news is everywhere… and nowhere at once." Group chat, Facebook, noticeboard, old website, paper rota |
| 0:26.4 | "And it leaves people out." Riya, 20, at university in Leicester; Ba, 79, doesn't use WhatsApp |
| 0:33.6 | The turn: cream wipe, garland, "Toran — Every mandir's events. One place." |
| 0:38.4 | "Find what's on near you." Map, events (one in Gujarati), add to calendar, share |
| 0:45.6 | "Seva in one link." Link in the group, take a slot, rota fills, reminder |
| 0:52.8 | "Committees: just forward your poster." Poster becomes an event |
| 0:55.2 | End card: "Free for mandirs · Launching 2027" |

## Re-rendering

Source is in `source/`:

- `cues.js` — the timeline, in beats. Both the picture and the sound read
  it, so a sound effect always lands on the frame its animation starts. To
  move something, change its beat here and re-render both.
- `scene.html` — the animation; `render(t)` draws the frame at time `t`
- `render.mjs` — Playwright script that screenshots every frame
  (`node render.mjs <chromium> <source dir> frames 30`), or a few stills
  (`KEYS=5,20,40 node render.mjs <chromium> <source dir> keys`)
- `soundtrack.py` — synthesises `soundtrack.wav` (needs numpy and scipy)

Steps: put Bricolage Grotesque, Figtree and Noto Sans Gujarati (Google
Fonts) in `source/fonts/` with a `local.css`, render frames to
`source/frames/`, run `python3 soundtrack.py`, then:

```bash
ffmpeg -framerate 30 -i frames/%04d.png -i soundtrack.wav -map 0:v -map 1:a \
  -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -c:a aac -b:a 160k \
  -shortest -movflags +faststart ../toran-explainer.mp4
```
