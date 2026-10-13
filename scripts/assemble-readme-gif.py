"""Assemble labeled GIFs from capture-readme-media.cjs browser frames.

Usage: python scripts/assemble-readme-gif.py
Requires Pillow. This assembles real UI frames; it does not simulate PC input.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "tmp" / "readme-media"
DESTINATION = ROOT / "docs" / "assets" / "readme-demo.gif"


def main():
    try:
        font = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 16)
    except OSError:
        font = ImageFont.load_default(size=16)
    frames = []
    durations = []
    for name, caption, expected in [
        ("move", "One finger: move the pointer", 27),
        ("scroll", "Two fingers: scroll up or down", 32),
    ]:
        paths = sorted(SOURCE.glob(f"{name}-[0-9][0-9][0-9].png"))
        if len(paths) != expected:
            raise SystemExit(f"Expected {expected} {name} frames; found {len(paths)}. Run the capture script first.")
        for index, path in enumerate(paths):
            with Image.open(path) as source:
                source = source.convert("RGB")
                frame = Image.new("RGB", (source.width, source.height + 64), "#080a0e")
                frame.paste(source, (0, 64))
                draw = ImageDraw.Draw(frame)
                draw.text((16, 8), "Simulated gesture guide", font=font, fill="#a4b0bd")
                draw.text((16, 32), caption, font=font, fill="#ffffff")
                frames.append(frame)
                durations.append(600 if index in (0, len(paths) - 1) else 100)
    # A shared palette prevents stationary interface elements from flickering.
    samples = Image.new("RGB", (frames[0].width * 4, frames[0].height))
    for column, index in enumerate([0, 13, 27, 43]):
        samples.paste(frames[index], (column * frames[0].width, 0))
    palette = samples.quantize(colors=128)
    indexed = [frame.quantize(palette=palette, dither=Image.Dither.NONE) for frame in frames]
    DESTINATION.parent.mkdir(parents=True, exist_ok=True)
    indexed[0].save(DESTINATION, save_all=True, append_images=indexed[1:],
                    duration=durations, loop=0, optimize=True, disposal=1)
    print(f"Created {DESTINATION.relative_to(ROOT)}: {len(frames)} frames, {sum(durations) / 1000:.1f}s, {DESTINATION.stat().st_size:,} bytes.")


if __name__ == "__main__":
    main()
