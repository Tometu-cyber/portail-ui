// Build de @portail/ui : JS et types fichier par fichier avec tsc (garde "use client" en tête
// de chaque module), puis les feuilles de style dans dist/.
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");
const dist = join(root, "dist");

rmSync(dist, { recursive: true, force: true });

// le binaire déclaré par le paquet typescript (son chemin n'est pas dans ses "exports")
const tsPkg = createRequire(import.meta.url).resolve("typescript/package.json");
const tsc = join(dirname(tsPkg), JSON.parse(readFileSync(tsPkg, "utf8")).bin.tsc);
execFileSync(process.execPath, [tsc, "-p", join(root, "tsconfig.build.json")], { stdio: "inherit" });

mkdirSync(dist, { recursive: true });
// styles.css : tokens (clair et sombre) puis composants, en un seul fichier
const css = ["tokens.css", "styles.css"].map((f) => readFileSync(join(src, f), "utf8").trim()).join("\n\n");
writeFileSync(join(dist, "styles.css"), `/* @portail/ui : tokens et composants du design system Portail */\n${css}\n`);
copyFileSync(join(src, "tailwind-theme.css"), join(dist, "tailwind-theme.css"));

console.log("dist/ prêt");
