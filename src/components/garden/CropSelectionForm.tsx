import { useMemo, useState, type SyntheticEvent } from "react";

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
      ? "!bg-purple-300"
      : demoInteraction === "focus"
        ? "outline outline-2 outline-purple-200 outline-offset-2"
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
        <p className="mb-2 text-sm font-semibold tracking-[0.2em] text-purple-200 uppercase">S-03 · Planowanie upraw</p>
        <h2 id={titleId} className="text-2xl font-bold text-white">
          Wybór warzyw i udziałów procentowych
        </h2>
        <p className="mt-3 text-blue-100/75">
          Określ, jaki procent planowanej liczby roślin na całej działce ma przypadać na każdą uprawę. Algorytm później
          dobierze dla nich grządki; tutaj nie przypisujesz upraw do konkretnych skrzyń.
        </p>
      </header>

      {unavailable && (
        <p className="rounded-lg border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100" role="alert">
          Nie udało się odczytać zapisanego wyboru upraw. Odśwież stronę później; formularz jest tymczasowo wyłączony,
          żeby nie nadpisać danych.
        </p>
      )}

      <div className="max-w-2xl space-y-3">
        <label htmlFor={searchId} className="block space-y-2 text-sm text-blue-100/80">
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
            className="w-full rounded-lg border border-white/15 bg-slate-950/40 px-3 py-2 text-white outline-none placeholder:text-blue-100/40 focus:border-purple-300 disabled:opacity-50"
          />
        </label>
        <p className="text-xs text-blue-100/60">Wyszukiwanie uwzględnia aliasy i nie wymaga polskich znaków.</p>

        {query.trim() && searchResults.length > 0 && (
          <ul aria-label="Wyniki wyszukiwania" className="divide-y divide-white/10 rounded-xl border border-white/10">
            {searchResults.map((crop) => (
              <li key={crop.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="text-sm text-white">{crop.commonNamePl}</span>
                <button
                  type="button"
                  onClick={() => {
                    updateSelection((current) => [...current, { cropId: crop.id, proportion: "1.00" }]);
                  }}
                  disabled={unavailable || status === "saving"}
                  className="shrink-0 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-200 disabled:opacity-50"
                  aria-label={`Dodaj ${crop.commonNamePl}`}
                >
                  Dodaj
                </button>
              </li>
            ))}
          </ul>
        )}

        {query.trim() && searchResults.length === 0 && (
          <p className="text-sm text-blue-100/70" role="status">
            Nie znaleziono nowych warzyw dla tej frazy.
          </p>
        )}
      </div>

      <form onSubmit={saveSelection} className="space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-white">Wybrane warzywa</h3>
          {selection.length === 0 ? (
            <p className="mt-2 text-sm text-blue-100/70">
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
                    className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-4 sm:grid-cols-[1fr_10rem_auto] sm:items-end"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-white">{cropName}</p>
                    </div>
                    <label htmlFor={proportionId} className="space-y-2 text-sm text-blue-100/80">
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
                        className="w-full rounded-lg border border-white/15 bg-slate-950/40 px-3 py-2 text-white outline-none focus:border-purple-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-200 disabled:opacity-50"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        updateSelection((current) => current.filter((item) => item.cropId !== crop.cropId));
                      }}
                      disabled={unavailable || status === "saving"}
                      className="rounded-lg px-3 py-2 text-sm text-rose-200 transition-colors hover:bg-rose-400/10 hover:text-rose-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-200 disabled:opacity-50"
                      aria-label={`Usuń ${cropName}`}
                    >
                      Usuń
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-white" role="status" aria-live="polite">
            Suma udziałów:{" "}
            {totalPercentageHundredths === null
              ? "—"
              : `${percentageFormatter.format(totalPercentageHundredths / 100)}%`}
          </p>
          <p
            id={mixGuidanceId}
            className={selection.length > 0 && !selectionIsValid ? "text-sm text-amber-100" : "sr-only"}
          >
            Udziały muszą być dodatnie i sumować się do dokładnie 100,00%.
          </p>
        </div>

        {status === "error" && (
          <p
            className="rounded-lg border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100"
            role="alert"
          >
            {message}
          </p>
        )}
        {status === "saved" && (
          <p
            className="rounded-lg border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100"
            role="status"
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={unavailable || status === "saving" || !selectionIsValid}
          className={`rounded-lg bg-purple-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-purple-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-200 disabled:cursor-not-allowed disabled:opacity-60 ${status === "saving" ? "cursor-wait" : ""} ${demoInteractionClass}`}
        >
          {status === "saving" ? "Zapisywanie…" : "Zapisz wybór upraw"}
        </button>
      </form>
    </section>
  );
}
