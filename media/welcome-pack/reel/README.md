# Toran Instagram Reel

A one-minute Reel for Instagram (and TikTok, YouTube Shorts and WhatsApp
Status): `../out/toran-reel.mp4`.

- 1080 × 1920 (9:16), 60 fps, H.264 High, AAC 48 kHz, 60.5 seconds.
- Made to work with the sound off: every point is on screen in big type.
- Everything important sits inside Instagram's safe area, clear of the top
  bar, the caption at the bottom and the buttons on the right
  (`runChecks` in `reel.js` checks every quarter second; `render.mjs`
  prints any problem).
- The screens are Toran's real pages, captured from a local copy of the
  site (`../capture/`, copied into `shots/`) with the made-up Shree Sample Mandir,
  Anytown. Scenes that show them say "Example mandir and events".
- The music is original, synthesised in `music.py` (nothing sampled or
  licensed), so it can't be muted for copyright.

## The minute, beat by beat (120 BPM: a beat is half a second)

| Time | Scene | On screen |
| --- | --- | --- |
| 0–4 s | The hook | WhatsApp forwards pile up. "POV: you find out about the garba night … the day AFTER 😭" |
| 4–8 s | Toran | The drop. The mark builds itself, TORAN, "Every mandir event in the UK. One place." |
| 8–15 s | What's on | "What's on near you 📍": the real What's on page scrolls in a phone; two events pop out of it |
| 15–21 s | The finder | "Find your mandir 🛕": the street map, a pin tapped, its card, "3 miles away" |
| 21–26 s | Festivals | "Every festival.": Navratri, Diwali, Holi, Janmashtami, Ram Navami, Maha Shivaratri drop in on the beat |
| 26–31 s | Seva | "Volunteer in one tap 🙏": Take this slot, "✓ Slot taken", "No sign-up needed" |
| 31–36 s | Languages | "In your language.": What's on, કાર્યક્રમો, कार्यक्रम; the phone turns over to the Gujarati page |
| 36–40 s | Save and share | "Save it 📅 Share it 💬": Add to calendar, a WhatsApp message with the link |
| 40–50 s | For committees | Cream breakdown: "Run a mandir? Send the poster 📸", the Gujarati patrika is read into three events, "Phone number left out", "You check. You publish." |
| 50–60 s | Call to action | The last drop: a screen on every beat, "No app to download. Free for families.", toran.org.uk, "Coming soon", "Send this to your family group 💬", the diya |

## Build

```
./make.sh [workers=4] [fps=60]
```

It writes the cues (`node render.mjs reel cues`, which also runs the
framing checks), the soundtrack (`music.py`), every frame, and the MP4.
`node render.mjs reel keys 3,10,20` renders stills at those seconds for a
quick look. When Toran's screens change, capture them again
(`../capture/run-capture.sh "0 a b" --reset`), copy the pictures and
`manifest.json`/`manifest.js` from `../shots/` into `shots/`, and rebuild. The
Reel keeps its own copy because the welcome-pack films are framed for the
screens as they were when those were made.
