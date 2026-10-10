import { readFile } from "node:fs/promises";
import { URL } from "node:url";

const files = [
  "src/layouts/Layout.astro",
  "src/components/Topbar.astro",
  "src/components/Welcome.astro",
  "src/pages/dashboard.astro",
  "src/pages/auth/signin.astro",
  "src/pages/auth/signup.astro",
  "src/components/auth/FormField.tsx",
  "src/components/auth/SubmitButton.tsx",
  "src/components/auth/PasswordToggle.tsx",
  "src/components/auth/ServerError.tsx",
  "src/components/auth/SignInForm.tsx",
  "src/components/auth/SignUpForm.tsx",
  "src/pages/garden.astro",
  "src/pages/dev/garden-planner-kitchen-sink.astro",
  "src/pages/dev/crop-selection-kitchen-sink.astro",
  "src/components/garden/GardenSetupForm.tsx",
  "src/components/garden/CropSelectionForm.tsx",
  "src/components/garden/GardenPlanner.tsx",
  "src/components/garden/GardenLayoutView.tsx",
  "src/components/garden/SeasonWorkSchedule.tsx",
  "src/components/garden/CropSourceLinks.tsx",
];

const hardcodedUiValuePattern =
  /#[\da-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|oklch\([^)]*\)|\b(?:bg|text|border|ring|outline|from|via|to|fill|stroke|shadow|divide)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)\b|\b(?:bg|text|border|ring|outline|from|via|to|fill|stroke|shadow)-\[[^\]\n]+\]/gi;

const intentionalMatches = new Map();

const findings = [];
const documentedMatches = [];
const documentedMatchCounts = new Map();

for (const file of files) {
  const content = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
  const lines = content.split(/\r?\n/);

  for (const [index, line] of lines.entries()) {
    if (/\bbg-cosmic\b/.test(line)) {
      findings.push(`${file}:${index + 1}: bg-cosmic (replace legacy background utility with a semantic role)`);
    }

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
