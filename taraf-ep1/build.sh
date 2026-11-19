#!/usr/bin/env bash
# Rebuilds Episode 1 (needs: python3, Pillow with raqm, numpy, ffmpeg)
set -e
cd "$(dirname "$0")"
python3 prep.py            # voices -> timeline.json + audio2.wav
python3 render2.py         # scenes/t1..t4.mp4
printf "file 'scenes/t1.mp4'\nfile 'scenes/t2.mp4'\nfile 'scenes/t3.mp4'\nfile 'scenes/t4.mp4'\n" > list.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i list.txt -c copy v_noaudio.mp4
ffmpeg -y -loglevel error -i v_noaudio.mp4 -i audio2.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 160k -shortest Taraf_Ep1.mp4
echo "done -> Taraf_Ep1.mp4"
