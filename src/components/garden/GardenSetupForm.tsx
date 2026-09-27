import { useState } from "react";

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
          className="rounded-lg border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100"
          role="status"
        >
          Działka została zapisana.
        </p>
      )}
      {error && (
        <p className="rounded-lg border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100" role="alert">
          {ERROR_MESSAGES[error] ?? "Nie udało się zapisać danych. Sprawdź formularz i spróbuj ponownie."}
        </p>
      )}

      <div className="space-y-4">
        {spaces.map((space, index) => (
          <fieldset key={space.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <legend className="px-2 text-sm font-semibold text-blue-100">Przestrzeń {index + 1}</legend>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-blue-100/80">
                <span>Nazwa</span>
                <input
                  name="spaceName"
                  value={space.name}
                  onChange={(event) => {
                    updateSpace(index, { name: event.target.value });
                  }}
                  maxLength={80}
                  required
                  className="w-full rounded-lg border border-white/15 bg-slate-950/40 px-3 py-2 text-white outline-none focus:border-purple-300"
                />
              </label>
              <label className="space-y-2 text-sm text-blue-100/80">
                <span>Typ</span>
                <select
                  name="spaceType"
                  value={space.spaceType}
                  onChange={(event) => {
                    updateSpace(index, { spaceType: event.target.value as SpaceType });
                  }}
                  className="w-full rounded-lg border border-white/15 bg-slate-950/40 px-3 py-2 text-white outline-none focus:border-purple-300"
                >
                  <option value="bed">Skrzynia</option>
                  <option value="sector">Sektor</option>
                </select>
              </label>
              <label className="space-y-2 text-sm text-blue-100/80">
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
                  className="w-full rounded-lg border border-white/15 bg-slate-950/40 px-3 py-2 text-white outline-none focus:border-purple-300"
                />
              </label>
              <label className="space-y-2 text-sm text-blue-100/80">
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
                  className="w-full rounded-lg border border-white/15 bg-slate-950/40 px-3 py-2 text-white outline-none focus:border-purple-300"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={() => {
                removeSpace(index);
              }}
              disabled={spaces.length === 1}
              className="mt-4 text-sm text-rose-200 transition-colors hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Usuń tę przestrzeń
            </button>
          </fieldset>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={addSpace}
          className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
        >
          + Dodaj skrzynię lub sektor
        </button>
        <button
          type="submit"
          className="rounded-lg bg-purple-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-purple-300"
        >
          Zapisz działkę
        </button>
      </div>
    </form>
  );
}
