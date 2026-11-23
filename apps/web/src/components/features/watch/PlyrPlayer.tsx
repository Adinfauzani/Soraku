import { useEffect, useRef } from "react";
import Plyr from "plyr";
import Hls from "hls.js";
import "plyr/dist/plyr.css";

export interface PlyrSubtitle {
  url: string;
  label: string;
  lang?: string;
}

interface PlyrPlayerProps {
  src: string;
  poster?: string;
  subtitles?: PlyrSubtitle[];
  initialTime?: number;
  isM3U8?: boolean;
  onTimeUpdate?: (time: number) => void;
  onEnded?: () => void;
  onError?: () => void;
}

export default function PlyrPlayer({
  src,
  poster,
  subtitles = [],
  initialTime = 0,
  isM3U8 = false,
  onTimeUpdate,
  onEnded,
  onError,
}: PlyrPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const plyrRef = useRef<Plyr | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const cbRef = useRef({ onTimeUpdate, onEnded, onError, initialTime });
  cbRef.current = { onTimeUpdate, onEnded, onError, initialTime };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const player = new Plyr(video, {
      controls: [
        "play-large",
        "play",
        "progress",
        "current-time",
        "duration",
        "mute",
        "volume",
        "settings",
        "fullscreen",
      ],
      settings: ["speed"],
      speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] },
      storage: { enabled: false },
      tooltips: { controls: true, seek: true },
    });
    plyrRef.current = player;
    return () => {
      player.destroy();
      plyrRef.current = null;
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    const handleTimeUpdate = () => cbRef.current.onTimeUpdate?.(video.currentTime);
    const handleEnded = () => cbRef.current.onEnded?.();
    const handleError = () => {
      if (video.error?.code === 1) return;
      cbRef.current.onError?.();
    };
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);

    hlsRef.current?.destroy();
    hlsRef.current = null;

    if (isM3U8 && Hls.isSupported()) {
      const hls = new Hls({
        capLevelToPlayerSize: true,
        maxBufferLength: 30,
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      video.muted = true;
      video.play().catch(() => {});
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        } else {
          cbRef.current.onError?.();
        }
      });
    } else {
      video.src = src;
      video.load();
      if (initialTime > 0) {
        video.currentTime = initialTime;
      }
    }

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
      hlsRef.current?.destroy();
      hlsRef.current = null;
      video.removeAttribute("src");
      video.load();
    };
  }, [src, initialTime, isM3U8]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.poster = poster || "";
  }, [poster]);

  return (
    <div className="w-full h-full bg-black">
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        className="w-full h-full"
      >
        {subtitles.map((subtitle, index) => (
          <track
            key={index}
            kind="captions"
            src={subtitle.url}
            label={subtitle.label}
            lang={subtitle.lang || "en"}
            default={index === 0}
          />
        ))}
      </video>
    </div>
  );
}