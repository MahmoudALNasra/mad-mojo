"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type StudioFilmProps = {
  src?: string;
  poster?: string;
  productHref?: string;
};

export function StudioFilm({
  src = "/videos/studio-painting.mp4",
  poster = "/videos/studio-poster.jpg",
  productHref = "/shop/paintings",
}: StudioFilmProps) {
  const { t } = useLocale();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = muted;
  }, [muted]);

  function togglePlay() {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      // First play also turns sound on — otherwise VO is easy to miss
      el.muted = false;
      setMuted(false);
      void el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  }

  function toggleMute() {
    const el = videoRef.current;
    if (!el) return;
    const next = !muted;
    el.muted = next;
    setMuted(next);
    if (!next) {
      void el.play();
      setPlaying(true);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
        <div className="relative overflow-hidden rounded-3xl bg-ink">
          <div className="relative aspect-[9/16] sm:aspect-[4/5] lg:aspect-[3/4]">
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover"
              poster={poster}
              playsInline
              preload="metadata"
              muted={muted}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
            >
              <source src={src} type="video/mp4" />
            </video>
            {/* Controls stay at the top so Magda's burned-in captions stay readable */}
            <div className="absolute left-4 right-4 top-4 flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                className="rounded-full bg-cream/95 px-4 py-2 text-xs font-bold uppercase tracking-wider text-ink transition-colors hover:bg-sun"
              >
                {playing ? t("studio.pause") : t("studio.play")}
              </button>
              <button
                type="button"
                onClick={toggleMute}
                className="rounded-full border border-cream/40 bg-ink/50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-cream backdrop-blur transition-colors hover:bg-ink/70"
              >
                {muted ? t("studio.unmute") : t("studio.mute")}
              </button>
              <span className="ml-auto rounded-full bg-mojo px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white">
                {t("studio.badge")}
              </span>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-mojo">
            {t("studio.kicker")}
          </p>
          <h2 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
            {t("studio.title")}
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-ink/70">
            {t("studio.body")}
          </p>
          <Link
            href={productHref}
            className="mt-7 inline-block rounded-full bg-ink px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-cream transition-colors hover:bg-mojo"
          >
            {t("studio.cta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
