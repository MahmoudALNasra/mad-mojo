"use client";

import { SunLogo } from "@/components/SunLogo";
import { useLocale } from "@/lib/i18n/LocaleProvider";

function PersonCard({
  name,
  role,
  bio,
  accent,
}: {
  name: string;
  role: string;
  bio: string;
  accent: string;
}) {
  const { t } = useLocale();
  return (
    <div className="rounded-3xl border border-ink/10 bg-white p-6 sm:p-8">
      {/* Placeholder portrait — replace with a real photo of the team */}
      <div
        className={`mx-auto flex h-40 w-40 items-center justify-center rounded-full ${accent}`}
      >
        <span className="font-display text-6xl font-bold text-white">
          {name[0]}
        </span>
      </div>
      <p className="mt-2 text-center text-[11px] uppercase tracking-wider text-ink/40">
        {t("about.photoSoon")}
      </p>
      <h2 className="mt-4 text-center font-display text-2xl font-bold">
        {name}
      </h2>
      <p className="text-center text-sm font-bold uppercase tracking-widest text-mojo">
        {role}
      </p>
      <p className="mt-4 leading-relaxed text-ink/70">{bio}</p>
    </div>
  );
}

export function AboutView() {
  const { t } = useLocale();
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <header className="mx-auto max-w-2xl text-center">
        <SunLogo className="mx-auto h-12 w-12 text-mojo" />
        <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl">
          {t("about.title")}
        </h1>
      </header>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <PersonCard
          name={t("about.magda.name")}
          role={t("about.magda.role")}
          bio={t("about.magda.bio")}
          accent="bg-violet"
        />
        <PersonCard
          name={t("about.mahmoud.name")}
          role={t("about.mahmoud.role")}
          bio={t("about.mahmoud.bio")}
          accent="bg-jungle"
        />
      </div>

      <section className="mt-14 grid items-center gap-8 rounded-3xl bg-sand p-6 sm:p-10 lg:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-ink">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src="/videos/studio-loop-b.mp4"
            poster="/products/_site/2.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label="Magda painting in the studio"
          />
        </div>
        <div>
          <h2 className="font-display text-3xl font-bold">
            {t("about.mission.title")}
          </h2>
          <p className="mt-4 leading-relaxed text-ink/70">
            {t("about.mission.body")}
          </p>
        </div>
      </section>
    </div>
  );
}
