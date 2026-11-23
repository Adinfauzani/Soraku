"use client";

import { create } from "zustand";
import { applyTheme, getSavedTheme, type ThemeKey } from "@/lib/theme";

interface UIState {
  isSearchOpen: boolean;
  isPlayerOpen: boolean;
  isAuthModalOpen: boolean;
  isProfileMenuOpen: boolean;
  isMobileSidebarOpen: boolean;
  toasts: Array<{
    id: string;
    title: string;
    description?: string;
    type: "success" | "error" | "info" | "warning";
  }>;
  isSidebarExpanded: boolean;
  colorTheme: ThemeKey;

  openSearch: () => void;
  closeSearch: () => void;
  openPlayer: () => void;
  closePlayer: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  openProfileMenu: () => void;
  closeProfileMenu: () => void;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;

  addToast: (toast: Omit<UIState["toasts"][0], "id">) => void;
  removeToast: (id: string) => void;

  toggleSidebar: () => void;
  setColorTheme: (theme: ThemeKey) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSearchOpen: false,
  isPlayerOpen: false,
  isAuthModalOpen: false,
  isProfileMenuOpen: false,
  isMobileSidebarOpen: false,
  toasts: [],
  isSidebarExpanded: false,
  colorTheme: getSavedTheme(),

  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),
  openPlayer: () => set({ isPlayerOpen: true }),
  closePlayer: () => set({ isPlayerOpen: false }),
  openAuthModal: () => set({ isAuthModalOpen: true }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),
  openProfileMenu: () => set({ isProfileMenuOpen: true }),
  closeProfileMenu: () => set({ isProfileMenuOpen: false }),
  openMobileSidebar: () => set({ isMobileSidebarOpen: true }),
  closeMobileSidebar: () => set({ isMobileSidebarOpen: false }),

  addToast: (toast) => set((state) => ({
    toasts: [...state.toasts, { ...toast, id: Math.random().toString(36).slice(2) }]
  })),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),

  toggleSidebar: () => set((state) => ({ isSidebarExpanded: !state.isSidebarExpanded })),
  setColorTheme: (colorTheme) => {
    applyTheme(colorTheme);
    set({ colorTheme });
  },
}));