interface GardenSpaceIdentity {
  persistedId: string | null;
}

interface ShouldBlockGardenSpaceSubmitInput {
  hasSavedPlan: boolean;
  initialSpaceIds: readonly string[];
  currentSpaces: readonly GardenSpaceIdentity[];
  confirm: (message: string) => boolean;
}

const STRUCTURAL_CHANGE_CONFIRMATION =
  "Dodanie lub usunięcie skrzyni albo sektora usunie zapisany układ. Po zapisaniu zmian możesz wygenerować nowy plan. Czy kontynuować?";

export function shouldBlockGardenSpaceSubmit({
  hasSavedPlan,
  initialSpaceIds,
  currentSpaces,
  confirm,
}: ShouldBlockGardenSpaceSubmitInput): boolean {
  const currentPersistedIds = new Set(
    currentSpaces.flatMap((space) => (space.persistedId === null ? [] : [space.persistedId])),
  );
  const hasAddedSpace = currentSpaces.some((space) => space.persistedId === null);
  const hasRemovedSpace = initialSpaceIds.some((initialId) => !currentPersistedIds.has(initialId));

  if (!hasSavedPlan || (!hasAddedSpace && !hasRemovedSpace)) return false;

  return !confirm(STRUCTURAL_CHANGE_CONFIRMATION);
}
