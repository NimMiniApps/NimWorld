#!/usr/bin/env bash
# Compose a NimWorld 4x4 character sheet (192x192) from PixelLab 68x68 frames.
# Rows: south, west, east, north.  Cols: idle, walk frame 0, 1, 2.
# Layout and the 68->48 lanczos downscale were reverse-engineered from
# characters/builder_sheet_v01.png (psnr ~45dB against a rebuild).
#
# Usage: build-character-sheet.sh OUT.png FRAME_DIR
#   FRAME_DIR holds {south,west,east,north}_idle.png and {dir}_w{0,1,2}.png
set -euo pipefail

out=$1
dir=$2

inputs=()
for d in south west east north; do
  for f in idle w0 w1 w2; do
    inputs+=(-i "$dir/${d}_${f}.png")
  done
done

filter=""
for i in $(seq 0 15); do
  filter+="[$i:v]scale=48:48:flags=lanczos,format=rgba[c$i];"
done
layout=""
for i in $(seq 0 15); do
  filter+="[c$i]"
  [ "$i" -gt 0 ] && layout+="|"
  layout+="$(((i % 4) * 48))_$(((i / 4) * 48))"
done
filter+="xstack=inputs=16:layout=$layout:fill=none[v]"

ffmpeg -y -loglevel error "${inputs[@]}" -filter_complex "$filter" -map "[v]" -frames:v 1 "$out"
echo "wrote $out"
