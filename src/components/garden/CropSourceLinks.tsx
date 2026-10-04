import { CROP_SOURCES, type SourceId } from "../../data/crop-catalog.js";

const sourceById = new Map(CROP_SOURCES.map((source) => [source.id, source] as const));

export default function CropSourceLinks({ sourceIds }: { sourceIds: readonly SourceId[] }) {
  if (sourceIds.length === 0) return <span>Brak wskazanego źródła.</span>;

  return (
    <ul className="mt-1 list-disc space-y-1 pl-5">
      {sourceIds.map((sourceId) => {
        const source = sourceById.get(sourceId);
        return (
          <li key={sourceId}>
            {source ? (
              <>
                <a className="text-garden-accent underline underline-offset-2" href={source.url}>
                  {source.title}
                </a>
                <span className="text-garden-muted/70"> — {source.context}</span>
              </>
            ) : (
              `Nieznane źródło ${sourceId}`
            )}
          </li>
        );
      })}
    </ul>
  );
}
