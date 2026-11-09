# Toran welcome pack

Three onboarding films and the welcome pack page that holds them, made for
the pilot launch (mid-December 2026) and the public launch (mid-January
2027).

| Film | For | Length | File |
| --- | --- | --- | --- |
| Toran for mandirs | Committees deciding whether to join | 1:48 | `out/toran-mandirs.mp4` |
| Committee guide | Committee members who add events | 2:14 | `out/toran-committee.mp4` |
| Find what's on | Families | 1:55 | `out/toran-families.mp4` |

Each is 1920×1080, 30 fps, H.264 and AAC, with captions burned in so it
works with the sound off. `pack/films/` has share-sized copies (under 14 MB,
for WhatsApp and the welcome pack page) and a still from each.

Every film follows **Shree Sample Mandir, Anytown**, the made-up mandir from
Toran's `/demo` page. Every event, person and number is made up, and each
film says "Example mandir and events" in the corner.

## How they're made

1. **Screens** (`capture/`). Playwright drives a local copy of Toran
   (toran-main-code, built with `VERCEL_PROJECT_PRODUCTION_URL=toran.org.uk`
   so links read toran.org.uk, and a stand-in for Claude,
   `capture/mock-claude.cjs`, so no AI is called). `seed.sql` adds the
   made-up mandirs; the specs then log in and add events through the site
   itself, as a committee would, taking a screenshot at every step and
   recording where each button is (`shots/manifest.json`). Stages: `0`
   (a trustee claims the page), `a` (a committee member on a laptop adds
   events every way, plans seva), `b` (a family on a phone), `d` (extras).
   Run `capture/run-capture.sh "0 a b d" --reset` with local Supabase and
   the site running on port 3100.
2. **Films** (`films/*.js`). Each film is a list of scenes: a light opening
   (the title beside Toran's real screens on a laptop and phone), dark list
   and closing cards, and laptop or phone scenes that show the screenshots with a
   pointer or finger, clicks, zooms, scrolling, typing, highlights and
   captions, all placed from the recorded button positions.
3. **Engine** (`engine/`). `film.html?film=<name>` draws any frame with
   `render(t)`; `render.mjs` renders stills (`keys`), every frame
   (`frames`) or the sound cues (`cues`).
4. **Sound** (`sound/music.py`). Original music synthesised in code: a
   bright, modern track at 112 BPM in D major (warm pads, a plucked synth
   arpeggio, a light four-on-the-floor kit, a rounded bass and a
   glockenspiel), kept low under the captions. The opening is pads and
   plucks only, and the dark list cards drop back so they breathe. Clicks,
   taps, typing and chimes land on the frames they happen. Nothing is
   sampled or licensed. `STEM=drums|bass|pads|spark` writes one layer on
   its own, for checking the mix.
5. **Build**: `./make.sh <mandirs|committee|families> [workers]` runs all
   of it and writes `out/toran-<film>.mp4`.

The fonts come from `../source/fonts/` (Marcellus, Mulish; see
`../README.md`).

## When the screens change

Run the capture again, check the keyframes (`node engine/render.mjs
<film> keys 5,20,40`), adjust any button names in `films/*.js` that moved,
and rebuild. The voiceover scripts in the welcome pack come from the
films' captions (`node engine/scripts.mjs`).
