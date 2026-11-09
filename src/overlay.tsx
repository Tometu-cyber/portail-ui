"use client";

import { clsx } from "clsx";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { CircleAlert, CircleCheck, X } from "lucide-react";
import { createPortal } from "react-dom";
import { appClass, type AppId } from "./ds.js";
import { animateSpring, project, rubberband, SPRINGS, velocityFrom, type SpringAnimation, type SpringConfig } from "./motion/spring.js";

/** Préférence système « réduire les animations ». */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Modale centrée sur ordinateur, feuille remontant du bas sur mobile.
 * Échap ou clic sur le fond ferme sans action.
 *
 * Mouvement : ressorts interruptibles (une modale en train de se fermer peut être rattrapée),
 * entrée et sortie par le même chemin. Sur mobile, la feuille se tire vers le bas par sa
 * poignée : elle suit le doigt 1:1, résiste vers le haut, et l'élan au lâcher décide entre
 * fermer et revenir. « Réduire les animations » : simple fondu.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
  app,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
  /** Couleur d'accent (sinon celle posée sur <body>, la modale étant rendue à sa racine) */
  app?: AppId;
}) {
  const [mounted, setMounted] = useState(open);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  // onClose est souvent une fonction inline : on la garde en ref pour ne pas relancer l'effet
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Contenu conservé pendant l'animation de sortie (le parent l'a souvent déjà vidé)
  const content = useRef({ title, children, footer });
  if (open) content.current = { title, children, footer };

  // État du mouvement, hors rendu React (mis à jour à chaque image)
  const motion = useRef({
    sheet: false,
    reduced: false,
    height: 600,
    /** feuille : décalage en px (0 = ouverte) ; boîte de dialogue : 0 = ouverte, 1 = fermée */
    value: 1,
    anim: null as SpringAnimation | null,
    releaseVelocity: 0,
    drag: null as null | { startY: number; startValue: number; active: boolean; history: { t: number; v: number }[] },
  });

  const closedValue = () => (motion.current.sheet ? motion.current.height : 1);

  const paint = useCallback((v: number) => {
    const m = motion.current;
    m.value = v;
    const panel = panelRef.current;
    const scrim = scrimRef.current;
    if (!panel || !scrim) return;
    const closedness = m.sheet ? Math.min(1, Math.max(0, v / m.height)) : v;
    scrim.style.opacity = String(1 - closedness);
    if (m.reduced && !m.drag?.active) {
      panel.style.opacity = String(1 - closedness);
      panel.style.transform = m.sheet && v < 0 ? `translate3d(0, ${v}px, 0)` : "";
    } else if (m.sheet) {
      panel.style.opacity = "";
      panel.style.transform = `translate3d(0, ${v}px, 0)`;
    } else {
      // la surface « se matérialise » : opacité et échelle ensemble
      panel.style.opacity = String(1 - v);
      panel.style.transform = `translate3d(0, ${v * 8}px, 0) scale(${1 - v * 0.04})`;
    }
  }, []);

  const animateTo = useCallback(
    (target: number, opts: { velocity?: number; config?: SpringConfig; onComplete?: () => void } = {}) => {
      const m = motion.current;
      const current = m.anim ? m.anim.stop() : { value: m.value, velocity: 0 };
      m.anim = animateSpring({
        from: current.value,
        to: target,
        velocity: opts.velocity ?? current.velocity,
        config: opts.config ?? (m.sheet ? SPRINGS.sheet : SPRINGS.default),
        restDelta: m.sheet ? 0.5 : 0.002,
        onUpdate: paint,
        onComplete: () => {
          m.anim = null;
          opts.onComplete?.();
        },
      });
    },
    [paint],
  );

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  // Entrée / sortie
  useLayoutEffect(() => {
    if (!mounted) return;
    const m = motion.current;
    const panel = panelRef.current;
    if (open) {
      // ouverture depuis l'état fermé ; si la sortie était en cours, on repart de là
      if (!m.anim) {
        m.sheet = window.matchMedia("(max-width: 767px)").matches;
        m.reduced = prefersReducedMotion();
        m.height = panel?.getBoundingClientRect().height || 600;
        paint(closedValue());
      }
      animateTo(0);
    } else {
      const velocity = m.releaseVelocity || undefined;
      m.releaseVelocity = 0;
      animateTo(closedValue(), { velocity, config: m.sheet ? SPRINGS.sheet : SPRINGS.default, onComplete: () => setMounted(false) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mounted]);

  useEffect(() => {
    const m = motion.current;
    return () => {
      m.anim?.stop();
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    // focus sur le premier champ de la modale
    requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>("input, select, textarea, button:not([data-close])")?.focus({ preventScroll: true });
    });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previous?.focus?.({ preventScroll: true });
    };
  }, [mounted]);

  // Glisser pour fermer (feuille mobile)
  const onPointerDown = (e: ReactPointerEvent) => {
    const m = motion.current;
    if (!m.sheet || !open || e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button, a, input, select, textarea")) return;
    const current = m.anim ? m.anim.stop() : { value: m.value, velocity: 0 };
    m.anim = null;
    m.drag = { startY: e.clientY, startValue: current.value, active: false, history: [{ t: e.timeStamp, v: current.value }] };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const d = motion.current.drag;
    if (!d) return;
    const dy = e.clientY - d.startY;
    if (!d.active && Math.abs(dy) < 4) return;
    d.active = true;
    const raw = d.startValue + dy;
    d.history.push({ t: e.timeStamp, v: raw });
    if (d.history.length > 12) d.history.shift();
    // vers le haut : résistance, il n'y a rien de plus à ouvrir
    paint(raw < 0 ? rubberband(raw, motion.current.height) : raw);
  };
  const onPointerUp = () => {
    const m = motion.current;
    const d = m.drag;
    m.drag = null;
    if (!d?.active) return;
    const velocity = velocityFrom(d.history);
    // décision sur la position projetée par l'élan, pas sur la position au lâcher
    if (m.value + project(velocity) > m.height * 0.5) {
      m.releaseVelocity = velocity;
      onCloseRef.current();
    } else {
      animateTo(0, { velocity, config: SPRINGS.momentum });
    }
  };

  if (!mounted) return null;
  const { title: shownTitle, children: shownChildren, footer: shownFooter } = content.current;
  const dragProps = { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp };
  // Rendue à la racine du document : ouverte depuis un en-tête collant (contexte d'empilement
  // à part), la feuille passait sous la barre d'onglets.
  return createPortal(
    <div className={clsx("pt-root pt-modal-layer", appClass(app), !open && "is-closing")} role="presentation">
      <div ref={scrimRef} className="pt-modal-scrim" style={{ opacity: 0 }} onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        style={{ opacity: 0 }}
        className={clsx("pt-modal", size === "lg" && "pt-modal-lg")}
      >
        {/* poignée : zone de glisser de la feuille mobile */}
        <div {...dragProps} className="pt-modal-grabber" aria-hidden>
          <span />
        </div>
        {shownTitle && (
          <div {...dragProps} className="pt-modal-head">
            <h2 className="pt-modal-title">{shownTitle}</h2>
            <button
              type="button"
              data-close
              onClick={onClose}
              className="pt-glass pt-modal-close"
              aria-label="Fermer"
            >
              <X size={18} strokeWidth={1.75} className="pt-icon" aria-hidden />
            </button>
          </div>
        )}
        <div className="pt-modal-body">{shownChildren}</div>
        {shownFooter && <div className="pt-modal-foot">{shownFooter}</div>}
      </div>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// Toasts
// ---------------------------------------------------------------------------

interface ToastItem {
  id: number;
  message: string;
  tone: "success" | "error";
  leaving?: boolean;
}

const ToastContext = createContext<(message: string, tone?: ToastItem["tone"]) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const push = useCallback((message: string, tone: ToastItem["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list.slice(-2), { id, message, tone }]);
    // sortie par le même chemin que l'entrée, puis retrait
    setTimeout(() => setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t))), 3300);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3550);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pt-root pt-toasts" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={clsx("pt-toast", `pt-toast-${t.tone}`, t.leaving ? "is-out" : "is-in")}
          >
            {t.tone === "success" ? (
              <CircleCheck size={18} strokeWidth={2} className="pt-icon" aria-hidden />
            ) : (
              <CircleAlert size={18} strokeWidth={2} className="pt-icon" aria-hidden />
            )}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
