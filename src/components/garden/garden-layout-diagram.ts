export const GARDEN_DIAGRAM_GRID_STEP_CM = 10;
export const GARDEN_DIAGRAM_MAX_MARKER_DIAMETER_CM = 9.5;
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
  cropId?: string;
  row?: number;
  column?: number;
}

export interface GardenDiagramCropCount {
  cropId: string;
  count: number;
}

export interface GardenDiagramMarker<TPosition extends GardenDiagramPosition> {
  /** Present for individual markers; aggregates keep their source positions in `positions`. */
  position?: TPosition;
  positions: readonly TPosition[];
  cropCounts: readonly GardenDiagramCropCount[];
  center: GardenDiagramPosition;
  diameterCm: number;
}

export interface GardenDiagramProjection<TPosition extends GardenDiagramPosition> {
  gridStepCm: number;
  viewBox: {
    xCm: number;
    yCm: number;
    widthCm: number;
    heightCm: number;
  };
  xGridLinesCm: readonly number[];
  yGridLinesCm: readonly number[];
  markers: readonly GardenDiagramMarker<TPosition>[];
}

export type GardenDiagramProjectionMode = "overview" | "detail";
const GARDEN_DIAGRAM_OVERVIEW_CELL_PIXELS = 48;
const GARDEN_DIAGRAM_OVERVIEW_WIDTH_PIXELS = 720;

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
      Math.min(GARDEN_DIAGRAM_MAX_MARKER_DIAMETER_CM, nearestDistanceCm * 0.82),
    );
  });
}

/** Uses one SVG user unit per centimeter and leaves every plotted center at its source coordinates. */
export function createGardenDiagramProjection<TPosition extends GardenDiagramPosition>(
  space: GardenDiagramSpace,
  positions: readonly TPosition[],
  mode: GardenDiagramProjectionMode = "detail",
  overviewCellSizeCm?: number,
  maxOverviewMarkers?: number,
): GardenDiagramProjection<TPosition> {
  const stepCm = gridStepCm(space);
  const viewBox = {
    xCm: -GARDEN_DIAGRAM_EDGE_PADDING_CM,
    yCm: -GARDEN_DIAGRAM_EDGE_PADDING_CM,
    widthCm: space.widthCm + GARDEN_DIAGRAM_EDGE_PADDING_CM * 2,
    heightCm: space.lengthCm + GARDEN_DIAGRAM_EDGE_PADDING_CM * 2,
  };
  let markerPositions: {
    position?: TPosition;
    positions: TPosition[];
    center: GardenDiagramPosition;
    cropCounts: GardenDiagramCropCount[];
    minimumDiameterCm?: number;
  }[];

  if (mode === "detail") {
    markerPositions = positions.map((position) => ({
      position,
      positions: [position],
      center: { xCm: position.xCm, yCm: position.yCm },
      cropCounts: [{ cropId: position.cropId ?? "", count: 1 }],
    }));
  } else {
    let cellCm =
      overviewCellSizeCm ??
      (viewBox.widthCm / GARDEN_DIAGRAM_OVERVIEW_WIDTH_PIXELS) * GARDEN_DIAGRAM_OVERVIEW_CELL_PIXELS;
    const buildCells = (sizeCm: number) => {
      const result = new Map<string, { x: number; y: number; positions: TPosition[] }>();
      for (const position of positions) {
        const x = Math.floor(position.xCm / sizeCm);
        const y = Math.floor(position.yCm / sizeCm);
        const key = `${x}:${y}`;
        const cell = result.get(key) ?? { x, y, positions: [] };
        cell.positions.push(position);
        result.set(key, cell);
      }
      return result;
    };
    let cells = buildCells(cellCm);
    for (
      let attempt = 0;
      maxOverviewMarkers !== undefined && cells.size > maxOverviewMarkers && attempt < 8;
      attempt += 1
    ) {
      cellCm *= 1.5;
      cells = buildCells(cellCm);
    }
    markerPositions = [...cells.values()].map(({ x, y, positions: items }) => {
      const cropCounts = new Map<string, number>();
      for (const item of items) {
        const cropId = item.cropId ?? "";
        cropCounts.set(cropId, (cropCounts.get(cropId) ?? 0) + 1);
      }
      const edgePaddingCm = Math.min(cellCm * 0.4, space.widthCm / 2);
      const lengthPaddingCm = Math.min(cellCm * 0.4, space.lengthCm / 2);
      const center =
        items.length === 1
          ? { xCm: items[0]?.xCm ?? 0, yCm: items[0]?.yCm ?? 0 }
          : {
              xCm: Math.max(edgePaddingCm, Math.min(space.widthCm - edgePaddingCm, (x + 0.5) * cellCm)),
              yCm: Math.max(lengthPaddingCm, Math.min(space.lengthCm - lengthPaddingCm, (y + 0.5) * cellCm)),
            };
      return {
        position: items.length === 1 ? items[0] : undefined,
        positions: items,
        center,
        cropCounts: [...cropCounts].map(([cropId, count]) => ({ cropId, count })),
        minimumDiameterCm: items.length > 1 ? cellCm * 0.72 : undefined,
      };
    });
  }
  const diameters = markerDiameters(markerPositions.map(({ center }) => center));

  return {
    gridStepCm: stepCm,
    viewBox,
    xGridLinesCm: gridLines(space.widthCm, stepCm),
    yGridLinesCm: gridLines(space.lengthCm, stepCm),
    markers: markerPositions.map((marker, index) => ({
      position: marker.position,
      positions: marker.positions,
      cropCounts: marker.cropCounts,
      center: marker.center,
      diameterCm: Math.max(diameters[index] ?? GARDEN_DIAGRAM_MAX_MARKER_DIAMETER_CM, marker.minimumDiameterCm ?? 0),
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
