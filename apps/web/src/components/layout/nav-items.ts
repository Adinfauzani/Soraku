import type { LucideIcon } from "lucide-react";
import { Clapperboard, Home, User } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  bottom?: boolean;
}

export const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/genre", label: "Genres", icon: Clapperboard },
  { href: "/profile", label: "Profile", icon: User, bottom: true },
];

export const topNavItems = navItems.filter((item) => !item.bottom);
export const bottomNavItems = navItems.filter((item) => item.bottom);