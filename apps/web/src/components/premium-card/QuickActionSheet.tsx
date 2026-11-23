"use client";

import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Play, Plus, Heart, Share2, X } from "lucide-react";
import { animeUrl } from "@/lib/slug";
import { PremiumImage } from "./PremiumImage";
import type { PremiumAnime } from "./types";

interface Props {
  anime: PremiumAnime;
  open: boolean;
  onClose: () => void;
}

export function QuickActionSheet({ anime, open, onClose }: Props) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] lg:hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-[#1a1a2e] rounded-t-3xl border-t border-white/[0.06] p-5 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 aspect-[2/3] rounded-lg overflow-hidden bg-white/[0.06]">
              {anime.poster && (
                <img src={anime.poster} alt={anime.title} className="w-full h-full object-cover" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-sm text-white">{anime.title}</h3>
              {anime.titleNative && (
                <p className="text-[11px] text-white/40 mt-0.5">{anime.titleNative}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center">
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          <ActionItem icon={Play} label="Watch" href={animeUrl(anime.id, anime.title)} onClick={onClose} />
          <ActionItem icon={Plus} label="List" />
          <ActionItem icon={Heart} label="Favorite" />
          <ActionItem icon={Share2} label="Share" onClick={() => { if (navigator.share) navigator.share({ url: window.location.origin + animeUrl(anime.id, anime.title) }); }} />
        </div>

        <Link
to={animeUrl(anime.id, anime.title)}
          onClick={onClose}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/[0.06] border border-white/[0.06] text-white/80 text-sm font-medium"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}

function ActionItem({ icon: Icon, label, href, onClick }: {
  icon: typeof Play;
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors"
    >
      <Icon className="w-5 h-5 text-white/70" />
      <span className="text-[10px] text-white/50 font-medium">{label}</span>
    </button>
  );

  if (href) {
    return <Link to={href} onClick={onClick}>{content}</Link>;
  }
  return content;
}
