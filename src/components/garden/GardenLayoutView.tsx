import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import type { GardenLayoutResult } from "@/lib/garden-layout";
import {
  CROP_ATLAS_HREF,
  CROP_ATLAS_VIEWBOX_HEIGHT,
  CROP_ATLAS_VIEWBOX_WIDTH,
  getCropAtlasCellViewBox,
  resolveCropThumbnailPresentation,
} from "./crop-thumbnail-manifest";
import {
  createGardenDiagramProjection,
  getGardenDiagramAspectRatio,
  getGardenDiagramZoomDimensions,
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

function cropName(cropId: string, cropNames: Record<string, string>): string {
  return cropNames[cropId] ?? cropId;
}

function CropAtlasGlyph({
  cropId,
  code,
  size,
  x,
  y,
}: {
  cropId: string;
  code: string;
  size: number;
  x?: number;
  y?: number;
}) {
  const presentation = resolveCropThumbnailPresentation(cropId, code);

  return (
    <svg x={x} y={y} width={size} height={size} viewBox="-50 -50 100 100" aria-hidden="true" focusable="false">
      <circle cx="0" cy="0" r="48" className="fill-garden-surface stroke-garden-surface/40" strokeWidth="3" />
      {presentation.kind === "atlas" && (
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
            href={CROP_ATLAS_HREF}
            x="0"
            y="0"
            width={CROP_ATLAS_VIEWBOX_WIDTH}
            height={CROP_ATLAS_VIEWBOX_HEIGHT}
            preserveAspectRatio="xMidYMid meet"
          />
        </svg>
      )}
      {presentation.kind === "text" && (
        <text x="0" y="5" textAnchor="middle" className="fill-garden-foreground" fontSize="28" fontWeight="700">
          {presentation.fallbackLabel}
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
  className?: string;
  style?: CSSProperties;
}

function GardenSpaceDiagram({
  space,
  positions,
  projection,
  cropCodes,
  cropNames,
  className = "text-garden-muted block h-auto w-full",
  style,
}: GardenSpaceDiagramProps) {
  const viewBox = projection.viewBox;

  return (
    <svg
      role="group"
      aria-label={`Diagram ${space.name ?? "przestrzeni"} w skali centymetrowej`}
      viewBox={`${viewBox.xCm} ${viewBox.yCm} ${viewBox.widthCm} ${viewBox.heightCm}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
      style={{ aspectRatio: getGardenDiagramAspectRatio(projection), ...style }}
    >
      <rect
        x="0"
        y="0"
        width={space.widthCm}
        height={space.lengthCm}
        className="fill-garden-surface/5 stroke-garden-surface/35"
        strokeWidth="0.35"
      />
      {projection.xGridLinesCm.map((xCm) => (
        <line
          key={`grid-x-${xCm}`}
          x1={xCm}
          y1="0"
          x2={xCm}
          y2={space.lengthCm}
          className="stroke-garden-surface/20"
          strokeWidth="0.18"
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
          className="stroke-garden-surface/20"
          strokeWidth="0.18"
          aria-hidden="true"
        />
      ))}
      {projection.markers.map(({ position, center, diameterCm }) => {
        const code = cropCodes.get(position.cropId) ?? "?";
        const name = cropName(position.cropId, cropNames);
        const label = `${name}, pozycja ${position.row + 1}, ${position.column + 1}, ${position.xCm} × ${position.yCm} cm`;

        return (
          <g
            key={`${position.cropId}-${position.row}-${position.column}`}
            role="img"
            aria-label={`${code} · ${label}`}
            transform={`translate(${center.xCm} ${center.yCm})`}
          >
            <title>{`${code} · ${label}`}</title>
            <CropAtlasGlyph
              cropId={position.cropId}
              code={code}
              size={diameterCm}
              x={-diameterCm / 2}
              y={-diameterCm / 2}
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const projection = createGardenDiagramProjection(space, positions);
  const zoomDimensions = getGardenDiagramZoomDimensions(projection);
  const spaceName = space.name ?? "Przestrzeń działki";

  useEffect(() => {
    if (!isDialogOpen) return;

    const dialog = dialogRef.current;
    const openButton = openButtonRef.current;
    if (!dialog || dialog.open) return;

    dialog.showModal();
    scrollViewportRef.current?.focus({ preventScroll: true });

    return () => {
      if (dialog.open) dialog.close();
      openButton?.focus({ preventScroll: true });
    };
  }, [isDialogOpen]);

  return (
    <>
      <div className="border-garden-surface/15 bg-garden-surface/10 space-y-2 rounded-lg border p-2">
        <p className="text-garden-muted/75 text-xs">
          Siatka co 10 cm · współrzędne w centymetrach · środek znacznika odpowiada pozycji rośliny.
        </p>
        <GardenSpaceDiagram
          space={space}
          positions={positions}
          projection={projection}
          cropCodes={cropCodes}
          cropNames={cropNames}
        />
      </div>

      <Button
        ref={openButtonRef}
        type="button"
        variant="outline"
        aria-haspopup="dialog"
        aria-expanded={isDialogOpen}
        onClick={() => {
          setIsDialogOpen(true);
        }}
        className="border-garden-surface/20 bg-garden-surface/10 text-garden-foreground hover:bg-garden-surface/20 focus-visible:ring-garden-focus w-full md:hidden"
      >
        Powiększ diagram
      </Button>

      <dialog
        ref={dialogRef}
        aria-label={`Powiększony diagram: ${spaceName}`}
        onCancel={(event) => {
          event.preventDefault();
          setIsDialogOpen(false);
        }}
        className="backdrop:bg-garden-input/90 border-garden-surface/20 bg-garden-input text-garden-foreground m-auto h-dvh max-h-dvh w-screen max-w-none overflow-hidden rounded-2xl border p-0 shadow-2xl backdrop:backdrop-blur-sm"
      >
        <div className="flex h-full min-h-0 flex-col">
          <header className="border-garden-surface/10 flex shrink-0 items-center justify-between gap-4 border-b p-4">
            <div>
              <h2 className="text-garden-foreground font-semibold">{spaceName}</h2>
              <p className="text-garden-muted/75 mt-1 text-xs">Przewijaj diagram w poziomie i pionie.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
              }}
              className="border-garden-surface/20 bg-garden-surface/10 text-garden-foreground hover:bg-garden-surface/20 focus-visible:ring-garden-focus shrink-0"
            >
              Zamknij
            </Button>
          </header>
          <div
            ref={scrollViewportRef}
            tabIndex={0}
            aria-label={`Przewijany diagram ${spaceName}`}
            className="focus-visible:outline-garden-focus min-h-0 flex-1 overflow-auto overscroll-contain p-3 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <div
              className="max-w-none"
              style={{ width: `${zoomDimensions.widthPx}px`, height: `${zoomDimensions.heightPx}px` }}
            >
              <GardenSpaceDiagram
                space={space}
                positions={positions}
                projection={projection}
                cropCodes={cropCodes}
                cropNames={cropNames}
                className="text-garden-muted block h-full w-full max-w-none"
              />
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}

export default function GardenLayoutView({ plan, status, cropNames }: Props) {
  const cropCodes = new Map<string, string>(
    plan.cropSummaries.map((summary, index): [string, string] => [summary.cropId, String(index + 1).padStart(2, "0")]),
  );
  const geometryConflicts = plan.conflicts.filter((conflict) => conflict.type === "geometry");
  const neighborConflicts = plan.conflicts.filter((conflict) => conflict.type === "negative_neighbor");

  return (
    <section aria-label="Szczegóły wygenerowanego układu" className="space-y-8" data-layout-status={status}>
      {status === "stale" && (
        <p
          className="border-garden-warning/30 bg-garden-warning/10 text-garden-warning rounded-lg border px-4 py-3 text-sm font-semibold"
          role="alert"
        >
          Plan nieaktualny. Diagram i liczby poniżej opisują poprzedni zapisany układ, a nie bieżące wejścia.
        </p>
      )}
      {status === "unknown" && (
        <p
          className="border-garden-warning/30 bg-garden-warning/10 text-garden-warning rounded-lg border px-4 py-3 text-sm font-semibold"
          role="alert"
        >
          Nie można potwierdzić aktualności tego planu, ponieważ odczyt wejść nie powiódł się.
        </p>
      )}

      <div className="space-y-6">
        {plan.spaces.map(({ space, positions }) => {
          return (
            <article
              key={space.id}
              className="border-garden-surface/10 bg-garden-surface/5 space-y-4 rounded-xl border p-4"
            >
              <header className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-garden-foreground font-semibold">{space.name ?? "Przestrzeń działki"}</h3>
                <p className="text-garden-muted/80 text-sm">
                  {space.widthCm} × {space.lengthCm} cm · {positions.length} pozycji
                </p>
              </header>

              <GardenSpaceDiagramViewer
                space={space}
                positions={positions}
                cropCodes={cropCodes}
                cropNames={cropNames}
              />

              {positions.length > 0 && (
                <details className="border-garden-surface/10 bg-garden-surface/5 rounded-lg border px-4 py-3">
                  <summary className="text-garden-foreground cursor-pointer text-sm font-semibold">
                    Sąsiedzi i uzasadnienie pozycji ({positions.length})
                  </summary>
                  <ol className="text-garden-muted mt-3 list-decimal space-y-3 pl-5 text-sm">
                    {positions.map((position) => (
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
                                {neighbor.rationale
                                  ? `: ${neighbor.rationale}`
                                  : " — brak potwierdzonego opisu w katalogu."}
                                {neighbor.sourceIds.length > 0 ? ` Źródła: ${neighbor.sourceIds.join(", ")}.` : ""}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ol>
                </details>
              )}
            </article>
          );
        })}
      </div>

      {plan.cropSummaries.length > 0 && (
        <section
          aria-label="Legenda diagramu"
          className="border-garden-surface/10 bg-garden-surface/5 rounded-xl border p-4"
        >
          <h3 className="text-garden-foreground mb-3 text-sm font-semibold">Legenda upraw</h3>
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {plan.cropSummaries.map((summary, index) => (
              <li key={summary.cropId} className="text-garden-muted flex items-center gap-2 text-sm">
                <CropAtlasGlyph cropId={summary.cropId} code={String(index + 1).padStart(2, "0")} size={28} />
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
            <p className="text-garden-muted/70 mt-1 text-sm">
              Cel procentowy pochodzi z wyboru upraw. Liczba pozycji obsady i osiągnięty udział pokazują ten diagram;
              udział liczymy według jednostek sadzenia (np. jedna kępa szczypiorku to jedna pozycja). Kody upraw
              znajdziesz w legendzie, a szczegóły po wskazaniu pozycji.
            </p>
          </div>
          <div className="border-garden-surface/10 overflow-x-auto rounded-xl border">
            <table className="w-full min-w-max text-left text-sm">
              <thead className="bg-garden-surface/10 text-garden-muted">
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
              <tbody className="divide-garden-surface/10 divide-y">
                {plan.cropSummaries.map((summary, index) => (
                  <tr key={summary.cropId}>
                    <th scope="row" className="text-garden-foreground px-3 py-3 font-medium whitespace-nowrap">
                      <span className="border-garden-surface/20 mr-2 inline-flex size-6 items-center justify-center rounded-md border text-xs">
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
            <div className="border-garden-warning/30 bg-garden-warning/10 rounded-lg border p-4">
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
            <div className="border-garden-danger-border/30 bg-garden-danger-surface/10 rounded-lg border p-4">
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
            <div className="border-garden-surface/10 bg-garden-surface/5 rounded-lg border p-4">
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

      <p className="text-garden-muted/80 text-sm">
        Sąsiedztwo w układzie: korzystne wskazówki {plan.metrics.supportedNeighbors}, ostrzeżenia caution{" "}
        {plan.metrics.cautionNeighbors}. Brak wpisu w katalogu jest neutralny; wskazówki nie są gwarancją plonu.
      </p>

      {plan.warnings.length > 0 && (
        <ul className="border-garden-warning/30 bg-garden-warning/10 text-garden-warning list-disc space-y-1 rounded-lg border px-4 py-3 pl-8 text-sm">
          {plan.warnings.map((warning, index) => (
            <li key={`${warning}-${index}`}>{warning}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
