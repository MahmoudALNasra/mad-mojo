"""
Build web-ready Mad Mojo studio video:
  - female VO (edge-tts) + soft bed music + ducked original audio
  - WebVTT captions
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
RATE = "+2%"

# Cleaned cues: (start_sec, end_sec, text)
CUES: list[tuple[float, float, str]] = [
    (0.5, 3.2, "Finish a painting with me!"),
    (3.4, 8.0, "We're painting with oil — let's put some final touches together."),
    (8.2, 14.0, "For red, I chose Rembrandt Permanent Red Deep, artist-quality oil paint."),
    (14.2, 21.5, "Next goes Van Gogh Cadmium Yellow — a gorgeous non-transparent colour. I just love it."),
    (21.8, 27.5, "As an addition, I'm using Winsor & Newton Fluorescent Yellow."),
    (27.8, 31.5, "Look how bright it is — sick."),
    (32.0, 39.0, "Next we have Rembrandt Turquoise — just a tiny bit as an addition."),
    (39.5, 47.0, "Rembrandt Periwinkle. It's transparent, and I'm absolutely obsessed with it."),
    (47.5, 55.5, "Looks almost like Pantone Veri Peri. Viridian hue as an addition to create the shadings."),
    (56.0, 66.0, "I like to organise my work — paints in separate boxes so I know where to search for what I need."),
    (66.5, 73.0, "I use scent-free turpentine as a medium."),
    (74.0, 82.0, "And that's how the final touches come together."),
    (83.0, 92.0, "Mad Mojo — art with a little madness in it."),
]


def run(cmd: list[str]) -> None:
    print("+", " ".join(cmd))
    subprocess.run(cmd, check=True)


def write_vtt(path: Path) -> None:
    def ts(sec: float) -> str:
        h = int(sec // 3600)
        m = int((sec % 3600) // 60)
        s = sec % 60
        return f"{h:02d}:{m:02d}:{s:06.3f}".replace(".", ",")

    # WebVTT uses . for milliseconds
    def vtt_ts(sec: float) -> str:
        h = int(sec // 3600)
        m = int((sec % 3600) // 60)
        s = sec % 60
        return f"{h:02d}:{m:02d}:{s:06.3f}"

    lines = ["WEBVTT", ""]
    for i, (start, end, text) in enumerate(CUES, 1):
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
    # edge-tts writes mp3; convert after
    mp3 = out.with_suffix(".mp3")
    await communicate.save(str(mp3))
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


async def build_vo_track(duration: float, out_wav: Path) -> None:
    parts_dir = WORK / "vo_parts"
    parts_dir.mkdir(parents=True, exist_ok=True)
    filter_parts: list[str] = []
    inputs: list[str] = []

    for i, (start, _end, text) in enumerate(CUES):
        part = parts_dir / f"{i:02d}.wav"
        await synth_line(text, part)
        delay_ms = int(start * 1000)
        inputs += ["-i", str(part)]
        # adelay for mono: delay|delay
        filter_parts.append(
            f"[{i}:a]adelay={delay_ms}|{delay_ms},apad=whole_dur={duration:.3f}[a{i}]"
        )

    mix_in = "".join(f"[a{i}]" for i in range(len(CUES)))
    filter_complex = (
        ";".join(filter_parts)
        + f";{mix_in}amix=inputs={len(CUES)}:normalize=0:dropout_transition=0,"
        + "volume=1.15[vo]"
    )
    cmd = [
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
    run(cmd)


def build_music(duration: float, out_wav: Path) -> None:
    # Soft ambient pad from layered sine + pink noise (royalty-free generated)
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
    # Mix: original audio low + music + VO
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
            "[0:a]volume=0.18,highpass=f=120[orig];"
            "[1:a]volume=1.2[vo];"
            "[2:a]volume=0.55[mus];"
            "[orig][vo][mus]amix=inputs=3:duration=first:dropout_transition=2,"
            "loudnorm=I=-16:TP=-1.5:LRA=11[a]",
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

    # Probe duration
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

    write_vtt(OUT / "studio-painting.vtt")

    vo = WORK / "vo.wav"
    music = WORK / "music.wav"
    await build_vo_track(duration, vo)
    build_music(duration, music)
    mux_final(duration, vo, music, OUT / "studio-painting.mp4")

    make_loop(10, 12, OUT / "studio-loop-a.mp4")
    make_loop(40, 14, OUT / "studio-loop-b.mp4")
    grab_poster(OUT / "studio-poster.jpg")

    # Size report
    for p in sorted(OUT.glob("*")):
        mb = p.stat().st_size / (1024 * 1024)
        print(f"  {p.name:28s} {mb:6.2f} MB")


if __name__ == "__main__":
    asyncio.run(main())
