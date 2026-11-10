#!/bin/bash
# Builds the Toran Instagram Reel: cues, soundtrack, every frame, then the MP4.
# Usage: ./make.sh [workers=4] [fps=60]
set -e
W=${1:-4}; FPS=${2:-60}
R=$(cd "$(dirname "$0")" && pwd)
OUT=$R/../out/reel
cd $R
node render.mjs reel cues
python3 $R/music.py
rm -rf $OUT/frames && mkdir -p $OUT/frames
TOTAL=$(python3 -c "import json;print(round(json.load(open('$OUT/cues.json'))['duration']*$FPS))")
STEP=$(( (TOTAL + W - 1) / W ))
for i in $(seq 0 $((W-1))); do
  FROM=$((i*STEP)) TO=$(((i+1)*STEP)) node render.mjs reel frames $FPS > $OUT/render-$i.log 2>&1 &
done
wait
cat $OUT/render-*.log | grep -v '^errors \[\]' | grep -i error || true
# Instagram Reels: 1080x1920, H.264 High, yuv420p, AAC 48 kHz.
ffmpeg -loglevel error -y -framerate $FPS -i $OUT/frames/%05d.jpg -i $OUT/soundtrack.wav \
  -c:v libx264 -preset slow -crf 16 -profile:v high -level 4.2 -pix_fmt yuv420p -r $FPS -g $((FPS*2)) \
  -movflags +faststart -c:a aac -b:a 256k -ar 48000 -shortest $R/../out/toran-reel.mp4
ls -la $R/../out/toran-reel.mp4
