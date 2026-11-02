/* Read-only geometry queries for illustration tracing, not authoritative world topology. */
(() => {
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

  function pointToSegmentDistance(point, start, end) {
    const dx = end[0] - start[0], dy = end[1] - start[1];
    const lengthSquared = dx * dx + dy * dy;
    if (!lengthSquared) return distance(point, start);
    const t = clamp(((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / lengthSquared, 0, 1);
    return distance(point, [start[0] + t * dx, start[1] + t * dy]);
  }

  function distanceToFeature(point, feature) {
    if (feature.point) return distance(point, feature.point);
    if (!feature.points?.length) return Infinity;
    if (feature.points.length === 1) return distance(point, feature.points[0]);
    let nearest = Infinity;
    for (let index = 1; index < feature.points.length; index++) {
      nearest = Math.min(nearest, pointToSegmentDistance(point, feature.points[index - 1], feature.points[index]));
    }
    return nearest;
  }

  function gridFor(data, id) {
    return data?.grids?.find(item => item.id === id) || null;
  }

  function cellAt(data, id, imageX, imageY) {
    const grid = gridFor(data, id);
    const ref = data?.source?.referenceSize;
    if (!grid || !ref || !Number.isFinite(imageX) || !Number.isFinite(imageY)) return null;
    const { width, height } = ref;
    if (!(width > 0 && height > 0 && grid.cols > 0 && grid.rows > 0)) return null;
    const col = clamp(Math.floor(imageX / width * grid.cols), 0, grid.cols - 1);
    const row = clamp(Math.floor(imageY / height * grid.rows), 0, grid.rows - 1);
    const bounds = {
      x: col * width / grid.cols, y: row * height / grid.rows,
      width: width / grid.cols, height: height / grid.rows
    };
    const center = [bounds.x + bounds.width / 2, bounds.y + bounds.height / 2];
    const halfDiagonal = Math.hypot(bounds.width, bounds.height) / 2;
    // Candidate proximity is for editor review, NOT terrain classification.
    const candidates = (data.features || [])
      .filter(feature => distanceToFeature(center, feature) <= (feature.radiusPx || 0) + halfDiagonal)
      .map(feature => ({
        id: feature.id, type: feature.type, label: feature.label,
        proximityPx: Math.round(distanceToFeature(center, feature) * 10) / 10
      }))
      .sort((a, b) => a.proximityPx - b.proximityPx);
    return { gridId: grid.id, col, row, bounds, center, candidates };
  }

  function getAnchor(data, id) {
    return data?.placeAnchors?.find(anchor => anchor.id === id) || null;
  }

  globalThis.WorldSpatialPrototype = Object.freeze({
    gridFor, cellAt, getAnchor, distanceToFeature, pointToSegmentDistance
  });
})();
