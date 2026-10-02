export const GARDEN_DIAGRAM_GRID_STEP_CM = 10;
export const GARDEN_DIAGRAM_MAX_MARKER_DIAMETER_CM = 5.5;
export const GARDEN_DIAGRAM_ZOOM_PIXELS_PER_CM = 8;
const GARDEN_DIAGRAM_MAX_GRID_LINES_PER_AXIS = 100;
const GARDEN_DIAGRAM_MIN_MARKER_DIAMETER_CM = 0.8;
const GARDEN_DIAGRAM_EDGE_PADDING_CM = GARDEN_DIAGRAM_MAX_MARKER_DIAMETER_CM / 2 + 0.5;

export interface GardenDiagramSpace {
  widthCm: number;
  lengthCm: number;
}

export interface GardenDiagramPosition {
  xCm: number;
  yCm: number;
}

export interface GardenDiagramProjection<TPosition extends GardenDiagramPosition> {
  viewBox: {
    xCm: number;
    yCm: number;
    widthCm: number;
    heightCm: number;
  };
  xGridLinesCm: readonly number[];
  yGridLinesCm: readonly number[];
  markers: readonly {
    position: TPosition;
    center: GardenDiagramPosition;
    diameterCm: number;
  }[];
}

function gridStepCm(space: GardenDiagramSpace): number {
  const maxExtentCm = Math.max(space.widthCm, space.lengthCm);
  const stepMultiple = Math.max(
    1,
    Math.ceil(maxExtentCm / (GARDEN_DIAGRAM_GRID_STEP_CM * GARDEN_DIAGRAM_MAX_GRID_LINES_PER_AXIS)),
  );

  return GARDEN_DIAGRAM_GRID_STEP_CM * stepMultiple;
}

function gridLines(extentCm: number, stepCm: number): number[] {
  const lines: number[] = [];
  for (let coordinateCm = stepCm; coordinateCm < extentCm; coordinateCm += stepCm) {
    lines.push(coordinateCm);
  }
  return lines;
}

function markerDiameters(positions: readonly GardenDiagramPosition[]): number[] {
  const buckets = new Map<string, number[]>();
  const bucketCoordinates = positions.map((position) => ({
    x: Math.floor(position.xCm / GARDEN_DIAGRAM_MAX_MARKER_DIAMETER_CM),
    y: Math.floor(position.yCm / GARDEN_DIAGRAM_MAX_MARKER_DIAMETER_CM),
  }));

  for (const [index, bucket] of bucketCoordinates.entries()) {
    const key = `${bucket.x}:${bucket.y}`;
    const items = buckets.get(key) ?? [];
    items.push(index);
    buckets.set(key, items);
  }

  return positions.map((position, index) => {
    const bucket = bucketCoordinates[index];
    let nearestDistanceCm = Number.POSITIVE_INFINITY;
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        const nearby = buckets.get(`${bucket.x + offsetX}:${bucket.y + offsetY}`) ?? [];
        for (const candidateIndex of nearby) {
          if (candidateIndex === index) continue;
          const candidate = positions[candidateIndex];
          nearestDistanceCm = Math.min(
            nearestDistanceCm,
            Math.hypot(position.xCm - candidate.xCm, position.yCm - candidate.yCm),
          );
        }
      }
    }

    if (!Number.isFinite(nearestDistanceCm)) return GARDEN_DIAGRAM_MAX_MARKER_DIAMETER_CM;
    return Math.max(
      GARDEN_DIAGRAM_MIN_MARKER_DIAMETER_CM,
      Math.min(GARDEN_DIAGRAM_MAX_MARKER_DIAMETER_CM, nearestDistanceCm * 0.72),
    );
  });
}

/** Uses one SVG user unit per centimeter and leaves every plotted center at its source coordinates. */
export function createGardenDiagramProjection<TPosition extends GardenDiagramPosition>(
  space: GardenDiagramSpace,
  positions: readonly TPosition[],
): GardenDiagramProjection<TPosition> {
  const diameters = markerDiameters(positions);
  const stepCm = gridStepCm(space);

  return {
    viewBox: {
      xCm: -GARDEN_DIAGRAM_EDGE_PADDING_CM,
      yCm: -GARDEN_DIAGRAM_EDGE_PADDING_CM,
      widthCm: space.widthCm + GARDEN_DIAGRAM_EDGE_PADDING_CM * 2,
      heightCm: space.lengthCm + GARDEN_DIAGRAM_EDGE_PADDING_CM * 2,
    },
    xGridLinesCm: gridLines(space.widthCm, stepCm),
    yGridLinesCm: gridLines(space.lengthCm, stepCm),
    markers: positions.map((position, index) => ({
      position,
      center: { xCm: position.xCm, yCm: position.yCm },
      diameterCm: diameters[index] ?? GARDEN_DIAGRAM_MAX_MARKER_DIAMETER_CM,
    })),
  };
}

/** This ratio is used directly by the responsive SVG so both centimeter axes share one pixel scale. */
export function getGardenDiagramAspectRatio<TPosition extends GardenDiagramPosition>(
  projection: GardenDiagramProjection<TPosition>,
): number {
  return projection.viewBox.widthCm / projection.viewBox.heightCm;
}

/** Returns a scrollable zoom viewport size without changing the diagram's centimeter geometry. */
export function getGardenDiagramZoomDimensions<TPosition extends GardenDiagramPosition>(
  projection: GardenDiagramProjection<TPosition>,
): { widthPx: number; heightPx: number } {
  return {
    widthPx: projection.viewBox.widthCm * GARDEN_DIAGRAM_ZOOM_PIXELS_PER_CM,
    heightPx: projection.viewBox.heightCm * GARDEN_DIAGRAM_ZOOM_PIXELS_PER_CM,
  };
}
