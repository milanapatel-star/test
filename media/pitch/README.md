# Toran pitch film

A 52-second sales film for messages to mandir committees, mostly on
WhatsApp. It shows what Toran does for a mandir in a modern launch-film
style, and works with the sound off.

| File | Use |
| --- | --- |
| `toran-pitch.mp4` | Full quality: 1080×1920, 60 fps |
| `toran-pitch-whatsapp.mp4` | To send: 720×1280, 30 fps, small enough for WhatsApp |

## The film

120 BPM, so a bar is 2 seconds; every scene starts on a bar line.

| Time | Scene |
| --- | --- |
| 0–4 s | "For mandir committees. Your mandir does so much." |
| 4–10 s | "But it gets lost.": a forwarded poster, a WhatsApp group at 412 unread, "Is the havan at 6 or 7?", a website last updated in 2019, a notice board. They're pulled into one point |
| 10–14 s | The Toran mark draws itself: "Every mandir's events. One place." |
| 14–22 s | 01 Add events: "Send a poster. We do the rest." The example Gujarati patrika is scanned into three events; a tap on Publish puts them live. "Phone numbers left out", "You check, then it goes live" |
| 22–29 s | 02 Get found: "Families find you." What's on near me, pins and the mandir's own events, page views counting up (example figures), a family sharing the link |
| 29–36 s | 03 Seva rota: "Seva, sorted." Six slots fill, "Rota full", "Send it to your volunteers' group" |
| 36–40 s | 04 In your language: What's on, કાર્યક્રમો, कार्यक्रम |
| 40–44 s | "It's real. And it's free.": three of Toran's real screens (the example mandir) |
| 44–47 s | Why mandirs use Toran: free for every mandir, no app to install, made to share on WhatsApp, English, ગુજરાતી, हिन्दी |
| 47–52.5 s | "Put your mandir on Toran." Join free at toran.org.uk |

## Design

Dark midnight background with slow lapis and gold light, a faint dot grid
and film grain; frosted-glass cards; Geist and Geist Mono for the words
(Marcellus only for the TORAN wordmark); words rise out of a blur one at a
time. The product moments are drawn as clean interface pieces rather than
screenshots, so they stay sharp; the real screens appear once, near the end.

The soundtrack (`music.py`) is original and synthesised in code, nothing
sampled or licensed: a tanpura drone and soft plucks, a tense pulse under
the problem, an impact as Toran appears, then a clean groove in D major
with a bell motif, a flute line under the languages, and a last lift for
the call to action. Every pop, ping, scan and chime is placed from the
picture's cues, on the frame its animation starts.

## Rebuilding

Fonts go in `fonts/` (gitignored): Geist and Geist Mono variable `.woff2`
from the `geist` npm package, Noto Sans Gujarati 700 from
`@fontsource/noto-sans-gujarati`, and `marcellus.ttf` and
`noto-sans-devanagari-600.ttf` from `../source/fonts/`.

```bash
node render.mjs pitch keys 2,12,18,32   # stills at those seconds, in out/keys
node render.mjs pitch check             # framing checks only
./make.sh [workers=6] [fps=60]          # cues, soundtrack, frames, both MP4s
```

`pitch.js` is the whole film: each scene's `update(t)` sets every element
for time `t`, and `cue()` records the sound effects. `runChecks()` makes
sure every visible text block and card stays inside the frame.
