#!/usr/bin/env python3
"""Validate editable icon assets with the Python standard library only.
Run from any working directory: python3 tools/validate_icons.py
This checks file structure, not Safari behavior or visual comprehension.
"""
from pathlib import Path
import hashlib
import json
import re
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ICONS = ROOT / "icons"
SVG = "{http://www.w3.org/2000/svg}"
FORBIDDEN = {"script", "foreignObject", "image", "text", "style", "animate", "animateTransform"}


def check_tree(root: ET.Element, name: str) -> None:
    for el in root.iter():
        tag = el.tag.rsplit("}", 1)[-1]
        assert tag not in FORBIDDEN, f"{name}: forbidden element {tag}"
        for key, value in el.attrib.items():
            assert not key.lower().startswith("on"), f"{name}: event attribute"
            assert "javascript:" not in value.lower(), f"{name}: unsafe URL"
            if key.endswith("href"):
                assert value.startswith("#"), f"{name}: external reference"
            assert "url(" not in value.lower(), f"{name}: external/paint-server dependency"


def main() -> int:
    manifest = json.loads((ICONS / "manifest.json").read_text(encoding="utf-8"))
    entries = manifest["icons"]
    assert len(entries) == manifest["svg_file_count"] == 16
    assert len({a["base_id"] for a in entries}) == manifest["base_icon_count"] == 15
    assert len({a["id"] for a in entries}) == 16
    sprite = ET.parse(ICONS / manifest["sprite"]).getroot()
    check_tree(sprite, "sprite.svg")
    symbols = sprite.findall(f"{SVG}defs/{SVG}symbol")
    ids = [el.attrib["id"] for el in symbols]
    assert len(ids) == len(set(ids)) == manifest["sprite_symbol_count"] == 16
    symbol_map = dict(zip(ids, symbols))
    frames = []
    for asset in entries:
        rel = Path(asset["path"])
        assert not rel.is_absolute() and ".." not in rel.parts
        raw = (ICONS / rel).read_bytes()
        assert hashlib.sha256(raw).hexdigest() == asset["sha256"], f"{rel}: hash mismatch"
        root = ET.fromstring(raw)
        check_tree(root, str(rel))
        expected = " ".join(str(n) for n in asset["viewBox"])
        assert root.attrib["viewBox"] == expected
        assert root.tag == SVG + "svg"
        if asset["family"] in {"ui", "status"}:
            assert b"currentColor" in raw
        symbol = symbol_map[asset["id"]]
        assert symbol.attrib["viewBox"] == expected
        # Children must be identical in individual files and sprite symbols.
        assert [ET.tostring(el) for el in root] == [ET.tostring(el) for el in symbol]
        if asset["base_id"] == "world-gate":
            frames.append(root.find(f".//{SVG}g[@data-part='frame']"))
    assert len(frames) == 2 and all(el is not None for el in frames)
    assert ET.tostring(frames[0]) == ET.tostring(frames[1]), "Gate frame changed across states"
    preview = (ICONS / "preview.html").read_text(encoding="utf-8")
    used = set(re.findall(r"sprite\.svg#([a-z0-9-]+)", preview))
    assert used == set(ids), "Preview missing an icon or using an unknown ID"
    for path in ("preview.css", "preview.js", "README.md"):
        assert (ICONS / path).is_file(), f"Missing preview dependency: {path}"
    assert manifest["runtime_integrated"] is False
    assert manifest["iphone_validated"] is False
    print("PASS: 15 base icons, 16 standalone SVGs, 16 matching sprite symbols.")
    print("PASS: hashes, viewBoxes, currentColor, safe self-contained SVGs, identical gate frame, preview coverage.")
    print("NOT TESTED: live game integration, gameplay regression, iPhone/Safari, user visual approval.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (AssertionError, OSError, ValueError, ET.ParseError) as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        sys.exit(1)
