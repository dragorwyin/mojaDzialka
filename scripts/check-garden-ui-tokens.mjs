import { readFile } from "node:fs/promises";
import { URL } from "node:url";

const files = [
  "src/pages/garden.astro",
  "src/components/garden/GardenSetupForm.tsx",
  "src/components/garden/CropSelectionForm.tsx",
];

const hardcodedUiValuePattern =
  /#[\da-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|oklch\([^)]*\)|-\[[^\]\n]+\]|\b(?:bg|text|border|ring|outline|from|via|to|fill|stroke|shadow|divide)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)\b/gi;

const intentionalMatches = new Map([
  [
    "src/pages/garden.astro:-[0.2em]",
    "Preserves the existing section-label tracking; replacing it with a stock spacing changes the approved motif.",
  ],
  [
    "src/components/garden/CropSelectionForm.tsx:-[0.2em]",
    "Preserves the existing section-label tracking; replacing it with a stock spacing changes the approved motif.",
  ],
  [
    "src/components/garden/CropSelectionForm.tsx:-[1fr_10rem_auto]",
    "Keeps the proportion input at 10rem and the action content-sized at desktop widths.",
  ],
]);

const findings = [];
const documentedMatches = [];
const documentedMatchCounts = new Map();

for (const file of files) {
  const content = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
  const lines = content.split(/\r?\n/);

  for (const [index, line] of lines.entries()) {
    hardcodedUiValuePattern.lastIndex = 0;
    const matches = [...line.matchAll(hardcodedUiValuePattern)].map(([match]) => match);

    for (const match of matches) {
      const key = `${file}:${match}`;
      const reason = intentionalMatches.get(key);
      if (reason) {
        const seenCount = (documentedMatchCounts.get(key) ?? 0) + 1;
        documentedMatchCounts.set(key, seenCount);

        if (seenCount === 1) {
          documentedMatches.push(`${file}:${index + 1}: ${match} — ${reason}`);
        } else {
          findings.push(`${file}:${index + 1}: ${match} (documented exception exceeded its one allowed occurrence)`);
        }
      } else {
        findings.push(`${file}:${index + 1}: ${match}`);
      }
    }
  }
}

if (findings.length > 0) {
  console.error(`Garden UI token scan found ${findings.length} hardcoded-value line(s):\n${findings.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(
    `Garden UI token scan passed: 0 unapproved matches across ${files.length} files; ${documentedMatches.length} documented matches remain.`,
  );
}
