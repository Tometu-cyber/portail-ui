import {
  ArrowLeftRight,
  Baby,
  Book,
  BriefcaseBusiness,
  Bus,
  Circle,
  CircleEllipsis,
  CreditCard,
  Fuel,
  Gift,
  HeartPulse,
  House,
  Landmark,
  PawPrint,
  PiggyBank,
  Plane,
  Repeat,
  Shirt,
  ShoppingCart,
  SlidersHorizontal,
  Smartphone,
  Ticket,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { clsx } from "clsx";
import { Glyph } from "./ds.js";

/** Icônes nommées stockées en base (categories.icon, accounts.icon). */
const ICONS: Record<string, LucideIcon> = {
  cart: ShoppingCart,
  utensils: Utensils,
  bus: Bus,
  home: House,
  repeat: Repeat,
  ticket: Ticket,
  heart: HeartPulse,
  piggy: PiggyBank,
  more: CircleEllipsis,
  briefcase: BriefcaseBusiness,
  card: CreditCard,
  bank: Landmark,
  plane: Plane,
  wallet: Wallet,
  gift: Gift,
  shirt: Shirt,
  book: Book,
  baby: Baby,
  paw: PawPrint,
  fuel: Fuel,
  phone: Smartphone,
  transfer: ArrowLeftRight,
  adjust: SlidersHorizontal,
  circle: Circle,
};

export function iconFor(name: string): LucideIcon {
  return ICONS[name] ?? Circle;
}

/** Pastille ronde à la couleur du compte ou de la catégorie, avec son pictogramme (repère de ListRow). */
export function IconBadge({
  icon,
  color,
  size = "md",
  className,
}: {
  icon: string;
  color: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const glyph = size === "sm" ? 14 : size === "lg" ? 22 : 17;
  return (
    <span className={clsx("pt-badge", size !== "md" && `pt-badge-${size}`, className)} style={{ backgroundColor: color }} aria-hidden>
      <Glyph icon={iconFor(icon)} size={glyph} />
    </span>
  );
}
