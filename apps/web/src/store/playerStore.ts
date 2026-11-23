import { create } from "zustand";

interface PlayerState {
  isTheaterMode: boolean;
  volume: number;
  isMuted: boolean;
  playbackSpeed: number;
  selectedSubtitle: string | null;
  introSkipSeconds: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  currentAnimeId: string | null;
  currentEpisodeId: string | null;
  currentEpisode: number;
  sources: Array<{ url: string; quality: string; isM3U8?: boolean }>;
  currentSource: string;
  subtitles: Array<{ url: string; label: string; lang?: string }>;
  currentSubtitle: string;

  toggleTheaterMode: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setPlaybackSpeed: (speed: number) => void;
  setSelectedSubtitle: (subtitle: string | null) => void;
  setIntroSkipSeconds: (seconds: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setAnime: (animeId: string, episodeId: string, episode: number) => void;
  setProgress: (progress: number) => void;
  setLoading: (isLoading: boolean) => void;
  setSources: (sources: Array<{ url: string; quality: string; isM3U8?: boolean }>) => void;
  setCurrentSource: (url: string) => void;
  setSubtitles: (subtitles: Array<{ url: string; label: string; lang?: string }>) => void;
  setCurrentSubtitle: (url: string) => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  isTheaterMode: false,
  volume: 1,
  isMuted: false,
  playbackSpeed: 1,
  selectedSubtitle: null,
  introSkipSeconds: 85,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  isLoading: false,
  currentAnimeId: null,
  currentEpisodeId: null,
  currentEpisode: 1,
  sources: [],
  currentSource: "",
  subtitles: [],
  currentSubtitle: "",

  toggleTheaterMode: () => set((state) => ({ isTheaterMode: !state.isTheaterMode })),
  setVolume: (volume) => set({ volume }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
  setSelectedSubtitle: (selectedSubtitle) => set({ selectedSubtitle }),
  setIntroSkipSeconds: (introSkipSeconds) => set({ introSkipSeconds }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setAnime: (animeId, episodeId, episode) => set({
    currentAnimeId: animeId,
    currentEpisodeId: episodeId,
    currentEpisode: episode,
    currentTime: 0,
    duration: 0,
    isPlaying: false,
  }),
  setProgress: () => {},
  setLoading: (isLoading) => set({ isLoading }),
  setSources: (sources) => set({ sources, currentSource: sources[0]?.url || "" }),
  setCurrentSource: (url) => set({ currentSource: url }),
  setSubtitles: (subtitles) => set({ subtitles }),
  setCurrentSubtitle: (url) => set({ currentSubtitle: url }),
  reset: () => set({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isLoading: false,
    currentAnimeId: null,
    currentEpisodeId: null,
    currentEpisode: 1,
    sources: [],
    currentSource: "",
    subtitles: [],
    currentSubtitle: "",
  }),
}));
