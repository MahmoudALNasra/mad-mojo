"""Build multiple 8s Instagram Reels (1080x1920) from studio-painting.mp4."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT.parent / "public" / "videos" / "studio-painting.mp4"
OUT = ROOT / "out"
ASSETS = ROOT / "assets"
SFX = ROOT / "sfx"
OUT.mkdir(parents=True, exist_ok=True)

FFMPEG = (
    Path.home()
    / "AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe"
    / "ffmpeg-9.0-full_build/bin/ffmpeg.exe"
)


def run(cmd: list[str]) -> None:
    print(">", " ".join(cmd[:8]), "...")
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr[-4000:])
        raise SystemExit(r.returncode)


def scale_pad(label: str = "v") -> str:
    # Fit source into 1080x1920 with blurred fill background
    return (
        f"[{label}]scale=1080:1920:force_original_aspect_ratio=increase,"
        f"crop=1080:1920,setsar=1[{label}s]"
    )


def build_reel1_hook() -> Path:
    """
    Hook reel (8s):
    0.0-1.6 eyes close-up + WAIT FOR IT
    1.6-4.2 fast process bits
    4.2-7.0 final painting + WOOOO + glow cat
    7.0-8.0 punch zoom CTA
    """
    out = OUT / "reel1_hook_glow_cat.mp4"
    # Pre-extract segments with re-encode for clean cuts
    segs = [
        ("seg_eyes.mp4", 69.0, 1.6, "1.35"),  # zoomed eyes later via filter
        ("seg_tube.mp4", 12.2, 0.9, "1"),
        ("seg_brush.mp4", 50.5, 0.9, "1"),
        ("seg_face.mp4", 71.5, 0.9, "1"),
        ("seg_final.mp4", 83.5, 2.8, "1"),
        ("seg_end.mp4", 91.0, 1.0, "1.2"),
    ]
    tmp = OUT / "_tmp"
    tmp.mkdir(exist_ok=True)
    for name, ss, dur, _ in segs:
        run(
            [
                str(FFMPEG),
                "-y",
                "-ss",
                str(ss),
                "-i",
                str(SRC),
                "-t",
                str(dur),
                "-vf",
                "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30",
                "-an",
                "-c:v",
                "libx264",
                "-preset",
                "veryfast",
                "-crf",
                "18",
                str(tmp / name),
            ]
        )

    # Concat process bits
    concat_list = tmp / "r1.txt"
    concat_list.write_text(
        "\n".join(
            [
                f"file '{(tmp / 'seg_eyes.mp4').as_posix()}'",
                f"file '{(tmp / 'seg_tube.mp4').as_posix()}'",
                f"file '{(tmp / 'seg_brush.mp4').as_posix()}'",
                f"file '{(tmp / 'seg_face.mp4').as_posix()}'",
                f"file '{(tmp / 'seg_final.mp4').as_posix()}'",
                f"file '{(tmp / 'seg_end.mp4').as_posix()}'",
            ]
        ),
        encoding="utf-8",
    )
    base = tmp / "r1_base.mp4"
    run(
        [
            str(FFMPEG),
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat_list),
            "-c",
            "copy",
            str(base),
        ]
    )

    # Overlay memes + text with timed enable
    glow = ASSETS / "glow_cat.png"
    scream = ASSETS / "scream_cat.png"
    wooo = ASSETS / "woooo_stack.png"
    hook = ASSETS / "hook_wait.png"
    stare = ASSETS / "hook_glitch.png"
    cta = ASSETS / "hook_sentient.png"
    sfx = SFX / "reel1_hook.wav"

    fc = (
        # slight zoom punch on first 1.6s
        "[0:v]split=2[a][b];"
        "[a]trim=0:1.6,setpts=PTS-STARTPTS,"
        "zoompan=z='min(1.45,1.15+0.02*on)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)-80':d=1:s=1080x1920:fps=30[a1];"
        "[b]trim=1.6:8,setpts=PTS-STARTPTS[b1];"
        "[a1][b1]concat=n=2:v=1:a=0[vbase];"
        # overlays
        f"[1:v]scale=380:-1[glow];"
        f"[2:v]scale=300:-1[scream];"
        f"[3:v]scale=980:-1[wooo];"
        f"[4:v]scale=900:-1[hook];"
        f"[5:v]scale=920:-1[stare];"
        f"[6:v]scale=960:-1[cta];"
        "[vbase][hook]overlay=(W-w)/2:220:enable='between(t,0,1.55)'[v1];"
        "[v1][stare]overlay=(W-w)/2:1550:enable='between(t,1.55,4.1)'[v2];"
        "[v2][wooo]overlay=(W-w)/2:80:enable='between(t,4.2,7.0)'[v3];"
        "[v3][glow]overlay=W-w-40:H-h-420:enable='between(t,4.3,7.2)'[v4];"
        "[v4][scream]overlay=40:H-h-450:enable='between(t,4.5,6.8)'[v5];"
        "[v5][cta]overlay=(W-w)/2:1500:enable='gte(t,6.9)'[vout]"
    )

    run(
        [
            str(FFMPEG),
            "-y",
            "-i",
            str(base),
            "-loop",
            "1",
            "-i",
            str(glow),
            "-loop",
            "1",
            "-i",
            str(scream),
            "-loop",
            "1",
            "-i",
            str(wooo),
            "-loop",
            "1",
            "-i",
            str(hook),
            "-loop",
            "1",
            "-i",
            str(stare),
            "-loop",
            "1",
            "-i",
            str(cta),
            "-i",
            str(sfx),
            "-filter_complex",
            fc,
            "-map",
            "[vout]",
            "-map",
            "7:a",
            "-t",
            "8",
            "-c:v",
            "libx264",
            "-preset",
            "fast",
            "-crf",
            "18",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-ar",
            "44100",
            "-shortest",
            "-movflags",
            "+faststart",
            "-pix_fmt",
            "yuv420p",
            str(out),
        ]
    )
    return out


def build_simple_montage(
    name: str,
    clips: list[tuple[float, float]],
    overlays: list[tuple[str, str, str]],
    sfx_name: str,
    extra_vf: str | None = None,
) -> Path:
    """
    clips: list of (start, duration)
    overlays: list of (png_name, overlay_expr, enable_expr)
    """
    tmp = OUT / "_tmp" / name
    tmp.mkdir(parents=True, exist_ok=True)
    parts = []
    for i, (ss, dur) in enumerate(clips):
        p = tmp / f"c{i}.mp4"
        vf = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30"
        if extra_vf and i == 0:
            vf = extra_vf
        run(
            [
                str(FFMPEG),
                "-y",
                "-ss",
                str(ss),
                "-i",
                str(SRC),
                "-t",
                str(dur),
                "-vf",
                vf,
                "-an",
                "-c:v",
                "libx264",
                "-preset",
                "veryfast",
                "-crf",
                "18",
                str(p),
            ]
        )
        parts.append(p)

    lst = tmp / "list.txt"
    lst.write_text("\n".join(f"file '{p.as_posix()}'" for p in parts), encoding="utf-8")
    base = tmp / "base.mp4"
    run([str(FFMPEG), "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(base)])

    # Build filter for overlays
    inputs = [str(FFMPEG), "-y", "-i", str(base)]
    for png, _, _ in overlays:
        inputs += ["-loop", "1", "-i", str(ASSETS / png)]
    inputs += ["-i", str(SFX / sfx_name)]

    fc_parts = []
    last = "0:v"
    for idx, (png, place, enable) in enumerate(overlays, start=1):
        scaled = f"ov{idx}"
        outv = f"v{idx}"
        fc_parts.append(f"[{idx}:v]scale=920:-1[{scaled}]")
        # Special scale for stickers
        if "cat" in png or "woooo" in png:
            fc_parts[-1] = f"[{idx}:v]scale=360:-1[{scaled}]" if "cat" in png else f"[{idx}:v]scale=980:-1[{scaled}]"
        fc_parts.append(f"[{last}][{scaled}]overlay={place}:enable='{enable}'[{outv}]")
        last = outv

    fc = ";".join(fc_parts)
    out = OUT / f"{name}.mp4"
    audio_idx = 1 + len(overlays)
    cmd = inputs + [
        "-filter_complex",
        fc,
        "-map",
        f"[{last}]",
        "-map",
        f"{audio_idx}:a",
        "-t",
        "8",
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "18",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-ar",
        "44100",
        "-shortest",
        "-movflags",
        "+faststart",
        "-pix_fmt",
        "yuv420p",
        str(out),
    ]
    run(cmd)
    return out


def main() -> None:
    if not FFMPEG.exists():
        print("ffmpeg not found:", FFMPEG)
        sys.exit(1)
    if not SRC.exists():
        print("source missing:", SRC)
        sys.exit(1)

    # Ensure assets exist
    subprocess.run([sys.executable, str(ROOT / "make_assets.py")], check=True)

    print("\n=== REEL 1: Hook / Glow Cat / WOOOO ===")
    r1 = build_reel1_hook()
    print("Wrote", r1)

    print("\n=== REEL 2: Speedrun process -> final ===")
    r2 = build_simple_montage(
        "reel2_speedrun_final",
        clips=[
            (0.3, 1.2),
            (12.0, 1.0),
            (27.0, 1.0),
            (50.0, 1.0),
            (69.0, 1.2),
            (84.0, 2.6),
        ],
        overlays=[
            ("hook_watch.png", "(W-w)/2:200", "between(t,0,2.0)"),
            ("woooo_stack.png", "(W-w)/2:60", "between(t,5.2,8)"),
            ("glow_cat.png", "W-w-30:H-h-380", "between(t,5.4,8)"),
            ("cta_follow.png", "(W-w)/2:1550", "gte(t,6.5)"),
        ],
        sfx_name="reel2_speedrun.wav",
    )
    print("Wrote", r2)

    print("\n=== REEL 3: Instant meme dump on final painting ===")
    r3 = build_simple_montage(
        "reel3_final_meme_spam",
        clips=[
            (84.0, 3.5),
            (90.5, 2.5),
            (72.0, 2.0),
        ],
        overlays=[
            ("hook_rate.png", "(W-w)/2:180", "between(t,0,2.5)"),
            ("woooo_stack.png", "(W-w)/2:70", "between(t,0.2,3.5)"),
            ("scream_cat.png", "40:1200", "between(t,0.4,4.0)"),
            ("glow_cat.png", "W-w-40:1180", "between(t,1.0,5.5)"),
            ("hook_glitch.png", "(W-w)/2:1500", "gte(t,5.0)"),
        ],
        sfx_name="reel3_meme.wav",
    )
    print("Wrote", r3)

    print("\n=== REEL 4: Eyes hook -> reveal ===")
    r4 = build_simple_montage(
        "reel4_eyes_reveal",
        clips=[
            (70.0, 2.2),
            (14.0, 1.3),
            (52.0, 1.5),
            (85.0, 3.0),
        ],
        overlays=[
            ("hook_stare.png", "(W-w)/2:220", "between(t,0,2.1)"),
            ("hook_wait.png", "(W-w)/2:200", "between(t,2.1,4.8)"),
            ("woooo_stack.png", "(W-w)/2:80", "gte(t,5.0)"),
            ("glow_cat.png", "(W-w)/2:H-h-360", "gte(t,5.2)"),
            ("hook_sentient.png", "(W-w)/2:1520", "gte(t,6.4)"),
        ],
        sfx_name="reel4_reveal.wav",
        extra_vf=(
            "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,"
            "eq=contrast=1.15:saturation=1.25,fps=30"
        ),
    )
    print("Wrote", r4)

    # Captions / posting guide
    guide = OUT / "POSTING_GUIDE.md"
    guide.write_text(
        """# Instagram Reels — posting guide

All files are **8.0s · 1080×1920 · H.264 + AAC** in `reels/out/`.

## Reel 1 — `reel1_hook_glow_cat.mp4` (START HERE)
**Hook style:** mystery → process flashes → final painting meme dump  
**On-screen:** WAIT FOR IT → glowing eyes text → WOOOOO + glow/scream cats → sentience CTA  

**Caption idea:**
this painting looked at me first 😭⚡

**Audio tip (IG):** layer a trending “suspense then drop” or cat meme audio on top in Reels editor if you want max reach. Keep our SFX low if you do.

**Hashtags:** #artreels #catmeme #paintingprocess #artistsoftiktok #funnyreels

---

## Reel 2 — `reel2_speedrun_final.mp4`
**Hook:** “watch till the END” + rapid process cuts → final reveal WOOOO  
Great as part 2 / carousel follow-up the next day.

**Caption:** 96 seconds of chaos. condensed. you’re welcome.

---

## Reel 3 — `reel3_final_meme_spam.mp4`
**Hook:** cold-open on the finished painting + instant WOOOO / scream cat spam  
Best for “rate this 1–10” comment bait.

**Caption:** be honest… 1-10 how unhinged is this cat

---

## Reel 4 — `reel4_eyes_reveal.mp4`
**Hook:** extreme eye close-up (“this cat stared back”) → build → reveal  
Best “story” beat of the four.

**Caption:** POV: you make eye contact with your own painting

---

## Series tip
Post order for a week: **1 → 4 → 2 → 3**. Same source, different hooks = algorithm-friendly without looking duplicate.
""",
        encoding="utf-8",
    )
    print("\nGuide:", guide)
    print("Done.")


if __name__ == "__main__":
    main()
