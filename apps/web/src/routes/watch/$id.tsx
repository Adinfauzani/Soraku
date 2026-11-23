import { createFileRoute } from "@tanstack/react-router";
import { normalizeEpisode } from "@/lib/episode";

export const Route = createFileRoute("/watch/$id")({
  component: WatchRoute,
  validateSearch: (search: Record<string, unknown>) => ({
    ep: normalizeEpisode(search.ep),
  }),
});

function WatchRoute() {
  const { id } = Route.useParams();
  const { ep } = Route.useSearch();
  const navigate = useNavigate();
  const searchStr = useRouterState({
    select: (s) => s.location.searchStr || "",
  });

  useEffect(() => {
    if (searchStr !== `?ep=${ep}`) {
      navigate({
        to: "/watch/$id",
        params: { id },
        search: { ep },
        replace: true,
      });
    }
  }, [ep, searchStr, id, navigate]);

  console.log("[watch/$id] mount", { id, ep, time: Date.now() });
  const slug = undefined;
  return <WatchPageContent id={id} slug={slug} ep={ep} />;
}

import { Suspense, useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import PlyrPlayer from "@/components/features/watch/PlyrPlayer";
import { WatchUtilityBar } from "@/components/features/watch/WatchUtilityBar";
import {
  ChevronLeft,
  ChevronRight,
  List,
  Star,
  Clock,
  Tv,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/layout/container";
import { usePlayerStore } from "@/store/playerStore";
import { slugify } from "@/lib/slug";
import { customColorFor } from "@/lib/anime-meta";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SERVERS = [
  { id: "Auto", name: "Auto" },
  { id: "lcl", name: "lcl" },
  { id: "local", name: "SRI" },
];
const AUDIO_OPTIONS = [
  { id: "sub", label: "Sub" },
  { id: "dub", label: "Dub" },
] as const;

type AudioLang = "sub" | "dub";

interface AnimeInfo {
  id: string;
  title: string;
  titleEnglish?: string;
  romajiTitle?: string;
  titleNative?: string;
  poster: string | null;
  cover?: string;
  description?: string;
  rating?: number;
  totalEpisodes?: number;
  status: string;
  genres?: string[];
  releaseDate?: string;
  duration?: string;
  studios?: string[];
  type?: string;
}

interface Episode {
  id: string;
  animeId: string;
  number: number;
  title?: string;
  image?: string;
  isSubbed?: boolean;
  isDubbed?: boolean;
}

interface Source {
  url: string;
  quality: string;
  isM3U8?: boolean;
}

interface Subtitle {
  url: string;
  label: string;
  lang?: string;
}

interface WatchPageContentProps {
  id: string;
  slug?: string;
  ep: number;
}

function WatchPageContent({ id, ep: epParam, slug: urlSlug }: WatchPageContentProps) {
  const navigate = useNavigate();

  const [anime, setAnime] = useState<AnimeInfo | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [currentSource, setCurrentSource] = useState<Source | null>(null);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [episodesLoading, setEpisodesLoading] = useState(true);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [sourcesFetched, setSourcesFetched] = useState(false);
  const [sourcesError, setSourcesError] = useState<string | null>(null);
const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentServer, setCurrentServer] = useState<string>("Auto");
  const [audioLang, setAudioLang] = useState<AudioLang>("sub");
  const [dubAvailable, setDubAvailable] = useState<boolean | null>(null);
  const [audioNote, setAudioNote] = useState<string | null>(null);
  const titleRef = useRef("");
  const [lightsOut, setLightsOut] = useState(false);
  const { isMuted, toggleMute } = usePlayerStore();
  const { setIsPlaying } = usePlayerStore();

  // Redirect slug-based URL to numeric ID URL
  useEffect(() => {
    if (anime && !loading && !/^\d+$/.test(id) && /^\d+$/.test(anime.id) && anime.id !== id) {
      const targetSlug = urlSlug || slugify(anime.romajiTitle || anime.titleEnglish || anime.title);
      navigate({
        to: "/watch/$id/$",
        params: { id: anime.id, _splat: targetSlug },
        search: { ep: epParam },
        replace: true,
      });
    }
  }, [anime, loading, id, urlSlug, epParam, navigate]);

  const currentEpisodeNumber = epParam;
  const currentEpisode = episodes.find((ep) => ep.number === currentEpisodeNumber);
  const derivedSlug = useMemo(() => anime ? slugify(anime.romajiTitle || anime.titleEnglish || anime.title) : urlSlug || id, [anime, urlSlug, id]);
  const slug = urlSlug || derivedSlug;

  // Canonicalize slug-less /watch/{id} to /watch/{id}/{slug} once the title is known
  useEffect(() => {
    if (!loading && anime && /^\d+$/.test(id) && !urlSlug && derivedSlug && derivedSlug !== id) {
      navigate({
        to: "/watch/$id/$",
        params: { id, _splat: derivedSlug },
        search: { ep: epParam },
        replace: true,
      });
    }
  }, [loading, anime, id, urlSlug, derivedSlug, epParam, navigate]);

  const fetchAnime = useCallback(async () => {
    try {
      const res = await fetch(`/api/anime/${id}`);
      let data: any = null;
      if (res.ok) {
        data = await res.json();
      } else {
        const sr = await fetch(`/api/search?q=${encodeURIComponent(titleRef.current || id)}`);
        if (sr.ok) {
          const list = (await sr.json()).animes || [];
          data = list.find((a: any) => a.id === id) || list[0];
        }
      }
      const animeData = data?.anime ?? data?.data ?? data;
      if (animeData) {
        setAnime((prev) => prev ?? animeData);
        titleRef.current = animeData.title || "";
      } else {
        setError("Anime not found");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load anime");
    }
  }, [id]);

  const fetchEpisodes = useCallback(async () => {
    setEpisodesLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentServer !== "Auto") params.set("server", currentServer);
      if (titleRef.current) params.set("title", titleRef.current);
      const effectiveSlug = slug || slugify(titleRef.current || id);
      const res = await fetch(`/api/watch/${id}/${effectiveSlug}/episodes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const payload = data?.data ?? data;
        const list = Array.isArray(payload?.episodes)
          ? payload.episodes
          : Array.isArray(payload)
            ? payload
            : [];
        if (list.length) {
          setEpisodes(list);
          setEpisodesLoading(false);
          return;
        }
      }
      const res2 = await fetch(`/api/watch/${id}/episodes`);
      if (res2.ok) {
        const payload = await res2.json();
        const data = payload?.data ?? payload;
        setEpisodes(Array.isArray(data) ? data : []);
      } else {
        setEpisodes([]);
      }
    } catch (err) {
      console.error("Failed to fetch episodes:", err);
      setEpisodes([]);
    } finally {
      setEpisodesLoading(false);
    }
  }, [id, slug, currentServer, anime]);

  const fetchSources = useCallback(async (episodeId: string) => {
    setSourcesLoading(true);
    setSourcesFetched(false);
    setSourcesError(null);
    setCurrentSource(null);
    setSourceIndex(0);
    try {
      const params = new URLSearchParams();
      params.set("ep", String(currentEpisodeNumber));
      params.set("proxy", "true");
      params.set("lang", audioLang);
      if (currentServer !== "Auto") params.set("server", currentServer);
      if (titleRef.current) params.set("title", titleRef.current);
      const effectiveSlug = slug || slugify(titleRef.current || id);
      const res = await fetch(`/api/watch/${id}/${effectiveSlug}/episodes/${episodeId}?${params.toString()}`);
      let payload: any = null;
      if (res.ok) payload = await res.json();
      const data = payload?.data ?? payload;
      if (!data?.sources?.length) {
        const res2 = await fetch(`/api/watch/${id}/source?${params.toString()}`);
        if (res2.ok) {
          payload = await res2.json();
          const data2 = payload?.data ?? payload;
          if (!data2?.sources?.length) throw new Error("No sources returned from server");
        } else {
          throw new Error("No sources returned from server");
        }
      }
      const resolved = data?.sources?.length ? data : payload?.data ?? payload;
      if (!resolved?.sources?.length) throw new Error("No sources returned from server");
      setSources(resolved.sources || []);
      setSubtitles(resolved.subtitles || []);
      setDubAvailable(resolved.dubAvailable === true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load stream";
      console.error("Failed to fetch sources:", message);
      setSourcesError(message);
    } finally {
      setSourcesLoading(false);
      setSourcesFetched(true);
    }
  }, [currentServer, id, slug, currentEpisodeNumber, audioLang]);

  const EMBED_HOSTS_RE = /(desustream|solidfiles|mp4upload|yourupload|sibnet|ok\.ru|dailymotion|vidguard|embed)/i;

  useEffect(() => {
    if (audioLang === "dub" && dubAvailable === false && sourcesFetched) {
      setAudioNote("Dub belum tersedia — memutar Sub");
    } else if (audioLang === "sub" || dubAvailable === true) {
      setAudioNote(null);
    }
  }, [audioLang, dubAvailable, sourcesFetched]);

  useEffect(() => {
    if (sourcesFetched && !sourcesError && sources.length && !currentSource) {
      const picked = sources.find((s: Source) => !EMBED_HOSTS_RE.test(s.url)) ?? sources[0];
      setCurrentSource(picked ?? null);
    }
  }, [sources, sourcesFetched, sourcesError, currentSource]);

  const handleSourceError = useCallback(() => {
    const next = sourceIndex + 1;
    if (next < sources.length) {
      setSourceIndex(next);
      setCurrentSource(sources[next] ?? null);
    } else {
      setCurrentSource(null);
      setSourcesError("All sources failed to play");
    }
  }, [sourceIndex, sources]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAnime(), fetchEpisodes()]).finally(() => setLoading(false));
  }, [fetchAnime, fetchEpisodes]);

  useEffect(() => {
    if (currentEpisode?.id) {
      fetchSources(currentEpisode.id);
    }
  }, [currentEpisode?.id, fetchSources]);

  useEffect(() => {
    if (!loading && !episodesLoading && episodes.length === 0 && !sourcesFetched) {
      fetchSources(`ep-${currentEpisodeNumber}`);
    }
  }, [loading, episodesLoading, episodes.length, sourcesFetched, fetchSources]);

  useEffect(() => {
    setIsPlaying(false);
  }, [currentEpisodeNumber, setIsPlaying]);

  const navigateEpisode = useCallback(
    (episodeNumber: number) => {
      navigate({
        to: "/watch/$id",
        params: { id },
        search: { ep: episodeNumber },
        replace: false,
      });
    },
    [navigate, id]
  );

  useEffect(() => {
    setIsPlaying(false);
    setCurrentSource(null);
  }, [epParam, setIsPlaying]);

  const handleEpisodeEnded = useCallback(() => {
    if (currentEpisode && episodes.length > 0) {
      const nextEpisode = episodes.find(
        (ep) => ep.number === currentEpisodeNumber + 1
      );
      if (nextEpisode) {
        navigateEpisode(nextEpisode.number);
      }
    }
  }, [currentEpisode, episodes, currentEpisodeNumber, navigateEpisode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      switch (e.code) {
        case "Space": {
          e.preventDefault();
          const video = document.querySelector("video");
          if (video) {
            if (video.paused) video.play();
            else video.pause();
          }
          break;
        }
        case "KeyF": {
          e.preventDefault();
          const container = document.querySelector("[data-player-container]");
          if (container) {
            if (!document.fullscreenElement) {
              container.requestFullscreen();
            } else {
              document.exitFullscreen();
            }
          }
          break;
        }
        case "ArrowLeft": {
          e.preventDefault();
          const video = document.querySelector("video");
          if (video) {
            video.currentTime = Math.max(0, video.currentTime - 10);
          }
          break;
        }
        case "ArrowRight": {
          e.preventDefault();
          const video = document.querySelector("video");
          if (video) {
            video.currentTime = Math.min(
              video.duration || 0,
              video.currentTime + 10
            );
          }
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const video = document.querySelector("video");
          if (video) {
            const newVol = Math.min(1, video.volume + 0.1);
            video.volume = newVol;
          }
          break;
        }
        case "ArrowDown": {
          e.preventDefault();
          const video = document.querySelector("video");
          if (video) {
            const newVol = Math.max(0, video.volume - 0.1);
            video.volume = newVol;
          }
          break;
        }
        case "KeyM": {
          e.preventDefault();
          const video = document.querySelector("video");
          if (video) {
            video.muted = !video.muted;
          }
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="w-full aspect-video rounded-lg mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !anime) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white/80 mb-4">
            {error || "Anime not found"}
          </h1>
<Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ ["--custom" as string]: customColorFor(anime) }}>
      <div className="max-w-[1920px] mx-auto">
        {/* Breadcrumb bar dihilangkan: judul dari API berantakan & EP number redundant. */}

        <div className="flex flex-col lg:flex-row gap-4 px-4 pb-6 lg:px-6">
          <div className="flex-1 min-w-0">
            <div
              data-player-container
              className="relative w-full aspect-video bg-black rounded-lg overflow-hidden"
            >
              {sourcesLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  {currentEpisode?.image && (
                    <img
                      src={currentEpisode.image}
                      alt={currentEpisode?.title || ""}
                      className="absolute inset-0 w-full h-full object-cover opacity-40"
                    />
                  )}
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-2 border-custom border-t-transparent rounded-full animate-spin" />
                    <p className="text-white/60 text-sm">Loading stream...</p>
                  </div>
                </div>
              ) : sourcesFetched && (sources.length === 0 || !currentSource) ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  {currentEpisode?.image && (
                    <img
                      src={currentEpisode.image}
                      alt={currentEpisode?.title || ""}
                      className="absolute inset-0 w-full h-full object-cover opacity-30"
                    />
                  )}
                  <div className="relative z-10 flex flex-col items-center gap-3 px-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center">
                      <span className="text-2xl">📺</span>
                    </div>
                    <p className="text-white/80 text-sm font-medium">No sources available</p>
                    <p className="text-white/40 text-xs max-w-xs">
                      {sourcesError
                        ? `${sourcesError}. Try a different server or episode.`
                        : "Try a different server or episode below."}
                    </p>
                    <button
                      onClick={() => currentEpisode?.id && fetchSources(currentEpisode.id)}
                      className="px-4 py-1.5 rounded-lg bg-custom/90 hover:bg-custom text-black text-xs font-semibold transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : (
                <PlyrPlayer
                  src={currentSource?.url || ""}
                  poster={currentEpisode?.image || anime.poster || undefined}
                  subtitles={subtitles}
                  isM3U8={currentSource?.isM3U8}
                  onEnded={handleEpisodeEnded}
                  onError={handleSourceError}
                />
              )}
            </div>

            <WatchUtilityBar
              currentEpisodeNumber={currentEpisodeNumber}
              hasNext={Boolean(episodes.find((e) => e.number === currentEpisodeNumber + 1))}
              hasPrev={currentEpisodeNumber > 1}
                  hasSubtitles={subtitles.length > 0}
              isSkipAvailable={false}
              skipSeconds={null}
              introSkipSeconds={0}
                  onSeekBy={(seconds) => {
                const video = document.querySelector("video");
                if (video) {
                  const target = video.currentTime + seconds;
                  video.currentTime = Math.min(Math.max(0, target), video.duration || 0);
                }
              }}
              onToggleFullscreen={() => {
                const container = document.querySelector("[data-player-container]");
                if (container) {
                  if (!document.fullscreenElement) container.requestFullscreen().catch(() => {});
                  else document.exitFullscreen().catch(() => {});
                }
              }}
              onToggleLightsOut={() => setLightsOut((v) => !v)}
              onPrev={() => navigateEpisode(currentEpisodeNumber - 1)}
              onNext={() => navigateEpisode(currentEpisodeNumber + 1)}
            />

            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] rounded-lg p-1">
                <span className="px-2 text-xs text-white/40 font-medium uppercase">Audio</span>
                <Select
                  value={audioLang}
                  onValueChange={(v) => setAudioLang(v as AudioLang)}
                >
                  <SelectTrigger className="h-7 w-24 border-0 bg-transparent px-2 text-xs text-white/80 focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIO_OPTIONS.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] rounded-lg p-1">
                <span className="px-2 text-xs text-white/40 font-medium uppercase">Server</span>
                <Select value={currentServer} onValueChange={(v) => setCurrentServer(v)}>
                  <SelectTrigger className="h-7 min-w-28 border-0 bg-transparent px-2 text-xs text-white/80 focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVERS.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {audioNote && (
                <span className="text-xs text-amber-400 font-medium">{audioNote}</span>
              )}
            </div>

            <div className="flex items-center justify-between mt-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden gap-1 text-white/60"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                <List className="h-4 w-4" />
                Episodes
              </Button>
            </div>

            <Link
            to="/info/$id"
            params={{ id: anime.id }}
            search={{ page: undefined }}
            className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] block hover:bg-white/[0.04] hover:border-white/[0.1] transition-colors cursor-pointer group"
          >
              <div className="flex items-start gap-4">
                <div className="relative w-20 aspect-[2/3] rounded-lg overflow-hidden shrink-0 hidden sm:block bg-white/[0.04] ring-1 ring-white/[0.06]">
                  {anime.poster && (
                    <img
                      src={anime.poster}
                      alt={anime.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-white">
                    {anime.titleEnglish || anime.title}
                  </h2>
                  {anime.titleNative && (
                    <p className="text-xs text-white/40 mt-0.5">
                      {anime.titleNative}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-white/50">
                    {anime.rating && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        {anime.rating}
                      </span>
                    )}
                    {anime.releaseDate && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {anime.releaseDate}
                      </span>
                    )}
                    {anime.duration && (
                      <span className="flex items-center gap-1">
                        <Tv className="w-3 h-3" />
                        {anime.duration}
                      </span>
                    )}
                    {anime.status && (
                      <Badge
                        variant={anime.status === "ONGOING" ? "default" : "secondary"}
                        className="text-[10px] h-5"
                      >
                        {anime.status}
                      </Badge>
                    )}
                  </div>
                  {anime.genres && anime.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {anime.genres.map((genre) => (
                        <span
                          key={genre}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.04] text-white/40 border border-white/[0.06]"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}
                  {anime.description && (
                    <p className="text-sm text-white/40 leading-relaxed mt-3 line-clamp-2">
                      {anime.description}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          </div>

          <div
            className={`${
              showSidebar ? "block" : "hidden"
            } lg:block w-full lg:w-80 xl:w-96 shrink-0`}
          >
            <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] overflow-hidden backdrop-blur-sm">
              <div className="flex items-center gap-2 px-4 py-3.5 border-b border-white/[0.06]">
                <List className="h-4 w-4 text-custom" />
                <span className="text-sm font-semibold text-white">
                  Episodes
                </span>
                {anime.totalEpisodes && (
                  <span className="text-xs text-white/40 ml-auto">
                    {episodes.length} of {anime.totalEpisodes}
                  </span>
                )}
              </div>

              {episodesLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              ) : episodes.length === 0 ? (
                <div className="p-8 text-center text-white/40 text-sm">
                  No episodes available
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[60vh] lg:max-h-[calc(100vh-240px)] scrollbar-hide">
                  {episodes.map((ep) => (
                    <button
                      key={ep.number}
                      onClick={() => navigateEpisode(ep.number)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${
                        ep.number === currentEpisodeNumber
                          ? "bg-custom/10 border-l-2 border-l-custom"
                          : "hover:bg-white/[0.03] border-l-2 border-l-transparent"
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                          ep.number === currentEpisodeNumber
                            ? "bg-custom text-black shadow-sm shadow-custom/20"
                            : "bg-white/[0.06] text-white/50"
                        }`}
                      >
                        {ep.number}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm truncate leading-tight ${
                            ep.number === currentEpisodeNumber
                              ? "text-white font-medium"
                              : "text-white/50"
                          }`}
                        >
                          {ep.title || `Episode ${ep.number}`}
                        </p>
                      </div>
                      {ep.isDubbed && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400/70 border border-blue-500/10 shrink-0">
                          DUB
                        </span>
                      )}
</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WatchPageComponent({ id, slug, ep }: WatchPageContentProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            <Skeleton className="w-full aspect-video rounded-lg mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      }
    >
      <WatchPageContent id={id} slug={slug} ep={ep} />
    </Suspense>
  );
}
