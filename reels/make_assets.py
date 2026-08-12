"""Generate meme overlays + SFX for Instagram painting reels."""
from __future__ import annotations

import math
import struct
import wave
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
SFX = ROOT / "sfx"
ASSETS.mkdir(parents=True, exist_ok=True)
SFX.mkdir(parents=True, exist_ok=True)


def font(size: int, bold: bool = True) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        r"C:\Windows\Fonts\impact.ttf",
        r"C:\Windows\Fonts\arialbd.ttf",
        r"C:\Windows\Fonts\seguiemj.ttf",
        r"C:\Windows\Fonts\arial.ttf",
    ]
    for path in candidates:
        p = Path(path)
        if p.exists():
            try:
                return ImageFont.truetype(str(p), size=size)
            except OSError:
                continue
    return ImageFont.load_default()


def draw_text_outline(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    fill: tuple[int, int, int, int],
    outline: tuple[int, int, int, int],
    fnt: ImageFont.ImageFont,
    width: int = 4,
) -> None:
    x, y = xy
    for dx in range(-width, width + 1):
        for dy in range(-width, width + 1):
            if dx == 0 and dy == 0:
                continue
            draw.text((x + dx, y + dy), text, font=fnt, fill=outline)
    draw.text(xy, text, font=fnt, fill=fill)


def make_glowing_cat(path: Path) -> None:
    """Cartoon glowing red cat face sticker (transparent PNG)."""
    w, h = 640, 640
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    g = ImageDraw.Draw(glow)
    # Cyan outer glow
    for i, alpha in enumerate([40, 70, 110, 160]):
        r = 280 - i * 28
        g.ellipse([(w // 2 - r, h // 2 - r + 20), (w // 2 + r, h // 2 + r + 20)], fill=(0, 255, 255, alpha))
    glow = glow.filter(ImageFilter.GaussianBlur(28))
    img = Image.alpha_composite(img, glow)

    d = ImageDraw.Draw(img)
    # Head
    d.ellipse([(120, 140), (520, 540)], fill=(220, 30, 55, 255), outline=(90, 0, 20, 255), width=8)
    # Ears
    d.polygon([(150, 220), (200, 70), (270, 190)], fill=(220, 30, 55, 255), outline=(90, 0, 20, 255))
    d.polygon([(370, 190), (440, 70), (490, 220)], fill=(220, 30, 55, 255), outline=(90, 0, 20, 255))
    d.polygon([(180, 200), (205, 105), (245, 185)], fill=(255, 160, 190, 255))
    d.polygon([(395, 185), (435, 105), (460, 200)], fill=(255, 160, 190, 255))
    # Eyes with lightning
    for cx in (250, 390):
        d.ellipse([(cx - 55, 250), (cx + 55, 370)], fill=(40, 220, 255, 255), outline=(255, 255, 255, 255), width=6)
        d.polygon(
            [(cx - 8, 265), (cx + 18, 300), (cx + 2, 300), (cx + 22, 355), (cx - 14, 310), (cx + 4, 310)],
            fill=(255, 255, 255, 255),
        )
    # Nose + mouth
    d.ellipse([(300, 375), (340, 405)], fill=(255, 120, 160, 255))
    d.arc([(250, 390), (390, 470)], 20, 160, fill=(40, 0, 10, 255), width=7)
    # Whiskers
    for y in (390, 410, 430):
        d.line([(140, y), (230, y + 5)], fill=(255, 255, 255, 220), width=4)
        d.line([(410, y + 5), (500, y)], fill=(255, 255, 255, 220), width=4)

    img.save(path)


def make_screaming_cat(path: Path) -> None:
    """WOOOO screaming cat meme sticker."""
    w, h = 520, 560
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse([(60, 80), (460, 500)], fill=(255, 150, 40, 255), outline=(120, 50, 0, 255), width=8)
    d.polygon([(90, 160), (130, 40), (210, 140)], fill=(255, 150, 40, 255), outline=(120, 50, 0, 255))
    d.polygon([(310, 140), (390, 40), (430, 160)], fill=(255, 150, 40, 255), outline=(120, 50, 0, 255))
    # Huge shocked eyes
    for cx in (190, 330):
        d.ellipse([(cx - 48, 180), (cx + 48, 290)], fill=(255, 255, 255, 255), outline=(20, 20, 20, 255), width=5)
        d.ellipse([(cx - 18, 215), (cx + 18, 265)], fill=(20, 20, 20, 255))
    # Wide open mouth
    d.ellipse([(170, 320), (350, 470)], fill=(20, 10, 10, 255))
    d.ellipse([(195, 345), (325, 430)], fill=(180, 40, 60, 255))
    img.save(path)


def make_text_banner(text: str, path: Path, color=(255, 255, 255, 255), size=92) -> None:
    fnt = font(size)
    tmp = Image.new("RGBA", (10, 10), (0, 0, 0, 0))
    td = ImageDraw.Draw(tmp)
    bbox = td.textbbox((0, 0), text, font=fnt)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    pad_x, pad_y = 48, 28
    img = Image.new("RGBA", (tw + pad_x * 2, th + pad_y * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # Soft black plate behind text for readability
    d.rounded_rectangle([(8, 8), (img.width - 8, img.height - 8)], radius=24, fill=(0, 0, 0, 140))
    draw_text_outline(d, (pad_x, pad_y - 4), text, color, (0, 0, 0, 255), fnt, width=5)
    img.save(path)


def make_woooo_stack(path: Path) -> None:
    text = "WOOOOOOOOO"
    fnt = font(110)
    img = Image.new("RGBA", (1080, 420), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    colors = [
        (255, 255, 0, 255),
        (255, 80, 200, 255),
        (80, 255, 255, 255),
        (255, 120, 40, 255),
    ]
    for i, color in enumerate(colors):
        y = 20 + i * 90
        x = 40 + (i % 2) * 30
        draw_text_outline(d, (x, y), text[: 6 + i * 2], color, (0, 0, 0, 255), fnt, width=6)
    img.save(path)


def write_wav(path: Path, samples: list[float], rate: int = 44100) -> None:
    with wave.open(str(path), "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(rate)
        frames = b"".join(struct.pack("<h", max(-32767, min(32767, int(s * 32767)))) for s in samples)
        wf.writeframes(frames)


def tone(freq: float, dur: float, vol: float = 0.35, rate: int = 44100, attack: float = 0.02) -> list[float]:
    n = int(rate * dur)
    out = []
    for i in range(n):
        t = i / rate
        env = 1.0
        if t < attack:
            env = t / attack
        if t > dur - attack:
            env = max(0.0, (dur - t) / attack)
        out.append(math.sin(2 * math.pi * freq * t) * vol * env)
    return out


def noise_burst(dur: float, vol: float = 0.25, rate: int = 44100) -> list[float]:
    # Deterministic pseudo-noise
    n = int(rate * dur)
    out = []
    state = 1234567
    for i in range(n):
        state = (1103515245 * state + 12345) & 0x7FFFFFFF
        v = ((state / 0x7FFFFFFF) * 2 - 1) * vol
        t = i / rate
        env = math.exp(-6 * t / max(dur, 1e-6))
        out.append(v * env)
    return out


def whoosh(dur: float = 0.35, rate: int = 44100) -> list[float]:
    n = int(rate * dur)
    out = []
    state = 99
    for i in range(n):
        state = (1103515245 * state + 12345) & 0x7FFFFFFF
        noise = ((state / 0x7FFFFFFF) * 2 - 1)
        t = i / rate
        # Rising band feel via amplitude envelope + highpass-ish mix
        env = (t / dur) ** 0.6 * (1 - t / dur) ** 0.2
        out.append(noise * 0.4 * env)
    return out


def wooo_vox(dur: float = 1.4, rate: int = 44100) -> list[float]:
    """Synthetic meme WOOOO (rising pitch vibrato)."""
    n = int(rate * dur)
    out = []
    for i in range(n):
        t = i / rate
        # Pitch climb 220 -> 520
        freq = 220 + 300 * (t / dur) + 18 * math.sin(2 * math.pi * 7 * t)
        env = min(1.0, t * 8) * (1 - (t / dur) ** 2)
        # Add harmonics for yell character
        s = (
            0.55 * math.sin(2 * math.pi * freq * t)
            + 0.25 * math.sin(2 * math.pi * freq * 2 * t)
            + 0.12 * math.sin(2 * math.pi * freq * 3 * t)
        )
        out.append(s * 0.55 * env)
    return out


def bass_hit(rate: int = 44100) -> list[float]:
    n = int(rate * 0.28)
    out = []
    for i in range(n):
        t = i / rate
        freq = 140 * math.exp(-10 * t)
        env = math.exp(-8 * t)
        out.append(math.sin(2 * math.pi * freq * t) * 0.7 * env)
    return out


def concat(parts: list[list[float]]) -> list[float]:
    out: list[float] = []
    for p in parts:
        out.extend(p)
    return out


def mix_at(base: list[float], overlay: list[float], at: float, rate: int = 44100) -> list[float]:
    start = int(at * rate)
    end = start + len(overlay)
    if end > len(base):
        base.extend([0.0] * (end - len(base)))
    for i, s in enumerate(overlay):
        base[start + i] = max(-1.0, min(1.0, base[start + i] + s))
    return base


def silence(dur: float, rate: int = 44100) -> list[float]:
    return [0.0] * int(rate * dur)


def main() -> None:
    make_glowing_cat(ASSETS / "glow_cat.png")
    make_screaming_cat(ASSETS / "scream_cat.png")
    make_woooo_stack(ASSETS / "woooo_stack.png")

    banners = {
        "hook_wait.png": ("WAIT FOR IT...", (255, 255, 80, 255)),
        "hook_stare.png": ("this cat stared back 😭", (255, 255, 255, 255)),
        "hook_sentient.png": ("POV: painting gains sentience", (255, 240, 255, 255)),
        "hook_rate.png": ("rate this chaotic cat 1-10", (255, 255, 255, 255)),
        "hook_watch.png": ("watch till the END 👀", (255, 255, 120, 255)),
        "hook_glitch.png": ("bro the eyes are GLOWING", (120, 255, 255, 255)),
        "cta_follow.png": ("follow for more studio chaos", (255, 255, 255, 255)),
    }
    for name, (text, color) in banners.items():
        make_text_banner(text, ASSETS / name, color=color, size=78 if len(text) > 22 else 92)

    # SFX packs for 8s reels
    # Reel 1: hook punch + whoosh + WOOO + hit
    bed = silence(8.0)
    mix_at(bed, bass_hit(), 0.05)
    mix_at(bed, whoosh(0.3), 1.4)
    mix_at(bed, tone(880, 0.08, 0.2), 2.6)
    mix_at(bed, whoosh(0.25), 3.8)
    mix_at(bed, wooo_vox(1.6), 4.2)
    mix_at(bed, bass_hit(), 4.3)
    mix_at(bed, noise_burst(0.15, 0.2), 6.8)
    write_wav(SFX / "reel1_hook.wav", bed)

    bed2 = silence(8.0)
    mix_at(bed2, whoosh(0.28), 0.0)
    mix_at(bed2, tone(660, 0.06, 0.18), 1.0)
    mix_at(bed2, tone(880, 0.06, 0.18), 2.0)
    mix_at(bed2, tone(990, 0.06, 0.18), 3.0)
    mix_at(bed2, bass_hit(), 4.0)
    mix_at(bed2, wooo_vox(1.8), 5.0)
    write_wav(SFX / "reel2_speedrun.wav", bed2)

    bed3 = silence(8.0)
    mix_at(bed3, bass_hit(), 0.0)
    mix_at(bed3, wooo_vox(1.2), 0.15)
    mix_at(bed3, whoosh(0.3), 2.5)
    mix_at(bed3, tone(520, 0.1, 0.2), 4.0)
    mix_at(bed3, wooo_vox(1.5), 5.5)
    write_wav(SFX / "reel3_meme.wav", bed3)

    bed4 = silence(8.0)
    for i, f in enumerate([440, 554, 659, 880]):
        mix_at(bed4, tone(f, 0.12, 0.22), 0.2 + i * 0.35)
    mix_at(bed4, whoosh(0.35), 2.2)
    mix_at(bed4, bass_hit(), 4.5)
    mix_at(bed4, wooo_vox(1.4), 5.8)
    write_wav(SFX / "reel4_reveal.wav", bed4)

    print("Assets ready in", ASSETS)
    print("SFX ready in", SFX)


if __name__ == "__main__":
    main()
