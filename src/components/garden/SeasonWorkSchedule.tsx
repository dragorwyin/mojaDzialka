import { useMemo, useSyncExternalStore } from "react";

import { CROP_CATALOG } from "../../data/crop-catalog.js";
import {
  getMillisecondsUntilNextLocalMonthStart,
  getNextSeasonWork,
  getUpcomingSeasonWork,
} from "../../lib/season-work-schedule.js";
import type { GardenLayoutCropSummary } from "../../lib/garden-layout.js";
import CropSourceLinks from "./CropSourceLinks";

const cropById = new Map(CROP_CATALOG.map((crop) => [crop.id, crop] as const));

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

const SOWING_METHOD_LABELS = {
  direct_sow: "Siew bezpośredni",
  seedling: "Przygotowanie rozsady",
  plant_out: "Sadzenie na miejsce",
  overwintering: "Sadzenie/siew ozimy",
} as const;

const CONFIDENCE_LABELS = {
  high: "wysoka",
  medium: "średnia",
  low: "niska",
} as const;

function subscribeToMonthChanges(onStoreChange: () => void) {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const scheduleRefresh = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      onStoreChange();
      scheduleRefresh();
    }, getMillisecondsUntilNextLocalMonthStart(new Date()));
  };

  const refreshWhenVisible = () => {
    if (document.visibilityState !== "visible") return;
    onStoreChange();
    scheduleRefresh();
  };

  window.addEventListener("focus", refreshWhenVisible);
  document.addEventListener("visibilitychange", refreshWhenVisible);
  scheduleRefresh();

  return () => {
    if (timer !== undefined) clearTimeout(timer);
    window.removeEventListener("focus", refreshWhenVisible);
    document.removeEventListener("visibilitychange", refreshWhenVisible);
  };
}

export default function SeasonWorkSchedule({ cropSummaries }: { cropSummaries: readonly GardenLayoutCropSummary[] }) {
  const referenceMonth = useSyncExternalStore(
    subscribeToMonthChanges,
    () => new Date().getMonth() + 1,
    () => null,
  );

  const planCrops = useMemo(
    () =>
      cropSummaries.flatMap((summary) => {
        const crop = cropById.get(summary.cropId);
        return crop ? [crop] : [];
      }),
    [cropSummaries],
  );
  const unverifiedCropNames = planCrops
    .filter((crop) => crop.seasonWindows.length === 0)
    .map((crop) => crop.commonNamePl);
  const workItems = referenceMonth === null ? [] : getUpcomingSeasonWork(planCrops, referenceMonth);
  const nextWork =
    referenceMonth !== null && workItems.length === 0 ? getNextSeasonWork(planCrops, referenceMonth) : null;
  const monthLabels =
    referenceMonth === null
      ? []
      : [referenceMonth, referenceMonth === 12 ? 1 : referenceMonth + 1].map((month) => MONTH_NAMES[month - 1]);

  return (
    <section
      aria-label="Przypomnienia o nadchodzących pracach sezonowych"
      aria-busy={referenceMonth === null}
      className="border-garden-surface/10 bg-garden-surface/5 space-y-4 rounded-xl border p-4"
    >
      <header className="space-y-1">
        <h3 className="text-garden-foreground text-lg font-semibold">Nadchodzące prace sezonowe</h3>
        {referenceMonth === null ? (
          <p className="text-garden-muted/75 text-sm">Ustalanie aktualnego miesiąca…</p>
        ) : (
          <p className="text-garden-muted/75 text-sm">
            Orientacyjne terminy na {monthLabels[0]} i {monthLabels[1]}.
          </p>
        )}
      </header>

      {referenceMonth !== null && workItems.length > 0 && (
        <ul className="space-y-4">
          {workItems.map(({ cropId, cropNamePl, window, upcomingMonths }) => (
            <li
              key={`${cropId}-${window.method}-${window.startMonth}-${window.endMonth}-${window.condition}`}
              className="border-garden-surface/10 border-t pt-3"
            >
              <p className="text-garden-foreground font-medium">
                {cropNamePl} · {SOWING_METHOD_LABELS[window.method]}
              </p>
              <p className="text-garden-muted/80 mt-1 text-sm">
                {upcomingMonths.map((month) => MONTH_NAMES[month - 1]).join(" i ")} — {window.condition}
              </p>
              <p className="text-garden-muted/70 mt-1 text-xs">
                Okno: {MONTH_NAMES[window.startMonth - 1]}–{MONTH_NAMES[window.endMonth - 1]} · pewność danych:{" "}
                {CONFIDENCE_LABELS[window.confidence]}.
              </p>
              <CropSourceLinks sourceIds={window.sourceIds} />
            </li>
          ))}
        </ul>
      )}

      {referenceMonth !== null && workItems.length === 0 && (
        <>
          <p className="text-garden-muted/80 text-sm">Brak potwierdzonych prac w bieżącym i kolejnym miesiącu.</p>
          {nextWork ? (
            <aside
              className="border-garden-accent/30 bg-garden-accent/10 rounded-lg border p-3"
              aria-label="Najbliższe późniejsze prace sezonowe"
            >
              <p className="text-garden-foreground text-sm font-semibold">
                Najbliższe późniejsze prace sezonowe wypadają w {MONTH_NAMES[nextWork.month - 1]} (termin orientacyjny).
              </p>
              <ul className="mt-2 space-y-2">
                {nextWork.items.map(({ cropId, cropNamePl, window }) => (
                  <li key={`${cropId}-${window.method}-${window.startMonth}-${window.endMonth}-${window.condition}`}>
                    <p className="text-garden-foreground text-sm font-medium">
                      {cropNamePl} · {SOWING_METHOD_LABELS[window.method]}
                    </p>
                    <p className="text-garden-muted/80 mt-1 text-sm">{window.condition}</p>
                    <p className="text-garden-muted/70 mt-1 text-xs">
                      Okno: {MONTH_NAMES[window.startMonth - 1]}–{MONTH_NAMES[window.endMonth - 1]} · pewność danych:{" "}
                      {CONFIDENCE_LABELS[window.confidence]}.
                    </p>
                    <CropSourceLinks sourceIds={window.sourceIds} />
                  </li>
                ))}
              </ul>
            </aside>
          ) : (
            <p className="text-garden-muted/70 text-sm">
              Brak dalszych potwierdzonych terminów dla upraw z tego planu.
            </p>
          )}
        </>
      )}

      {unverifiedCropNames.length > 0 && (
        <p className="border-garden-warning/30 bg-garden-warning/10 text-garden-warning rounded-md border p-3 text-sm">
          Brak potwierdzonego terminu dla: {unverifiedCropNames.join(", ")}. Te uprawy wymagają weryfikacji i nie tworzą
          przypomnienia.
        </p>
      )}
    </section>
  );
}
