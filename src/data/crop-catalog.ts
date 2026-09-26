export type CatalogTier = "core" | "extended";
export type Confidence = "high" | "medium" | "low";
export type CompanionStatus = "supported" | "caution";
export type RelationshipType =
  "space_saving" | "pest_management" | "habitat" | "rotation" | "disease_risk" | "folklore";
export type SowingMethod = "direct_sow" | "seedling" | "plant_out" | "overwintering";

export type SourceId = "S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "S7" | "S8" | "S9" | "S10" | "S11" | "S12" | "S14";

export interface SourceReference {
  id: SourceId;
  title: string;
  url: string;
  context: string;
}

export interface NumericRange {
  min: number;
  max: number;
}

export interface SpacingData {
  publishedPairCm: readonly [number, number] | null;
  inRowCm: NumericRange | null;
  betweenRowsCm: NumericRange | null;
  context: string;
  sourceIds: readonly SourceId[];
  confidence: Confidence;
  axisVerified: boolean;
}

export interface SeasonWindow {
  startMonth: number;
  endMonth: number;
  method: SowingMethod;
  condition: string;
  sourceIds: readonly SourceId[];
  confidence: Confidence;
}

export interface CropCatalogEntry {
  id: string;
  commonNamePl: string;
  aliases: readonly string[];
  catalogTier: CatalogTier;
  sourceIds: readonly SourceId[];
  spacing: SpacingData | null;
  seasonWindows: readonly SeasonWindow[];
  needsLocalValidation: boolean;
  validationNotes?: string;
}

export interface CompanionRelation {
  cropIds: readonly [string, string];
  status: CompanionStatus;
  relationshipType: RelationshipType;
  confidence: Confidence;
  rationale: string;
  sourceIds: readonly SourceId[];
  conflictNote?: string;
  hardBlock: boolean;
}

export const CROP_SOURCES: readonly SourceReference[] = [
  {
    id: "S1",
    title: "Journal of Ethnobiology: Polish allotment gardeners",
    url: "https://journals.sagepub.com/doi/full/10.2993/0278-0771-38.1.123",
    context: "Badanie etnobotaniczne 46 działkowców w trzech polskich miastach w 2009 r.",
  },
  {
    id: "S2",
    title: "WODR: Warzywa w przydomowym ogrodku",
    url: "https://www.wodr.poznan.pl/doradztwo/rozwoj-obszarow-wiejskich/warzywa-w-przydomowym-ogrodku-jakie-wybrac-i-jak-o-nie-zadbac",
    context: "Praktyczne gatunki, terminy i przykłady sąsiedztwa.",
  },
  {
    id: "S3",
    title: "WODR: Ekologiczna uprawa warzyw",
    url: "https://www.wodr.poznan.pl/doradztwo/produkcja-roslinna/ekologiczna-uprawa-warzyw",
    context: "Płodozmian, grupy roślin i ostrożne uwagi o sąsiedztwie.",
  },
  {
    id: "S4",
    title: "ZPE: przygotowanie terenu pod rośliny warzywne i przyprawowe",
    url: "https://zpe.gov.pl/a/wybor-i-przygotowanie-terenu-pod-uprawe-roslin-warzywnych-i-przyprawowych/DnOKx7CLp",
    context: "Polski materiał edukacyjny i lista gatunków.",
  },
  {
    id: "S5",
    title: "CDR: Papryka i warzywa polowe",
    url: "https://www.cdr.gov.pl/images/Radom/2017/11-12/cdr_papryka_poprawka_2.pdf",
    context: "Kontekst produkcyjny, rozsada, terminy i ostrożność fitosanitarna.",
  },
  {
    id: "S6",
    title: "ROD Czapla: Terminarz siewu warzyw",
    url: "http://rodczaplaznin.com.pl/rozne-dokumenty/terminarze-siewu/termin-siewu-warzyw.pdf",
    context: "Tabela działkowa terminów i opublikowanych par rozstaw.",
  },
  {
    id: "S7",
    title: "SODR: Warzywa gruntowe — ilości i terminy",
    url: "https://www.sodr.pl/main/aktualnosci/Warzywa-gruntowe-ilosci-i-terminy/idn:4111",
    context: "Aktualny polski materiał terminowy z 2026 r.",
  },
  {
    id: "S8",
    title: "SODR: Pora na sadzenie czosnku",
    url: "https://www.sodr.pl/pliki/Pora-na-sadzenie-czosnku--Malgorzata-Milek,814.pdf",
    context: "Termin i rozstawa czosnku.",
  },
  {
    id: "S9",
    title: "COMPO: Kalendarz wysiewu",
    url: "https://www.compo.pl/doradca/pielegnacja-roslin/prawidlowe-sadzenie-roslin/kalendarz-wysiewu",
    context: "Pomocnicze okna siewu i rozróżnienie roślin ciepłolubnych.",
  },
  {
    id: "S10",
    title: "University of Minnesota Extension: Crop and field planning tools",
    url: "https://extension.umn.edu/vegetable-growing-guides-farmers/crop-and-field-planning-tools-vegetable-farmers",
    context: "Niezależny sanity check rozstaw i grup temperaturowych; nie kalendarz polski.",
  },
  {
    id: "S11",
    title: "University of Minnesota Extension: Companion planting",
    url: "https://extension.umn.edu/gardening-minnesota/companion-planting-home-gardens",
    context: "Ograniczone przykłady oparte na badaniach i ostrzeżenie przed listami internetowymi.",
  },
  {
    id: "S12",
    title: "Washington State University: Gardening with companion plants",
    url: "https://pubs.extension.wsu.edu/product/gardening-with-companion-plants-home-garden-series/",
    context: "Krytyka nieudokumentowanych tabel i rozróżnienie folkloru od intercroppingu.",
  },
  {
    id: "S14",
    title: "COBORU: Wyniki PDO rośliny warzywne 2024",
    url: "https://coboru.gov.pl/Publikacje_COBORU/Wyniki_PDO/WPDO_222_rosliny_warzywne_2024.pdf",
    context: "Obecność gatunków w badaniach odmianowych; nie ranking popularności.",
  },
];

const publishedSpacing = (
  firstCm: number,
  secondCm: number,
  context: string,
  sourceIds: readonly SourceId[],
  confidence: Confidence = "medium",
): SpacingData => ({
  publishedPairCm: [firstCm, secondCm],
  inRowCm: null,
  betweenRowsCm: null,
  context,
  sourceIds,
  confidence,
  axisVerified: false,
});

const verifiedSpacing = (
  inRowCm: NumericRange,
  betweenRowsCm: NumericRange,
  context: string,
  sourceIds: readonly SourceId[],
  confidence: Confidence = "medium",
): SpacingData => ({
  publishedPairCm: null,
  inRowCm,
  betweenRowsCm,
  context,
  sourceIds,
  confidence,
  axisVerified: true,
});

const season = (
  startMonth: number,
  endMonth: number,
  method: SowingMethod,
  condition: string,
  sourceIds: readonly SourceId[],
  confidence: Confidence = "medium",
): SeasonWindow => ({
  startMonth,
  endMonth,
  method,
  condition,
  sourceIds,
  confidence,
});

export const CROP_CATALOG: readonly CropCatalogEntry[] = [
  {
    id: "pomidor",
    commonNamePl: "pomidor",
    aliases: ["pomidory", "tomato"],
    catalogTier: "core",
    sourceIds: ["S1", "S4", "S5", "S6", "S7", "S9"],
    spacing: publishedSpacing(
      80,
      50,
      "Odmiana wysoka; para S6 wymaga kontroli osi i zależy od podpory.",
      ["S6"],
      "medium",
    ),
    seasonWindows: [
      season(3, 5, "seedling", "Wysiew rozsady pod osłoną; kwietniowego wysiewu nie traktować jako terminu gruntu.", [
        "S6",
        "S9",
      ]),
      season(
        5,
        6,
        "plant_out",
        "Sadzenie po połowie maja i po ustąpieniu ryzyka przymrozków; lokalnie później.",
        ["S5", "S6", "S7"],
        "medium",
      ),
    ],
    needsLocalValidation: true,
    validationNotes: "Zweryfikować oś rozstawy S6 i wariant prowadzenia przed użyciem w układzie.",
  },
  {
    id: "ogorek",
    commonNamePl: "ogórek",
    aliases: ["ogórki", "cucumber"],
    catalogTier: "core",
    sourceIds: ["S1", "S2", "S4", "S5", "S6", "S7", "S9"],
    spacing: publishedSpacing(
      10,
      135,
      "Rozstaw silnie zależy od prowadzenia; para S6 bez zweryfikowanych osi.",
      ["S6"],
      "medium",
    ),
    seasonWindows: [
      season(4, 4, "seedling", "Rozsada w cieple; nie przenosić terminu bezpośrednio na grunt.", ["S6", "S9"]),
      season(5, 6, "direct_sow", "Siew lub sadzenie po przymrozkach; ogórek jest bardzo wrażliwy na chłód.", [
        "S2",
        "S6",
        "S7",
        "S9",
      ]),
    ],
    needsLocalValidation: true,
    validationNotes: "Zweryfikować oś rozstawy S6 i sposób prowadzenia.",
  },
  {
    id: "fasola-zwykla",
    commonNamePl: "fasola zwykła",
    aliases: ["fasola", "fasola szparagowa", "common bean"],
    catalogTier: "core",
    sourceIds: ["S1", "S2", "S4", "S6", "S7", "S9"],
    spacing: publishedSpacing(
      10,
      40,
      "Para S6 dla formy podstawowej; forma karłowa i pnąca wymagają osobnych wariantów.",
      ["S6"],
      "low",
    ),
    seasonWindows: [
      season(5, 7, "direct_sow", "Siew po ryzyku przymrozków i po ogrzaniu gleby.", ["S2", "S6", "S7", "S9"]),
    ],
    needsLocalValidation: true,
    validationNotes: "Dodać wariant karłowy/pnący dopiero po osobnej walidacji rozstawy.",
  },
  {
    id: "pietruszka",
    commonNamePl: "pietruszka korzeniowa/naciowa",
    aliases: ["pietruszka", "parsley"],
    catalogTier: "core",
    sourceIds: ["S1", "S4", "S6", "S7"],
    spacing: publishedSpacing(
      4,
      30,
      "Tabela S6 łączy warianty korzeniowy i naciowy; para nie ma zweryfikowanych osi.",
      ["S6"],
      "medium",
    ),
    seasonWindows: [
      season(3, 6, "direct_sow", "Siew bezpośredni; wolne wschody i potrzeba utrzymania wilgotności.", ["S6", "S7"]),
    ],
    needsLocalValidation: true,
    validationNotes: "Rozdzielić wariant korzeniowy i naciowy po potwierdzeniu odmiany oraz osi rozstawy.",
  },
  {
    id: "marchew",
    commonNamePl: "marchew",
    aliases: ["carrot"],
    catalogTier: "core",
    sourceIds: ["S2", "S4", "S5", "S6", "S7", "S10"],
    spacing: publishedSpacing(5, 25, "Siew rzędowy z przerywką; para S6 wymaga kontroli osi.", ["S6"], "medium"),
    seasonWindows: [
      season(3, 6, "direct_sow", "Siew bezpośredni; po wschodach konieczna przerywka.", ["S6", "S7", "S9"]),
    ],
    needsLocalValidation: true,
    validationNotes: "Rzodkiewka może pełnić funkcję markera rzędu, ale nie jest to poprawka rozstawy.",
  },
  {
    id: "cebula",
    commonNamePl: "cebula",
    aliases: ["onion"],
    catalogTier: "core",
    sourceIds: ["S2", "S4", "S5", "S6", "S7"],
    spacing: publishedSpacing(
      5,
      30,
      "S6; typ uprawy (siew, dymka, rozsada) zmienia praktyczny rozstaw.",
      ["S6"],
      "medium",
    ),
    seasonWindows: [
      season(3, 4, "direct_sow", "Siew lub dymka; wariant zależy od materiału sadzeniowego.", ["S6", "S7"]),
    ],
    needsLocalValidation: true,
    validationNotes: "Rozdzielić siew, dymkę i rozsadę przed dokładnym planowaniem.",
  },
  {
    id: "burak-cwiklowy",
    commonNamePl: "burak ćwikłowy",
    aliases: ["burak", "beetroot", "beet"],
    catalogTier: "core",
    sourceIds: ["S2", "S4", "S6", "S7"],
    spacing: publishedSpacing(5, 30, "Rozstaw S6 zależy od zbioru młodego lub dojrzałego.", ["S6"], "medium"),
    seasonWindows: [season(4, 6, "direct_sow", "Siew po ogrzaniu gleby; możliwe kolejne siewy.", ["S6", "S7"])],
    needsLocalValidation: true,
    validationNotes: "Dodać osobny kontekst dla botwiny i korzeni do przechowania.",
  },
  {
    id: "rzodkiewka",
    commonNamePl: "rzodkiewka",
    aliases: ["rzodkiew", "radish"],
    catalogTier: "core",
    sourceIds: ["S2", "S4", "S6", "S7", "S10"],
    spacing: publishedSpacing(
      10,
      15,
      "S6; siew gęsty i rzodkiew na przechowanie wymagają różnych interpretacji.",
      ["S6"],
      "medium",
    ),
    seasonWindows: [
      season(3, 7, "direct_sow", "Siewy sukcesywne w chłodniejszych oknach; zakres zależy od odmiany.", [
        "S2",
        "S6",
        "S7",
        "S9",
      ]),
    ],
    needsLocalValidation: true,
    validationNotes: "Nie traktować jednej wartości jako normy dla wszystkich terminów i odmian.",
  },
  {
    id: "salata",
    commonNamePl: "sałata",
    aliases: ["lettuce"],
    catalogTier: "core",
    sourceIds: ["S2", "S4", "S6", "S7", "S9"],
    spacing: publishedSpacing(20, 15, "S6; zbiór główek i baby leaf mają różny cel rozstawy.", ["S6"], "medium"),
    seasonWindows: [
      season(3, 7, "direct_sow", "Wczesne i kolejne siewy; odmiana wyznacza tolerancję temperatury.", [
        "S6",
        "S7",
        "S9",
      ]),
    ],
    needsLocalValidation: true,
    validationNotes: "Oddzielić główki i baby leaf, zanim rozstaw będzie użyty do alokacji.",
  },
  {
    id: "kapusta-biala",
    commonNamePl: "kapusta biała",
    aliases: ["kapusta", "white cabbage"],
    catalogTier: "core",
    sourceIds: ["S4", "S5", "S6", "S7"],
    spacing: publishedSpacing(
      40,
      40,
      "Para S6 dla grupy kapusty; odmiana i termin zmieniają pokrój.",
      ["S6"],
      "medium",
    ),
    seasonWindows: [
      season(3, 5, "seedling", "Rozsada wczesna lub późna; termin zależny od odmiany.", ["S6", "S7"]),
      season(4, 6, "plant_out", "Sadzenie wiosenne z uwzględnieniem odporności na chłód.", ["S6", "S7"]),
    ],
    needsLocalValidation: true,
    validationNotes: "Nie mieszać kapusty białej z innymi kapustnymi w jednym parametrze odmianowym.",
  },
  {
    id: "kalafior",
    commonNamePl: "kalafior",
    aliases: ["cauliflower"],
    catalogTier: "core",
    sourceIds: ["S4", "S5", "S6", "S7"],
    spacing: publishedSpacing(40, 40, "Para S6; termin i odmiana mają znaczenie.", ["S6"], "medium"),
    seasonWindows: [
      season(3, 5, "seedling", "Rozsada dla wariantu wczesnego lub późnego.", ["S6", "S7"]),
      season(4, 6, "plant_out", "Sadzenie wiosenne zależne od odporności na chłód.", ["S6", "S7"]),
    ],
    needsLocalValidation: true,
    validationNotes: "Zweryfikować wariant odmianowy przed precyzyjnym układem.",
  },
  {
    id: "brokul",
    commonNamePl: "brokuł",
    aliases: ["broccoli"],
    catalogTier: "core",
    sourceIds: ["S4", "S5", "S6", "S7", "S10"],
    spacing: publishedSpacing(
      50,
      50,
      "S6; S10 daje niezależny zakres sanity check, ale bez polskiej normy.",
      ["S6", "S10"],
      "medium",
    ),
    seasonWindows: [
      season(3, 5, "seedling", "Rozsada; wariant wczesny lub późny.", ["S6", "S7"]),
      season(4, 7, "plant_out", "Sadzenie wiosenne i późniejsze okna produkcyjne.", ["S7"]),
    ],
    needsLocalValidation: true,
    validationNotes: "Zachować konflikt zakresów S6/S10 zamiast wybierać jedną fałszywie dokładną wartość.",
  },
  {
    id: "kalarepa",
    commonNamePl: "kalarepa",
    aliases: ["kohlrabi"],
    catalogTier: "core",
    sourceIds: ["S4", "S6", "S7"],
    spacing: publishedSpacing(20, 30, "Para S6; zależy od terminu i wielkości zbioru.", ["S6"], "medium"),
    seasonWindows: [
      season(3, 5, "seedling", "Rozsada lub siew w chłodniejszym oknie.", ["S6", "S7"]),
      season(4, 6, "plant_out", "Sadzenie wiosenne; możliwe kolejne terminy.", ["S6", "S7"]),
    ],
    needsLocalValidation: true,
    validationNotes: "Wariant zbioru młodego wymaga osobnej interpretacji rozstawy.",
  },
  {
    id: "jarmuz",
    commonNamePl: "jarmuż",
    aliases: ["kale"],
    catalogTier: "core",
    sourceIds: ["S4", "S6", "S7"],
    spacing: publishedSpacing(
      50,
      45,
      "Duży pokrój dojrzałej rośliny; para S6 bez zweryfikowanych osi.",
      ["S6"],
      "medium",
    ),
    seasonWindows: [
      season(4, 6, "seedling", "Rozsada lub siew zależnie od odmiany.", ["S6", "S7"]),
      season(5, 7, "plant_out", "Sadzenie po przygotowaniu rozsady; toleruje chłód.", ["S7", "S9"]),
    ],
    needsLocalValidation: true,
    validationNotes: "Zweryfikować oś rozstawy i wariant zbioru liści.",
  },
  {
    id: "groch",
    commonNamePl: "groch",
    aliases: ["pea"],
    catalogTier: "core",
    sourceIds: ["S2", "S4", "S6", "S7", "S10"],
    spacing: publishedSpacing(25, 50, "Podpora i odmiana zmieniają układ; para S6 bez kontroli osi.", ["S6"], "medium"),
    seasonWindows: [season(3, 4, "direct_sow", "Wczesny siew bezpośredni.", ["S2", "S6", "S7"])],
    needsLocalValidation: true,
    validationNotes: "Rozdzielić odmiany karłowe i wymagające podpory.",
  },
  {
    id: "bob",
    commonNamePl: "bób",
    aliases: ["broad bean", "fava bean"],
    catalogTier: "core",
    sourceIds: ["S2", "S4", "S6", "S7"],
    spacing: publishedSpacing(40, 20, "Para S6; wariant wczesny i późny może różnić się pokrojem.", ["S6"], "medium"),
    seasonWindows: [season(3, 4, "direct_sow", "Siew wczesny; bób toleruje chłód.", ["S2", "S6", "S7"])],
    needsLocalValidation: true,
    validationNotes: "Zweryfikować oś rozstawy przed alokacją powierzchni.",
  },
  {
    id: "cukinia",
    commonNamePl: "cukinia",
    aliases: ["zucchini", "courgette"],
    catalogTier: "core",
    sourceIds: ["S2", "S4", "S5", "S6", "S7", "S9"],
    spacing: publishedSpacing(80, 80, "Duża powierzchnia; para S6 bez zweryfikowanych osi.", ["S6"], "medium"),
    seasonWindows: [
      season(4, 4, "seedling", "Rozsada w cieple.", ["S6", "S9"]),
      season(5, 5, "direct_sow", "Siew po ogrzaniu gleby i ryzyku przymrozków.", ["S6", "S7", "S9"]),
      season(5, 6, "plant_out", "Sadzenie po połowie maja, zależnie od lokalnych warunków.", ["S2", "S6", "S7"]),
    ],
    needsLocalValidation: true,
    validationNotes: "Wariant prowadzony i forma krzaczasta mogą wymagać innych zakresów.",
  },
  {
    id: "dynia",
    commonNamePl: "dynia",
    aliases: ["pumpkin", "winter squash"],
    catalogTier: "core",
    sourceIds: ["S4", "S6", "S7", "S9"],
    spacing: publishedSpacing(100, 150, "Bardzo duża przestrzeń; para S6 bez zweryfikowanych osi.", ["S6"], "medium"),
    seasonWindows: [
      season(4, 4, "seedling", "Rozsada w cieple.", ["S6", "S9"]),
      season(5, 5, "direct_sow", "Siew po ogrzaniu gleby i ryzyku przymrozków.", ["S6", "S7", "S9"]),
      season(5, 6, "plant_out", "Sadzenie po połowie maja, lokalnie później.", ["S6", "S7"]),
    ],
    needsLocalValidation: true,
    validationNotes: "Warianty dyni mają bardzo różny pokrój; nie uogólniać jednej pary.",
  },
  {
    id: "papryka",
    commonNamePl: "papryka",
    aliases: ["pepper", "sweet pepper"],
    catalogTier: "core",
    sourceIds: ["S4", "S5", "S6", "S7", "S9"],
    spacing: publishedSpacing(40, 50, "Uprawa z rozsady; para S6 bez zweryfikowanych osi.", ["S6"], "medium"),
    seasonWindows: [
      season(3, 4, "seedling", "Wysiew rozsady w ogrzewanym miejscu.", ["S5", "S6", "S9"]),
      season(5, 6, "plant_out", "Sadzenie do gruntu po połowie maja, lokalnie później.", ["S5", "S6", "S7"]),
    ],
    needsLocalValidation: true,
    validationNotes: "Nie stosować terminu rozsady jako terminu gruntu.",
  },
  {
    id: "por",
    commonNamePl: "por",
    aliases: ["leek"],
    catalogTier: "core",
    sourceIds: ["S4", "S6", "S7"],
    spacing: publishedSpacing(
      5,
      40,
      "Głębokość sadzenia jest osobną cechą; para S6 bez zweryfikowanych osi.",
      ["S6"],
      "medium",
    ),
    seasonWindows: [
      season(3, 5, "seedling", "Rozsada wiosenna.", ["S6", "S7"]),
      season(5, 7, "plant_out", "Sadzenie późną wiosną i latem.", ["S7"]),
    ],
    needsLocalValidation: true,
    validationNotes: "Nie mieszać rozstawy z głębokością sadzenia.",
  },
  {
    id: "szpinak",
    commonNamePl: "szpinak",
    aliases: ["spinach"],
    catalogTier: "core",
    sourceIds: ["S4", "S6", "S7", "S10"],
    spacing: publishedSpacing(
      3,
      15,
      "S6 podaje gęsty siew; S10 opisuje liczbę nasion, więc wartości nie są równoważne.",
      ["S6", "S10"],
      "low",
    ),
    seasonWindows: [
      season(3, 6, "direct_sow", "Siew w chłodniejszych oknach; odmiana wpływa na termin.", ["S6", "S7", "S10"]),
      season(8, 9, "direct_sow", "Późne okno może być użyteczne dla zbioru jesiennego.", ["S7", "S10"], "low"),
    ],
    needsLocalValidation: true,
    validationNotes: "Nie porównywać bezpośrednio gęstości S6 z liczbą nasion S10.",
  },
  {
    id: "seler",
    commonNamePl: "seler",
    aliases: ["celery"],
    catalogTier: "extended",
    sourceIds: ["S4", "S6", "S7"],
    spacing: publishedSpacing(50, 35, "Długa uprawa z rozsady; para S6 bez zweryfikowanych osi.", ["S6"], "medium"),
    seasonWindows: [
      season(3, 5, "seedling", "Rozsada wymaga długiego sezonu.", ["S6", "S7"]),
      season(5, 6, "plant_out", "Sadzenie późną wiosną po przygotowaniu rozsady.", ["S7"]),
    ],
    needsLocalValidation: true,
    validationNotes: "Rozdzielić seler korzeniowy i naciowy przed użyciem rozstawy.",
  },
  {
    id: "kukurydza-cukrowa",
    commonNamePl: "kukurydza cukrowa",
    aliases: ["kukurydza", "sweet corn"],
    catalogTier: "extended",
    sourceIds: ["S4", "S5", "S6", "S9"],
    spacing: publishedSpacing(
      50,
      28,
      "Układ blokowy pomaga w zapyleniu; para S6 bez zweryfikowanych osi.",
      ["S6"],
      "medium",
    ),
    seasonWindows: [
      season(5, 6, "direct_sow", "Siew od połowy maja na ciepłą glebę; lepszy układ blokowy.", ["S5", "S6", "S9"]),
    ],
    needsLocalValidation: true,
    validationNotes: "Nie wyliczać plonu z samej powierzchni bez uwzględnienia układu bloku.",
  },
  {
    id: "czosnek",
    commonNamePl: "czosnek",
    aliases: ["garlic"],
    catalogTier: "core",
    sourceIds: ["S6", "S8"],
    spacing: verifiedSpacing(
      { min: 8, max: 12 },
      { min: 20, max: 25 },
      "Źródło S8 podaje odstęp w rzędzie i między rzędami.",
      ["S8"],
      "high",
    ),
    seasonWindows: [
      season(
        9,
        10,
        "overwintering",
        "Czosnek zimowy: połowa września–koniec października, zależnie od pogody.",
        ["S8"],
        "high",
      ),
      season(3, 3, "direct_sow", "Czosnek wiosenny: wczesna wiosna.", ["S8"], "medium"),
    ],
    needsLocalValidation: false,
  },
  {
    id: "pasternak",
    commonNamePl: "pasternak",
    aliases: ["parsnip"],
    catalogTier: "extended",
    sourceIds: ["S4", "S6", "S7"],
    spacing: publishedSpacing(20, 30, "Tabela S6; brak niezależnej polskiej kontroli osi.", ["S6"], "low"),
    seasonWindows: [season(3, 6, "direct_sow", "Siew bezpośredni; wolne wschody.", ["S6", "S7"], "medium")],
    needsLocalValidation: true,
    validationNotes: "Potwierdzić oś rozstawy oraz aktualne okno dla odmiany.",
  },
  {
    id: "rukola",
    commonNamePl: "rukola",
    aliases: ["arugula", "rocket"],
    catalogTier: "extended",
    sourceIds: ["S4", "S6", "S9"],
    spacing: publishedSpacing(15, 15, "S6; szybki zbiór liści może zmieniać praktyczną gęstość.", ["S6"], "low"),
    seasonWindows: [season(3, 8, "direct_sow", "Siewy sukcesywne w chłodniejszych oknach.", ["S6", "S9"], "low")],
    needsLocalValidation: true,
    validationNotes: "Brak wystarczających danych o popularności i wariantach zbioru.",
  },
  {
    id: "roszponka",
    commonNamePl: "roszponka",
    aliases: ["lambs lettuce", "lamb's lettuce"],
    catalogTier: "extended",
    sourceIds: ["S4", "S7", "S9"],
    spacing: null,
    seasonWindows: [
      season(8, 10, "direct_sow", "Chłodne późne lato i jesień; termin zależy od odmiany.", ["S7", "S9"], "low"),
    ],
    needsLocalValidation: true,
    validationNotes: "Brak zweryfikowanej polskiej rozstawy w zebranych źródłach.",
  },
  {
    id: "baklazan",
    commonNamePl: "bakłażan",
    aliases: ["eggplant", "aubergine"],
    catalogTier: "extended",
    sourceIds: ["S4", "S6", "S9"],
    spacing: publishedSpacing(50, 45, "Uprawa z rozsady; para S6 bez zweryfikowanych osi.", ["S6"], "low"),
    seasonWindows: [
      season(3, 4, "seedling", "Wysiew rozsady w cieple.", ["S6", "S9"]),
      season(5, 6, "plant_out", "Sadzenie po połowie maja i po ustąpieniu ryzyka przymrozków.", ["S6", "S9"]),
    ],
    needsLocalValidation: true,
    validationNotes: "Brak polskiego źródła produkcyjnego w zebranym materiale.",
  },
  {
    id: "rzepa",
    commonNamePl: "rzepa",
    aliases: ["turnip"],
    catalogTier: "extended",
    sourceIds: ["S4"],
    spacing: null,
    seasonWindows: [
      season(4, 7, "direct_sow", "Okno orientacyjne z grupy korzeniowych; wymaga lokalnej walidacji.", ["S4"], "low"),
    ],
    needsLocalValidation: true,
    validationNotes: "Brak wystarczających polskich danych o rozstawie i terminach.",
  },
  {
    id: "ziemniak",
    commonNamePl: "ziemniak",
    aliases: ["potato"],
    catalogTier: "extended",
    sourceIds: ["S4", "S5", "S10"],
    spacing: null,
    seasonWindows: [],
    needsLocalValidation: true,
    validationNotes: "Brak polskiej zweryfikowanej rozstawy i finalnego okna w obecnym researchu.",
  },
];

export const COMPANION_RELATIONS: readonly CompanionRelation[] = [
  {
    cropIds: ["marchew", "cebula"],
    status: "supported",
    relationshipType: "pest_management",
    confidence: "low",
    rationale: "S2 i S3 opisują potencjalne ograniczanie presji połyśnicy marchwianki i śmietki cebulanki.",
    sourceIds: ["S2", "S3"],
    conflictNote: "To wskazówka praktyczna, nie gwarancja ochrony ani wzrostu plonu.",
    hardBlock: false,
  },
  {
    cropIds: ["marchew", "rzodkiewka"],
    status: "supported",
    relationshipType: "space_saving",
    confidence: "medium",
    rationale: "Rzodkiewka może oznaczać rząd marchwi i zostać zebrana wcześniej.",
    sourceIds: ["S2", "S3", "S10"],
    conflictNote: "Korzyść dotyczy organizacji przestrzeni, nie potwierdzonego wzrostu plonu.",
    hardBlock: false,
  },
  {
    cropIds: ["fasola-zwykla", "cebula"],
    status: "caution",
    relationshipType: "disease_risk",
    confidence: "low",
    rationale: "S2 i S3 wymieniają fasolę oraz cebulę jako niezalecane bezpośrednie sąsiedztwo.",
    sourceIds: ["S2", "S3"],
    conflictNote: "Reguła jest źródłowo niespójna z innymi popularnymi tabelami; nie jest zakazem.",
    hardBlock: false,
  },
  {
    cropIds: ["fasola-zwykla", "czosnek"],
    status: "caution",
    relationshipType: "disease_risk",
    confidence: "low",
    rationale: "S2 i S3 wskazują na ostrożność przy łączeniu fasoli z czosnkiem.",
    sourceIds: ["S2", "S3"],
    conflictNote: "Niska pewność i brak mechanizmu wystarczającego do twardej blokady.",
    hardBlock: false,
  },
  {
    cropIds: ["pomidor", "ziemniak"],
    status: "caution",
    relationshipType: "disease_risk",
    confidence: "medium",
    rationale: "S5 wskazuje na wspólne ryzyka chorób i szkodników oraz potrzebę przerwy w uprawie psiankowatych.",
    sourceIds: ["S2", "S5"],
    conflictNote: "To przede wszystkim ostrzeżenie fitosanitarne i rotacyjne, nie uniwersalny zakaz sąsiedztwa.",
    hardBlock: false,
  },
  {
    cropIds: ["pomidor", "ogorek"],
    status: "caution",
    relationshipType: "disease_risk",
    confidence: "low",
    rationale: "S2 wymienia tę parę wśród kombinacji, przy których zalecana jest ostrożność.",
    sourceIds: ["S2"],
    conflictNote: "Brak wystarczającej zgodności źródeł dla silniejszej rekomendacji.",
    hardBlock: false,
  },
  {
    cropIds: ["pomidor", "papryka"],
    status: "caution",
    relationshipType: "disease_risk",
    confidence: "low",
    rationale: "S2 wymienia tę parę wśród kombinacji, przy których zalecana jest ostrożność.",
    sourceIds: ["S2"],
    conflictNote: "Niska pewność; nie utożsamiać z zakazem wspólnej uprawy.",
    hardBlock: false,
  },
  {
    cropIds: ["kapusta-biala", "pomidor"],
    status: "caution",
    relationshipType: "disease_risk",
    confidence: "low",
    rationale: "S2 wymienia kapustne i pomidora wśród par, przy których zalecana jest ostrożność.",
    sourceIds: ["S2"],
    conflictNote: "Niska pewność i ograniczony zakres dowodów.",
    hardBlock: false,
  },
];

const sourceIdSet = new Set<SourceId>(CROP_SOURCES.map((source) => source.id));

function assertCondition(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error("Invalid crop catalog: " + message);
  }
}

function assertSourceIds(sourceIds: readonly SourceId[], label: string): void {
  for (const sourceId of sourceIds) {
    assertCondition(sourceIdSet.has(sourceId), label + " references unknown source " + sourceId);
  }
}

function assertRange(range: NumericRange, label: string): void {
  assertCondition(Number.isFinite(range.min) && Number.isFinite(range.max), label + " must be finite");
  assertCondition(range.min > 0 && range.max > 0, label + " must be positive");
  assertCondition(range.min <= range.max, label + " min must not exceed max");
}

function canonicalPair(firstId: string, secondId: string): string {
  return [firstId, secondId].sort().join("::");
}

export function validateCropCatalog(
  catalog: readonly CropCatalogEntry[] = CROP_CATALOG,
  relations: readonly CompanionRelation[] = COMPANION_RELATIONS,
): void {
  assertCondition(catalog.length === 30, "expected exactly 30 crop records");

  const cropIds = new Set<string>();
  for (const crop of catalog) {
    assertCondition(crop.id.trim().length > 0, "crop id cannot be empty");
    assertCondition(!cropIds.has(crop.id), "duplicate crop id " + crop.id);
    cropIds.add(crop.id);
    assertCondition(crop.commonNamePl.trim().length > 0, crop.id + " has an empty Polish name");
    assertCondition(
      crop.seasonWindows.length > 0 || crop.needsLocalValidation,
      crop.id + " has no season window or validation flag",
    );
    assertSourceIds(crop.sourceIds, crop.id);

    const aliases = new Set<string>();
    for (const alias of crop.aliases) {
      const normalizedAlias = alias.trim().toLocaleLowerCase("pl-PL");
      assertCondition(normalizedAlias.length > 0, crop.id + " has an empty alias");
      assertCondition(!aliases.has(normalizedAlias), crop.id + " has a duplicate alias");
      aliases.add(normalizedAlias);
    }

    if (crop.needsLocalValidation) {
      assertCondition(Boolean(crop.validationNotes?.trim()), crop.id + " needs a validation note");
    }

    if (crop.spacing !== null) {
      assertSourceIds(crop.spacing.sourceIds, crop.id + " spacing");
      if (crop.spacing.publishedPairCm !== null) {
        assertRange(
          { min: crop.spacing.publishedPairCm[0], max: crop.spacing.publishedPairCm[0] },
          crop.id + " published spacing first value",
        );
        assertRange(
          { min: crop.spacing.publishedPairCm[1], max: crop.spacing.publishedPairCm[1] },
          crop.id + " published spacing second value",
        );
      }
      if (crop.spacing.inRowCm !== null) {
        assertRange(crop.spacing.inRowCm, crop.id + " in-row spacing");
      }
      if (crop.spacing.betweenRowsCm !== null) {
        assertRange(crop.spacing.betweenRowsCm, crop.id + " between-row spacing");
      }
      if (crop.spacing.axisVerified) {
        assertCondition(crop.spacing.inRowCm !== null, crop.id + " verified spacing needs in-row values");
        assertCondition(crop.spacing.betweenRowsCm !== null, crop.id + " verified spacing needs between-row values");
      } else {
        assertCondition(crop.spacing.publishedPairCm !== null, crop.id + " unverified spacing needs published pair");
      }
    }

    for (const window of crop.seasonWindows) {
      assertCondition(Number.isInteger(window.startMonth), crop.id + " start month must be an integer");
      assertCondition(Number.isInteger(window.endMonth), crop.id + " end month must be an integer");
      assertCondition(window.startMonth >= 1 && window.startMonth <= 12, crop.id + " start month is out of range");
      assertCondition(window.endMonth >= 1 && window.endMonth <= 12, crop.id + " end month is out of range");
      assertCondition(window.condition.trim().length > 0, crop.id + " season window has no condition");
      assertSourceIds(window.sourceIds, crop.id + " season window");
    }
  }

  const relationPairs = new Set<string>();
  for (const relation of relations) {
    const [firstId, secondId] = relation.cropIds;
    assertCondition(cropIds.has(firstId), "relation references unknown crop " + firstId);
    assertCondition(cropIds.has(secondId), "relation references unknown crop " + secondId);
    assertCondition(firstId !== secondId, "relation cannot reference the same crop twice");
    const pair = canonicalPair(firstId, secondId);
    assertCondition(!relationPairs.has(pair), "duplicate companion relation " + pair);
    relationPairs.add(pair);
    assertCondition(relation.rationale.trim().length > 0, pair + " has no rationale");
    assertSourceIds(relation.sourceIds, pair + " relation");
    assertCondition(!relation.hardBlock, pair + " cannot be a hard block");
  }
}

validateCropCatalog();
