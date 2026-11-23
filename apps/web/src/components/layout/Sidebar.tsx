"use client";

import { Link, useLocation } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Moon, Search, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui.store";
import { bottomNavItems, topNavItems } from "./nav-items";

export function Sidebar() {
  const { pathname } = useLocation();
  const { colorTheme, setColorTheme, openSearch } = useUIStore();
  const isLight = colorTheme === "light";

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const renderItem = (href: string, label: string, Icon: typeof Search, active: boolean) => (
    <Link
      key={href}
      to={href}
      className={cn(
        "relative w-10 h-10 rounded-lg flex-center transition-colors duration-150 no-scale",
        active
          ? "text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
      title={label}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active"
          className="absolute inset-0 bg-primary rounded-lg"
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      )}
      <Icon className="w-5 h-5 relative" />
    </Link>
  );

  return (
    <div className="hidden lg:flex fixed left-0 top-0 bottom-0 z-40 w-14 flex-col items-center gap-1 py-3 bg-background border-r border-border">
      <Link
        to="/"
        className="w-10 h-10 mb-2 rounded-lg flex-center no-scale"
        aria-label="Soraku home"
      >
        <span className="text-xl font-black tracking-tight text-foreground">
          S
        </span>
      </Link>

      {topNavItems.map((item) =>
        renderItem(item.href, item.label, item.icon, isActive(item.href))
      )}

      <button
        onClick={openSearch}
        className="w-10 h-10 rounded-lg flex-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors no-scale"
        title="Search (/)"
      >
        <Search className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      {bottomNavItems.map((item) =>
        renderItem(item.href, item.label, item.icon, isActive(item.href))
      )}

      <button
        onClick={() => setColorTheme(isLight ? "default" : "light")}
        className="w-10 h-10 rounded-lg flex-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors no-scale"
        title={isLight ? "Dark theme" : "Light theme"}
        aria-label="Toggle theme"
      >
        {isLight ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>
    </div>
  );
}