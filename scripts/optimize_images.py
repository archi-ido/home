#!/usr/bin/env python3
"""portfolio/ 하위 jpg·jpeg·png 이미지를 리사이즈 후 webp로 변환하고 원본을 삭제한다.

- 짧은 변이 TARGET_SHORT(기본 1000px)를 넘으면 비율을 유지하며 축소
- 품질 QUALITY(기본 80)로 webp 저장

로컬에서도 `python3 scripts/optimize_images.py` 로 실행할 수 있고,
GitHub Action(.github/workflows/optimize-images.yml)에서 push 시 자동 실행된다.
content/ 의 로고 등은 대상이 아니며 portfolio/ 폴더만 처리한다.
"""
import os
import glob
from PIL import Image

TARGET_SHORT = 1000  # 짧은 변 기준 최대 픽셀 (넘을 때만 축소)
QUALITY = 80
ROOT = "portfolio"


def main():
    paths = []
    for ext in ("jpg", "jpeg", "png", "JPG", "JPEG", "PNG"):
        paths += glob.glob(f"{ROOT}/**/*.{ext}", recursive=True)
    paths = sorted(set(paths))

    if not paths:
        print("변환할 이미지가 없습니다. (이미 전부 webp)")
        return

    total_before = total_after = 0
    converted = 0
    for path in paths:
        try:
            im = Image.open(path)
            im.load()
        except Exception as e:  # 이미지가 아니거나 손상된 파일은 건너뛴다
            print(f"건너뜀(이미지 아님/손상): {path} ({e})")
            continue

        before = os.path.getsize(path)
        im = im.convert("RGB")
        w, h = im.size
        short = min(w, h)
        note = ""
        if short > TARGET_SHORT:
            scale = TARGET_SHORT / short
            neww, newh = round(w * scale), round(h * scale)
            im = im.resize((neww, newh), Image.LANCZOS)
            note = f"  ({w}x{h} -> {neww}x{newh})"

        out = os.path.splitext(path)[0] + ".webp"
        im.save(out, "webp", quality=QUALITY, method=6)
        after = os.path.getsize(out)
        os.remove(path)  # 원본 삭제

        total_before += before
        total_after += after
        converted += 1
        print(f"{path}: {before // 1024}K -> {after // 1024}K{note}")

    if total_before:
        pct = 100 - total_after * 100 // total_before
        print("-" * 50)
        print(f"총 {converted}장  {total_before // 1024}K -> {total_after // 1024}K  (약 {pct}% 감소)")


if __name__ == "__main__":
    main()
