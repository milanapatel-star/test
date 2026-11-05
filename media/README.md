# Media

`toran-explainer.mp4` — 75-second animated explainer for sharing in group
chats. Portrait 1080×1920, 30 fps, H.264 + AAC. (Earlier 28- and 60-second
versions are in the git history.)

It uses the website's "Midnight & Gold" design (midnight blue, one lapis
blue for buttons, gold for the logo; Marcellus and Mulish) and the site's
real screens, so the film looks like the product. Motion follows modern
product launch films: words rising out of masks, cards flying in, one
phone with gold rings and taps showing exactly which button does what,
a slow camera push-in on every scene.

The soundtrack is original and synthesised in code, so there is nothing to
license. Traditional instruments carry it (tanpura drone, santoor in Raag
Bhupali, tabla, temple bells). From the moment Toran appears, a soft
launch-film layer joins them (kick, clap, hats, sub bass, warm pads). The
problem half is sparse and uneasy; the music lifts at the turn and is
fullest under the closing values.

## Storyboard

100 BPM, so a beat is 0.6 s and a bar is 2.4 s. Every scene starts on a beat
in `cues.js`.

| Time | Scene |
| --- | --- |
| 0:00 | A diya lights in the dark. One word a beat: "Festivals. Satsangs. Classes. Seva." Then: "**What's on, and when?**" |
| 0:06 | "The details are… somewhere." A WhatsApp group (47 → 412 unread), a forwarded poster, a Facebook post saying the programme moved, a paper notice, a website last updated in 2019. Mum: "Satsang was this morning. Nobody told you?" |
| 0:19.2 | "And the mandir needs help." The seva rota stays red: "6 of 20 volunteers. And it's tomorrow." It all collapses into a point of gold |
| 0:26.4 | The turn: garland, the Toran mark draws itself, "TORAN — Every mandir's events. One place." |
| 0:30 | 1 · "Find what's on near you." Tap "Find near me", pins drop, events nearest first (a weekly satsang, a kids' class, a festival) |
| 0:37.2 | 2 · "Save it. Share it." Open the event, "Add to calendar", "Send on WhatsApp" to the family; Ba replies "I'll be there!" |
| 0:45.6 | 3 · "Follow your mandirs." Tap Follow; "Your mandirs" appears. No account, no tracking |
| 0:50.4 | 4 · "Give seva in one tap." Take a slot; the rota fills 1 → 4 of 4; "Rota full · thank you" |
| 0:56.4 | For mandirs: "Just send the poster." A Gujarati patrika is read into three draft events, checked by a person, then live |
| 1:03.6 | A list builds and stays: Free for families. Free for mandirs. No account. No tracking. Works on any phone. English · ગુજરાતી · हिन्दी |
| 1:09.6 | End card: garland, diya, "TORAN — What's on at mandirs near you", "Coming soon · Free for every mandir" |

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

Steps: put Marcellus, Mulish (400, 600, 700, 800), Noto Serif Gujarati
(600, 700) and Noto Sans Devanagari (600) from Google Fonts in
`source/fonts/` with a `local.css` (the folder is gitignored). The two
poster images in `source/assets/` are the demo posters from the website
repo (`public/demo-posters/`). Render frames to `source/frames/` (set
`OUT=<dir>` to write `frames/` or `keys/` somewhere else, and
`FROM`/`TO` to render a range of frames, e.g. in parallel), run
`python3 soundtrack.py`, then:

```bash
ffmpeg -framerate 30 -i frames/%04d.png -i soundtrack.wav -map 0:v -map 1:a \
  -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -c:a aac -b:a 160k \
  -shortest -movflags +faststart ../toran-explainer.mp4
```
