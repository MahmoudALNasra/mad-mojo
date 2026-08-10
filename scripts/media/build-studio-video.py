"""
Build web-ready Mad Mojo studio video:
  - female VO synced to Magda's burned-in on-screen captions
  - soft bed music + ducked original audio
  - short muted loops for homepage backgrounds
  - NO separate WebVTT (captions are already in the picture)
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

# Warmer conversational voice (less “news robot” than Ava)
VOICE = "en-US-JennyNeural"
RATE = "-6%"
PITCH = "+2Hz"
VO_LEAD = 0.05
GAP = 0.08
BED_SRC = WORK / "bed_src.mp3"

# Spoken lines timed to the burned-in captions visible in the source video.
# start_sec = when that caption first appears on screen (~1fps frame index).
LINES: list[tuple[float, str]] = [
    (0.4, "Finish a painting with me!"),
    (2.4, "We're painting with oil paint, let's put some final touches together."),
    (6.4, "For red, I chose Rembrandt."),
    (8.0, "Permanent Red Deep Artist Quality Oil Paint. Next goes fine quality."),
    (11.5, "Van Gogh Cadmium yellow."),
    (15.0, "It's a gorgeous non transparent colour, just love it."),
    (17.5, "As addition I am using Winsor and Newton Fluorescent Yellow."),
    (21.0, "Look how bright it is, siiick."),
    (24.0, "Next we have Rembrandt Oil for Art Turquoise, just a tiny bit as addition."),
    (30.5, "Rembrandt Periwinkle, it is a transparent colour but I am absolutely obsessed with it."),
    (34.0, "Looks almost like Pantone Veri Peri. Viridian hue as addition to create shadings."),
    (39.0, "I recently like to organize my work so,"),
    (41.5, "I store paints in separate boxes to know where to search for what I need."),
    (44.5, "I use no scent turpentine as a medium."),
    (47.5, "It's a simple solution how not to affect the paint much and keep the brushes clean."),
    (49.5, "The painting is almost done so,"),
    (53.5, "I am just adding small details to brighten the whole thing up."),
    (59.0, "I am also adding more paint in the"),
    (67.0, "the contrast and create the depth."),
    (73.5, "I'm not forgetting about the details, as they say the devil is in the detail."),
    (79.0, "And here we go, the final effect."),
    (84.0, "I love how dynamic it came out, it looks so good on the wall."),
    (89.0, "I can't wait to put the varnish on it."),
]


def run(cmd: list[str]) -> None:
    print("+", " ".join(cmd[:8]), "..." if len(cmd) > 8 else "")
    subprocess.run(cmd, check=True)


def wav_duration(path: Path) -> float:
    with wave.open(str(path), "rb") as w:
        return w.getnframes() / float(w.getframerate())


async def synth_line(text: str, out: Path) -> None:
    mp3 = out.with_suffix(".mp3")
    last_err: Exception | None = None
    for attempt in range(5):
        try:
            communicate = edge_tts.Communicate(
                text, VOICE, rate=RATE, pitch=PITCH
            )
            await communicate.save(str(mp3))
            last_err = None
            break
        except Exception as err:  # noqa: BLE001 — retry transient edge-tts 503s
            last_err = err
            await asyncio.sleep(1.2 * (attempt + 1))
    if last_err is not None:
        raise last_err
    # Light high-shelf cut + gentle compression = less harsh/robotic
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
            "-af",
            "highpass=f=90,lowpass=f=9800,acompressor=threshold=-18dB:ratio=2.2:attack=12:release=180:makeup=2",
            str(out),
        ]
    )
    mp3.unlink(missing_ok=True)


def fit_duration(src: Path, target: float, dst: Path) -> None:
    dur = wav_duration(src)
    if dur <= target or target <= 0.4:
        if src != dst:
            dst.write_bytes(src.read_bytes())
        return
    tempo = min(1.4, dur / max(0.4, target))
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


async def build_vo_track(duration: float, out_wav: Path) -> None:
    parts_dir = WORK / "vo_parts"
    parts_dir.mkdir(parents=True, exist_ok=True)

    raw_parts: list[Path] = []
    for i, (_anchor, text) in enumerate(LINES):
        part = parts_dir / f"{i:02d}.wav"
        await synth_line(text, part)
        raw_parts.append(part)

    schedule: list[tuple[float, Path]] = []
    cursor = 0.0
    for i, ((anchor, text), raw) in enumerate(zip(LINES, raw_parts)):
        next_anchor = LINES[i + 1][0] if i + 1 < len(LINES) else duration - 0.3
        window = max(0.45, next_anchor - max(anchor, cursor) - GAP)
        fitted = parts_dir / f"{i:02d}_fit.wav"
        fit_duration(raw, window, fitted)
        dur = wav_duration(fitted)
        start = max(anchor - VO_LEAD, cursor)
        if start + dur > next_anchor - GAP:
            start = max(cursor, next_anchor - GAP - dur)
        start = max(0.0, start)
        schedule.append((start, fitted))
        cursor = start + dur + GAP
        print(f"  vo {i:02d}: {start:6.2f}s (+{dur:4.2f}s)  {text[:56]}")

    filter_parts: list[str] = []
    inputs: list[str] = []
    for i, (start, part) in enumerate(schedule):
        delay_ms = int(round(start * 1000))
        inputs += ["-i", str(part)]
        filter_parts.append(
            f"[{i}:a]adelay={delay_ms}|{delay_ms},apad=whole_dur={duration:.3f}[a{i}]"
        )

    mix_in = "".join(f"[a{i}]" for i in range(len(schedule)))
    filter_complex = (
        ";".join(filter_parts)
        + f";{mix_in}amix=inputs={len(schedule)}:normalize=0:dropout_transition=0,"
        + "volume=1.25[vo]"
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


def build_music(duration: float, out_wav: Path) -> None:
    """Soft chill bed from a royalty-free track + light room texture."""
    fade = max(0, duration - 3)
    if BED_SRC.exists():
        run(
            [
                "ffmpeg",
                "-y",
                "-stream_loop",
                "-1",
                "-i",
                str(BED_SRC),
                "-f",
                "lavfi",
                "-i",
                f"anoisesrc=color=pink:amplitude=0.02:sample_rate=44100:duration={duration}",
                "-filter_complex",
                # Warm, low music bed + subtle vinyl/room hiss
                f"[0:a]atrim=0:{duration},asetpts=PTS-STARTPTS,"
                "highpass=f=80,lowpass=f=4200,volume=0.28,"
                f"afade=t=in:st=0:d=2.5,afade=t=out:st={fade}:d=3[bed];"
                "[1:a]lowpass=f=900,volume=0.045[tex];"
                "[bed][tex]amix=inputs=2:normalize=0[out]",
                "-map",
                "[out]",
                "-t",
                f"{duration:.3f}",
                "-ac",
                "2",
                "-ar",
                "44100",
                str(out_wav),
            ]
        )
        return

    # Fallback pad if bed file missing
    run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "lavfi",
            "-i",
            f"sine=frequency=196:sample_rate=44100:duration={duration}",
            "-f",
            "lavfi",
            "-i",
            f"sine=frequency=246.94:sample_rate=44100:duration={duration}",
            "-f",
            "lavfi",
            "-i",
            f"sine=frequency=293.66:sample_rate=44100:duration={duration}",
            "-f",
            "lavfi",
            "-i",
            f"anoisesrc=color=pink:amplitude=0.025:sample_rate=44100:duration={duration}",
            "-filter_complex",
            "[0:a]volume=0.05[a0];[1:a]volume=0.04[a1];[2:a]volume=0.03[a2];"
            "[3:a]lowpass=f=600,volume=0.07[a3];"
            "[a0][a1][a2][a3]amix=inputs=4:normalize=0,"
            f"afade=t=in:st=0:d=2,afade=t=out:st={fade}:d=3",
            "-ac",
            "2",
            "-ar",
            "44100",
            str(out_wav),
        ]
    )


def mux_final(duration: float, vo: Path, music: Path, out_mp4: Path) -> None:
    # Keep VO dominant; music stays soft. Avoid sidechain (was crushing speech).
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
            "[0:a]volume=0.10,highpass=f=140[orig];"
            "[1:a]aformat=channel_layouts=stereo,volume=2.4[vo];"
            "[2:a]aformat=channel_layouts=stereo,volume=0.22,lowpass=f=4500[mus];"
            "[orig][vo][mus]amix=inputs=3:duration=first:dropout_transition=0:normalize=0,"
            "loudnorm=I=-14:TP=-1.5:LRA=11[a]",
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
            "160k",
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
    await build_vo_track(duration, vo)
    build_music(duration, music)
    mux_final(duration, vo, music, OUT / "studio-painting.mp4")

    # Remove old WebVTT overlays — captions are burned into the video
    vtt = OUT / "studio-painting.vtt"
    if vtt.exists():
        vtt.unlink()
        print(f"Removed {vtt}")

    make_loop(10, 12, OUT / "studio-loop-a.mp4")
    make_loop(40, 14, OUT / "studio-loop-b.mp4")
    grab_poster(OUT / "studio-poster.jpg")

    for p in sorted(OUT.glob("*")):
        mb = p.stat().st_size / (1024 * 1024)
        print(f"  {p.name:28s} {mb:6.2f} MB")


if __name__ == "__main__":
    asyncio.run(main())
