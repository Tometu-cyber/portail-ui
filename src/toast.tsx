/**
 * Toast : message bref qui monte du bas de l'écran (« Enregistré »), avec une action
 * facultative (« Annuler »). Composant visuel : l'app gère la file, la durée d'affichage et
 * la sortie (`leaving`, puis retrait de la liste après l'animation, environ 220 ms).
 *
 *   <ToastRegion>
 *     {toasts.map((t) => <Toast key={t.id} tone={t.tone} leaving={t.leaving}>{t.message}</Toast>)}
 *   </ToastRegion>
 */
import { clsx } from "clsx";
import { CircleAlert, CircleCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Glyph } from "./ds.js";
import type { IconSource } from "./icon.js";

/** Zone fixe en bas de l'écran (au-dessus de la barre d'onglets sur mobile), annoncée aux lecteurs d'écran. */
export function ToastRegion({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div className={clsx("pt-root pt-toasts", className)} aria-live="polite">
      {children}
    </div>
  );
}

export interface ToastProps {
  children: ReactNode;
  /** success : coche verte ; error : alerte rouge ; neutral : sans pictogramme */
  tone?: "success" | "error" | "neutral";
  /** Remplace le pictogramme du ton (null : aucun) */
  icon?: IconSource | null;
  /** Bouton à droite (« Annuler ») */
  action?: { label: string; onClick: () => void };
  /** Le toast repart (animation de sortie) */
  leaving?: boolean;
  className?: string;
}

const TONE_ICON: Record<NonNullable<ToastProps["tone"]>, IconSource | null> = { success: CircleCheck, error: CircleAlert, neutral: null };

export function Toast({ children, tone = "neutral", icon, action, leaving = false, className }: ToastProps) {
  const shown = icon === undefined ? TONE_ICON[tone] : icon;
  return (
    <div className={clsx("pt-toast", `pt-toast-${tone}`, leaving ? "is-out" : "is-in", className)} role={tone === "error" ? "alert" : "status"}>
      {shown && <Glyph icon={shown} size={18} strokeWidth={2} />}
      <span className="pt-toast-text">{children}</span>
      {action && (
        <button type="button" className="pt-toast-action" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
