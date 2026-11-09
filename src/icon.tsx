/**
 * Pictogrammes du design system « Portail » : la liste `IconName` de l'artefact, dessinée
 * avec lucide-react au trait de 1,75. Partout où un composant prend `icon`, on peut passer
 * un nom (`icon="plus"`, la forme de l'artefact) ou un composant lucide (`icon={Plus}`)
 * pour un pictogramme hors liste.
 */
import { clsx } from "clsx";
import {
  ArrowDownWideNarrow,
  ArrowLeftRight,
  Bell,
  BriefcaseBusiness,
  Calendar,
  ChartColumn,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  CircleAlert,
  Clock,
  Coins,
  Copy,
  CreditCard,
  Dumbbell,
  Ellipsis,
  Euro,
  FileText,
  House,
  LayoutGrid,
  ListFilter,
  MapPin,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  TrendingUp,
  User,
  Utensils,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import type { AppId } from "./ds.js";

export type IconName =
  | "home"
  | "grid"
  | "search"
  | "user"
  | "plus"
  | "settings"
  | "chevron"
  | "calendar"
  | "bell"
  | "alert"
  | "check"
  | "chart"
  | "euro"
  | "clock"
  | "updown"
  | "more"
  | "edit"
  | "copy"
  | "trash"
  | "sort"
  | "x"
  | "back"
  | "filter"
  | "card"
  | "coins"
  | "swap"
  | "pin"
  | "trend"
  | AppId;

/** Un pictogramme : son nom dans le design system, ou un composant lucide-react. */
export type IconSource = IconName | LucideIcon;

/** Équivalent lucide de chaque nom (même dessin que l'artefact, ou le plus proche). */
export const ICONS: Record<IconName, LucideIcon> = {
  home: House,
  grid: LayoutGrid,
  search: Search,
  user: User,
  plus: Plus,
  settings: SlidersHorizontal,
  chevron: ChevronRight,
  calendar: Calendar,
  bell: Bell,
  alert: CircleAlert,
  check: Check,
  chart: ChartColumn,
  euro: Euro,
  clock: Clock,
  updown: ChevronsUpDown,
  more: Ellipsis,
  edit: Pencil,
  copy: Copy,
  trash: Trash2,
  sort: ArrowDownWideNarrow,
  x: X,
  back: ChevronLeft,
  filter: ListFilter,
  card: CreditCard,
  coins: Coins,
  swap: ArrowLeftRight,
  pin: MapPin,
  trend: TrendingUp,
  finances: Wallet,
  sport: Dumbbell,
  alternance: BriefcaseBusiness,
  alimentation: Utensils,
  notes: FileText,
  portail: LayoutGrid,
};

/** Composant lucide d'un pictogramme ; un nom inconnu donne la grille, comme dans l'artefact. */
export function resolveIcon(icon: IconSource): LucideIcon {
  return typeof icon === "string" ? (ICONS[icon] ?? LayoutGrid) : icon;
}

/** Épaisseur de trait par défaut des pictogrammes, proche des SF Symbols. */
export const ICON_STROKE = 1.75;

/** Pictogramme, par nom ou composant lucide. Décoratif sans `label`. Utilisé par tous les composants. */
export function Glyph({
  icon,
  size = 22,
  strokeWidth = ICON_STROKE,
  label,
  className,
}: {
  icon: IconSource;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}) {
  const Svg = resolveIcon(icon);
  return (
    <Svg
      size={size}
      strokeWidth={strokeWidth}
      className={clsx("pt-icon", className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
    />
  );
}

export interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  /** Nom lu par les lecteurs d'écran (sans : décoratif) */
  label?: string;
  className?: string;
}

/** Pictogramme du design system par son nom : `<Icon name="plus" />` (API de l'artefact). */
export function Icon({ name, ...props }: IconProps) {
  return <Glyph icon={name} {...props} />;
}
