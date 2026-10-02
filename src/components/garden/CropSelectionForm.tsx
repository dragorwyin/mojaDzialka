import { useMemo, useState, type SyntheticEvent } from "react";
import { Button } from "@/components/ui/button";

import { CROP_CATALOG, CROP_SOURCES, type CropCatalogEntry, type SourceId } from "../../data/crop-catalog.js";
import { searchCrops } from "../../lib/crop-catalog.js";
import { resolveGardenCropSelection, validateGardenCropSelection } from "../../lib/garden-crop-selection.js";
import {
  isValidCropPercentageMix,
  normalizeProportionsToPercentages,
  parseCropPercentageToHundredths,
  sumCropPercentageHundredths,
} from "../../lib/garden-crop-percentages.js";

interface CropSelection {
  cropId: string;
  proportion: string;
}

interface Props {
  initialSelection: CropSelection[];
  unavailable: boolean;
  idPrefix?: string;
  demoMode?: boolean;
  demoStatus?: "idle" | "saving" | "error";
  demoMessage?: string;
  demoInteraction?: "hover" | "focus";
}

const MAX_SEARCH_RESULTS = 8;
const percentageFormatter = new Intl.NumberFormat("pl-PL", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const spacingFormatter = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 1 });
const cropById = new Map(CROP_CATALOG.map((crop) => [crop.id, crop] as const));
const sourceById = new Map(CROP_SOURCES.map((source) => [source.id, source] as const));

const CONFIDENCE_LABELS = {
  high: "wysoka",
  medium: "średnia",
  low: "niska",
} as const;

const FINAL_SPACING_STAGE_LABELS = {
  after_thinning: "po przerywce",
  after_planting: "po posadzeniu",
} as const;

const SOWING_METHOD_LABELS = {
  direct_sow: "Siew bezpośredni",
  seedling: "Siew na rozsadę",
  plant_out: "Sadzenie na miejsce",
  overwintering: "Siew ozimy / przezimowanie",
} as const;

const MONTH_NAMES = [
  "styczeń",
  "luty",
  "marzec",
  "kwiecień",
  "maj",
  "czerwiec",
  "lipiec",
  "sierpień",
  "wrzesień",
  "październik",
  "listopad",
  "grudzień",
] as const;

function formatRange(range: { min: number; max: number }, unit = "cm"): string {
  const formatNumber = (value: number) => spacingFormatter.format(value);
  const value =
    range.min === range.max ? formatNumber(range.min) : `${formatNumber(range.min)}–${formatNumber(range.max)}`;
  return unit ? `${value} ${unit}` : value;
}

function CropSourceLinks({ sourceIds }: { sourceIds: readonly SourceId[] }) {
  if (sourceIds.length === 0) return <span>Brak wskazanego źródła.</span>;

  return (
    <ul className="mt-1 list-disc space-y-1 pl-5">
      {sourceIds.map((sourceId) => {
        const source = sourceById.get(sourceId);
        return (
          <li key={sourceId}>
            {source ? (
              <a className="text-garden-accent underline underline-offset-2" href={source.url}>
                {source.title}
              </a>
            ) : (
              `Nieznane źródło ${sourceId}`
            )}
          </li>
        );
      })}
    </ul>
  );
}

function formatSowingDensity(crop: CropCatalogEntry): string {
  const density = crop.sowingDensity;
  if (density === null) return crop.sowingDensityNote ?? "Brak dostępnych danych liczbowych o gęstości siewu.";

  const dimensions = [
    density.inRowCm === null ? null : `w rzędzie: ${formatRange(density.inRowCm)}`,
    density.betweenRowsCm === null ? null : `między rzędami: ${formatRange(density.betweenRowsCm)}`,
    density.seedsPerPosition === null ? null : `nasion na stanowisko: ${formatRange(density.seedsPerPosition, "")}`,
  ].filter((value): value is string => value !== null);

  return dimensions.length > 0 ? dimensions.join(" · ") : "Nie podano wartości liczbowej.";
}

function formatSeasonWindow(startMonth: number, endMonth: number): string {
  const start = MONTH_NAMES[startMonth - 1] ?? "nieznany miesiąc";
  const end = MONTH_NAMES[endMonth - 1] ?? "nieznany miesiąc";
  return startMonth === endMonth ? start : `${start}–${end}`;
}

function CropDetails({ crop }: { crop: CropCatalogEntry }) {
  const finalSpacing = crop.finalSpacing;

  return (
    <details className="border-garden-surface/10 mt-2 rounded-lg border px-3 py-2">
      <summary className="text-garden-accent focus-visible:outline-garden-focus cursor-pointer text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2">
        Informacje o rozstawie, siewie i terminach
      </summary>
      <div className="text-garden-muted/80 mt-3 space-y-4 text-xs leading-relaxed">
        <p>Pewność danych katalogowych: {CONFIDENCE_LABELS[crop.catalogConfidence]}.</p>
        <section aria-label={`Końcowa rozstawa: ${crop.commonNamePl}`}>
          <h4 className="text-garden-foreground font-semibold">Końcowa obsada</h4>
          {finalSpacing ? (
            <>
              <p className="mt-1">
                {formatRange(finalSpacing.inRowCm)} w rzędzie · {formatRange(finalSpacing.betweenRowsCm)} między rzędami
              </p>
              <p>
                Etap: {FINAL_SPACING_STAGE_LABELS[finalSpacing.stage]} · jednostka:{" "}
                {finalSpacing.unit === "clump" ? "kępa" : "roślina"} · pewność danych:{" "}
                {CONFIDENCE_LABELS[finalSpacing.confidence]}.
              </p>
              <p>{finalSpacing.context}</p>
              <p className="text-garden-foreground mt-1 font-medium">Źródła rozstawy:</p>
              <CropSourceLinks sourceIds={finalSpacing.sourceIds} />
            </>
          ) : (
            <p className="mt-1">
              Brak potwierdzonej rozstawy końcowej — nie podstawiamy danych z siewu, a planer nie wyznaczy tej uprawie
              pozycji na diagramie.
            </p>
          )}
        </section>

        <section aria-label={`Gęstość siewu: ${crop.commonNamePl}`}>
          <h4 className="text-garden-foreground font-semibold">Gęstość siewu — osobna od końcowej obsady</h4>
          <p className="mt-1">{formatSowingDensity(crop)}</p>
          {crop.sowingDensity && (
            <>
              <p>
                {crop.sowingDensity.context} Pewność danych: {CONFIDENCE_LABELS[crop.sowingDensity.confidence]}.
              </p>
              <p className="text-garden-foreground mt-1 font-medium">Źródła gęstości siewu:</p>
              <CropSourceLinks sourceIds={crop.sowingDensity.sourceIds} />
            </>
          )}
        </section>

        <section aria-label={`Terminy siewu i sadzenia: ${crop.commonNamePl}`}>
          <h4 className="text-garden-foreground font-semibold">Orientacyjne terminy</h4>
          {crop.seasonWindows.length > 0 ? (
            <ul className="mt-1 space-y-2">
              {crop.seasonWindows.map((window, index) => (
                <li key={`${window.method}-${window.startMonth}-${window.endMonth}-${index}`}>
                  <p>
                    <span className="text-garden-foreground font-medium">{SOWING_METHOD_LABELS[window.method]}: </span>
                    {formatSeasonWindow(window.startMonth, window.endMonth)} — {window.condition} · pewność danych:{" "}
                    {CONFIDENCE_LABELS[window.confidence]}.
                  </p>
                  <CropSourceLinks sourceIds={window.sourceIds} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1">Brak dostępnych, zweryfikowanych okien terminów.</p>
          )}
        </section>

        {crop.needsLocalValidation && crop.validationNotes && (
          <p className="border-garden-warning/30 bg-garden-warning/10 text-garden-warning rounded-md border p-2">
            Wymaga lokalnej weryfikacji: {crop.validationNotes}
          </p>
        )}
      </div>
    </details>
  );
}

function normalizeInitialSelection(initialSelection: CropSelection[]): CropSelection[] {
  const percentages = normalizeProportionsToPercentages(initialSelection.map((crop) => Number(crop.proportion)));
  if (percentages === null) return initialSelection;

  return initialSelection.map((crop, index) => ({
    ...crop,
    proportion: percentages[index]?.toFixed(2) ?? crop.proportion,
  }));
}

export default function CropSelectionForm({
  initialSelection,
  unavailable,
  idPrefix = "crop",
  demoMode = false,
  demoStatus = "idle",
  demoMessage = "",
  demoInteraction,
}: Props) {
  const [selection, setSelection] = useState<CropSelection[]>(() => normalizeInitialSelection(initialSelection));
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(demoStatus);
  const [message, setMessage] = useState(demoMessage);

  const searchResults = useMemo(() => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return [];

    const selectedIds = new Set(selection.map((crop) => crop.cropId));
    return searchCrops(normalizedQuery)
      .filter((crop) => !selectedIds.has(crop.id))
      .slice(0, MAX_SEARCH_RESULTS);
  }, [query, selection]);

  const selectedPercentages = selection.map((crop) => crop.proportion);
  const totalPercentageHundredths = sumCropPercentageHundredths(selectedPercentages);
  const percentageMixIsValid = isValidCropPercentageMix(selectedPercentages);
  const unresolvedSelections = selection.filter((crop) => resolveGardenCropSelection(crop.cropId).status !== "active");
  const selectionIsValid = percentageMixIsValid && unresolvedSelections.length === 0;
  const searchId = `${idPrefix}-search`;
  const titleId = `${idPrefix}-selection-title`;
  const mixGuidanceId = `${idPrefix}-mix-guidance`;
  const demoInteractionClass =
    demoInteraction === "hover"
      ? "!bg-garden-accent-hover"
      : demoInteraction === "focus"
        ? "outline outline-2 outline-garden-focus outline-offset-2"
        : "";

  function updateSelection(updater: (current: CropSelection[]) => CropSelection[]) {
    setSelection(updater);
    setStatus("idle");
    setMessage("");
  }

  async function saveSelection(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const unresolved = selection.map((crop) => resolveGardenCropSelection(crop.cropId));
    if (unresolved.some((crop) => crop.status === "retired")) {
      setStatus("error");
      setMessage("Usuń lub zamień wycofaną uprawę przed zapisem. Rozwiąż ją również przed generowaniem układu.");
      return;
    }
    if (unresolved.some((crop) => crop.status === "unknown")) {
      setStatus("error");
      setMessage("Usuń lub zamień nierozpoznaną uprawę przed zapisem. Nieznane ID nie są pomijane.");
      return;
    }

    if (!isValidCropPercentageMix(selection.map((crop) => crop.proportion))) {
      setStatus("error");
      setMessage("Udziały muszą być dodatnie i sumować się do dokładnie 100,00%.");
      return;
    }

    const validated = validateGardenCropSelection(
      selection.map((crop) => ({ cropId: crop.cropId, proportion: Number(crop.proportion) })),
    );
    if (validated === null) {
      setStatus("error");
      setMessage("Każdy udział musi być dodatnią, skończoną liczbą.");
      return;
    }

    if (demoMode) {
      setStatus("saved");
      setMessage("Podgląd demonstracyjny — zapis nie jest wykonywany.");
      return;
    }

    setStatus("saving");
    try {
      const response = await fetch("/api/garden-crops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(validated),
      });

      if (response.status === 401) {
        window.location.assign("/auth/signin?returnTo=%2Fgarden");
        return;
      }
      if (!response.ok) {
        setStatus("error");
        setMessage(
          response.status === 503
            ? "Zapisywanie wyboru jest chwilowo niedostępne. Spróbuj ponownie."
            : "Nie udało się zapisać wyboru. Spróbuj ponownie.",
        );
        return;
      }

      setStatus("saved");
      setMessage("Wybór upraw został zapisany.");
      window.dispatchEvent(
        new CustomEvent("garden:inputs-saved", {
          detail: { hasCrops: validated.length > 0 },
        }),
      );
    } catch {
      setStatus("error");
      setMessage("Nie udało się połączyć z serwerem. Sprawdź połączenie i spróbuj ponownie.");
    }
  }

  return (
    <section aria-labelledby={titleId} className="space-y-6">
      <header className="max-w-2xl">
        <p className="text-garden-accent mb-2 text-sm font-semibold tracking-[0.2em] uppercase">
          S-03 · Planowanie upraw
        </p>
        <h2 id={titleId} className="text-garden-foreground text-2xl font-bold">
          Wybór warzyw i udziałów procentowych
        </h2>
        <p className="text-garden-muted/75 mt-3">
          Określ, jaki procent planowanej liczby roślin na całej działce ma przypadać na każdą uprawę. Algorytm później
          dobierze dla nich grządki; tutaj nie przypisujesz upraw do konkretnych skrzyń.
        </p>
      </header>

      {unavailable && (
        <p
          className="border-garden-danger-border/30 bg-garden-danger-surface/10 text-garden-danger rounded-lg border px-4 py-3 text-sm"
          role="alert"
        >
          Nie udało się odczytać zapisanego wyboru upraw. Odśwież stronę później; formularz jest tymczasowo wyłączony,
          żeby nie nadpisać danych.
        </p>
      )}

      <div className="max-w-2xl space-y-3">
        <label htmlFor={searchId} className="text-garden-muted/80 block space-y-2 text-sm">
          <span>Wyszukaj warzywo po nazwie lub aliasie</span>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            placeholder="Np. pomidor, ogórek albo rocket"
            autoComplete="off"
            disabled={unavailable || status === "saving"}
            className="border-garden-surface/15 bg-garden-input/40 text-garden-foreground placeholder:text-garden-muted/40 focus:border-garden-accent-hover focus-visible:ring-garden-focus w-full rounded-lg border px-3 py-2 outline-none focus-visible:ring-2 disabled:opacity-50"
          />
        </label>
        <p className="text-garden-muted/60 text-xs">Wyszukiwanie uwzględnia aliasy i nie wymaga polskich znaków.</p>

        {query.trim() && searchResults.length > 0 && (
          <ul
            aria-label="Wyniki wyszukiwania"
            className="divide-garden-surface/10 border-garden-surface/10 divide-y rounded-xl border"
          >
            {searchResults.map((crop) => (
              <li key={crop.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="text-garden-foreground text-sm">{crop.commonNamePl}</span>
                <Button
                  type="button"
                  onClick={() => {
                    updateSelection((current) => [...current, { cropId: crop.id, proportion: "1.00" }]);
                  }}
                  disabled={unavailable || status === "saving"}
                  variant="outline"
                  className="border-garden-surface/20 bg-garden-surface/10 text-garden-foreground hover:bg-garden-surface/20 focus-visible:ring-garden-focus shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium shadow-none transition-colors"
                  aria-label={`Dodaj ${crop.commonNamePl}`}
                >
                  Dodaj
                </Button>
              </li>
            ))}
          </ul>
        )}

        {query.trim() && searchResults.length === 0 && (
          <p className="text-garden-muted/70 text-sm" role="status">
            Nie znaleziono nowych warzyw dla tej frazy.
          </p>
        )}
      </div>

      <form onSubmit={saveSelection} className="space-y-5">
        <div>
          <h3 className="text-garden-foreground text-lg font-semibold">Wybrane warzywa</h3>
          {unresolvedSelections.length > 0 && (
            <p
              className="border-garden-danger-border/30 bg-garden-danger-surface/10 text-garden-danger mt-3 rounded-lg border px-4 py-3 text-sm"
              role="alert"
            >
              Zapis zawiera wycofaną lub nierozpoznaną pozycję. Usuń ją albo dodaj aktywny zamiennik przed zapisem i
              generowaniem układu.
            </p>
          )}
          {selection.length === 0 ? (
            <p className="text-garden-muted/70 mt-2 text-sm">
              Nie wybrano jeszcze warzyw. Zapis pustej listy wyczyści wybór.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {selection.map((crop, index) => {
                const resolution = resolveGardenCropSelection(crop.cropId);
                const cropName = resolution.displayName;
                const cropDetails = cropById.get(crop.cropId);
                const proportionId = `${idPrefix}-proportion-${crop.cropId}`;
                const proportionHundredths = parseCropPercentageToHundredths(crop.proportion);

                return (
                  <li
                    key={crop.cropId}
                    className="border-garden-surface/10 bg-garden-surface/5 grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_10rem_auto] sm:items-end"
                  >
                    <div className="min-w-0">
                      <p className="text-garden-foreground font-medium">{cropName}</p>
                      {resolution.status === "retired" && (
                        <p className="text-garden-danger mt-1 text-sm">
                          Wycofana uprawa — usuń ją lub wybierz aktywny zamiennik w wyszukiwarce.
                        </p>
                      )}
                      {resolution.status === "unknown" && (
                        <p className="text-garden-danger mt-1 text-sm">
                          Nieznane ID „{crop.cropId}” — pozycja została zachowana. Usuń ją lub zastąp aktywną uprawą.
                        </p>
                      )}
                      {resolution.status === "active" && cropDetails && <CropDetails crop={cropDetails} />}
                    </div>
                    <label htmlFor={proportionId} className="text-garden-muted/80 space-y-2 text-sm">
                      <span>Udział (%)</span>
                      <input
                        id={proportionId}
                        type="number"
                        min="0.01"
                        max="100"
                        step="0.01"
                        required
                        inputMode="decimal"
                        value={crop.proportion}
                        onChange={(event) => {
                          const proportion = event.target.value;
                          updateSelection((current) =>
                            current.map((item, itemIndex) => (itemIndex === index ? { ...item, proportion } : item)),
                          );
                        }}
                        disabled={unavailable || status === "saving"}
                        aria-invalid={
                          resolution.status !== "active" || proportionHundredths === null || proportionHundredths <= 0
                        }
                        aria-describedby={mixGuidanceId}
                        className="border-garden-surface/15 bg-garden-input/40 text-garden-foreground focus:border-garden-accent-hover focus-visible:ring-garden-focus w-full rounded-lg border px-3 py-2 outline-none focus-visible:ring-2 disabled:opacity-50"
                      />
                    </label>
                    <Button
                      type="button"
                      onClick={() => {
                        updateSelection((current) => current.filter((item) => item.cropId !== crop.cropId));
                      }}
                      disabled={unavailable || status === "saving"}
                      variant="ghost"
                      className="text-garden-danger-muted hover:bg-garden-danger-surface/10 hover:text-garden-danger focus-visible:ring-garden-focus rounded-lg px-3 py-2 text-sm transition-colors"
                      aria-label={`Usuń ${cropName}`}
                    >
                      Usuń
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-garden-foreground text-sm font-semibold" role="status" aria-live="polite">
            Suma udziałów:{" "}
            {totalPercentageHundredths === null
              ? "—"
              : `${percentageFormatter.format(totalPercentageHundredths / 100)}%`}
          </p>
          <p
            id={mixGuidanceId}
            className={selection.length > 0 && !percentageMixIsValid ? "text-garden-warning text-sm" : "sr-only"}
          >
            Udziały muszą być dodatnie i sumować się do dokładnie 100,00%.
          </p>
        </div>

        {status === "error" && (
          <p
            className="border-garden-danger-border/30 bg-garden-danger-surface/10 text-garden-danger rounded-lg border px-4 py-3 text-sm"
            role="alert"
          >
            {message}
          </p>
        )}
        {status === "saved" && (
          <p
            className="border-garden-success-border/30 bg-garden-success-surface/10 text-garden-success rounded-lg border px-4 py-3 text-sm"
            role="status"
          >
            {message}
          </p>
        )}

        <Button
          type="submit"
          disabled={unavailable || status === "saving" || !selectionIsValid}
          className={`bg-garden-accent-strong text-garden-accent-foreground hover:bg-garden-accent-hover focus-visible:ring-garden-focus rounded-lg px-4 py-2 text-sm font-semibold shadow-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${status === "saving" ? "cursor-wait" : ""} ${demoInteractionClass}`}
        >
          {status === "saving" ? "Zapisywanie…" : "Zapisz wybór upraw"}
        </Button>
      </form>
    </section>
  );
}
