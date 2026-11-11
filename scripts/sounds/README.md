# Kolo sounds

- `public/sounds/*.mp3` — what the app plays (mono 48 kHz, 128 kbps; orbit-closed is stereo). Played by `src/utils/sounds.ts`.
- `synth.py` — the generator. `python3 scripts/sounds/synth.py` rebuilds everything, `python3 scripts/sounds/synth.py level-up` rebuilds one file.
  Needs numpy, scipy, soundfile, ffmpeg. MP3s go straight into `public/sounds/`.
- `out/wav/` — 24-bit masters, `out/calib.json` — loudness calibration. Both are local only (gitignored) and the build is
  deterministic, so a full run recreates them. A single-file rebuild needs `calib.json`, so run the full build once first.

A new sound: add a function and a `SOUNDS` entry in `synth.py`, then the name to `SOUND_IDS` in `src/utils/sounds.ts`.

## Pitch variants in code (playbackRate)
All steps keep the sounds in C pentatonic. In code: `semitones(n)` from `src/utils/sounds.ts`.
- card-next: «не знаю» −2, «забыл» −1, «помню» 0, «знаю» +2 (`RATING_PITCH`) — the file is mostly unpitched, any rate is fine
- streak-up: speed round ×2 → 0, ×3 → +2, ×4 → +5 (G → A → C). Survival 5 → 0, 10 → +2
- timer-tick: regular 0, last three seconds +2 (G5 → A5)

## capsule-shake loop
The loop is seamless in the WAV. MP3 adds encoder padding, so `<audio loop>` would click on some browsers.
It plays through Web Audio (`startLoop`): `source.loop = true` on a decoded AudioBuffer with `loopStart`/`loopEnd` at 0 and 0.75 s.

## Levels
Relative loudness is baked in (frequent = quieter, rewards = louder); the loudest peak is −3 dBFS.
Edit the dB numbers in `SOUNDS` in synth.py to rebalance.

## Order
Ceremony sounds (session-complete, time-up, game-over, achievement, level-up, orbit-closed, shield, orbit-repaired)
never overlap: each waits for the previous one to finish (`CEREMONY` in `src/utils/sounds.ts`).
