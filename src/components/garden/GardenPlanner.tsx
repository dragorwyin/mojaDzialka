import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { canGenerateGardenPlan } from "@/lib/garden-crop-selection";
import type { GardenLayoutResult } from "@/lib/garden-layout";
import GardenLayoutView from "./GardenLayoutView";

type InitialPlanStatus = "current" | "stale" | "empty" | "unavailable";

interface Props {
  initialPlan: GardenLayoutResult | null;
  initialStatus: InitialPlanStatus;
  initialGeneratedAt: string | null;
  cropNames: Record<string, string>;
  hasSpaces: boolean;
  hasCrops: boolean;
  hasUnresolvedCrops: boolean;
  inputsUnavailable: boolean;
}

interface PlanState {
  plan: GardenLayoutResult | null;
  status: InitialPlanStatus;
}

interface GenerateResponse {
  saved?: unknown;
  inputFingerprint?: unknown;
  generatedAt?: unknown;
  plan?: unknown;
}

const STATUS_LABELS: Record<InitialPlanStatus, string> = {
  current: "Aktualny",
  stale: "Nieaktualny",
  empty: "Brak planu",
  unavailable: "Status niepotwierdzony",
};

const STATUS_MESSAGES: Record<InitialPlanStatus, string> = {
  current: "Plan odpowiada zapisanym wymiarom działki i wybranemu miksowi upraw.",
  stale: "Plan nieaktualny — poprzedni układ pozostaje widoczny, ale wymaga ponownego wygenerowania.",
  empty: "Nie wygenerowano jeszcze planu działki.",
  unavailable: "Nie udało się porównać wszystkich zapisanych wejść. Nie można potwierdzić aktualności planu.",
};

const GENERATION_ERROR =
  "Nie udało się wygenerować planu. Sprawdź zapisane wymiary i wybór upraw, a następnie spróbuj ponownie.";

function layoutStatus(status: InitialPlanStatus): "current" | "stale" | "unknown" {
  if (status === "current" || status === "stale") return status;
  return "unknown";
}

export default function GardenPlanner({
  initialPlan,
  initialStatus,
  initialGeneratedAt,
  cropNames,
  hasSpaces,
  hasCrops,
  hasUnresolvedCrops: initialHasUnresolvedCrops,
  inputsUnavailable,
}: Props) {
  const [planState, setPlanState] = useState<PlanState>({ plan: initialPlan, status: initialStatus });
  const [generatedAt, setGeneratedAt] = useState(initialGeneratedAt);
  const [hasUnresolvedCrops, setHasUnresolvedCrops] = useState(initialHasUnresolvedCrops);
  const [canGenerate, setCanGenerate] = useState(
    canGenerateGardenPlan({
      inputsUnavailable,
      hasSpaces,
      hasCrops,
      hasUnresolvedCrops: initialHasUnresolvedCrops,
    }),
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const inputRevision = useRef(0);
  const statusIsAlert = planState.status === "stale" || planState.status === "unavailable";

  useEffect(() => {
    function handleCropSelectionSaved(event: Event) {
      const detail = (event as CustomEvent<{ hasCrops?: boolean; hasUnresolvedCrops?: boolean }>).detail;
      inputRevision.current += 1;
      setHasUnresolvedCrops(detail.hasUnresolvedCrops === true);
      setCanGenerate(
        canGenerateGardenPlan({
          inputsUnavailable,
          hasSpaces,
          hasCrops: detail.hasCrops === true,
          hasUnresolvedCrops: detail.hasUnresolvedCrops === true,
        }),
      );
      setPlanState((current) => (current.plan === null ? current : { ...current, status: "stale" }));
    }

    window.addEventListener("garden:inputs-saved", handleCropSelectionSaved);
    return () => {
      window.removeEventListener("garden:inputs-saved", handleCropSelectionSaved);
    };
  }, [hasSpaces, inputsUnavailable]);

  async function generatePlan() {
    if (!canGenerate || isGenerating) return;

    const revisionAtStart = inputRevision.current;
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const response = await fetch("/api/garden-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({}),
      });

      if (response.status === 401) {
        window.location.assign("/auth/signin?returnTo=%2Fgarden");
        return;
      }

      if (!response.ok) throw new Error("generation_failed");

      const result = (await response.json()) as GenerateResponse;
      if (
        result.saved !== true ||
        typeof result.inputFingerprint !== "string" ||
        typeof result.generatedAt !== "string" ||
        typeof result.plan !== "object" ||
        result.plan === null
      ) {
        throw new Error("generation_failed");
      }

      setPlanState({
        plan: result.plan as GardenLayoutResult,
        status: inputRevision.current === revisionAtStart ? "current" : "stale",
      });
      setGeneratedAt(result.generatedAt);
    } catch {
      setPlanState((current) => (current.plan === null ? current : { ...current, status: "stale" }));
      setGenerationError(GENERATION_ERROR);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <section
      aria-labelledby="garden-planner-title"
      aria-busy={isGenerating}
      className="space-y-5"
      data-plan-status={planState.status}
    >
      <header className="max-w-3xl space-y-3">
        <p className="text-garden-accent text-sm font-semibold tracking-widest uppercase">
          S-04 · Automatyczne rozmieszczenie
        </p>
        <h2 id="garden-planner-title" className="text-garden-foreground text-2xl font-bold">
          Układ działki
        </h2>
        <p className="text-garden-muted/75">
          Algorytm rozkłada wybrane uprawy na wszystkich zapisanych skrzyniach i sektorach. Nie przypisujesz ich ręcznie
          do konkretnych przestrzeni.
        </p>
      </header>

      <div className="border-garden-surface/10 bg-garden-surface/5 flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4">
        <div className="min-w-0 space-y-1">
          <p
            className={`text-sm font-semibold ${planState.status === "stale" ? "text-garden-warning" : "text-garden-foreground"}`}
            role={statusIsAlert ? "alert" : "status"}
            aria-live={statusIsAlert ? "assertive" : "polite"}
          >
            <span className="mr-2 inline-block rounded-md border border-current px-2 py-0.5 text-xs">
              {STATUS_LABELS[planState.status]}
            </span>
            {STATUS_MESSAGES[planState.status]}
          </p>
          {generatedAt && <p className="text-garden-muted/70 text-xs">Wygenerowano: {generatedAt}</p>}
        </div>

        <Button
          type="button"
          onClick={generatePlan}
          disabled={!canGenerate || isGenerating}
          className="bg-garden-accent-strong text-garden-accent-foreground hover:bg-garden-accent-hover focus-visible:ring-garden-focus rounded-lg px-4 py-2 text-sm font-semibold shadow-none transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGenerating ? "Generowanie…" : planState.plan ? "Wygeneruj ponownie" : "Wygeneruj plan"}
        </Button>
      </div>

      {!canGenerate && (
        <p className="text-garden-muted/80 text-sm" role="note">
          {inputsUnavailable
            ? "Generowanie jest wyłączone, ponieważ nie udało się odczytać wszystkich zapisanych danych."
            : !hasSpaces
              ? "Najpierw zapisz co najmniej jedną skrzynię lub sektor."
              : hasUnresolvedCrops
                ? "Zapisany wybór zawiera wycofaną lub nierozpoznaną uprawę. Usuń ją albo zamień i zapisz wybór przed generowaniem."
                : "Najpierw zapisz co najmniej jedną uprawę z poprawnym udziałem procentowym."}
        </p>
      )}

      {generationError && (
        <p
          className="border-garden-danger-border/30 bg-garden-danger-surface/10 text-garden-danger rounded-lg border px-4 py-3 text-sm"
          role="alert"
        >
          {generationError}
        </p>
      )}

      {planState.plan ? (
        <GardenLayoutView plan={planState.plan} status={layoutStatus(planState.status)} cropNames={cropNames} />
      ) : (
        <p className="border-garden-surface/10 bg-garden-surface/5 text-garden-muted/80 rounded-xl border px-4 py-5 text-sm">
          {planState.status === "unavailable"
            ? "Zapisany diagram jest chwilowo niedostępny. Spróbuj odświeżyć stronę później."
            : "Po wygenerowaniu tutaj pojawią się diagram przestrzeni, liczby roślin i porównanie z celami procentowymi."}
        </p>
      )}
    </section>
  );
}
