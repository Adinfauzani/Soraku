"use client";

import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Clapperboard, Home, Moon, Search, Sun } from "lucide-react";
import { useUIStore } from "@/store/ui.store";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/genre", icon: Clapperboard, label: "Genres" },
];

export function MobileNav() {
  const { pathname } = useLocation();
  const { colorTheme, setColorTheme, openSearch } = useUIStore();
  const isLight = colorTheme === "light";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[150] lg:hidden bg-background border-t border-border">
      <div
        className="flex items-center justify-around py-1.5 px-4"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-16 py-1 rounded-xl transition-colors no-scale",
                isActive
                  ? "text-primary bg-muted"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="mt-0.5 text-[10px] font-medium leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}

        <button
          onClick={openSearch}
          className="flex flex-col items-center justify-center w-16 py-1 rounded-xl text-muted-foreground hover:text-foreground transition-colors no-scale"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
          <span className="mt-0.5 text-[10px] font-medium leading-none">Search</span>
        </button>

        <button
          onClick={() => setColorTheme(isLight ? "default" : "light")}
          className="flex flex-col items-center justify-center w-16 py-1 rounded-xl text-muted-foreground hover:text-foreground transition-colors no-scale"
          aria-label="Toggle theme"
        >
          {isLight ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          <span className="mt-0.5 text-[10px] font-medium leading-none">Theme</span>
        </button>
      </div>
    </nav>
  );
}