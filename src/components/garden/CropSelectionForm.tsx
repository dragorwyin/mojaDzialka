import { useMemo, useState, type SyntheticEvent } from "react";
import { Button } from "@/components/ui/button";

import { getCropById, searchCrops } from "../../lib/crop-catalog.js";
import { validateGardenCropSelection } from "../../lib/garden-crop-selection.js";
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
  const selectionIsValid = isValidCropPercentageMix(selectedPercentages);
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
          {selection.length === 0 ? (
            <p className="text-garden-muted/70 mt-2 text-sm">
              Nie wybrano jeszcze warzyw. Zapis pustej listy wyczyści wybór.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {selection.map((crop, index) => {
                const catalogCrop = getCropById(crop.cropId);
                const cropName = catalogCrop?.commonNamePl ?? crop.cropId;
                const proportionId = `${idPrefix}-proportion-${crop.cropId}`;
                const proportionHundredths = parseCropPercentageToHundredths(crop.proportion);

                return (
                  <li
                    key={crop.cropId}
                    className="border-garden-surface/10 bg-garden-surface/5 grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_10rem_auto] sm:items-end"
                  >
                    <div className="min-w-0">
                      <p className="text-garden-foreground font-medium">{cropName}</p>
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
                        aria-invalid={proportionHundredths === null || proportionHundredths <= 0}
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
            className={selection.length > 0 && !selectionIsValid ? "text-garden-warning text-sm" : "sr-only"}
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
