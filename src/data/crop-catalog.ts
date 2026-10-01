export type CatalogTier = "core" | "extended";
export type Confidence = "high" | "medium" | "low";
export type CompanionStatus = "supported" | "caution" | "negative";
export type SpacingStage = "sowing" | "thinning" | "planting" | "final_planting" | "mixed";
export type FinalSpacingStage = "after_thinning" | "after_planting";
export type PlantingUnit = "plant" | "clump";
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
  | "S44"
  | "S45"
  | "S46"
  | "S47"
  | "S48"
  | "S49"
  | "S50"
  | "S51"
  | "S52"
  | "S53"
  | "S54"
  | "S55"
  | "S56"
  | "S58"
  | "S59"
  | "S60"
  | "S61"
  | "S62"
  | "S63"
  | "S64"
  | "S65"
  | "S66";

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

export interface FinalSpacingData {
  inRowCm: NumericRange;
  betweenRowsCm: NumericRange;
  unit: PlantingUnit;
  context: string;
  sourceIds: readonly SourceId[];
  confidence: Confidence;
  stage: FinalSpacingStage;
}

export interface SowingDensityData {
  inRowCm: NumericRange | null;
  betweenRowsCm: NumericRange | null;
  seedsPerPosition: NumericRange | null;
  context: string;
  sourceIds: readonly SourceId[];
  confidence: Confidence;
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
  catalogConfidence: Confidence;
  finalSpacing: FinalSpacingData | null;
  sowingDensity: SowingDensityData | null;
  sowingDensityNote?: string;
  /** Compatibility view for existing layout code; mirrors finalSpacing only. */
  spacing: SpacingData | null;
  seasonWindows: readonly SeasonWindow[];
  needsLocalValidation: boolean;
  validationNotes?: string;
}

type CropCatalogSeed = Omit<
  CropCatalogEntry,
  "catalogConfidence" | "finalSpacing" | "sowingDensity" | "sowingDensityNote"
>;

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
  {
    id: "S45",
    title: "PSOR: Uprawa pomidorów od A do Z",
    url: "https://psor.pl/wp-content/uploads/2024/05/Uprawa-pomidorow-od-A-do-Z_praktyczny-poradnik.pdf",
    context: "Działkowa siatka dla wysokiego pomidora prowadzonego przy podporze; nie specyfikuje odmiany Faworyt.",
  },
  {
    id: "S46",
    title: "Poradnik Ogrodniczy: Pomidory koktajlowe — odmiany i uprawa",
    url: "https://poradnikogrodniczy.pl/pomidory-koktajlowe-odmiany-uprawa-w-gruncie-i-w-doniczkach.php",
    context: "Rozstawa pomidorów koktajlowych; nie osobny pomiar każdej odmiany palikowanej.",
  },
  {
    id: "S47",
    title: "Strefa Agro: Kiedy siać cukinię i jak ją uprawiać",
    url: "https://strefaagro.pl/kiedy-siac-cukinie-uprawa-mozliwa-z-nasion-i-rozsady-a-termin-podobny-dla-kabaczka-i-patisona/ar/c8-18447405",
    context:
      "Działkowy punkt odniesienia dla jednej rośliny cukinii; liczby z siewu w miejscu nie są obsadą po przerywce.",
  },
  {
    id: "S48",
    title: "DIONP: Jak uprawiać dynię — podstawowe informacje",
    url: "https://www.dionp.pl/jak-uprawiac-dynie-podstawowe-informacje/",
    context: "Zakresy różnią się między typami dyni i nie tworzą jednej siatki dla wpisu ogólnego.",
  },
  {
    id: "S49",
    title: "University of Minnesota Extension: Growing sweet corn",
    url: "https://extension.umn.edu/vegetables/growing-sweet-corn",
    context: "Rozstaw pozycji siewu kukurydzy; brak potwierdzenia końcowej liczby roślin po przerywce.",
  },
  {
    id: "S50",
    title: "Michigan State University Extension: How to grow peas",
    url: "https://www.canr.msu.edu/resources/how_to_grow_peas_2",
    context: "Rozdziela początkowy siew grochu od odstępu po przerzedzeniu.",
  },
  {
    id: "S51",
    title: "Murator: Kiedy i jak sadzić ziemniaki",
    url: "https://muratordom.pl/ogrod/pielegnacja-roslin/kiedy-i-jak-sadzic-ziemniaki-poznaj-terminy-i-techniki-by-cieszyc-sie-wlasnymi-bulwami-aa-zfAQ-mikF-b5Mu.html",
    context: "Sadzenie odmiany głównej z jednego sadzeniaka bulwowego na pozycję.",
  },
  {
    id: "S52",
    title: "DIONP: Jak uprawiać bakłażany — podstawowe informacje",
    url: "https://www.dionp.pl/jak-uprawiac-baklazany-oberzyny-podstawowe-informacje/",
    context: "Rozstawa zależna od siły wzrostu odmiany; rozsada do gruntu.",
  },
  {
    id: "S53",
    title: "Poradnik Ogrodniczy: Pietruszka naciowa",
    url: "https://poradnikogrodniczy.pl/pietruszka-naciowa.php",
    context: "Terminy siewu pietruszki naciowej; źródło nie potwierdza pełnej końcowej siatki dwóch osi.",
  },
  {
    id: "S54",
    title: "Urządzisz.pl: Jak siać warzywa w ogródku",
    url: "https://urzadzisz.pl/jak-siac-warzywa-w-ogrodku-praktyczne-wskazowki/",
    context: "Końcowa rozstawa marchwi i kandydat rozstawy buraka; rozróżnia siew i pozostawione rośliny.",
  },
  {
    id: "S55",
    title: "Deccoria: Marchewka z ogródka — zasady uprawy",
    url: "https://deccoria.pl/artykuly/porady-ogrodnicze/news-marchewka-z-ogrodka-jest-gorzka-stosuj-proste-zasady-bedzie,nId,22438398",
    context: "Końcowy odstęp marchwi po przerywce.",
  },
  {
    id: "S56",
    title: "Atlas Roślin: Sałata (Lactuca sativa)",
    url: "https://atlas-roslin.pl/gatunki/Lactuca_sativa.htm",
    context: "Rozstawa zależna od typu sałaty; wybrany zakres dotyczy sałaty masłowej.",
  },
  {
    id: "S58",
    title: "Atlas Roślin: Jarmuż",
    url: "https://atlas-roslin.pl/gatunki/Brassica_oleracea_ssp._acephala_var._sabellica.htm",
    context: "Rozstawa jarmużu w technicznym kontekście uprawy.",
  },
  {
    id: "S59",
    title: "UC ANR Extension: Arugula",
    url: "https://ucanr.edu/site/uc-marin-master-gardeners/document/arugula",
    context: "Zagraniczny fallback pełnej siatki rozety rukoli; polskie źródło podaje tylko odstęp w rzędzie.",
  },
  {
    id: "S60",
    title: "Poradnik Ogrodniczy: Rzepa — uprawa i odmiany",
    url: "https://poradnikogrodniczy.pl/rzepa-wartosci-odzywcze-odmiany-uprawa.php",
    context: "Odstęp roślin rzepy po przerywce.",
  },
  {
    id: "S61",
    title: "Stacja Ogród: Kiedy sadzimy i zbieramy warzywa",
    url: "https://stacjaogrod.pl/poradnik-ogrodniczy/kiedy-sadzimy-i-zbieramy-warzywa/",
    context: "Działkowy punkt odniesienia dla rozstawy rozsady pora; pewność niska–średnia.",
  },
  {
    id: "S62",
    title: "Atlas Roślin: Szczypiorek (Allium schoenoprasum)",
    url: "https://atlas-roslin.pl/gatunki/Allium_schoenoprasum.htm",
    context: "Rozstawa dotyczy kęp szczypiorku, nie pojedynczych pędów.",
  },
  {
    id: "S63",
    title: "University of Minnesota Extension: Growing dill",
    url: "https://extension.umn.edu/yard-and-garden/growing-dill",
    context: "Zagraniczny, niskiej pewności fallback dla kopru po przerwaniu siewek.",
  },
  {
    id: "S64",
    title: "Poradnik Ogrodniczy: Marchew",
    url: "https://poradnikogrodniczy.pl/marchew.php",
    context: "Terminy siewu marchwi i gęsty siew nasion, oddzielone od końcowej obsady.",
  },
  {
    id: "S65",
    title: "CDR: Normatywy Produkcji Rolniczej — burak ćwikłowy",
    url: "https://poznan.cdr.gov.pl/normatywy/public/pdf/5_1.pdf",
    context: "Polowa rozstawa buraka; starszy materiał i niepewność obsady z wielonasiennego kłębka.",
  },
  {
    id: "S66",
    title: "Atlas Roślin: Koper ogrodowy (Anethum graveolens)",
    url: "https://atlas-roslin.pl/gatunki/Anethum_graveolens.htm",
    context: "Polska gęstość siewu kopru na kiszenie; nie końcowa rozstawa po przerywce.",
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

// The seed literals predate the split contract; their old `spacing` field is discarded below.
// Only `CROP_PLANTING_METADATA.finalSpacing` reaches the exported compatibility view.
const CROP_CATALOG_SEEDS: readonly CropCatalogSeed[] = [
  {
    id: "pomidor",
    commonNamePl: "pomidor Faworyt",
    aliases: ["pomidor", "pomidory", "faworyt", "tomato"],
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
      season(3, 4, "seedling", "Wysiew rozsady pod osłoną; kwietniowego wysiewu nie traktować jako terminu gruntu.", [
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
      "Zachowujemy istniejące ID pomidor dla Faworyta; siatka jest ostrożnym defaultem dla wysokiej odmiany gruntowej, nie specyfikacją odmiany.",
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
    id: "pietruszka",
    commonNamePl: "pietruszka korzeniowa/naciowa",
    aliases: ["pietruszka", "parsley"],
    catalogTier: "core",
    sourceIds: ["S1", "S4", "S6", "S7", "S53"],
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
    sourceIds: ["S4", "S5", "S6", "S7", "S24"],
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
    seasonWindows: [
      season(
        4,
        5,
        "plant_out",
        "Sadzenie od połowy kwietnia, zależnie od regionu i temperatury gleby.",
        ["S51"],
        "medium",
      ),
    ],
    needsLocalValidation: true,
    validationNotes: "Roboczy rozstaw pochodzi z polskiego atlasu; lokalne okno sadzenia pozostaje do walidacji.",
  },
  {
    id: "pomidor-koktajlowy-palikowany",
    commonNamePl: "pomidor koktajlowy (palikowany)",
    aliases: ["pomidorki koktajlowe", "pomidor koktajlowy", "cherry tomato"],
    catalogTier: "core",
    sourceIds: ["S45", "S46"],
    spacing: null,
    seasonWindows: [
      season(3, 3, "seedling", "Wysiew na rozsadę około połowy marca.", ["S46"], "medium"),
      season(
        5,
        6,
        "plant_out",
        "Sadzenie po połowie maja, po ustąpieniu ryzyka przymrozków.",
        ["S45", "S46"],
        "medium",
      ),
    ],
    needsLocalValidation: true,
    validationNotes:
      "Rozstawa dotyczy ogrodowego wariantu koktajlowego; nie przenosić siatki wysokiego pomidora Faworyt.",
  },
  {
    id: "koper",
    commonNamePl: "koper",
    aliases: ["koper ogrodowy", "dill"],
    catalogTier: "core",
    sourceIds: ["S4", "S63", "S66"],
    spacing: null,
    seasonWindows: [season(3, 7, "direct_sow", "Siew bezpośredni sukcesywnie do początku lata.", ["S66"], "medium")],
    needsLocalValidation: true,
    validationNotes: "Końcowa siatka jest niskiej pewności; polski Atlas opisuje gęstość siewu na kiszenie.",
  },
  {
    id: "szczypiorek",
    commonNamePl: "szczypiorek",
    aliases: ["chives"],
    catalogTier: "core",
    sourceIds: ["S4", "S62"],
    spacing: null,
    seasonWindows: [
      season(3, 4, "direct_sow", "Siew zewnętrzny pod koniec marca lub na początku kwietnia.", ["S62"], "medium"),
      season(5, 5, "plant_out", "Możliwe sadzenie rozsady w maju.", ["S62"], "medium"),
    ],
    needsLocalValidation: true,
    validationNotes: "Jedna jednostka końcowej obsady to kępa złożona z kilku roślin, nie pojedynczy pęd.",
  },
];

interface CropPlantingMetadata {
  catalogConfidence: Confidence;
  finalSpacing: FinalSpacingData | null;
  sowingDensity: SowingDensityData | null;
  sowingDensityNote?: string;
}

const cm = (min: number, max = min): NumericRange => ({ min, max });

const finalSpacing = (
  inRowCm: NumericRange,
  betweenRowsCm: NumericRange,
  unit: PlantingUnit,
  stage: FinalSpacingStage,
  sourceIds: readonly SourceId[],
  confidence: Confidence,
  context: string,
): FinalSpacingData => ({ inRowCm, betweenRowsCm, unit, stage, sourceIds, confidence, context });

const sowingDensity = (
  inRowCm: NumericRange | null,
  betweenRowsCm: NumericRange | null,
  seedsPerPosition: NumericRange | null,
  sourceIds: readonly SourceId[],
  confidence: Confidence,
  context: string,
): SowingDensityData => ({ inRowCm, betweenRowsCm, seedsPerPosition, sourceIds, confidence, context });

const CROP_PLANTING_METADATA: Readonly<Partial<Record<string, CropPlantingMetadata>>> = {
  pomidor: {
    catalogConfidence: "low",
    finalSpacing: finalSpacing(
      cm(50),
      cm(100),
      "plant",
      "after_planting",
      ["S45", "S15"],
      "low",
      "Działkowy default wysokiego pomidora przy podporze. To typowy wariant, nie pomiar odmiany Faworyt.",
    ),
    sowingDensity: null,
    sowingDensityNote: "Źródła nie podają liczbowego odstępu nasion pomidora.",
  },
  "pomidor-koktajlowy-palikowany": {
    catalogConfidence: "medium",
    finalSpacing: finalSpacing(
      cm(40, 60),
      cm(40, 60),
      "plant",
      "after_planting",
      ["S46"],
      "medium",
      "Ogrodowy zakres dla pomidorów koktajlowych; palikowanie i odmiana mogą zmieniać pokrój.",
    ),
    sowingDensity: null,
    sowingDensityNote: "Odstępu nasion w rozsadniku nie potwierdzono.",
  },
  ogorek: {
    catalogConfidence: "medium",
    finalSpacing: finalSpacing(
      cm(10, 20),
      cm(80, 120),
      "plant",
      "after_thinning",
      ["S44"],
      "medium",
      "Działkowa siatka siewu bezpośredniego / pojedynczej rośliny na stanowisko z PSOR; nie mieszać z szerszym wariantem polowym.",
    ),
    sowingDensity: null,
  },
  papryka: {
    catalogConfidence: "medium",
    finalSpacing: finalSpacing(
      cm(30, 40),
      cm(50, 60),
      "plant",
      "after_planting",
      ["S33"],
      "medium",
      "Papryka słodka z rozsady w gruncie; uprawa pod osłoną ma osobne wartości.",
    ),
    sowingDensity: null,
  },
  cukinia: {
    catalogConfidence: "medium",
    finalSpacing: finalSpacing(
      cm(80),
      cm(100),
      "plant",
      "after_planting",
      ["S47", "S31"],
      "medium",
      "Działkowy default pojedynczej rośliny cukinii; źródło odróżnia pojedyncze rośliny od gniazd.",
    ),
    sowingDensity: null,
  },
  dynia: {
    catalogConfidence: "low",
    finalSpacing: null,
    sowingDensity: sowingDensity(
      null,
      null,
      cm(1, 2),
      ["S48"],
      "low",
      "Źródła wspominają 1–2 nasiona w pozycji siewu, ale nie rozstrzygają pozostawionej liczby roślin; to nie jest obsada końcowa.",
    ),
    sowingDensityNote: "Nie ma jednej końcowej siatki bez wyboru typu dyni i liczby roślin pozostawianych w gnieździe.",
  },
  "kukurydza-cukrowa": {
    catalogConfidence: "low",
    finalSpacing: null,
    sowingDensity: sowingDensity(
      cm(20, 30),
      cm(76, 91),
      null,
      ["S49"],
      "medium",
      "To siatka pozycji siewu, nie potwierdzona liczba roślin pozostawianych po przerywce.",
    ),
    sowingDensityNote:
      "Nie używać rozstawy siewu jako końcowej obsady; wymagany jest też blok co najmniej czterech rzędów.",
  },
  groch: {
    catalogConfidence: "medium",
    finalSpacing: finalSpacing(
      cm(5, 8),
      cm(30, 46),
      "plant",
      "after_thinning",
      ["S50"],
      "medium",
      "Niska/średnia odmiana po przerywce; odmiany wysokie wymagają innego układu rzędów.",
    ),
    sowingDensity: sowingDensity(
      cm(2.5),
      null,
      null,
      ["S50"],
      "medium",
      "Początkowy siew nasion co około 2,5 cm; osobny etap względem końcowych 5–8 cm po przerywce.",
    ),
  },
  ziemniak: {
    catalogConfidence: "medium",
    finalSpacing: finalSpacing(
      cm(30, 40),
      cm(60, 75),
      "plant",
      "after_planting",
      ["S51"],
      "medium",
      "Odmiana główna sadzona z jednego sadzeniaka bulwowego na pozycję.",
    ),
    sowingDensity: null,
  },
  baklazan: {
    catalogConfidence: "low",
    finalSpacing: finalSpacing(
      cm(50, 60),
      cm(60, 80),
      "plant",
      "after_planting",
      ["S52"],
      "low",
      "Ostrożny default dla silnie rosnącego bakłażana z rozsady; odmiany zwarte mają ciaśniejszą siatkę 30–40 × 30–50 cm.",
    ),
    sowingDensity: null,
    sowingDensityNote: "Odstęp w rozsadniku nie jest rozstawą roślin w grządce.",
  },
  pietruszka: {
    catalogConfidence: "medium",
    finalSpacing: finalSpacing(
      cm(4, 6),
      cm(30),
      "plant",
      "after_thinning",
      ["S18"],
      "medium",
      "Późna pietruszka korzeniowa na zbiór korzeni; dla pietruszki naciowej pełnej siatki końcowej nie potwierdzono.",
    ),
    sowingDensity: null,
  },
  marchew: {
    catalogConfidence: "medium",
    finalSpacing: finalSpacing(
      cm(7, 8),
      cm(20, 30),
      "plant",
      "after_thinning",
      ["S54", "S55"],
      "medium",
      "Roboczy, zachowawczy profil późnej marchwi na większy korzeń; końcowa rozstawa po przerywce, nie gęstość siewu ani uniwersalna norma dla wszystkich odmian.",
    ),
    sowingDensity: sowingDensity(
      cm(2, 3),
      cm(20, 30),
      null,
      ["S64"],
      "medium",
      "Gęsty siew nasion przed przerywką: 2–3 cm w rzędzie; to osobny parametr siewu, nie końcowa obsada roślin.",
    ),
  },
  cebula: {
    catalogConfidence: "medium",
    finalSpacing: finalSpacing(
      cm(5, 8),
      cm(30),
      "plant",
      "after_planting",
      ["S20"],
      "medium",
      "Wiosenna dymka sadzona pojedynczo na suchą główkę; nie jest to siatka cebuli z nasion ani na szczypior.",
    ),
    sowingDensity: null,
  },
  "burak-cwiklowy": {
    catalogConfidence: "low",
    finalSpacing: finalSpacing(
      cm(8, 10),
      cm(25, 30),
      "plant",
      "after_thinning",
      ["S54", "S65"],
      "low",
      "Pojedynczy korzeń po przerywce; wielonasienny kłębek może wytworzyć kilka siewek, których liczbę trzeba rozdzielić.",
    ),
    sowingDensity: null,
    sowingDensityNote: "Liczby nasion/kiełków z kłębka nie utożsamiać z liczbą końcowych roślin.",
  },
  rzodkiewka: {
    catalogConfidence: "high",
    finalSpacing: finalSpacing(
      cm(2, 4),
      cm(10, 20),
      "plant",
      "after_thinning",
      ["S22"],
      "high",
      "Standardowa wiosenna rzodkiewka; siew może od razu trafić w docelową siatkę albo zostać przerzedzony.",
    ),
    sowingDensity: null,
  },
  salata: {
    catalogConfidence: "medium",
    finalSpacing: finalSpacing(
      cm(20, 25),
      cm(20, 30),
      "plant",
      "after_planting",
      ["S56"],
      "medium",
      "Default dla sałaty masłowej; kruche, rzymskie i liściowe wymagają innych odstępów.",
    ),
    sowingDensity: null,
  },
  "kapusta-biala": {
    catalogConfidence: "low",
    finalSpacing: null,
    sowingDensity: null,
    sowingDensityNote:
      "Nie potwierdzono wiarygodnej, ogrodowej pary osi dla ogólnego wpisu kapusty; dane odmianowe nie są uniwersalnym zamiennikiem.",
  },
  kalafior: {
    catalogConfidence: "medium",
    finalSpacing: finalSpacing(
      cm(45, 60),
      cm(50, 60),
      "plant",
      "after_planting",
      ["S25"],
      "high",
      "Standardowa rozsada kalafiora do gruntu; źródło nie specyfikuje odmiany ani wielkości róży.",
    ),
    sowingDensity: null,
  },
  brokul: {
    catalogConfidence: "medium",
    finalSpacing: finalSpacing(
      cm(40),
      cm(50),
      "plant",
      "after_planting",
      ["S26"],
      "medium",
      "Dojrzały brokuł w ogrodzie działkowym; inne źródło podaje 50 × 50 cm.",
    ),
    sowingDensity: null,
  },
  kalarepa: {
    catalogConfidence: "high",
    finalSpacing: finalSpacing(
      cm(20, 30),
      cm(30),
      "plant",
      "after_planting",
      ["S27"],
      "high",
      "Rozsada kalarepy do zbioru zgrubień; wielkość zbioru wpływa na praktyczną gęstość.",
    ),
    sowingDensity: null,
  },
  jarmuz: {
    catalogConfidence: "medium",
    finalSpacing: finalSpacing(
      cm(40, 50),
      cm(50),
      "plant",
      "after_planting",
      ["S58"],
      "medium",
      "Końcowa rozstawa jarmużu z technicznego źródła; lokalny wariant odmianowy może się różnić.",
    ),
    sowingDensity: null,
  },
  szpinak: {
    catalogConfidence: "low",
    finalSpacing: finalSpacing(
      cm(10, 15),
      cm(30, 36),
      "plant",
      "after_thinning",
      ["S35"],
      "low",
      "Zbiór dojrzałych liści po przerzedzeniu; zagraniczny fallback, nie polska norma.",
    ),
    sowingDensity: null,
  },
  seler: {
    catalogConfidence: "medium",
    finalSpacing: finalSpacing(
      cm(30, 40),
      cm(40),
      "plant",
      "after_planting",
      ["S36"],
      "medium",
      "Seler korzeniowy na jesienny zbiór i przechowanie; nie seler naciowy ani wariant wczesny.",
    ),
    sowingDensity: null,
  },
  czosnek: {
    catalogConfidence: "medium",
    finalSpacing: finalSpacing(
      cm(8, 12),
      cm(20, 25),
      "plant",
      "after_planting",
      ["S8"],
      "medium",
      "Default dla czosnku zimowego: jeden ząbek na pozycję. Czosnek jary ma odrębną, ciaśniejszą siatkę.",
    ),
    sowingDensity: null,
  },
  pasternak: {
    catalogConfidence: "medium",
    finalSpacing: finalSpacing(
      cm(7, 10),
      cm(40, 50),
      "plant",
      "after_thinning",
      ["S38"],
      "medium",
      "Pasternak korzeniowy po przerwaniu wschodów; redliny wymagają innego układu.",
    ),
    sowingDensity: null,
  },
  rukola: {
    catalogConfidence: "low",
    finalSpacing: finalSpacing(
      cm(15),
      cm(30.5),
      "plant",
      "after_thinning",
      ["S59"],
      "low",
      "Zagraniczny fallback pełnej siatki rozety; polskie źródło potwierdza tylko około 6 cm w rzędzie.",
    ),
    sowingDensity: null,
  },
  roszponka: {
    catalogConfidence: "high",
    finalSpacing: finalSpacing(
      cm(10, 15),
      cm(15, 20),
      "plant",
      "after_thinning",
      ["S40"],
      "high",
      "Standardowy zbiór kęp/rozet po przerywce.",
    ),
    sowingDensity: null,
  },
  rzepa: {
    catalogConfidence: "medium",
    finalSpacing: finalSpacing(
      cm(8, 10),
      cm(20, 30),
      "plant",
      "after_thinning",
      ["S60"],
      "high",
      "Jedno pozostawione zgrubienie po przerywce; wiosenne i późnoletnie terminy siewu.",
    ),
    sowingDensity: null,
  },
  por: {
    catalogConfidence: "low",
    finalSpacing: finalSpacing(
      cm(15),
      cm(30),
      "plant",
      "after_planting",
      ["S61"],
      "low",
      "Działkowy punkt odniesienia dla rozsady pora; polowe źródła mają nieopisane osie.",
    ),
    sowingDensity: null,
  },
  koper: {
    catalogConfidence: "low",
    finalSpacing: finalSpacing(
      cm(25, 30),
      cm(61),
      "plant",
      "after_thinning",
      ["S63"],
      "low",
      "Zagraniczny fallback po przerwaniu siewek; polski Atlas opisuje siew kopru na kiszenie, nie końcową siatkę.",
    ),
    sowingDensity: sowingDensity(
      cm(3, 5),
      cm(35, 45),
      null,
      ["S66"],
      "medium",
      "Polska gęstość siewu kopru na kiszenie; nie używać jako końcowej obsady roślin.",
    ),
  },
  szczypiorek: {
    catalogConfidence: "medium",
    finalSpacing: finalSpacing(
      cm(20, 25),
      cm(30),
      "clump",
      "after_planting",
      ["S62"],
      "medium",
      "Odstępy między kępami; jedna jednostka planowania oznacza kępę złożoną z kilku pędów.",
    ),
    sowingDensity: null,
  },
};

function toLegacySpacing(final: FinalSpacingData | null): SpacingData | null {
  if (final === null) return null;
  return verifiedSpacing(
    final.inRowCm,
    final.betweenRowsCm,
    final.context,
    final.sourceIds,
    final.confidence,
    final.stage === "after_thinning" ? "thinning" : "planting",
    true,
  );
}

export const CROP_CATALOG: readonly CropCatalogEntry[] = CROP_CATALOG_SEEDS.map((crop) => {
  const planting = CROP_PLANTING_METADATA[crop.id];
  if (!planting) throw new Error(`Missing planting metadata for crop ${crop.id}`);

  const sourceIds = Array.from(
    new Set([
      ...crop.sourceIds,
      ...(planting.finalSpacing?.sourceIds ?? []),
      ...(planting.sowingDensity?.sourceIds ?? []),
    ]),
  );

  return {
    ...crop,
    ...planting,
    sourceIds,
    // Compatibility for the existing layout reader; never fall back to sowing density.
    spacing: toLegacySpacing(planting.finalSpacing),
  };
});

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
  assertCondition(catalog.length === 31, "expected exactly 31 active crop records");

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

    if (crop.finalSpacing !== null) {
      assertRange(crop.finalSpacing.inRowCm, crop.id + " final in-row spacing");
      assertRange(crop.finalSpacing.betweenRowsCm, crop.id + " final between-row spacing");
      assertCondition(crop.finalSpacing.context.trim().length > 0, crop.id + " final spacing has no context");
      assertCondition(crop.finalSpacing.sourceIds.length > 0, crop.id + " final spacing has no source");
      assertSourceIds(crop.finalSpacing.sourceIds, crop.id + " final spacing");
      assertCondition(crop.finalSpacing.stage.length > 0, crop.id + " final spacing has no stage");
      assertCondition(
        crop.spacing !== null,
        crop.id + " final spacing must be exposed to the layout compatibility view",
      );
    } else {
      assertCondition(crop.spacing === null, crop.id + " must not fall back to non-final spacing");
    }

    if (crop.sowingDensity !== null) {
      const density = crop.sowingDensity;
      if (density.inRowCm !== null) assertRange(density.inRowCm, crop.id + " sowing in-row density");
      if (density.betweenRowsCm !== null) assertRange(density.betweenRowsCm, crop.id + " sowing between-row density");
      if (density.seedsPerPosition !== null)
        assertRange(density.seedsPerPosition, crop.id + " seeds per sowing position");
      assertCondition(density.context.trim().length > 0, crop.id + " sowing density has no context");
      assertCondition(density.sourceIds.length > 0, crop.id + " sowing density has no source");
      assertSourceIds(density.sourceIds, crop.id + " sowing density");
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
