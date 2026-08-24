from pathlib import Path

from PIL import Image
from rembg import remove


def main() -> None:
    src = Path("images/Logo.png")
    dst = Path("images/Logo-header-transparent.png")

    img = Image.open(src).convert("RGBA")
    result = remove(img)
    result.save(dst)
    print(dst)


if __name__ == "__main__":
    main()

