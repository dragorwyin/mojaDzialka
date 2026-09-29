export type CatalogTier = "core" | "extended";
export type Confidence = "high" | "medium" | "low";
export type CompanionStatus = "supported" | "caution" | "negative";
export type SpacingStage = "sowing" | "thinning" | "planting" | "final_planting" | "mixed";
export type RelationshipType =
  "space_saving" | "pest_management" | "habitat" | "rotation" | "disease_risk" | "folklore";
export type SowingMethod = "direct_sow" | "seedling" | "plant_out" | "overwintering";

export type SourceId =
  | "S1"
  | "S2"
  | "S3"
  | "S4"
  | "S5"
  | "S6"
  | "S7"
  | "S8"
  | "S9"
  | "S10"
  | "S11"
  | "S12"
  | "S14"
  | "S15"
  | "S16"
  | "S17"
  | "S18"
  | "S19"
  | "S20"
  | "S21"
  | "S22"
  | "S23"
  | "S24"
  | "S25"
  | "S26"
  | "S27"
  | "S28"
  | "S29"
  | "S30"
  | "S31"
  | "S32"
  | "S33"
  | "S34"
  | "S35"
  | "S36"
  | "S37"
  | "S38"
  | "S39"
  | "S40"
  | "S41"
  | "S42"
  | "S43"
  | "S44";

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
  stage: SpacingStage;
  isFinalPlanting: boolean;
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
  {
    id: "S15",
    title: "PIORiN: Metodyka integrowanej produkcji pomidora polowego",
    url: "https://www.gov.pl/attachment/6b05bf5f-f4d0-47cd-92a7-2cf9128569d6",
    context: "Wysoka odmiana przy podporze: odstęp w rzędzie i między rzędami.",
  },
  {
    id: "S16",
    title: "PIORiN/IO-PIB: Metodyka integrowanej produkcji ogórka polowego (2023)",
    url: "https://www.gov.pl/attachment/6a7f4f25-0ec4-4692-a494-b5813bc06984",
    context: "Końcowa obsada po wschodach i polowa rozstawa między rzędami.",
  },
  {
    id: "S17",
    title: "Działkowiec: Uprawa grochu i fasoli",
    url: "https://dzialkowiec.app/porady/uprawa-grochu-fasoli-straczkowe",
    context: "Krzaczasta fasola szparagowa; pojedyncze nasiona w rzędzie i międzyrzędzia.",
  },
  {
    id: "S18",
    title: "Poradnik Ogrodniczy: Pietruszka korzeniowa",
    url: "https://poradnikogrodniczy.pl/pietruszka-korzeniowa.php",
    context: "Późna pietruszka korzeniowa po przerywce; siew i końcowy odstęp rozdzielone.",
  },
  {
    id: "S19",
    title: "Małopolski ODR: Zalecane odmiany marchwi do upraw ekologicznych",
    url: "https://www.modr.pl/sites/default/files/brochures/zalecane_odmiany_marchwi_do_upraw_ekologicznych_w_wojewodztwie_malopolskim_2020.pdf",
    context: "Odstępy roślin w rzędzie i między rzędami dla korzenia na zbiór główny.",
  },
  {
    id: "S20",
    title: "Świat Kwiatów: Cebula zwyczajna — uprawa, odmiany i siew nasion",
    url: "https://www.swiatkwiatow.pl/poradnik-ogrodniczy/cebula-zwyczajna--uprawa-odmiany-i-siew-nasion-id1249.html?more=",
    context: "Wiosenna dymka na główki do zbioru i przechowania.",
  },
  {
    id: "S21",
    title: "Małopolski ODR: Ekologiczna uprawa buraka ćwikłowego",
    url: "https://sww.modr.pl/sites/default/files/brochures/ekologiczna_uprawa_buraka_cwiklowego_2020.pdf",
    context: "Siew bezpośredni i końcowe odstępy po przerzedzeniu dla korzeni do przechowania.",
  },
  {
    id: "S22",
    title: "Poradnik Ogrodniczy: Rzodkiewka — właściwości, uprawa, odmiany",
    url: "https://poradnikogrodniczy.pl/rzodkiewka-wlasciwosci-uprawa-odmiany.php",
    context: "Standardowa rzodkiewka wiosenna; siew w docelowej siatce lub późniejsze przerzedzenie.",
  },
  {
    id: "S23",
    title: "Rutgers NJAES: FS129 — Lettuce",
    url: "https://njaes.rutgers.edu/FS129/",
    context: "Odstępy dojrzałych główek sałaty typu Bibb/masłowej w ogrodzie domowym.",
  },
  {
    id: "S24",
    title: "Uniwersytet Przyrodniczy we Wrocławiu: badanie odmiany kapusty białej Kalorama F1",
    url: "https://bibliotekanauki.pl/articles/11543105",
    context: "Rozstawa rozsady odmiany Kalorama F1 dla średnich główek.",
  },
  {
    id: "S25",
    title: "DIONP: Jak uprawiać kalafiory — podstawowe informacje",
    url: "https://www.dionp.pl/jak-uprawiac-kalafiory-podstawowe-informacje/",
    context: "Standardowa rozsada kalafiora w gruncie.",
  },
  {
    id: "S26",
    title: "Poradnik Ogrodniczy: Jak sadzić warzywa na działce",
    url: "https://poradnikogrodniczy.pl/jak-sadzic-warzywa-na-dzialce.php",
    context: "Rozstaw dojrzałego brokułu w rzędzie i między rzędami w ogrodzie działkowym.",
  },
  {
    id: "S27",
    title: "DIONP: Jak uprawiać kalarepę — podstawowe informacje",
    url: "https://www.dionp.pl/jak-uprawiac-kalarepe-podstawowe-informacje/",
    context: "Standardowa rozsada kalarepy do zbioru zgrubień.",
  },
  {
    id: "S28",
    title: "Utah State University Extension: Kale in the Garden",
    url: "https://extension.usu.edu/yardandgarden/research/kale-in-the-garden",
    context: "Końcowa siatka dojrzałego jarmużu; zagraniczny fallback dla ogrodu domowego.",
  },
  {
    id: "S29",
    title: "Poradnik Ogrodniczy: Groszek zielony",
    url: "https://poradnikogrodniczy.pl/groszek-zielony.php",
    context: "Niskie odmiany grochu bez podpory; odstęp dotyczy siewu nasion.",
  },
  {
    id: "S30",
    title: "Deccoria: Siew bobu na przedplon",
    url: "https://deccoria.pl/artykuly/porady-ogrodnicze/news-siew-bobu-na-przedplon-uprawa-wspolrzedna-bobu,nId,22439921",
    context: "Wiosenny siew rzędowy pojedynczych nasion; końcowa obsada niepotwierdzona.",
  },
  {
    id: "S31",
    title: "University of Maryland Extension: Growing Summer Squash and Zucchini",
    url: "https://www.extension.umd.edu/resource/growing-summer-squash-zucchini-home-garden",
    context: "Cukinia krzaczasta w ogrodzie domowym, przerzedzana do jednej rośliny na stanowisko.",
  },
  {
    id: "S32",
    title: "CDR: Normatywy Produkcji Rolniczej — dynia",
    url: "https://poznan.cdr.gov.pl/normatywy/public/pdf/5_1.pdf",
    context: "Pojedyncza obsada dyni w siatce polowej; źródło starsze i produkcyjne.",
  },
  {
    id: "S33",
    title: "Poradnik Ogrodniczy: Sadzenie papryki",
    url: "https://poradnikogrodniczy.pl/sadzenie-papryki.php",
    context: "Papryka słodka z rozsady w gruncie; osobne wartości dla tunelu.",
  },
  {
    id: "S34",
    title: "Atlas Roślin: Por (Allium porrum)",
    url: "https://atlas-roslin.pl/gatunki/Allium_porrum.htm",
    context: "Rozsada pora na zbiór jesienny; wczesny i przezimowujący wariant są inne.",
  },
  {
    id: "S35",
    title: "University of Kentucky Extension: Spinach Home Garden",
    url: "https://publications.ca.uky.edu/sites/publications.ca.uky.edu/files/NEP240.pdf",
    context: "Dojrzały zbiór liści szpinaku po przerzedzeniu; zagraniczny fallback.",
  },
  {
    id: "S36",
    title: "DIONP: Jak uprawiać seler korzeniowy — podstawowe informacje",
    url: "https://www.dionp.pl/jak-uprawiac-seler-korzeniowy-podstawowe-informacje/",
    context: "Rozsada selera korzeniowego na jesienny zbiór i przechowanie.",
  },
  {
    id: "S37",
    title: "Melinda Myers: Corn",
    url: "https://www.melindamyers.com/plants/fruits-vegetables/corn",
    context: "Kukurydza cukrowa po przerzedzeniu; zalecany blok co najmniej czterech rzędów.",
  },
  {
    id: "S38",
    title: "DIONP: Jak uprawiać pasternak — podstawowe informacje",
    url: "https://www.dionp.pl/jak-uprawiac-pasternak-podstawowe-informacje/",
    context: "Końcowa rozstawa pasternaku korzeniowego po przerzedzeniu siewek.",
  },
  {
    id: "S39",
    title: "Na Grządce: Jak uprawiać rukolę przez cały sezon",
    url: "https://nagrzadce.pl/warzywa/jak-uprawiac-rukole-przez-caly-sezon-siew-ciecie-i-zapobieganie-gorzknieniu-lisci/",
    context: "Gęsty zbiór liści po przerzedzeniu; polski poradnik bez podanego autora.",
  },
  {
    id: "S40",
    title: "Poradnik Ogrodniczy: Roszponka",
    url: "https://poradnikogrodniczy.pl/roszponka.php",
    context: "Standardowy zbiór kęp/rozet po przerzedzeniu.",
  },
  {
    id: "S41",
    title: "DIONP: Jak uprawiać bakłażany (oberżyny) — podstawowe informacje",
    url: "https://www.dionp.pl/jak-uprawiac-baklazany-oberzyny-podstawowe-informacje/",
    context: "Bujnie rosnący bakłażan z rozsady; odmiany niskie mają ciaśniejszą siatkę.",
  },
  {
    id: "S42",
    title: "Wikibooks: Ekoogrodnictwo — rzepa",
    url: "https://pl.wikibooks.org/wiki/Ekoogrodnictwo/Ro%C5%9Bliny_u%C5%BCytkowe/Rzepa",
    context: "Wczesna rzepa po przerwaniu wschodów; szeroki zakres i niska pewność.",
  },
  {
    id: "S43",
    title: "Atlas Roślin: Ziemniak (Solanum tuberosum)",
    url: "https://atlas-roslin.pl/gatunki/Solanum_tuberosum.htm",
    context: "Ziemniak odmiany głównej sadzony z bulwy sadzeniaka.",
  },
  {
    id: "S44",
    title: "PSOR: Uprawa ogórków od A do Z",
    url: "https://www.ior.poznan.pl/plik,4701,e-book-psor-uprawa-ogorkow-od-a-do-z-pdf.pdf",
    context: "Alternatywa bliższa ogródkowi: rozstawa siewu 10–20 cm w rzędzie i 80–120 cm między rzędami.",
  },
];

const verifiedSpacing = (
  inRowCm: NumericRange,
  betweenRowsCm: NumericRange,
  context: string,
  sourceIds: readonly SourceId[],
  confidence: Confidence = "medium",
  stage: SpacingStage = "final_planting",
  isFinalPlanting = stage === "thinning" || stage === "planting" || stage === "final_planting",
): SpacingData => ({
  publishedPairCm: null,
  inRowCm,
  betweenRowsCm,
  context,
  sourceIds,
  confidence,
  axisVerified: true,
  stage,
  isFinalPlanting,
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
    spacing: verifiedSpacing(
      { min: 50, max: 60 },
      { min: 100, max: 150 },
      "Wysoka odmiana gruntowa prowadzona przy podporze; źródło podaje osobno odstęp w rzędzie i między rzędami.",
      ["S15"],
      "medium",
      "planting",
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
    validationNotes:
      "Default dotyczy wysokiej odmiany gruntowej przy podporze; karłowe i szklarniowe wymagają osobnych wariantów.",
  },
  {
    id: "ogorek",
    commonNamePl: "ogórek",
    aliases: ["ogórki", "cucumber"],
    catalogTier: "core",
    sourceIds: ["S1", "S2", "S4", "S5", "S6", "S7", "S9", "S44"],
    spacing: verifiedSpacing(
      { min: 15, max: 20 },
      { min: 120, max: 150 },
      "Końcowa obsada po wschodach w polowym układzie rzędowym; PSOR podaje odrębny, ciaśniejszy wariant siewu 10–20 × 80–120 cm.",
      ["S16"],
      "medium",
      "thinning",
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
    validationNotes:
      "Roboczy default jest polowy; zachować osobno działkowy wariant siewu PSOR i zweryfikować lokalnie sposób prowadzenia.",
  },
  {
    id: "fasola-zwykla",
    commonNamePl: "fasola zwykła",
    aliases: ["fasola", "fasola szparagowa", "common bean"],
    catalogTier: "core",
    sourceIds: ["S1", "S2", "S4", "S6", "S7", "S9"],
    spacing: verifiedSpacing(
      { min: 7, max: 10 },
      { min: 40, max: 50 },
      "Krzaczasta fasola szparagowa; pojedyncze nasiona w rzędzie. Nie stosować jako siatki fasoli tycznej.",
      ["S17"],
      "medium",
      "sowing",
      false,
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
    spacing: verifiedSpacing(
      { min: 4, max: 6 },
      { min: 30, max: 30 },
      "Pietruszka korzeniowa odmiany późnej do zbioru korzeni; odstęp w rzędzie dotyczy roślin po przerywce.",
      ["S18"],
      "medium",
      "thinning",
    ),
    seasonWindows: [
      season(3, 6, "direct_sow", "Siew bezpośredni; wolne wschody i potrzeba utrzymania wilgotności.", ["S6", "S7"]),
    ],
    needsLocalValidation: true,
    validationNotes: "Default dotyczy późnej pietruszki korzeniowej; wariant naciowy wymaga osobnej rozstawy.",
  },
  {
    id: "marchew",
    commonNamePl: "marchew",
    aliases: ["carrot"],
    catalogTier: "core",
    sourceIds: ["S2", "S4", "S5", "S6", "S7", "S10"],
    spacing: verifiedSpacing(
      { min: 10, max: 15 },
      { min: 30, max: 35 },
      "Standardowy korzeń na zbiór główny; źródło nazywa obie osie, ale nie opisuje odrębnego zabiegu przerzedzania.",
      ["S19"],
      "medium",
      "sowing",
      false,
    ),
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
    spacing: verifiedSpacing(
      { min: 5, max: 8 },
      { min: 30, max: 30 },
      "Wiosenna dymka sadzona pojedynczo na główki do zbioru i przechowania; nie wariant na szczypior.",
      ["S20"],
      "medium",
      "planting",
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
    spacing: verifiedSpacing(
      { min: 6, max: 10 },
      { min: 25, max: 50 },
      "Burak na korzeń do przechowywania; odstęp w rzędzie po przerzedzeniu zależy od docelowej wielkości korzenia.",
      ["S21"],
      "medium",
      "thinning",
    ),
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
    spacing: verifiedSpacing(
      { min: 2, max: 4 },
      { min: 10, max: 20 },
      "Standardowa rzodkiewka wiosenna; można siać w docelowych odstępach albo przerzedzić gęstsze wschody.",
      ["S22"],
      "medium",
      "mixed",
      false,
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
    spacing: verifiedSpacing(
      { min: 15, max: 15 },
      { min: 38, max: 38 },
      "Dojrzałe główki sałaty typu Bibb/masłowej; liściowe i rzymskie mają inny odstęp w rzędzie.",
      ["S23"],
      "medium",
      "final_planting",
    ),
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
    spacing: verifiedSpacing(
      { min: 40, max: 40 },
      { min: 45, max: 45 },
      "Rozsada kapusty białej Kalorama F1 o średniej główce; źródło odmianowe, nie norma dla wszystkich odmian.",
      ["S24"],
      "medium",
      "planting",
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
    spacing: verifiedSpacing(
      { min: 45, max: 60 },
      { min: 50, max: 60 },
      "Standardowa rozsada kalafiora do gruntu; polski poradnik nie specyfikuje odmiany ani wielkości róży.",
      ["S25"],
      "medium",
      "planting",
    ),
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
    spacing: verifiedSpacing(
      { min: 40, max: 40 },
      { min: 50, max: 50 },
      "Dojrzały brokuł w ogrodzie działkowym; polskie źródło jawnie nazywa obie osie.",
      ["S26"],
      "medium",
      "final_planting",
    ),
    seasonWindows: [
      season(3, 5, "seedling", "Rozsada; wariant wczesny lub późny.", ["S6", "S7"]),
      season(4, 7, "plant_out", "Sadzenie wiosenne i późniejsze okna produkcyjne.", ["S7"]),
    ],
    needsLocalValidation: true,
    validationNotes: "Default opisuje dojrzałą roślinę w ogrodzie działkowym; lokalnie zweryfikować rozmiar odmiany.",
  },
  {
    id: "kalarepa",
    commonNamePl: "kalarepa",
    aliases: ["kohlrabi"],
    catalogTier: "core",
    sourceIds: ["S4", "S6", "S7"],
    spacing: verifiedSpacing(
      { min: 20, max: 30 },
      { min: 30, max: 30 },
      "Standardowa rozsada kalarepy do zbioru zgrubień; ich wielkość może zmienić docelową gęstość.",
      ["S27"],
      "medium",
      "planting",
    ),
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
    spacing: verifiedSpacing(
      { min: 30, max: 30 },
      { min: 61, max: 61 },
      "Siatka dojrzałych roślin na zbiór liści; zagraniczny fallback o niskiej pewności dla polskiego ogrodu.",
      ["S28"],
      "low",
      "final_planting",
    ),
    seasonWindows: [
      season(4, 6, "seedling", "Rozsada lub siew zależnie od odmiany.", ["S6", "S7"]),
      season(5, 7, "plant_out", "Sadzenie po przygotowaniu rozsady; toleruje chłód.", ["S7", "S9"]),
    ],
    needsLocalValidation: true,
    validationNotes: "Zachować niską pewność zagranicznego fallbacku i sprawdzić dopasowanie odmiany do grządki.",
  },
  {
    id: "groch",
    commonNamePl: "groch",
    aliases: ["pea"],
    catalogTier: "core",
    sourceIds: ["S2", "S4", "S6", "S7", "S10"],
    spacing: verifiedSpacing(
      { min: 4, max: 5 },
      { min: 20, max: 30 },
      "Niska odmiana grochu bez podpory; rozstaw dotyczy siewu nasion, niepotwierdzonego końcowego stanu roślin.",
      ["S29"],
      "low",
      "sowing",
      false,
    ),
    seasonWindows: [season(3, 4, "direct_sow", "Wczesny siew bezpośredni.", ["S2", "S6", "S7"])],
    needsLocalValidation: true,
    validationNotes: "Rozdzielić odmiany karłowe i wymagające podpory; podana siatka dotyczy siewu nasion.",
  },
  {
    id: "bob",
    commonNamePl: "bób",
    aliases: ["broad bean", "fava bean"],
    catalogTier: "core",
    sourceIds: ["S2", "S4", "S6", "S7"],
    spacing: verifiedSpacing(
      { min: 10, max: 15 },
      { min: 40, max: 60 },
      "Wiosenny siew rzędowy pojedynczych nasion; źródło nie potwierdza końcowej obsady po wschodach.",
      ["S30"],
      "low",
      "sowing",
      false,
    ),
    seasonWindows: [season(3, 4, "direct_sow", "Siew wczesny; bób toleruje chłód.", ["S2", "S6", "S7"])],
    needsLocalValidation: true,
    validationNotes: "Zachować niską pewność końcowej obsady; źródło podaje odstęp siewu pojedynczych nasion.",
  },
  {
    id: "cukinia",
    commonNamePl: "cukinia",
    aliases: ["zucchini", "courgette"],
    catalogTier: "core",
    sourceIds: ["S2", "S4", "S5", "S6", "S7", "S9"],
    spacing: verifiedSpacing(
      { min: 61, max: 91 },
      { min: 91, max: 152 },
      "Cukinia krzaczasta w ogrodzie domowym, przerzedzana do jednej rośliny na stanowisko.",
      ["S31"],
      "medium",
      "thinning",
    ),
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
    spacing: verifiedSpacing(
      { min: 100, max: 120 },
      { min: 100, max: 200 },
      "Pojedyncza obsada dyni w siatce polowej; starszy wariant produkcyjny, nie uniwersalna rozstawa wszystkich typów.",
      ["S32"],
      "low",
      "final_planting",
    ),
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
    spacing: verifiedSpacing(
      { min: 30, max: 40 },
      { min: 50, max: 60 },
      "Papryka słodka z rozsady w gruncie; uprawa pod osłoną ma osobne wartości.",
      ["S33"],
      "medium",
      "planting",
    ),
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
    spacing: verifiedSpacing(
      { min: 12, max: 15 },
      { min: 30, max: 45 },
      "Rozsada pora na zbiór jesienny; nie wariant wczesny pęczkowy ani przezimowujący.",
      ["S34"],
      "medium",
      "planting",
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
    spacing: verifiedSpacing(
      { min: 10, max: 15 },
      { min: 30, max: 36 },
      "Dojrzały zbiór liści po przerzedzeniu; zagraniczny fallback, nie lokalna polska norma.",
      ["S35"],
      "medium",
      "thinning",
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
    spacing: verifiedSpacing(
      { min: 30, max: 40 },
      { min: 40, max: 40 },
      "Seler korzeniowy z rozsady na jesienny zbiór i przechowanie; nie seler naciowy ani zbiór wczesny.",
      ["S36"],
      "medium",
      "planting",
    ),
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
    spacing: verifiedSpacing(
      { min: 20, max: 30 },
      { min: 76, max: 91 },
      "Rośliny po przerzedzeniu; źródło zaleca blok co najmniej czterech rzędów, bo pojedynczy rząd gorzej się zapyla.",
      ["S37"],
      "medium",
      "thinning",
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
      "planting",
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
    spacing: verifiedSpacing(
      { min: 7, max: 10 },
      { min: 40, max: 50 },
      "Pasternak korzeniowy po przerwaniu wschodów; rozstawa odpowiada siewowi na płask, redliny wymagają innego układu.",
      ["S38"],
      "medium",
      "thinning",
    ),
    seasonWindows: [season(3, 6, "direct_sow", "Siew bezpośredni; wolne wschody.", ["S6", "S7"], "medium")],
    needsLocalValidation: true,
    validationNotes: "Sprawdzić wpływ uprawy na redlinach i lokalne okno dla odmiany.",
  },
  {
    id: "rukola",
    commonNamePl: "rukola",
    aliases: ["arugula", "rocket"],
    catalogTier: "extended",
    sourceIds: ["S4", "S6", "S9"],
    spacing: verifiedSpacing(
      { min: 4, max: 5 },
      { min: 15, max: 20 },
      "Gęsty zbiór liści po przerzedzeniu; nie wariant dużych pojedynczych rozet.",
      ["S39"],
      "low",
      "thinning",
    ),
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
    spacing: verifiedSpacing(
      { min: 10, max: 15 },
      { min: 15, max: 20 },
      "Standardowy zbiór kęp/rozet po przerzedzeniu; alternatywy zależą od odmiany.",
      ["S40"],
      "medium",
      "thinning",
    ),
    seasonWindows: [
      season(8, 10, "direct_sow", "Chłodne późne lato i jesień; termin zależy od odmiany.", ["S7", "S9"], "low"),
    ],
    needsLocalValidation: true,
    validationNotes:
      "Źródło jest poradnikiem hobbystycznym; zweryfikować dopasowanie do lokalnej odmiany i celu zbioru.",
  },
  {
    id: "baklazan",
    commonNamePl: "bakłażan",
    aliases: ["eggplant", "aubergine"],
    catalogTier: "extended",
    sourceIds: ["S4", "S6", "S9"],
    spacing: verifiedSpacing(
      { min: 50, max: 60 },
      { min: 60, max: 80 },
      "Bujnie rosnący bakłażan z rozsady; odmiany niskie mają ciaśniejszą siatkę, a osłony mogą wymagać osobnego wariantu.",
      ["S41"],
      "medium",
      "planting",
    ),
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
    spacing: verifiedSpacing(
      { min: 8, max: 20 },
      { min: 20, max: 25 },
      "Wczesna rzepa po przerwaniu wschodów; szeroki zakres, niska pewność i osobne siatki dla odmian późnych.",
      ["S42"],
      "low",
      "thinning",
    ),
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
    spacing: verifiedSpacing(
      { min: 40, max: 50 },
      { min: 50, max: 60 },
      "Odmiana główna sadzona z bulwy sadzeniaka; odmiany wczesne mogą być sadzone ciaśniej.",
      ["S43"],
      "medium",
      "planting",
    ),
    seasonWindows: [],
    needsLocalValidation: true,
    validationNotes: "Roboczy rozstaw pochodzi z polskiego atlasu; lokalne okno sadzenia pozostaje do walidacji.",
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
        assertCondition(
          crop.spacing.publishedPairCm === null,
          crop.id + " verified spacing cannot also have an unlabeled pair",
        );
      } else {
        assertCondition(crop.spacing.publishedPairCm !== null, crop.id + " unverified spacing needs published pair");
        assertCondition(crop.spacing.inRowCm === null, crop.id + " unverified spacing cannot have an in-row axis");
        assertCondition(
          crop.spacing.betweenRowsCm === null,
          crop.id + " unverified spacing cannot have a between-row axis",
        );
      }
      assertCondition(crop.spacing.context.trim().length > 0, crop.id + " spacing has no context");
      assertCondition(crop.spacing.stage.length > 0, crop.id + " spacing has no stage");
      assertCondition(
        typeof crop.spacing.isFinalPlanting === "boolean",
        crop.id + " spacing has no planting-stage flag",
      );
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
    assertCondition(
      !relation.hardBlock || relation.status === "negative",
      pair + " may only be a hard block when status is negative",
    );
    if (relation.status === "negative") {
      assertCondition(relation.hardBlock, pair + " negative relation must be a hard block");
    }
  }
}

validateCropCatalog();
