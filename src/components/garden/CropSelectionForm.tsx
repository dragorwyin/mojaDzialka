import { useMemo, useState, type SyntheticEvent } from "react";

import { getCropById, searchCrops } from "../../lib/crop-catalog.js";
import { validateGardenCropSelection } from "../../lib/garden-crop-selection.js";

interface CropSelection {
  cropId: string;
  proportion: string;
}

interface Props {
  initialSelection: CropSelection[];
  unavailable: boolean;
}

const MAX_SEARCH_RESULTS = 8;

export default function CropSelectionForm({ initialSelection, unavailable }: Props) {
  const [selection, setSelection] = useState<CropSelection[]>(initialSelection);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  const searchResults = useMemo(() => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return [];

    const selectedIds = new Set(selection.map((crop) => crop.cropId));
    return searchCrops(normalizedQuery)
      .filter((crop) => !selectedIds.has(crop.id))
      .slice(0, MAX_SEARCH_RESULTS);
  }, [query, selection]);

  function updateSelection(updater: (current: CropSelection[]) => CropSelection[]) {
    setSelection(updater);
    setStatus("idle");
    setMessage("");
  }

  async function saveSelection(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const validated = validateGardenCropSelection(
      selection.map((crop) => ({ cropId: crop.cropId, proportion: Number(crop.proportion) })),
    );
    if (validated === null) {
      setStatus("error");
      setMessage("Każda proporcja musi być dodatnią, skończoną liczbą.");
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
    <section aria-labelledby="crop-selection-title" className="space-y-6">
      <header className="max-w-2xl">
        <p className="mb-2 text-sm font-semibold tracking-[0.2em] text-purple-200 uppercase">S-03 · Planowanie upraw</p>
        <h2 id="crop-selection-title" className="text-2xl font-bold text-white">
          Wybór warzyw i proporcji
        </h2>
        <p className="mt-3 text-blue-100/75">
          Wybierz warzywa dla całej działki i określ ich proporcje. Algorytm później dobierze dla nich grządki; tutaj
          nie przypisujesz upraw do konkretnych skrzyń.
        </p>
      </header>

      {unavailable && (
        <p className="rounded-lg border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100" role="alert">
          Nie udało się odczytać zapisanego wyboru upraw. Odśwież stronę później; formularz jest tymczasowo wyłączony,
          żeby nie nadpisać danych.
        </p>
      )}

      <div className="max-w-2xl space-y-3">
        <label htmlFor="crop-search" className="block space-y-2 text-sm text-blue-100/80">
          <span>Wyszukaj warzywo po nazwie lub aliasie</span>
          <input
            id="crop-search"
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
                    updateSelection((current) => [...current, { cropId: crop.id, proportion: "1" }]);
                  }}
                  disabled={unavailable || status === "saving"}
                  className="shrink-0 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-50"
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
                const proportionId = `crop-proportion-${crop.cropId}`;

                return (
                  <li
                    key={crop.cropId}
                    className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-4 sm:grid-cols-[1fr_10rem_auto] sm:items-end"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-white">{cropName}</p>
                    </div>
                    <label htmlFor={proportionId} className="space-y-2 text-sm text-blue-100/80">
                      <span>Proporcja</span>
                      <input
                        id={proportionId}
                        type="number"
                        min="0"
                        step="any"
                        required
                        value={crop.proportion}
                        onChange={(event) => {
                          const proportion = event.target.value;
                          updateSelection((current) =>
                            current.map((item, itemIndex) => (itemIndex === index ? { ...item, proportion } : item)),
                          );
                        }}
                        disabled={unavailable || status === "saving"}
                        className="w-full rounded-lg border border-white/15 bg-slate-950/40 px-3 py-2 text-white outline-none focus:border-purple-300 disabled:opacity-50"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        updateSelection((current) => current.filter((item) => item.cropId !== crop.cropId));
                      }}
                      disabled={unavailable || status === "saving"}
                      className="rounded-lg px-3 py-2 text-sm text-rose-200 transition-colors hover:bg-rose-400/10 hover:text-rose-100 disabled:opacity-50"
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
          disabled={unavailable || status === "saving"}
          className="rounded-lg bg-purple-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-purple-300 disabled:cursor-wait disabled:opacity-60"
        >
          {status === "saving" ? "Zapisywanie…" : "Zapisz wybór upraw"}
        </button>
      </form>
    </section>
  );
}
