import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { createGardenLayoutShortfallReport, type GardenLayoutResult } from "@/lib/garden-layout";
import { resolveGardenCropSelection } from "@/lib/garden-crop-selection";
import {
  CROP_ATLAS_HREF,
  CROP_ATLAS_VIEWBOX_HEIGHT,
  CROP_ATLAS_VIEWBOX_WIDTH,
  getCropAtlasCellViewBox,
  resolveCropThumbnailPresentation,
} from "./crop-thumbnail-manifest";
import {
  GARDEN_DIAGRAM_ZOOM_PIXELS_PER_CM,
  createGardenDiagramProjection,
  getGardenDiagramAspectRatio,
  getGardenDiagramZoomDimensions,
  type GardenDiagramCropCount,
  type GardenDiagramProjection,
} from "./garden-layout-diagram";

type GardenSpace = GardenLayoutResult["spaces"][number];
type GardenPosition = GardenSpace["positions"][number];

interface Props {
  plan: GardenLayoutResult;
  status: "current" | "stale" | "unknown";
  cropNames: Record<string, string>;
}

const CONFIDENCE_LABELS: Record<string, string> = {
  high: "wysoka",
  medium: "średnia",
  low: "niska",
};

const STAGE_LABELS: Record<string, string> = {
  sowing: "siew",
  thinning: "po przerywce",
  planting: "sadzenie",
  final_planting: "końcowa obsada",
  mixed: "mieszany etap",
};

const NEIGHBOR_STATUS_LABELS: Record<string, string> = {
  supported: "korzystne",
  caution: "ostrożność",
  negative: "negatywne",
  unknown: "brak potwierdzonej relacji",
};

const OMISSION_LABELS: Record<string, string> = {
  missing_spacing: "brak rozstawy w katalogu",
  unverified_spacing: "osie rozstawy nie są potwierdzone",
  invalid_spacing: "nieprawidłowa rozstawa",
  invalid_proportion: "nieprawidłowy udział",
  non_final_spacing: "dostępna jest tylko rozstawa siewu",
  no_fit: "nie znaleziono pasującego stanowiska",
  search_limit: "osiągnięto limit sprawdzania układu",
};

function formatPercentage(value: number): string {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

function formatDeviation(actual: number, target: number): string {
  const deviation = actual - target;
  const sign = deviation > 0 ? "+" : "";
  return `${sign}${formatPercentage(deviation)}`;
}

function formatMissingPositions(count: number): string {
  const lastTwoDigits = count % 100;
  if (count === 1) return "1 pozycja do dosadzenia";
  if (count % 10 >= 2 && count % 10 <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) {
    return String(count) + " pozycje do dosadzenia";
  }
  return String(count) + " pozycji do dosadzenia";
}

function cropFallbackEmoji(cropId: string, label: string): string {
  const key = `${cropId} ${label}`.toLocaleLowerCase("pl-PL");
  if (key.includes("pomidor")) return "🍅";
  if (key.includes("ogorek") || key.includes("ogórek")) return "🥒";
  if (key.includes("marchew")) return "🥕";
  if (key.includes("cebula") || key.includes("czosnek")) return "🧅";
  if (key.includes("fasola") || key.includes("groch") || key.includes("bób")) return "🫘";
  if (key.includes("burak") || key.includes("rzodkiew") || key.includes("rzepa")) return "🌱";
  if (key.includes("kapusta") || key.includes("sałata") || key.includes("jarmuż")) return "🥬";
  if (key.includes("brokuł") || key.includes("kalafior")) return "🥦";
  if (key.includes("papryka")) return "🫑";
  if (key.includes("kukurydza")) return "🌽";
  if (key.includes("ziemniak")) return "🥔";
  if (key.includes("dynia") || key.includes("cukinia")) return "🎃";
  if (key.includes("koper") || key.includes("pietruszka") || key.includes("szpinak")) return "🌿";
  return "🌱";
}

function cropName(cropId: string, cropNames: Record<string, string>): string {
  return cropNames[cropId] ?? resolveGardenCropSelection(cropId).displayName;
}

function CropAtlasGlyph({
  cropId,
  code,
  fallbackLabel = code,
  size,
  x,
  y,
}: {
  cropId: string;
  code: string;
  fallbackLabel?: string;
  size: number;
  x?: number;
  y?: number;
}) {
  const presentation = resolveCropThumbnailPresentation(cropId, fallbackLabel);
  const [atlasFailed, setAtlasFailed] = useState(false);

  return (
    <svg x={x} y={y} width={size} height={size} viewBox="-50 -50 100 100" aria-hidden="true" focusable="false">
      {presentation.kind === "atlas" && !atlasFailed && (
        <svg
          x="-40"
          y="-45"
          width="80"
          height="70"
          viewBox={getCropAtlasCellViewBox(presentation.cell)}
          preserveAspectRatio="xMidYMid meet"
          overflow="hidden"
        >
          <image
            ref={(image) => {
              if (image === null) return;
              image.addEventListener(
                "error",
                () => {
                  setAtlasFailed(true);
                },
                { once: true },
              );
            }}
            href={CROP_ATLAS_HREF}
            x="0"
            y="0"
            width={CROP_ATLAS_VIEWBOX_WIDTH}
            height={CROP_ATLAS_VIEWBOX_HEIGHT}
            preserveAspectRatio="xMidYMid meet"
          />
        </svg>
      )}
      {(presentation.kind === "text" || atlasFailed) && (
        <text x="0" y="34" textAnchor="middle" fontSize="76" role="img" aria-label={presentation.fallbackLabel}>
          {cropFallbackEmoji(cropId, presentation.fallbackLabel)}
        </text>
      )}
    </svg>
  );
}

interface GardenSpaceDiagramProps {
  space: GardenSpace["space"];
  positions: GardenSpace["positions"];
  projection: GardenDiagramProjection<GardenPosition>;
  cropCodes: Map<string, string>;
  cropNames: Record<string, string>;
  minMarkerSizeCm?: number;
  className?: string;
  style?: CSSProperties;
  onMarkerSelect?: (details: {
    cropCounts: readonly GardenDiagramCropCount[];
    position?: GardenPosition;
    clientX: number;
    clientY: number;
  }) => void;
}

function GardenSpaceDiagram({
  space,
  positions,
  projection,
  cropCodes,
  cropNames,
  minMarkerSizeCm = 0,
  className = "text-garden-muted block h-auto w-full",
  style,
  onMarkerSelect,
}: GardenSpaceDiagramProps) {
  const viewBox = projection.viewBox;
  const soilPatternId = `garden-soil-${useId().replaceAll(":", "")}`;

  return (
    <svg
      role="group"
      aria-label={`Diagram ${space.name ?? "przestrzeni"} w skali centymetrowej`}
      viewBox={`${viewBox.xCm} ${viewBox.yCm} ${viewBox.widthCm} ${viewBox.heightCm}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
      style={{ aspectRatio: getGardenDiagramAspectRatio(projection), ...style }}
    >
      <defs>
        <pattern id={soilPatternId} width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="2" r="0.28" className="fill-garden-bed-soil-texture opacity-35" />
          <circle cx="6" cy="6" r="0.2" className="fill-garden-bed-soil-texture opacity-25" />
        </pattern>
      </defs>
      <rect
        x="-2.2"
        y="-2.2"
        width={space.widthCm + 4.4}
        height={space.lengthCm + 4.4}
        rx="1.1"
        className="fill-garden-bed-frame-shadow"
      />
      <rect
        x="-2"
        y="-2"
        width={space.widthCm + 4}
        height={space.lengthCm + 4}
        rx="1"
        className="fill-garden-bed-frame"
      />
      <rect
        x="-1.3"
        y="-1.3"
        width={space.widthCm + 2.6}
        height={space.lengthCm + 2.6}
        rx="0.7"
        className="fill-garden-bed-frame-highlight"
      />
      <rect x="0" y="0" width={space.widthCm} height={space.lengthCm} className="fill-garden-bed-soil" />
      <rect
        x="0"
        y="0"
        width={space.widthCm}
        height={space.lengthCm}
        fill={`url(#${soilPatternId})`}
        aria-hidden="true"
      />
      {projection.xGridLinesCm.map((xCm) => (
        <line
          key={`grid-x-${xCm}`}
          x1={xCm}
          y1="0"
          x2={xCm}
          y2={space.lengthCm}
          className="stroke-garden-bed-soil-texture opacity-15"
          strokeWidth="0.12"
          aria-hidden="true"
        />
      ))}
      {projection.yGridLinesCm.map((yCm) => (
        <line
          key={`grid-y-${yCm}`}
          x1="0"
          y1={yCm}
          x2={space.widthCm}
          y2={yCm}
          className="stroke-garden-bed-soil-texture opacity-15"
          strokeWidth="0.12"
          aria-hidden="true"
        />
      ))}
      {projection.markers.map(({ position, positions: groupedPositions, cropCounts, center, diameterCm }) => {
        if (position === undefined) {
          const cropLabels = cropCounts
            .map(({ cropId, count }) => `${cropName(cropId, cropNames)}: ${count}`)
            .join(", ");
          const label = `${groupedPositions.length} roślin w skupisku. ${cropLabels}`;
          const visibleCrops = [...cropCounts].sort((left, right) => right.count - left.count).slice(0, 3);
          const markerSize = Math.max(Math.min(diameterCm * 0.72, 7), 3.4, minMarkerSizeCm);
          const markerGap = markerSize * 0.08;
          const markerWidth = visibleCrops.length * markerSize + Math.max(0, visibleCrops.length - 1) * markerGap;
          const countLabel = `+${groupedPositions.length}`;
          const badgeWidth = markerSize * (0.72 + countLabel.length * 0.35);
          const badgeHeight = markerSize * 0.72;
          const clusterWidth = markerWidth + markerGap + badgeWidth;
          return (
            <g
              key={`aggregate-${groupedPositions.map(({ cropId, row, column }) => `${cropId}-${row}-${column}`).join("_")}`}
              data-garden-marker="true"
              role="button"
              tabIndex={0}
              className="focus-visible:outline-garden-focus cursor-pointer focus-visible:outline-2"
              aria-label={label}
              transform={`translate(${center.xCm} ${center.yCm})`}
              onClick={(event) => onMarkerSelect?.({ cropCounts, clientX: event.clientX, clientY: event.clientY })}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                onMarkerSelect?.({ cropCounts, clientX: 0, clientY: 0 });
              }}
            >
              <title>{label}</title>
              {visibleCrops.map((crop, index) => (
                <CropAtlasGlyph
                  key={crop.cropId}
                  cropId={crop.cropId}
                  code={cropCodes.get(crop.cropId) ?? "?"}
                  fallbackLabel={cropName(crop.cropId, cropNames)}
                  size={markerSize}
                  x={-clusterWidth / 2 + index * (markerSize + markerGap)}
                  y={-markerSize / 2}
                />
              ))}
              <g aria-hidden="true" transform={`translate(${clusterWidth / 2 - badgeWidth} ${-badgeHeight / 2})`}>
                <rect
                  width={badgeWidth}
                  height={badgeHeight}
                  rx={badgeHeight / 2}
                  className="fill-garden-surface stroke-app-border"
                  strokeWidth={Math.max(0.12, markerSize * 0.035)}
                />
                <text
                  x={badgeWidth / 2}
                  y={badgeHeight / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-garden-foreground"
                  fontSize={markerSize * 0.48}
                  fontWeight="600"
                >
                  {countLabel}
                </text>
              </g>
            </g>
          );
        }
        const code = cropCodes.get(position.cropId) ?? "?";
        const name = cropName(position.cropId, cropNames);
        const label = `${name}, pozycja ${position.row + 1}, ${position.column + 1}, ${position.xCm} × ${position.yCm} cm`;
        const markerSize = Math.max(diameterCm, minMarkerSizeCm);

        return (
          <g
            key={`${position.cropId}-${position.row}-${position.column}`}
            data-garden-marker="true"
            role="button"
            tabIndex={0}
            className="focus-visible:outline-garden-focus cursor-pointer focus-visible:outline-2"
            aria-label={`${code} · ${label}`}
            transform={`translate(${center.xCm} ${center.yCm})`}
            onClick={(event) =>
              onMarkerSelect?.({
                cropCounts: [{ cropId: position.cropId, count: 1 }],
                position,
                clientX: event.clientX,
                clientY: event.clientY,
              })
            }
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              onMarkerSelect?.({
                cropCounts: [{ cropId: position.cropId, count: 1 }],
                position,
                clientX: 0,
                clientY: 0,
              });
            }}
          >
            <title>{`${code} · ${label}`}</title>
            <CropAtlasGlyph
              cropId={position.cropId}
              code={code}
              fallbackLabel={name}
              size={markerSize}
              x={-markerSize / 2}
              y={-markerSize / 2}
            />
          </g>
        );
      })}
      {positions.length === 0 && (
        <text
          x={space.widthCm / 2}
          y={space.lengthCm / 2}
          textAnchor="middle"
          className="fill-garden-muted/70"
          fontSize="5"
        >
          Brak wyznaczonych pozycji
        </text>
      )}
    </svg>
  );
}

function GardenSpaceDiagramViewer({
  space,
  positions,
  cropCodes,
  cropNames,
}: {
  space: GardenSpace["space"];
  positions: GardenSpace["positions"];
  cropCodes: Map<string, string>;
  cropNames: Record<string, string>;
}) {
  const [selectedMarker, setSelectedMarker] = useState<{
    cropCounts: readonly GardenDiagramCropCount[];
    position?: GardenPosition;
    anchor: { x: number; y: number };
  } | null>(null);
  const [pixelsPerCm, setPixelsPerCm] = useState(1);
  const [fitPixelsPerCm, setFitPixelsPerCm] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const pixelsPerCmRef = useRef(1);
  const fitPixelsPerCmRef = useRef(1);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const dragPointerRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const pinchStartRef = useRef<{ distance: number; zoom: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const canvasFrameRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const [viewportRect, setViewportRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const pendingZoomAnchorRef = useRef<{ contentX: number; contentY: number; x: number; y: number } | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const projection = createGardenDiagramProjection(space, positions, "overview");
  const emptyDetailProjection = createGardenDiagramProjection(space, [], "detail");
  const zoomFactor = pixelsPerCm / Math.max(fitPixelsPerCm, 0.001);
  const visiblePositions = useMemo(() => {
    if (!viewportRect) return [];
    const marginCm = Math.max(6, 40 / zoomFactor);
    const minXCm = viewportRect.left / pixelsPerCm + emptyDetailProjection.viewBox.xCm - marginCm;
    const maxXCm =
      (viewportRect.left + viewportRect.width) / pixelsPerCm + emptyDetailProjection.viewBox.xCm + marginCm;
    const minYCm = viewportRect.top / pixelsPerCm + emptyDetailProjection.viewBox.yCm - marginCm;
    const maxYCm =
      (viewportRect.top + viewportRect.height) / pixelsPerCm + emptyDetailProjection.viewBox.yCm + marginCm;
    return positions.filter(({ xCm, yCm }) => xCm >= minXCm && xCm <= maxXCm && yCm >= minYCm && yCm <= maxYCm);
  }, [
    emptyDetailProjection.viewBox.xCm,
    emptyDetailProjection.viewBox.yCm,
    pixelsPerCm,
    positions,
    viewportRect,
    zoomFactor,
  ]);
  const dialogProjection = useMemo(() => {
    if (zoomFactor >= 2 && visiblePositions.length <= GARDEN_DIAGRAM_MAX_DETAIL_MARKERS) {
      return createGardenDiagramProjection(space, visiblePositions, "detail");
    }

    return createGardenDiagramProjection(space, visiblePositions, "overview", 32 / pixelsPerCm, 500);
  }, [pixelsPerCm, space, visiblePositions, zoomFactor]);
  const baseZoomDimensions = getGardenDiagramZoomDimensions(emptyDetailProjection);
  const zoomDimensions = {
    widthPx: (baseZoomDimensions.widthPx * pixelsPerCm) / GARDEN_DIAGRAM_ZOOM_PIXELS_PER_CM,
    heightPx: (baseZoomDimensions.heightPx * pixelsPerCm) / GARDEN_DIAGRAM_ZOOM_PIXELS_PER_CM,
  };
  const spaceName = space.name ?? "Przestrzeń działki";

  useEffect(() => {
    if (!isExpanded) return;

    const dialog = dialogRef.current;
    if (!dialog) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    dialog.querySelector<HTMLButtonElement>('[aria-label="Zamknij powiększony widok skrzyni"]')?.focus();

    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [isExpanded]);

  function zoomAt(nextPixelsPerCm: number, x?: number, y?: number) {
    const viewport = scrollViewportRef.current;
    if (!viewport) return;
    const currentPixelsPerCm = pixelsPerCmRef.current;
    const currentFitPixelsPerCm = fitPixelsPerCmRef.current;
    const boundedPixelsPerCm = Math.max(
      currentFitPixelsPerCm * 0.5,
      Math.min(currentFitPixelsPerCm * 8, nextPixelsPerCm),
    );
    if (boundedPixelsPerCm === currentPixelsPerCm) return;
    const anchorX = x ?? viewport.clientWidth / 2;
    const anchorY = y ?? viewport.clientHeight / 2;
    pendingZoomAnchorRef.current = {
      contentX: (viewport.scrollLeft + anchorX) / currentPixelsPerCm,
      contentY: (viewport.scrollTop + anchorY) / currentPixelsPerCm,
      x: anchorX,
      y: anchorY,
    };
    pixelsPerCmRef.current = boundedPixelsPerCm;
    setPixelsPerCm(boundedPixelsPerCm);
  }

  function getPointerDistance(points: { x: number; y: number }[]) {
    const [first, second] = points;
    return Math.hypot(second.x - first.x, second.y - first.y);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.target instanceof Element && event.target.closest('[data-garden-marker="true"]')) return;
    if (event.pointerType === "mouse" && event.button !== 0 && event.button !== 1) return;
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    const point = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    pointersRef.current.set(event.pointerId, point);
    event.currentTarget.setPointerCapture(event.pointerId);

    const points = [...pointersRef.current.values()];
    if (points.length >= 2) {
      dragPointerRef.current = null;
      setIsPanning(false);
      pinchStartRef.current = {
        distance: Math.max(1, getPointerDistance(points)),
        zoom: pixelsPerCmRef.current,
      };
    } else {
      dragPointerRef.current = { pointerId: event.pointerId, ...point };
      setIsPanning(true);
    }
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(event.pointerId)) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const point = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    pointersRef.current.set(event.pointerId, point);
    const points = [...pointersRef.current.values()];
    const viewport = scrollViewportRef.current;
    if (!viewport) return;

    if (points.length >= 2 && pinchStartRef.current) {
      const distance = getPointerDistance(points);
      const midpoint = {
        x: (points[0].x + points[1].x) / 2,
        y: (points[0].y + points[1].y) / 2,
      };
      zoomAt(pinchStartRef.current.zoom * (distance / pinchStartRef.current.distance), midpoint.x, midpoint.y);
      return;
    }

    const drag = dragPointerRef.current;
    if (drag?.pointerId !== event.pointerId) return;
    viewport.scrollTo({ left: viewport.scrollLeft - (point.x - drag.x), top: viewport.scrollTop - (point.y - drag.y) });
    dragPointerRef.current = { pointerId: event.pointerId, ...point };
  }

  function handlePointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(event.pointerId);
    pinchStartRef.current = null;
    const remaining = [...pointersRef.current.entries()];
    if (remaining.length > 0) {
      const [pointerId, point] = remaining[0];
      dragPointerRef.current = { pointerId, ...point };
      setIsPanning(true);
    } else {
      dragPointerRef.current = null;
      setIsPanning(false);
    }
  }

  function handleMarkerSelect(details: {
    cropCounts: readonly GardenDiagramCropCount[];
    position?: GardenPosition;
    clientX: number;
    clientY: number;
  }) {
    const viewport = scrollViewportRef.current;
    if (!viewport) return;
    const bounds = viewport.getBoundingClientRect();
    const hasPointerPosition = details.clientX > 0 || details.clientY > 0;
    setSelectedMarker({
      cropCounts: details.cropCounts,
      position: details.position,
      anchor: hasPointerPosition
        ? { x: details.clientX - bounds.left, y: details.clientY - bounds.top }
        : { x: viewport.clientWidth / 2, y: viewport.clientHeight / 2 },
    });
  }

  useEffect(() => {
    const viewport = scrollViewportRef.current;
    const frame = canvasFrameRef.current;
    const fitDiagram = () => {
      if (!viewport || !frame) return;
      const availableWidth = Math.max(1, frame.clientWidth - 80);
      const availableHeight = Math.max(1, frame.clientHeight - 24);
      const nextFit = Math.min(
        availableWidth / emptyDetailProjection.viewBox.widthCm,
        availableHeight / emptyDetailProjection.viewBox.heightCm,
      );
      fitPixelsPerCmRef.current = nextFit;
      pixelsPerCmRef.current = nextFit;
      setFitPixelsPerCm(nextFit);
      setPixelsPerCm(nextFit);
      viewport.scrollTo({ left: 0, top: 0 });
      setViewportRect({ left: 0, top: 0, width: viewport.clientWidth, height: viewport.clientHeight });
    };
    if (!viewport || !frame) return;
    fitDiagram();
    const observer = new ResizeObserver(fitDiagram);
    observer.observe(frame);

    return () => {
      observer.disconnect();
    };
  }, [emptyDetailProjection.viewBox.heightCm, emptyDetailProjection.viewBox.widthCm, isExpanded]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const viewport = scrollViewportRef.current;
      if (!viewport) return;
      const anchor = pendingZoomAnchorRef.current;
      if (anchor) {
        viewport.scrollTo({
          left: Math.max(0, anchor.contentX * pixelsPerCm - anchor.x),
          top: Math.max(0, anchor.contentY * pixelsPerCm - anchor.y),
        });
        pendingZoomAnchorRef.current = null;
      }
      setViewportRect({
        left: viewport.scrollLeft,
        top: viewport.scrollTop,
        width: viewport.clientWidth,
        height: viewport.clientHeight,
      });
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [pixelsPerCm]);

  const diagramFrame = (
    <div
      ref={canvasFrameRef}
      className={`border-app-border bg-garden-surface relative min-h-0 overflow-hidden rounded-xl border shadow-sm ${
        isExpanded ? "flex-1" : "h-72 sm:h-80 lg:h-96"
      }`}
    >
      <div
        ref={scrollViewportRef}
        tabIndex={0}
        aria-label={`Płótno diagramu ${spaceName}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onLostPointerCapture={handlePointerEnd}
        onContextMenu={(event) => {
          event.preventDefault();
        }}
        onScroll={(event) => {
          const viewport = event.currentTarget;
          setViewportRect({
            left: viewport.scrollLeft,
            top: viewport.scrollTop,
            width: viewport.clientWidth,
            height: viewport.clientHeight,
          });
        }}
        onWheel={(event) => {
          if (!event.ctrlKey && !event.metaKey) return;
          if (event.deltaY === 0) return;
          event.preventDefault();
          const bounds = event.currentTarget.getBoundingClientRect();
          const factor = Math.exp(-event.deltaY * 0.002);
          zoomAt(pixelsPerCmRef.current * factor, event.clientX - bounds.left, event.clientY - bounds.top);
        }}
        className={`focus-visible:outline-garden-focus absolute inset-0 flex touch-none overflow-auto overscroll-contain p-3 focus-visible:outline-2 focus-visible:outline-offset-2 ${isPanning ? "cursor-grabbing" : "cursor-grab"}`}
      >
        <div
          className="m-auto max-w-none shrink-0"
          style={{ width: `${zoomDimensions.widthPx}px`, height: `${zoomDimensions.heightPx}px` }}
        >
          {viewportRect && (
            <GardenSpaceDiagram
              space={space}
              positions={visiblePositions}
              projection={dialogProjection}
              cropCodes={cropCodes}
              cropNames={cropNames}
              minMarkerSizeCm={18 / pixelsPerCm}
              onMarkerSelect={handleMarkerSelect}
              className="text-garden-muted block h-full w-full max-w-none"
            />
          )}
        </div>
      </div>

      <nav
        aria-label={`Sterowanie diagramem ${spaceName}`}
        className="garden-diagram-zoom-controls border-app-border bg-garden-surface absolute top-3 right-3 z-10 flex flex-col items-center gap-1 rounded-xl border p-1.5 shadow-lg"
      >
        <span className="text-garden-muted px-1 py-1 text-xs tabular-nums" aria-live="polite">
          {Math.round((pixelsPerCm / Math.max(fitPixelsPerCm, 0.001)) * 100)}%
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Powiększ diagram"
          onClick={() => {
            zoomAt(pixelsPerCm * 1.25);
          }}
          className="border-app-border bg-garden-surface text-garden-foreground hover:bg-app-page focus-visible:ring-garden-focus"
        >
          +
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Pomniejsz diagram"
          onClick={() => {
            zoomAt(pixelsPerCm / 1.25);
          }}
          className="border-app-border bg-garden-surface text-garden-foreground hover:bg-app-page focus-visible:ring-garden-focus"
        >
          −
        </Button>
        <div className="bg-app-border my-1 h-px w-7" aria-hidden="true" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            pendingZoomAnchorRef.current = null;
            pixelsPerCmRef.current = fitPixelsPerCm;
            setPixelsPerCm(fitPixelsPerCm);
            scrollViewportRef.current?.scrollTo({ left: 0, top: 0 });
          }}
          className="border-app-border bg-garden-surface text-garden-foreground hover:bg-app-page focus-visible:ring-garden-focus px-2"
        >
          Dopasuj
        </Button>
      </nav>

      {selectedMarker && (
        <aside
          aria-label="Informacje o zaznaczonych roślinach"
          className="border-app-border bg-garden-surface absolute right-20 bottom-12 left-3 z-10 max-h-40 overflow-auto rounded-xl border p-3 shadow-lg"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-garden-foreground text-sm font-semibold">
                {selectedMarker.position ? "Wybrana roślina" : "Rośliny w tym skupisku"}
              </p>
              <ul className="text-garden-muted mt-1 space-y-1 text-xs">
                {selectedMarker.cropCounts.map(({ cropId, count }) => (
                  <li key={cropId}>
                    {cropName(cropId, cropNames)}
                    {count > 1 ? ` · ${count} szt.` : ""}
                  </li>
                ))}
              </ul>
              {selectedMarker.position && (
                <p className="text-garden-muted mt-1 text-xs">
                  Pozycja: {selectedMarker.position.xCm} × {selectedMarker.position.yCm} cm
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Zamknij informacje o roślinach"
              onClick={() => {
                setSelectedMarker(null);
              }}
              className="text-garden-muted size-7 shrink-0"
            >
              ×
            </Button>
          </div>
          {!selectedMarker.position && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-app-border bg-garden-surface text-garden-foreground hover:bg-app-page focus-visible:ring-garden-focus mt-2"
              onClick={() => {
                zoomAt(pixelsPerCmRef.current * 1.8, selectedMarker.anchor.x, selectedMarker.anchor.y);
              }}
            >
              Powiększ to skupisko
            </Button>
          )}
        </aside>
      )}
    </div>
  );

  const diagramInstructions = (
    <p className="text-garden-muted bg-garden-surface border-app-border w-full shrink-0 rounded-lg border px-3 py-2 text-xs">
      Plakietka +N pokazuje wielkość skupiska · kliknij, by poznać gatunek · przeciągnij lub powiększ
    </p>
  );

  const viewerHeader = (
    <div className="flex shrink-0 items-start justify-between gap-3">
      <div>
        {isExpanded && <h2 className="text-garden-foreground mb-1 font-semibold">{spaceName}</h2>}
        <p className="text-garden-muted text-xs">
          Siatka co {projection.gridStepCm} cm · współrzędne w centymetrach · środek znacznika odpowiada pozycji
          rośliny.
        </p>
      </div>
      {isExpanded ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Zamknij powiększony widok skrzyni"
          onClick={() => {
            setIsExpanded(false);
          }}
          className="border-app-border bg-garden-surface text-garden-foreground hover:bg-app-page focus-visible:ring-garden-focus shrink-0"
        >
          Zamknij <span aria-hidden="true">×</span>
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Powiększ widok skrzyni na cały ekran"
          onClick={() => {
            setIsExpanded(true);
          }}
          className="border-app-border bg-garden-surface text-garden-foreground hover:bg-app-page focus-visible:ring-garden-focus shrink-0 sm:hidden"
        >
          Powiększ
        </Button>
      )}
    </div>
  );

  return (
    <>
      {!isExpanded && (
        <section aria-label={`Diagram ${spaceName}`} className="space-y-2">
          {viewerHeader}
          {diagramFrame}
          {diagramInstructions}
        </section>
      )}
      {isExpanded &&
        typeof document !== "undefined" &&
        createPortal(
          <dialog
            ref={dialogRef}
            aria-label={`Powiększony diagram ${spaceName}`}
            className="garden-diagram-dialog"
            onCancel={(event) => {
              event.preventDefault();
              setIsExpanded(false);
            }}
          >
            {viewerHeader}
            {diagramFrame}
            {diagramInstructions}
          </dialog>,
          document.body,
        )}
    </>
  );
}

const POSITION_DETAILS_PAGE_SIZE = 100;
const GARDEN_DIAGRAM_MAX_DETAIL_MARKERS = 500;

function GardenPositionDetails({
  positions,
  cropNames,
}: {
  positions: readonly GardenPosition[];
  cropNames: Record<string, string>;
}) {
  const [visibleCount, setVisibleCount] = useState(POSITION_DETAILS_PAGE_SIZE);
  const visiblePositions = positions.slice(0, visibleCount);

  return (
    <details className="border-app-border bg-garden-surface rounded-lg border px-4 py-3">
      <summary className="text-garden-foreground cursor-pointer text-sm font-semibold">
        Sąsiedzi i uzasadnienie pozycji ({positions.length})
      </summary>
      <ol className="text-garden-muted mt-3 list-decimal space-y-3 pl-5 text-sm">
        {visiblePositions.map((position) => (
          <li key={`${position.cropId}-${position.row}-${position.column}`}>
            <p className="text-garden-foreground font-medium">
              {cropName(position.cropId, cropNames)} · {position.xCm} × {position.yCm} cm
            </p>
            <p>
              {position.placementReason?.detail ??
                "Brak zapisanego uzasadnienia — ten układ mógł powstać przed dodaniem wyjaśnień."}
            </p>
            {position.neighbors === undefined ? (
              <p>Brak zapisanych danych o lokalnych sąsiadach w tym starszym planie.</p>
            ) : position.neighbors.length === 0 ? (
              <p>Brak lokalnych sąsiadów w tej samej przestrzeni.</p>
            ) : (
              <ul className="list-disc space-y-1 pl-5">
                {position.neighbors.map((neighbor, index) => (
                  <li key={`${neighbor.cropId}-${index}`}>
                    {cropName(neighbor.cropId, cropNames)} — {NEIGHBOR_STATUS_LABELS[neighbor.status]}
                    {neighbor.rationale ? `: ${neighbor.rationale}` : " — brak potwierdzonego opisu w katalogu."}
                    {neighbor.sourceIds.length > 0 ? ` Źródła: ${neighbor.sourceIds.join(", ")}.` : ""}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
      {visibleCount < positions.length && (
        <Button
          type="button"
          variant="outline"
          className="border-app-border bg-garden-surface text-garden-foreground hover:bg-app-page mt-4"
          onClick={() => {
            setVisibleCount((count) => Math.min(count + POSITION_DETAILS_PAGE_SIZE, positions.length));
          }}
        >
          Pokaż kolejne {Math.min(POSITION_DETAILS_PAGE_SIZE, positions.length - visibleCount)}
        </Button>
      )}
    </details>
  );
}

export default function GardenLayoutView({ plan, status, cropNames }: Props) {
  const cropCodes = new Map<string, string>(
    plan.cropSummaries.map((summary, index): [string, string] => [summary.cropId, String(index + 1).padStart(2, "0")]),
  );
  const geometryConflicts = plan.conflicts.filter((conflict) => conflict.type === "geometry");
  const neighborConflicts = plan.conflicts.filter((conflict) => conflict.type === "negative_neighbor");
  const shortfalls = createGardenLayoutShortfallReport(plan);
  const shortfallsBySpace = new Map(shortfalls.bySpace.map(({ space, crops }) => [space.id, crops]));

  return (
    <section aria-label="Szczegóły wygenerowanego układu" className="space-y-8" data-layout-status={status}>
      {status === "stale" && (
        <p
          className="border-garden-warning-border bg-garden-warning-surface text-garden-warning rounded-lg border px-4 py-3 text-sm font-semibold"
          role="alert"
        >
          Plan nieaktualny. Diagram i liczby poniżej opisują poprzedni zapisany układ, a nie bieżące wejścia.
        </p>
      )}
      {status === "unknown" && (
        <p
          className="border-garden-warning-border bg-garden-warning-surface text-garden-warning rounded-lg border px-4 py-3 text-sm font-semibold"
          role="alert"
        >
          Nie można potwierdzić aktualności tego planu, ponieważ odczyt wejść nie powiódł się.
        </p>
      )}

      <div className="space-y-6">
        {plan.spaces.map(({ space, positions, status = "complete" }) => {
          return (
            <article key={space.id} className="border-app-border bg-garden-surface space-y-4 rounded-xl border p-4">
              <header className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-garden-foreground font-semibold">{space.name ?? "Przestrzeń działki"}</h3>
                <p className="text-garden-muted text-sm">
                  {space.widthCm} × {space.lengthCm} cm · {positions.length} pozycji
                </p>
              </header>

              {shortfallsBySpace.has(space.id) && (
                <aside
                  aria-label={"Brakujące pozycje w " + (space.name ?? "przestrzeni działki")}
                  className="border-garden-warning-border bg-garden-warning-surface rounded-lg border px-3 py-2"
                >
                  <h4 className="text-garden-warning text-sm font-semibold">Do dosadzenia w tej skrzyni</h4>
                  <ul className="text-garden-muted mt-1 space-y-1 text-sm">
                    {shortfallsBySpace.get(space.id)?.map(({ cropId, missingCount }) => (
                      <li key={cropId}>
                        <span className="text-garden-foreground font-medium">{cropName(cropId, cropNames)}</span>:{" "}
                        {formatMissingPositions(missingCount)}
                      </li>
                    ))}
                  </ul>
                </aside>
              )}

              {status !== "complete" && (
                <p
                  className="border-garden-warning-border bg-garden-warning-surface text-garden-warning rounded-lg border px-3 py-2 text-sm font-medium"
                  role="alert"
                >
                  {status === "partial"
                    ? "Układ tej przestrzeni jest częściowy — osiągnięto limit obliczeń. Nie wszystkie pozycje musiały zostać sprawdzone."
                    : "Ta przestrzeń nie została przetworzona z powodu limitu obliczeń; nie pokazujemy jej jako zaplanowanej."}
                </p>
              )}

              <GardenSpaceDiagramViewer
                space={space}
                positions={positions}
                cropCodes={cropCodes}
                cropNames={cropNames}
              />

              {positions.length > 0 && <GardenPositionDetails positions={positions} cropNames={cropNames} />}
            </article>
          );
        })}
      </div>

      {shortfalls.byCrop.length > 0 && (
        <section aria-labelledby="garden-layout-shortfall-title" className="space-y-3">
          <div className="border-garden-warning-border bg-garden-warning-surface rounded-xl border p-4">
            <h3 id="garden-layout-shortfall-title" className="text-garden-warning font-semibold">
              Braki w całym ogrodzie
            </h3>
            <ul className="text-garden-muted mt-2 space-y-1 text-sm">
              {shortfalls.byCrop.map(({ cropId, missingCount }) => (
                <li key={cropId}>
                  <span className="text-garden-foreground font-medium">{cropName(cropId, cropNames)}</span>:{" "}
                  {formatMissingPositions(missingCount)}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {shortfalls.hasUnknownAllocations && (
        <div className="border-garden-warning-border bg-garden-warning-surface rounded-xl border p-4">
          <p className="text-garden-muted text-sm">
            Podsumowanie obejmuje tylko skrzynie z zapisaną alokacją. Pozostałe nie mają pełnych danych do obliczenia
            braków.
          </p>
        </div>
      )}

      {plan.cropSummaries.length > 0 && (
        <section aria-label="Legenda diagramu" className="border-app-border bg-garden-surface rounded-xl border p-4">
          <h3 className="text-garden-foreground mb-3 text-sm font-semibold">Legenda upraw</h3>
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {plan.cropSummaries.map((summary, index) => (
              <li key={summary.cropId} className="text-garden-muted flex items-center gap-2 text-sm">
                <CropAtlasGlyph
                  cropId={summary.cropId}
                  code={String(index + 1).padStart(2, "0")}
                  fallbackLabel={cropName(summary.cropId, cropNames)}
                  size={28}
                />
                <span>
                  <span className="text-garden-foreground font-semibold">{String(index + 1).padStart(2, "0")}</span>{" "}
                  {cropName(summary.cropId, cropNames)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {plan.cropSummaries.length > 0 && (
        <section aria-labelledby="garden-layout-summary-title" className="space-y-3">
          <div>
            <h3 id="garden-layout-summary-title" className="text-garden-foreground text-lg font-semibold">
              Cel i osiągnięty miks
            </h3>
            <p className="text-garden-muted mt-1 text-sm">
              Cel procentowy pochodzi z wyboru upraw. Liczba pozycji obsady i osiągnięty udział pokazują ten diagram;
              udział liczymy według jednostek sadzenia (np. jedna kępa szczypiorku to jedna pozycja). Kody upraw
              znajdziesz w legendzie, a szczegóły po wskazaniu pozycji.
            </p>
          </div>
          <div className="border-app-border overflow-x-auto rounded-xl border">
            <table className="w-full min-w-max text-left text-sm">
              <thead className="bg-garden-surface text-garden-muted">
                <tr>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Uprawa
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Cel
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Pozycje obsady
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Osiągnięto
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Odchylenie
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Pewność danych
                  </th>
                </tr>
              </thead>
              <tbody className="divide-app-border divide-y">
                {plan.cropSummaries.map((summary, index) => (
                  <tr key={summary.cropId}>
                    <th scope="row" className="text-garden-foreground px-3 py-3 font-medium whitespace-nowrap">
                      <span className="border-app-border mr-2 inline-flex size-6 items-center justify-center rounded-md border text-xs">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {cropName(summary.cropId, cropNames)}
                    </th>
                    <td className="text-garden-muted px-3 py-3">{formatPercentage(summary.targetPercentage)}</td>
                    <td className="text-garden-muted px-3 py-3">{summary.actualCount}</td>
                    <td className="text-garden-muted px-3 py-3">{formatPercentage(summary.actualPercentage)}</td>
                    <td className="text-garden-muted px-3 py-3">
                      {formatDeviation(summary.actualPercentage, summary.targetPercentage)}
                    </td>
                    <td className="text-garden-muted px-3 py-3">
                      {summary.dataConfidence ? CONFIDENCE_LABELS[summary.dataConfidence] : "brak danych"}
                      {summary.spacingStage ? ` · ${STAGE_LABELS[summary.spacingStage]}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {(geometryConflicts.length > 0 || neighborConflicts.length > 0 || plan.omissions.length > 0) && (
        <section aria-labelledby="garden-layout-limits-title" className="space-y-3">
          <h3 id="garden-layout-limits-title" className="text-garden-foreground text-lg font-semibold">
            Ograniczenia i braki
          </h3>

          {geometryConflicts.length > 0 && (
            <div className="border-garden-warning-border bg-garden-warning-surface rounded-lg border p-4">
              <h4 className="text-garden-warning font-semibold">Cel ograniczony przez geometrię</h4>
              <ul className="text-garden-muted mt-2 list-disc space-y-1 pl-5 text-sm">
                {geometryConflicts.map((conflict, index) => (
                  <li key={`${conflict.spaceId}-${index}`}>
                    {conflict.detail} ({conflict.cropIds.map((id) => cropName(id, cropNames)).join(", ")})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {neighborConflicts.length > 0 && (
            <div className="border-garden-danger-border bg-garden-danger-surface rounded-lg border p-4">
              <h4 className="text-garden-danger font-semibold">Potwierdzone negatywne sąsiedztwo</h4>
              <ul className="text-garden-muted mt-2 list-disc space-y-1 pl-5 text-sm">
                {neighborConflicts.map((conflict, index) => (
                  <li key={`${conflict.spaceId}-${index}`}>
                    {conflict.detail} ({conflict.cropIds.map((id) => cropName(id, cropNames)).join(", ")})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {plan.omissions.length > 0 && (
            <div className="border-app-border bg-garden-surface rounded-lg border p-4">
              <h4 className="text-garden-foreground font-semibold">Uprawy bez wyznaczonej pozycji</h4>
              <ul className="text-garden-muted mt-2 list-disc space-y-1 pl-5 text-sm">
                {plan.omissions.map((omission, index) => (
                  <li key={`${omission.cropId}-${omission.reason}-${index}`}>
                    <span className="text-garden-foreground font-medium">{cropName(omission.cropId, cropNames)}</span>:{" "}
                    {OMISSION_LABELS[omission.reason] ?? omission.detail}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <p className="text-garden-muted text-sm">
        Sąsiedztwo w układzie: korzystne wskazówki {plan.metrics.supportedNeighbors}, ostrzeżenia caution{" "}
        {plan.metrics.cautionNeighbors}. Brak wpisu w katalogu jest neutralny; wskazówki nie są gwarancją plonu.
      </p>

      {plan.warnings.length > 0 && (
        <ul className="border-garden-warning-border bg-garden-warning-surface text-garden-warning list-disc space-y-1 rounded-lg border px-4 py-3 pl-8 text-sm">
          {plan.warnings.map((warning, index) => (
            <li key={`${warning}-${index}`}>{warning}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
