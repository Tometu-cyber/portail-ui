/**
 * AppTile : tuile d'une app sur l'accueil du portail (icône, nom, chiffre clé, détail et
 * jauge facultative). Un tap ouvre l'app. `tinted` (fond <app>-bg) : une ou deux par écran.
 * Voir design-system/components/AppTile/README.md.
 */
import { clsx } from "clsx";
import type { ReactNode } from "react";
import { AppIcon } from "./app-icon.js";
import { appClass, Glyph, type AppId } from "./ds.js";
import { linkTag, type Linkable } from "./link.js";

export interface AppTileProps extends Linkable {
  app?: AppId;
  name: string;
  /** Chiffre clé, court (8 caractères maximum) */
  value?: ReactNode;
  /** Ce que le chiffre veut dire */
  detail?: ReactNode;
  /** 0 à 1 : affiche une jauge à la couleur de l'app */
  progress?: number;
  /** Jauge bientôt pleine (warn) ou dépassée (over) ; à doubler d'un texte */
  progressTone?: "default" | "warn" | "over";
  variant?: "plain" | "tinted";
  onClick?: () => void;
  className?: string;
}

export function AppTile({
  app = "portail",
  name,
  value,
  detail,
  progress,
  progressTone = "default",
  variant = "plain",
  href,
  linkAs,
  onClick,
  className,
}: AppTileProps) {
  const p = typeof progress === "number" ? Math.max(0, Math.min(1, progress)) : null;
  const cls = clsx("pt-root pt-tile", appClass(app), variant === "tinted" && "pt-tile-tinted", className);
  const content = (
    <>
      <span className="pt-tile-head">
        <AppIcon app={app} size={44} />
        <Glyph icon="chevron" size={18} className="pt-tile-chev" />
      </span>
      <span className="pt-tile-name">{name}</span>
      {value != null && <span className="pt-tile-value">{value}</span>}
      {detail != null && <span className="pt-tile-detail">{detail}</span>}
      {p !== null && (
        <span
          className={clsx("pt-tile-bar", progressTone !== "default" && `is-${progressTone}`)}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(p * 100)}
        >
          <span style={{ width: `${p * 100}%` }} />
        </span>
      )}
    </>
  );
  if (href) {
    const LinkTag = linkTag(linkAs);
    return (
      <LinkTag href={href} className={cls} onClick={onClick}>
        {content}
      </LinkTag>
    );
  }
  return (
    <button type="button" className={cls} onClick={onClick}>
      {content}
    </button>
  );
}
