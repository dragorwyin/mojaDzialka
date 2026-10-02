export const CROP_ATLAS_HREF = "/crops/crop-atlas.webp";
export const CROP_ATLAS_COLUMNS = 6;
export const CROP_ATLAS_ROWS = 6;
export const CROP_ATLAS_SOURCE_WIDTH = 1275;
export const CROP_ATLAS_SOURCE_HEIGHT = 1234;
export const CROP_ATLAS_VIEWBOX_WIDTH = CROP_ATLAS_SOURCE_WIDTH;
export const CROP_ATLAS_VIEWBOX_HEIGHT = CROP_ATLAS_SOURCE_HEIGHT;

export interface CropAtlasFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropAtlasCell {
  cropId: string;
  row: number;
  column: number;
  frame: CropAtlasFrame;
}

const ACTIVE_CROP_IDS = [
  "pomidor",
  "pomidor-koktajlowy-palikowany",
  "ogorek",
  "pietruszka",
  "marchew",
  "cebula",
  "burak-cwiklowy",
  "rzodkiewka",
  "salata",
  "kapusta-biala",
  "kalafior",
  "brokul",
  "kalarepa",
  "jarmuz",
  "cukinia",
  "dynia",
  "papryka",
  "por",
  "szpinak",
  "seler",
  "kukurydza-cukrowa",
  "czosnek",
  "pasternak",
  "rukola",
  "roszponka",
  "baklazan",
  "rzepa",
  "ziemniak",
  "groch",
  "koper",
  "szczypiorek",
] as const;

// Pixel-space crops around each complete atlas illustration, with transparent
// breathing room. Some illustrations extend beyond their nominal 6x6 grid cell.
const ACTIVE_CROP_ATLAS_FRAMES: readonly CropAtlasFrame[] = [
  { x: 34, y: 48, width: 187, height: 166 },
  { x: 243, y: 12, width: 162, height: 209 },
  { x: 435, y: 20, width: 192, height: 196 },
  { x: 650, y: 10, width: 187, height: 215 },
  { x: 897, y: 13, width: 112, height: 214 },
  { x: 1116, y: 14, width: 106, height: 211 },
  { x: 24, y: 223, width: 204, height: 214 },
  { x: 240, y: 227, width: 179, height: 201 },
  { x: 430, y: 236, width: 203, height: 187 },
  { x: 645, y: 240, width: 205, height: 180 },
  { x: 861, y: 248, width: 199, height: 175 },
  { x: 1070, y: 241, width: 183, height: 181 },
  { x: 17, y: 437, width: 212, height: 197 },
  { x: 242, y: 443, width: 175, height: 184 },
  { x: 436, y: 443, width: 193, height: 185 },
  { x: 657, y: 438, width: 193, height: 189 },
  { x: 884, y: 448, width: 146, height: 180 },
  { x: 1095, y: 438, width: 153, height: 192 },
  { x: 27, y: 649, width: 211, height: 189 },
  { x: 260, y: 633, width: 177, height: 206 },
  { x: 470, y: 640, width: 175, height: 198 },
  { x: 666, y: 648, width: 180, height: 188 },
  { x: 887, y: 637, width: 169, height: 206 },
  { x: 1086, y: 646, width: 163, height: 195 },
  { x: 21, y: 853, width: 209, height: 183 },
  { x: 260, y: 843, width: 141, height: 193 },
  { x: 430, y: 845, width: 204, height: 200 },
  { x: 648, y: 854, width: 198, height: 181 },
  { x: 876, y: 857, width: 153, height: 182 },
  { x: 1119, y: 890, width: 102, height: 148 },
  { x: 46, y: 1047, width: 151, height: 177 },
];

export const CROP_THUMBNAIL_MANIFEST: readonly CropAtlasCell[] = ACTIVE_CROP_IDS.map((cropId, index) => ({
  cropId,
  row: Math.floor(index / CROP_ATLAS_COLUMNS),
  column: index % CROP_ATLAS_COLUMNS,
  frame: ACTIVE_CROP_ATLAS_FRAMES[index],
}));

const CROP_THUMBNAILS_BY_ID = new Map(CROP_THUMBNAIL_MANIFEST.map((cell) => [cell.cropId, cell]));

export type CropThumbnailPresentation =
  { kind: "atlas"; cell: CropAtlasCell; fallbackLabel: string } | { kind: "text"; fallbackLabel: string };

export function getCropAtlasCell(cropId: string): CropAtlasCell | null {
  return CROP_THUMBNAILS_BY_ID.get(cropId) ?? null;
}

export function getCropAtlasCellViewBox(cell: CropAtlasCell): string {
  const { x, y, width, height } = cell.frame;
  return `${x} ${y} ${width} ${height}`;
}

export function resolveCropThumbnailPresentation(cropId: string, fallbackLabel: string): CropThumbnailPresentation {
  const cell = getCropAtlasCell(cropId);
  return cell === null ? { kind: "text", fallbackLabel } : { kind: "atlas", cell, fallbackLabel };
}
