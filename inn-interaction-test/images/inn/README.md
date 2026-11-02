# Inn room assets

- `room-v0.2/00.txt` ~ `02.txt`: text-free 640×960 WebP background encoded as base64 chunks for static GitHub Pages loading.
- `../../src/inn-room-hotspots.svg`: separate SVG interaction layer aligned to the 2:3 room background.
- `../../src/world-inn-runtime.js`: joins the raster chunks at runtime and injects the SVG layer above the image.

The room is viewed from the doorway. Visible vocabulary labels must stay out of the raster background so the same illustration can be reused while interaction labels and learning state change independently.

Current interactive objects are `床`, `桌子`, `椅子`, `箱子`, plus the doorway exit hotspot. The raster illustration is atmosphere; the SVG/HTML layers own interaction and text.
