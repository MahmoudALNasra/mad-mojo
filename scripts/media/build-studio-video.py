"""
Build web-ready Mad Mojo studio video:
  - female VO (edge-tts) + soft bed music + ducked original audio
  - WebVTT captions synced to measured VO timing
  - short muted loops for homepage backgrounds
"""
from __future__ import annotations

import asyncio
import json
import subprocess
import wave
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[2]
SRC = Path(r"c:\Users\laalg\Downloads\madmojo painint 1.mp4")
OUT = ROOT / "public" / "videos"
WORK = ROOT / "scripts" / "media" / "_work"

VOICE = "en-US-AvaNeural"
# Slightly faster so lines finish inside their visual windows
RATE = "+18%"
# Start speech a touch before the caption so VO never feels late
VO_LEAD = 0.12
GAP = 0.08

# Visual anchors + copy (end is only a soft target; real end = measured speech)
LINES: list[tuple[float, str]] = [
    (0.4, "Finish a painting with me!"),
    (3.2, "We're painting with oil — let's put some final touches together."),
    (7.8, "For red, I chose Rembrandt Permanent Red Deep, artist-quality oil paint."),
    (13.6, "Next goes Van Gogh Cadmium Yellow — a gorgeous non-transparent colour. I just love it."),
    (21.0, "As an addition, I'm using Winsor and Newton Fluorescent Yellow."),
    (26.8, "Look how bright it is — sick."),
    (30.8, "Next we have Rembrandt Turquoise — just a tiny bit as an addition."),
    (38.0, "Rembrandt Periwinkle. It's transparent, and I'm absolutely obsessed with it."),
    (46.0, "Looks almost like Pantone Veri Peri. Viridian hue as an addition to create the shadings."),
    (54.5, "I like to organise my work — paints in separate boxes so I know where to search for what I need."),
    (65.0, "I use scent-free turpentine as a medium."),
    (71.5, "And that's how the final touches come together."),
    (80.5, "Mad Mojo — art with a little madness in it."),
]


def run(cmd: list[str]) -> None:
    print("+", " ".join(cmd[:8]), "..." if len(cmd) > 8 else "")
    subprocess.run(cmd, check=True)


def vtt_ts(sec: float) -> str:
    sec = max(0.0, sec)
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = sec % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}"


def write_vtt(path: Path, cues: list[tuple[float, float, str]]) -> None:
    lines = ["WEBVTT", ""]
    for i, (start, end, text) in enumerate(cues, 1):
        lines.append(str(i))
        lines.append(f"{vtt_ts(start)} --> {vtt_ts(end)}")
        lines.append(text)
        lines.append("")
    path.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {path}")


def wav_duration(path: Path) -> float:
    with wave.open(str(path), "rb") as w:
        return w.getnframes() / float(w.getframerate())


async def synth_line(text: str, out: Path) -> None:
    communicate = edge_tts.Communicate(text, VOICE, rate=RATE)
    mp3 = out.with_suffix(".mp3")
    await communicate.save(str(mp3))
    # Convert only — do not strip "silence" (edge-tts pauses get eaten otherwise)
    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(mp3),
            "-ac",
            "1",
            "-ar",
            "44100",
            str(out),
        ]
    )
    mp3.unlink(missing_ok=True)


def fit_duration(src: Path, target: float, dst: Path) -> None:
    """Speed up a clip if it overruns the available window."""
    dur = wav_duration(src)
    if dur <= target or target <= 0.35:
        if src != dst:
            dst.write_bytes(src.read_bytes())
        return
    tempo = min(1.35, dur / max(0.35, target))
    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(src),
            "-af",
            f"atempo={tempo:.4f}",
            "-ac",
            "1",
            "-ar",
            "44100",
            str(dst),
        ]
    )


async def build_vo_and_cues(
    duration: float, out_wav: Path
) -> list[tuple[float, float, str]]:
    parts_dir = WORK / "vo_parts"
    parts_dir.mkdir(parents=True, exist_ok=True)

    raw_parts: list[Path] = []
    for i, (_anchor, text) in enumerate(LINES):
        part = parts_dir / f"{i:02d}.wav"
        await synth_line(text, part)
        raw_parts.append(part)

    # Schedule: prefer visual anchor, never overlap previous speech
    schedule: list[tuple[float, float, str, Path]] = []
    cursor = 0.0
    for i, ((anchor, text), raw) in enumerate(zip(LINES, raw_parts)):
        next_anchor = LINES[i + 1][0] if i + 1 < len(LINES) else duration - 0.4
        # Leave a little air before the next line
        window = max(0.4, next_anchor - max(anchor, cursor) - GAP)
        fitted = parts_dir / f"{i:02d}_fit.wav"
        fit_duration(raw, window, fitted)
        dur = wav_duration(fitted)
        start = max(anchor - VO_LEAD, cursor)
        # If still overruns next visual beat, pull start earlier into free gap
        if start + dur > next_anchor - GAP:
            start = max(cursor, next_anchor - GAP - dur)
        start = max(0.0, start)
        end = min(duration - 0.05, start + dur)
        schedule.append((start, end, text, fitted))
        cursor = end + GAP
        print(f"  cue {i:02d}: {start:6.2f}-{end:6.2f}s  ({dur:4.2f}s)  {text[:48]}")

    filter_parts: list[str] = []
    inputs: list[str] = []
    for i, (start, _end, _text, part) in enumerate(schedule):
        delay_ms = int(round(start * 1000))
        inputs += ["-i", str(part)]
        filter_parts.append(
            f"[{i}:a]adelay={delay_ms}|{delay_ms},apad=whole_dur={duration:.3f}[a{i}]"
        )

    mix_in = "".join(f"[a{i}]" for i in range(len(schedule)))
    filter_complex = (
        ";".join(filter_parts)
        + f";{mix_in}amix=inputs={len(schedule)}:normalize=0:dropout_transition=0,"
        + "volume=1.2[vo]"
    )
    run(
        [
            "ffmpeg",
            "-y",
            *inputs,
            "-filter_complex",
            filter_complex,
            "-map",
            "[vo]",
            "-t",
            f"{duration:.3f}",
            "-ac",
            "1",
            "-ar",
            "44100",
            str(out_wav),
        ]
    )

    # Captions match spoken audio exactly (slight pad so last word stays readable)
    cues = [
        (start, min(duration, end + 0.15), text)
        for start, end, text, _ in schedule
    ]
    return cues


def build_music(duration: float, out_wav: Path) -> None:
    run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "lavfi",
            "-i",
            f"sine=frequency=174:sample_rate=44100:duration={duration}",
            "-f",
            "lavfi",
            "-i",
            f"sine=frequency=220:sample_rate=44100:duration={duration}",
            "-f",
            "lavfi",
            "-i",
            f"sine=frequency=261.63:sample_rate=44100:duration={duration}",
            "-f",
            "lavfi",
            "-i",
            f"anoisesrc=color=pink:amplitude=0.03:sample_rate=44100:duration={duration}",
            "-filter_complex",
            "[0:a]volume=0.04[a0];"
            "[1:a]volume=0.03[a1];"
            "[2:a]volume=0.025[a2];"
            "[3:a]lowpass=f=500,volume=0.08[a3];"
            "[a0][a1][a2][a3]amix=inputs=4:normalize=0,"
            "afade=t=in:st=0:d=2,afade=t=out:st={fade}:d=3".format(
                fade=max(0, duration - 3)
            ),
            "-ac",
            "2",
            "-ar",
            "44100",
            str(out_wav),
        ]
    )


def mux_final(duration: float, vo: Path, music: Path, out_mp4: Path) -> None:
    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(SRC),
            "-i",
            str(vo),
            "-i",
            str(music),
            "-filter_complex",
            # No loudnorm (it can shift perceived timing); keep levels simple
            "[0:a]volume=0.16,highpass=f=120[orig];"
            "[1:a]volume=1.35[vo];"
            "[2:a]volume=0.45[mus];"
            "[orig][vo][mus]amix=inputs=3:duration=first:dropout_transition=1,"
            "alimiter=limit=0.95[a]",
            "-map",
            "0:v",
            "-map",
            "[a]",
            "-vf",
            "scale=-2:720",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "28",
            "-c:a",
            "aac",
            "-b:a",
            "96k",
            "-movflags",
            "+faststart",
            "-t",
            f"{duration:.3f}",
            str(out_mp4),
        ]
    )


def make_loop(start: float, length: float, out: Path) -> None:
    run(
        [
            "ffmpeg",
            "-y",
            "-ss",
            str(start),
            "-t",
            str(length),
            "-i",
            str(SRC),
            "-an",
            "-vf",
            "scale=-2:720",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "30",
            "-movflags",
            "+faststart",
            str(out),
        ]
    )


def grab_poster(out: Path) -> None:
    run(
        [
            "ffmpeg",
            "-y",
            "-ss",
            "12",
            "-i",
            str(SRC),
            "-frames:v",
            "1",
            "-update",
            "1",
            "-vf",
            "scale=1200:-2",
            "-q:v",
            "3",
            str(out),
        ]
    )


async def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Missing source video: {SRC}")
    OUT.mkdir(parents=True, exist_ok=True)
    WORK.mkdir(parents=True, exist_ok=True)

    probe = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "json",
            str(SRC),
        ],
        text=True,
    )
    duration = float(json.loads(probe)["format"]["duration"])
    print(f"Source duration: {duration:.2f}s")

    vo = WORK / "vo.wav"
    music = WORK / "music.wav"
    cues = await build_vo_and_cues(duration, vo)
    write_vtt(OUT / "studio-painting.vtt", cues)
    build_music(duration, music)
    mux_final(duration, vo, music, OUT / "studio-painting.mp4")

    make_loop(10, 12, OUT / "studio-loop-a.mp4")
    make_loop(40, 14, OUT / "studio-loop-b.mp4")
    grab_poster(OUT / "studio-poster.jpg")

    for p in sorted(OUT.glob("*")):
        mb = p.stat().st_size / (1024 * 1024)
        print(f"  {p.name:28s} {mb:6.2f} MB")


if __name__ == "__main__":
    asyncio.run(main())
