/**
 * Liens (API de l'artefact Portail) : un composant avec `href` se rend en <a>, ou avec le
 * composant de lien de l'app (Next.js Link, React Router Link…) :
 *   - `setLinkComponent(Link)`, appelé une fois au démarrage, vaut pour tous les composants ;
 *   - la prop `linkAs` d'un composant le remplace pour ce composant.
 * Pas de hook ici : Button, GlassButton et ListRow restent utilisables dans un composant
 * serveur (Next.js).
 */
import type { ComponentType, MouseEvent, ReactNode } from "react";

/** Composant de lien de l'app : reçoit href, className, onClick, children et les attributs aria. */
export type LinkComponent = ComponentType<{
  href: string;
  className?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  children?: ReactNode;
  [key: string]: unknown;
}>;

/** Props communes aux composants qui peuvent être des liens. */
export interface Linkable {
  href?: string;
  /** Composant de lien pour ce composant seulement (sinon celui de setLinkComponent) */
  linkAs?: LinkComponent;
}

let linkComponent: LinkComponent | null = null;

/** Choisit le composant utilisé par tous les `href` (null : balise <a>). */
export function setLinkComponent(link: LinkComponent | null): void {
  linkComponent = link;
}

/** Composant de lien à utiliser : `linkAs`, sinon celui de setLinkComponent, sinon <a>. */
export function linkTag(linkAs?: LinkComponent): LinkComponent | "a" {
  return linkAs ?? linkComponent ?? "a";
}
