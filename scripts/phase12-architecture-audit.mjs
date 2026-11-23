#!/usr/bin/env node
/**
 * Tiny Track Rivals - Fase 12: controllo architettura.
 * CLI di sola lettura: NON modifica index.html, JavaScript o gameplay.
 * Esecuzione: node scripts/phase12-architecture-audit.mjs
 * Richiede Node.js >= 18. Nessun pacchetto esterno.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const errors = [];
const warnings = [];
const checks = [];
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const exists = (relative) => fs.existsSync(path.join(root, relative));
const add = (ok, label, detail = "") => {
  checks.push({ ok, label, detail });
  if (!ok) errors.push(`${label}${detail ? `: ${detail}` : ""}`);
};
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : entry.isFile() && full.endsWith(".js") ? [full] : [];
  });
}

if (!exists("index.html") || !exists("js/06-game-legacy.js")) {
  console.error("ERRORE: avviare lo script dalla radice del repository, con index.html e js/06-game-legacy.js.");
  process.exit(1);
}

const html = read("index.html");
const scripts = [...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+\.js)(?:\?[^"']*)?["']/gi)]
  .map(m => m[1].replaceAll("\\", "/"));
const legacy = "js/06-game-legacy.js";
const legacyIndex = scripts.indexOf(legacy);

add(scripts.length > 0, "Script JS dichiarati in index.html", `${scripts.length} trovati`);
add(legacyIndex !== -1, "Legacy presente in index.html");
add(scripts.filter(s => s === legacy).length === 1, "Legacy caricato una volta sola");

for (const src of [...new Set(scripts)]) {
  if (!exists(src)) add(false, "File JS mancante", src);
}
const duplicateTags = [...new Set(scripts.filter((s, i) => scripts.indexOf(s) !== i))];
add(duplicateTags.length === 0, "Nessun JS caricato due volte", duplicateTags.join(", "));

const requiredBeforeLegacy = {
  "js/07a-race-grid-logic.js": "TTRRaceGrid",
  "js/07b-race-powerups-logic.js": "TTRRacePowerups",
  "js/07c-race-driver-logic.js": "TTRRaceDrivers",
  "js/07d-race-safety-logic.js": "TTRRaceSafety",
  "js/08a-race-progress-logic.js": "TTRRaceProgress",
  "js/08b-race-timing-logic.js": "TTRRaceTiming",
  "js/09a-race-cpu-logic.js": "TTRRaceCPU",
  "js/09b-race-oil-logic.js": "TTRRaceOil",
  "js/09c-race-pickup-logic.js": "TTRRacePickups",
  "js/09d-race-collision-logic.js": "TTRRaceCollisions",
  "js/10a-mode-race.js": "TTRModeRace",
  "js/10b-mode-trial.js": "TTRModeTrial",
  "js/10c-mode-elimination.js": "TTRModeElimination",
  "js/11a-race-results.js": "TTRRaceResults",
  "js/11b-race-flow.js": "TTRRaceFlow"
};
for (const [file, api] of Object.entries(requiredBeforeLegacy)) {
  const idx = scripts.indexOf(file);
  add(idx >= 0 && idx < legacyIndex, `Caricamento di ${file} prima del legacy`,
      `indice ${idx}, legacy ${legacyIndex}`);
  if (exists(file)) {
    const source = read(file);
    const assigned = new RegExp(`\\bwindow\\.${api}\\s*=`);
    add(assigned.test(source), `${file} esporta window.${api}`);
  }
}

const legacySource = read(legacy);
for (const api of Object.values(requiredBeforeLegacy)) {
  // Le modalita' Gara veloce e Time Trial sono richiamate dal flusso gara (Fase 11b),
  // non direttamente dal legacy: la dipendenza resta comunque verificata.
  const consumer = api === "TTRModeRace" || api === "TTRModeTrial"
    ? "js/11b-race-flow.js" : legacy;
  const source = consumer === legacy ? legacySource : read(consumer);
  add(new RegExp(`\\b(?:window\\.)?${api}\\b`).test(source),
      `${consumer} collega ${api}`);
}

// Gli adapter di compatibilita' sono intenzionali: stessi NOMI non equivalgono a due logiche.
// Nessuna sostituzione o cancellazione automatica: servirebbe un audit dei riferimenti e
// dell'ordine di inizializzazione, non una ricerca testuale.
const names = new Map();
const jsFiles = walk(path.join(root, "js"));
for (const file of jsFiles) {
  const rel = path.relative(root, file).replaceAll(path.sep, "/");
  const code = fs.readFileSync(file, "utf8");
  const localFunctions = [...code.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(x => x[1]);
  const duplicates = [...new Set(localFunctions.filter((name, i) => localFunctions.indexOf(name) !== i))];
  if (duplicates.length) warnings.push(`${rel}: verificare dichiarazioni di funzioni ripetute (${duplicates.join(", ")})`);
  for (const name of localFunctions) {
    const files = names.get(name) || new Set();
    files.add(rel);
    names.set(name, files);
  }
}
const sharedNames = [...names].filter(([, files]) => files.size > 1).map(([name, files]) => ({
  name, files: [...files].sort()
}));
if (sharedNames.length) {
  warnings.push(`${sharedNames.length} nomi funzione presenti in piu' file: esaminare gli adapter, NON eliminarli automaticamente`);
}

// Verifica di sintassi di tutti gli script non-module con il parser reale di Node.js.
// NON esegue gli script e NON esegue la logica di gioco.
let passedSyntax = 0;
for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8", timeout: 20_000 });
  if (result.status !== 0) {
    add(false, "Sintassi JS", `${path.relative(root, file)} - ${(result.stderr || result.error?.message || "").trim().slice(0, 500)}`);
  } else {
    passedSyntax++;
  }
}
checks.push({ ok: true, label: "File JS controllati sintatticamente", detail: String(passedSyntax) });

const result = {
  title: "Tiny Track Rivals - Fase 12: controllo architettura",
  scope: "Verifiche statiche; nessun cambiamento al gameplay",
  totals: { scriptTags: scripts.length, jsFiles: jsFiles.length, syntaxPassed: passedSyntax,
            errors: errors.length, warnings: warnings.length },
  checks, errors, warnings, sharedNames
};
const report = `# Controllo architettura - Fase 12\n\n` +
  `Esito: **${errors.length ? "FAIL" : "PASS"}**\n\n` +
  `- Script in index.html: ${scripts.length}\n` +
  `- File JavaScript analizzati: ${jsFiles.length}\n` +
  `- Sintassi JavaScript superata: ${passedSyntax}\n` +
  `- Errori: ${errors.length}\n` +
  `- Avvisi: ${warnings.length}\n` +
  `- Adapter/nomi condivisi tra file: ${sharedNames.length} (NON sono automaticamente duplicazioni)\n\n` +
  `## Errori\n\n${errors.length ? errors.map(x => `- ${x}`).join("\n") : "Nessuno."}\n\n` +
  `## Avvisi\n\n${warnings.length ? warnings.map(x => `- ${x}`).join("\n") : "Nessuno."}\n\n` +
  `## Note\n\nQuesto controllo non collauda telecamera, fisica, IA, audio o gameplay. ` +
  `I test in browser e su iPhone restano necessari.\n`;

console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
if (process.env.TTR_AUDIT_JSON === "1") console.log(JSON.stringify(result, null, 2));
process.exit(errors.length ? 1 : 0);
