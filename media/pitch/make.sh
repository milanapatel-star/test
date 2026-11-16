#!/bin/bash
# Builds the Toran pitch film: cues, soundtrack, every frame, then the MP4s.
# Usage: ./make.sh [workers=6] [fps=60]
set -e
W=${1:-6}; FPS=${2:-60}
R=$(cd "$(dirname "$0")" && pwd)
OUT=$R/out
cd $R
node render.mjs pitch cues
python3 music.py
mkdir -p $OUT/frames
find $OUT/frames -name '*.jpg' -delete
TOTAL=$(python3 -c "import json;print(round(json.load(open('$OUT/cues.json'))['duration']*$FPS))")
STEP=$(( (TOTAL + W - 1) / W ))
for i in $(seq 0 $((W-1))); do
  FROM=$((i*STEP)) TO=$(((i+1)*STEP)) node render.mjs pitch frames $FPS > $OUT/render-$i.log 2>&1 &
done
wait
cat $OUT/render-*.log | grep -v '^errors \[\]' | grep -i error || true
# Full quality, 60 fps.
ffmpeg -loglevel error -y -framerate $FPS -i $OUT/frames/%05d.jpg -i $OUT/soundtrack.wav \
  -c:v libx264 -preset slow -crf 17 -profile:v high -pix_fmt yuv420p -r $FPS -g $((FPS*2)) \
  -movflags +faststart -c:a aac -b:a 192k -ar 48000 -shortest $R/toran-pitch.mp4
# WhatsApp-sized copy: 30 fps, 720x1280, under 16 MB.
ffmpeg -loglevel error -y -i $R/toran-pitch.mp4 -vf "scale=720:1280:flags=lanczos,fps=30" \
  -c:v libx264 -preset slow -crf 23 -maxrate 1800k -bufsize 3600k -profile:v high -pix_fmt yuv420p \
  -movflags +faststart -c:a aac -b:a 128k $R/toran-pitch-whatsapp.mp4
find $OUT/frames -name '*.jpg' -delete
ls -la $R/toran-pitch.mp4 $R/toran-pitch-whatsapp.mp4
