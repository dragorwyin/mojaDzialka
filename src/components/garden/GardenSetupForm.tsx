import { useState } from "react";
import { Button } from "@/components/ui/button";

type SpaceType = "bed" | "sector";

interface GardenSpace {
  id: string;
  name: string;
  spaceType: SpaceType;
  widthCm: string;
  lengthCm: string;
}

interface Props {
  initialSpaces: GardenSpace[];
  error: string | null;
  saved: boolean;
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid_spaces: "Sprawdź nazwy, typy i dodatnie wymiary wszystkich przestrzeni.",
  save_failed: "Nie udało się zapisać działki. Spróbuj ponownie.",
  unavailable: "Zapisywanie działki jest chwilowo niedostępne.",
};

function createSpace(index: number): GardenSpace {
  return {
    id: `space-${index}`,
    name: `Skrzynia ${index}`,
    spaceType: "bed",
    widthCm: "120",
    lengthCm: "80",
  };
}

export default function GardenSetupForm({ initialSpaces, error, saved }: Props) {
  const [spaces, setSpaces] = useState<GardenSpace[]>(initialSpaces.length ? initialSpaces : [createSpace(1)]);

  function updateSpace(index: number, patch: Partial<GardenSpace>) {
    setSpaces((current) => current.map((space, spaceIndex) => (spaceIndex === index ? { ...space, ...patch } : space)));
  }

  function addSpace() {
    setSpaces((current) => [...current, { ...createSpace(current.length + 1), id: crypto.randomUUID() }]);
  }

  function removeSpace(index: number) {
    setSpaces((current) => (current.length === 1 ? current : current.filter((_, spaceIndex) => spaceIndex !== index)));
  }

  return (
    <form method="POST" action="/api/garden" className="space-y-6">
      {saved && (
        <p
          className="border-garden-success-border/30 bg-garden-success-surface/10 text-garden-success rounded-lg border px-4 py-3 text-sm"
          role="status"
        >
          Działka została zapisana.
        </p>
      )}
      {error && (
        <p
          className="border-garden-danger-border/30 bg-garden-danger-surface/10 text-garden-danger rounded-lg border px-4 py-3 text-sm"
          role="alert"
        >
          {ERROR_MESSAGES[error] ?? "Nie udało się zapisać danych. Sprawdź formularz i spróbuj ponownie."}
        </p>
      )}

      <div className="space-y-4">
        {spaces.map((space, index) => (
          <fieldset key={space.id} className="border-garden-surface/10 bg-garden-surface/5 rounded-xl border p-4">
            <legend className="text-garden-muted px-2 text-sm font-semibold">Przestrzeń {index + 1}</legend>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-garden-muted/80 space-y-2 text-sm">
                <span>Nazwa</span>
                <input
                  name="spaceName"
                  value={space.name}
                  onChange={(event) => {
                    updateSpace(index, { name: event.target.value });
                  }}
                  maxLength={80}
                  required
                  className="border-garden-surface/15 bg-garden-input/40 text-garden-foreground focus:border-garden-accent-hover focus-visible:ring-garden-focus w-full rounded-lg border px-3 py-2 outline-none focus-visible:ring-2"
                />
              </label>
              <label className="text-garden-muted/80 space-y-2 text-sm">
                <span>Typ</span>
                <select
                  name="spaceType"
                  value={space.spaceType}
                  onChange={(event) => {
                    updateSpace(index, { spaceType: event.target.value as SpaceType });
                  }}
                  className="border-garden-surface/15 bg-garden-input/40 text-garden-foreground focus:border-garden-accent-hover focus-visible:ring-garden-focus w-full rounded-lg border px-3 py-2 outline-none focus-visible:ring-2"
                >
                  <option value="bed">Skrzynia</option>
                  <option value="sector">Sektor</option>
                </select>
              </label>
              <label className="text-garden-muted/80 space-y-2 text-sm">
                <span>Szerokość (cm)</span>
                <input
                  name="widthCm"
                  type="number"
                  min="1"
                  max="100000"
                  step="1"
                  value={space.widthCm}
                  onChange={(event) => {
                    updateSpace(index, { widthCm: event.target.value });
                  }}
                  required
                  className="border-garden-surface/15 bg-garden-input/40 text-garden-foreground focus:border-garden-accent-hover focus-visible:ring-garden-focus w-full rounded-lg border px-3 py-2 outline-none focus-visible:ring-2"
                />
              </label>
              <label className="text-garden-muted/80 space-y-2 text-sm">
                <span>Długość (cm)</span>
                <input
                  name="lengthCm"
                  type="number"
                  min="1"
                  max="100000"
                  step="1"
                  value={space.lengthCm}
                  onChange={(event) => {
                    updateSpace(index, { lengthCm: event.target.value });
                  }}
                  required
                  className="border-garden-surface/15 bg-garden-input/40 text-garden-foreground focus:border-garden-accent-hover focus-visible:ring-garden-focus w-full rounded-lg border px-3 py-2 outline-none focus-visible:ring-2"
                />
              </label>
            </div>
            <Button
              type="button"
              onClick={() => {
                removeSpace(index);
              }}
              disabled={spaces.length === 1}
              variant="ghost"
              className="text-garden-danger-muted hover:text-garden-danger focus-visible:ring-garden-focus mt-4 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              Usuń tę przestrzeń
            </Button>
          </fieldset>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={addSpace}
          variant="outline"
          className="border-garden-surface/20 bg-garden-surface/10 text-garden-foreground hover:bg-garden-surface/20 focus-visible:ring-garden-focus rounded-lg px-4 py-2 text-sm font-medium shadow-none transition-colors"
        >
          + Dodaj skrzynię lub sektor
        </Button>
        <Button
          type="submit"
          className="bg-garden-accent-strong text-garden-accent-foreground hover:bg-garden-accent-hover focus-visible:ring-garden-focus rounded-lg px-4 py-2 text-sm font-semibold shadow-none transition-colors"
        >
          Zapisz działkę
        </Button>
      </div>
    </form>
  );
}
