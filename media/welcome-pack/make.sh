#!/bin/bash
# Builds one welcome-pack film: cues, soundtrack, frames, then the MP4.
# Usage: ./make.sh <mandirs|committee|families> [workers=4]
set -e
FILM=$1; W=${2:-4}
WP=$(cd "$(dirname "$0")" && pwd)
OUT=$WP/out/$FILM
cd $WP/engine
node render.mjs $FILM cues
python3 $WP/sound/music.py $FILM
rm -rf $OUT/frames && mkdir -p $OUT/frames
TOTAL=$(python3 -c "import json;print(round(json.load(open('$OUT/cues.json'))['duration']*30))")
STEP=$(( (TOTAL + W - 1) / W ))
for i in $(seq 0 $((W-1))); do
  FROM=$((i*STEP)) TO=$(((i+1)*STEP)) node render.mjs $FILM frames 30 > $OUT/render-$i.log 2>&1 &
done
wait
cat $OUT/render-*.log | grep -v '^errors \[\]' | grep -i error || true
ffmpeg -loglevel error -y -framerate 30 -i $OUT/frames/%05d.jpg -i $OUT/soundtrack.wav \
  -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -movflags +faststart \
  -c:a aac -b:a 192k -shortest $WP/out/toran-$FILM.mp4
rm -rf $OUT/frames
ls -la $WP/out/toran-$FILM.mp4
