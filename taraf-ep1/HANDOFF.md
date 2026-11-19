# ترف (Taraf) — Episode 1 handoff

## Paste this into Claude Code (from this folder)
> Read HANDOFF.md and script_ep1.txt. Rebuild Episode 1 of "ترف" in Remotion (use the remotion skills),
> 720x1280 vertical, 30 fps, ~67 s, using the 16 voice files in voices/ with the exact timings in timeline.json.
> Recreate the 2D characters (Taraf, Sahab) as React/SVG components matching the Python drawing code in lib.py
> and the reference photos in refs/. Keep lip-sync driven by each voice's loudness (timeline.json -> "env").
> Match Taraf_Ep1_v4_preview.mp4 first, then improve the animation quality.

## What this is
A series of 1-minute 2D animated episodes about a girl named ترف (Taraf), written by Fahad Al-Khalidi.
Story: Taraf is a clever, hyper, nosy girl who loves pranking her cousin سحاب (Sahab). Aunt فجر (Fajr) is the stern
aunt who appears in episode 2 (she is NOT in episode 1). Taraf and Fajr call each other "جرادة".
Dialect: Saudi (Hijazi/Najdi mix). Language: Arabic, right-to-left. Font: Cairo Bold (fonts/, OFL license).

## Episode 1 structure (timeline.json has exact times)
1. Title card (4 s): "ترف — الحلقة ١ — مقلب الدش", confetti, Taraf bouncing.
2. Sahab's room (T1..S3): Sahab bored on a hot summer afternoon; Taraf pops in with "a new way to cool off".
3. Bathroom (T4..S8): Taraf talks Sahab into standing under the shower in her clothes, opens the cold water,
   runs out, closes and locks the door (thud + click SFX), taunts from behind the door. Sahab furious.
4. End card (6 s): "يتبع... الحلقة ٢ — ترف تهرب... وسحاب ما راح تسكت!" with Taraf running and wet Sahab chasing.

## Characters (final approved design)
- **ترف / Taraf**: ~7 yr old. Light warm skin (246,211,182). Long SMOOTH dark-brown hair (46,30,33), center part,
  hair reaches waist. Big dark eyes with lashes + highlights, thick eyebrows, soft closed smile, rosy cheeks.
  Mustard-yellow t-shirt (246,190,38) with short sleeves, light-blue denim skirt (146,182,226), white sneakers.
  Reference: refs/taraf_ref3_yellow_tee_FINAL.jpg (the design target). refs/taraf_ref2_crown.jpg = optional princess
  look for special episodes (TARAF_P in lib.py: tiara, cream sparkly top, blush satin skirt).
- **سحاب / Sahab**: same age. Same skin tone as Taraf (246,211,182), long straight black hair with a white cloud hair-clip,
  sky-blue dress with short sleeves, pink shoes. When wet: hair/dress darker, water drips.
- **فجر / Fajr** (episode 2+): adult aunt, hair bun, teal long home dress, holds a coffee cup, stern eyebrows.
- Style: flat cartoon, big heads, front-facing, simple shadows, bubbles with a colored name chip
  (Taraf pink #E24682, Sahab blue #3C82D7, Fajr teal #28827F).

## Files
- build.sh — one command rebuild (python3, Pillow with raqm, numpy, ffmpeg).
- lib.py — character drawing (draw_girl) + speech bubbles. TARAF = TARAF_Q (final), TARAF_P, SAHAB, FAJR styles.
- scenes.py — backgrounds (room/bath/hall/title/end) + title scene. scenes2.py — episode 1 scenes (event driven).
- prep.py — trims/normalizes voices, lays out timings, builds mouth envelopes + final audio (music, shower, door SFX).
- render2.py — renders scenes in parallel to scenes/*.mp4.
- voices/T1..S8.opus — the author's own recorded voices (T = Taraf, S = Sahab), in dialogue order.
- timeline.json — scene durations, line start/end times, per-frame mouth envelopes.
- Taraf_Ep1_v4_preview.mp4 — current render with the final Taraf design (reference to match).

## Known gaps / next steps
- No Fajr voice yet (episode 2). Episode plan: 2) Fajr catches Taraf, "جرادة" banter, Sahab bursts out wet;
  3) Taraf throws a pillow and escapes; 4) chase through the house + ending.
- Subtitles on screen were written from the script; the author's audio may differ slightly in wording.
- Python renderer is flat/simple; the goal of moving to Remotion/HyperFrames is richer motion (squash & stretch,
  blinking, hair sway, camera moves, better water/steam effects).

## Remotion version (v5) — `remotion/`
- `src/Character.tsx` — SVG character rig: gradients + outlines, blinking, 8 expressions, eyelids, lip-sync
  from `timeline.json` env, hair sway, breathing, run cycle with squash, wet state (darker colours + drips), shiver.
- `src/backgrounds.tsx` — room (sun, heat shimmer, curtains, bed, thermometer) and bathroom (tiles, shower,
  knob, door, hallway). `src/scenes.tsx` — title / room / bath / end with smoothed camera, shake, SFX words.
- `src/ui.tsx` — Arabic speech bubbles (Cairo), pills, pop words, iris wipe, colour grade.
- Audio: `public/audio.wav` is the mixed track made by `prep.py` (copy `audio2.wav` there).
- Render:
  ```bash
  python3 prep.py && cp audio2.wav remotion/public/audio.wav
  cd remotion && npm i && npx remotion render TarafEp1 ../Taraf_Ep1_v5.mp4
  ```
  If Chrome can't be downloaded, set `REMOTION_BROWSER=/path/to/chrome`.
