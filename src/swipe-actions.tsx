"use client";

import { clsx } from "clsx";
import { useEffect, useId, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Glyph } from "./ds.js";
import type { IconSource } from "./icon.js";
import { animateSpring, project, rubberband, SPRINGS, velocityFrom, type SpringAnimation } from "./motion/spring.js";
import { prefersReducedMotion } from "./overlay.js";
import { Spinner } from "./spinner.js";

const ACTION_WIDTH = 92;
/** Hystérésis avant de choisir entre glisser (horizontal) et défiler (vertical) */
const SLOP = 10;
const OPEN_EVENT = "portail:swipe-open";

export interface SwipeActionsProps {
  children: ReactNode;
  /** Libellé de l'action révélée (« Supprimer », « Archiver »…) */
  label: string;
  icon?: IconSource;
  /** destructive : rouge (par défaut) ; app : couleur de l'app */
  tone?: "destructive" | "app";
  /** Appelée au toucher de l'action. L'app fait le travail et affiche son retour (toast…). */
  onAction: () => void;
  /**
   * Action en cours : spinner et geste bloqué ; quand il repasse à false, la ligne se referme.
   * Sans `pending`, la ligne se referme dès le toucher.
   */
  pending?: boolean;
}

/**
 * Glisser une ligne vers la gauche pour révéler une action (écrans tactiles).
 * La ligne suit le doigt 1:1, résiste au-delà des bords, et l'élan au lâcher décide
 * d'ouvrir ou de refermer. Une seule ligne ouverte à la fois ; toucher ailleurs referme.
 * Composant visuel : il ne sait pas ce que fait l'action.
 */
export function SwipeActions({ children, label, icon, tone = "destructive", onAction, pending }: SwipeActionsProps) {
  const busy = pending ?? false;
  const id = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLButtonElement>(null);
  const motion = useRef({
    offset: 0,
    anim: null as SpringAnimation | null,
    gesture: null as null | {
      pointerId: number;
      x: number;
      y: number;
      startOffset: number;
      axis: "x" | "y" | null;
      crossed: boolean;
      history: { t: number; v: number }[];
    },
    suppressClick: false,
  });

  const paint = (v: number) => {
    motion.current.offset = v;
    if (rowRef.current) rowRef.current.style.transform = v ? `translate3d(${v}px, 0, 0)` : "";
    // l'action n'existe visuellement que lorsqu'elle est découverte
    if (actionRef.current) actionRef.current.style.visibility = v < 0 ? "visible" : "hidden";
  };

  const settle = (target: number, velocity = 0) => {
    const m = motion.current;
    const from = m.anim ? m.anim.stop().value : m.offset;
    m.anim = null;
    setOpen(target !== 0);
    if (target !== 0) window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: id }));
    if (prefersReducedMotion()) return paint(target);
    m.anim = animateSpring({
      from,
      to: target,
      velocity,
      // léger rebond seulement si le geste avait de l'élan
      config: Math.abs(velocity) > 300 ? SPRINGS.momentum : SPRINGS.default,
      onUpdate: paint,
      onComplete: () => (m.anim = null),
    });
  };

  // Une autre ligne s'ouvre, ou on touche ailleurs : on referme
  useEffect(() => {
    if (!open) return;
    const onOtherOpen = (e: Event) => (e as CustomEvent).detail !== id && settle(0);
    const onPointerDown = (e: PointerEvent) => !rootRef.current?.contains(e.target as Node) && settle(0);
    window.addEventListener(OPEN_EVENT, onOtherOpen);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener(OPEN_EVENT, onOtherOpen);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, id]);

  useEffect(() => {
    const m = motion.current;
    return () => {
      m.anim?.stop();
    };
  }, []);

  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.pointerType === "mouse" || busy) return; // à la souris : pas de glissé, l'app propose l'action autrement
    const m = motion.current;
    const current = m.anim ? m.anim.stop().value : m.offset; // rattrapée en plein vol : on part de l'affiché
    m.anim = null;
    m.gesture = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, startOffset: current, axis: null, crossed: current !== 0, history: [] };
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const g = motion.current.gesture;
    if (!g || g.pointerId !== e.pointerId) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.axis) {
      if (Math.hypot(dx, dy) < SLOP) return;
      g.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (g.axis === "y") return; // défilement vertical natif
      rowRef.current?.setPointerCapture(e.pointerId);
    }
    if (g.axis !== "x") return;
    const width = rootRef.current?.offsetWidth ?? 360;
    const raw = g.startOffset + dx;
    g.history.push({ t: e.timeStamp, v: raw });
    if (g.history.length > 12) g.history.shift();
    // résistance au-delà des bords : vers la droite, et au-delà de la largeur de l'action
    const v = raw > 0 ? rubberband(raw, width) : raw < -ACTION_WIDTH ? -ACTION_WIDTH + rubberband(raw + ACTION_WIDTH, width) : raw;
    paint(v);
    // retour haptique discret au franchissement du seuil (Android)
    const past = v < -ACTION_WIDTH / 2;
    if (past !== g.crossed) {
      g.crossed = past;
      if (past) navigator.vibrate?.(8);
    }
  };

  const onPointerUp = (e: ReactPointerEvent) => {
    const m = motion.current;
    const g = m.gesture;
    m.gesture = null;
    if (!g || g.pointerId !== e.pointerId || g.axis !== "x") return;
    m.suppressClick = true; // un glisser n'est pas un clic sur la ligne
    const velocity = velocityFrom(g.history);
    // décision d'après la position projetée par l'élan (décélération « sèche »)
    const projected = m.offset + project(velocity, 0.99);
    settle(projected < -ACTION_WIDTH / 2 ? -ACTION_WIDTH : 0, velocity);
  };

  const onClickCapture = (e: ReactMouseEvent) => {
    const m = motion.current;
    if (m.suppressClick || m.offset !== 0) {
      e.preventDefault();
      e.stopPropagation();
      if (!m.suppressClick) settle(0); // ligne ouverte : toucher la referme
    }
    m.suppressClick = false;
  };

  // Fin de l'action (pending repasse à false) : la ligne se referme si elle est toujours là
  const wasBusy = useRef(busy);
  useEffect(() => {
    if (wasBusy.current && !busy) settle(0);
    wasBusy.current = busy;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy]);

  const act = () => {
    if (busy) return;
    onAction();
    if (pending === undefined) settle(0);
  };

  return (
    <div ref={rootRef} className="pt-root pt-swipe">
      <button
        ref={actionRef}
        type="button"
        onClick={act}
        aria-hidden={!open}
        aria-busy={busy || undefined}
        tabIndex={open ? 0 : -1}
        className={clsx("pt-swipe-action", tone === "app" && "pt-swipe-action-app")}
        style={{ width: ACTION_WIDTH, visibility: "hidden" }}
      >
        {busy ? <Spinner size={18} /> : icon ? <Glyph icon={icon} size={20} /> : null}
        {label}
      </button>
      <div
        ref={rowRef}
        className="pt-swipe-row"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
      >
        {children}
      </div>
    </div>
  );
}
