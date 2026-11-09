/**
 * Base commune des composants du design system « Portail » (design-system/README.md) :
 * identifiants d'app et pictogrammes (définis dans icon.tsx).
 */
export { Glyph, ICON_STROKE } from "./icon";

/** Couleur d'app : redéfinit --app, --app-text, --app-bg et --on-app (classe pt-app-<app>). */
export type AppId = "finances" | "sport" | "alternance" | "alimentation" | "notes" | "portail";

/**
 * Classe de couleur d'app. Sans app, le composant hérite de la couleur de son conteneur
 * (par exemple pt-app-finances sur tout le layout de Pecunia), et à défaut du bleu du portail.
 */
export function appClass(app: AppId | undefined): string | undefined {
  return app ? `pt-app-${app}` : undefined;
}
