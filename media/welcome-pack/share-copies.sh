#!/bin/bash
# Share-sized copies of the films (under 14 MB, for WhatsApp and the
# welcome pack page) and a still from each, into pack/films/.
set -e
WP=$(cd "$(dirname "$0")" && pwd)
mkdir -p $WP/pack/films
for f in mandirs committee families; do
  IN=$WP/out/toran-$f.mp4
  D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $IN)
  # 13.5 MB in all, less 128 kb/s of sound
  VB=$(python3 -c "print(int(13.5*8*1024/$D - 128))")
  cd $WP/out
  ffmpeg -loglevel error -y -i $IN -c:v libx264 -preset slow -b:v ${VB}k -pass 1 -an -f mp4 /dev/null
  ffmpeg -loglevel error -y -i $IN -c:v libx264 -preset slow -b:v ${VB}k -pass 2 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k $WP/pack/films/toran-$f.mp4
  rm -f ffmpeg2pass-0.log ffmpeg2pass-0.log.mbtree
  ffmpeg -loglevel error -y -ss ${2:-3.2} -i $IN -frames:v 1 -vf scale=720:-2 -q:v 3 $WP/pack/films/toran-$f.jpg
  ls -la $WP/pack/films/toran-$f.mp4
done
