"use client";

import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { SunLogo } from "@/components/SunLogo";
import { ZipChecker } from "@/components/ZipChecker";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { Product } from "@/lib/types";

export function Hero() {
  const { t } = useLocale();
  return (
    <section className="relative overflow-hidden bg-violet/10">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:py-20">
        <div className="animate-rise-in">
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-mojo">
            <SunLogo className="h-4 w-4" />
            {t("hero.kicker")}
          </p>
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            {t("hero.title")}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-ink/70 sm:text-lg">
            {t("hero.sub")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="rounded-full bg-ink px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-cream transition-colors hover:bg-mojo"
            >
              {t("hero.cta")}
            </Link>
            <Link
              href="/about"
              className="rounded-full border-2 border-ink px-7 py-3.5 text-sm font-bold uppercase tracking-wider transition-colors hover:border-mojo hover:text-mojo"
            >
              {t("hero.cta2")}
            </Link>
          </div>
        </div>
        <div className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand sm:aspect-[5/5] lg:aspect-[4/4.4]">
            <ProductImage
              src="/products/_site/1.jpg"
              alt="Magda holding an original Mad Mojo painting"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-top"
            />
          </div>
          <div className="absolute -bottom-4 -left-4 hidden rotate-[-3deg] rounded-xl bg-sun px-5 py-3 font-display text-sm font-bold shadow-lg sm:block">
            Hand-painted in Poland 🎨
          </div>
        </div>
      </div>
    </section>
  );
}

export function CategoryTiles() {
  const { t } = useLocale();
  const tiles = [
    {
      href: "/shop/paintings",
      label: t("home.cat.paintings"),
      image: "/products/parrots-in-love/1.jpg",
    },
    {
      href: "/shop/clothing",
      label: t("home.cat.clothing"),
      image: "/products/kimono-crane/1.jpg",
    },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h2 className="mb-6 font-display text-2xl font-bold sm:text-3xl">
        {t("home.categories")}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="group relative aspect-[16/10] overflow-hidden rounded-2xl bg-sand"
          >
            <ProductImage
              src={tile.image}
              alt={tile.label}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 flex items-center gap-3">
              <span className="font-display text-2xl font-bold text-white">
                {tile.label}
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink transition-transform group-hover:translate-x-1">
                →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ProductRow({
  title,
  subtitle,
  products,
  href,
}: {
  title: string;
  subtitle?: string;
  products: Product[];
  href: string;
}) {
  const { t } = useLocale();
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-ink/60">{subtitle}</p>}
        </div>
        <Link
          href={href}
          className="hidden text-sm font-semibold underline-offset-4 hover:text-mojo hover:underline sm:block"
        >
          {t("home.shopAll")} →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
        {products.map((product, i) => (
          <ProductCard key={product.id} product={product} priority={i < 4} />
        ))}
      </div>
      <div className="mt-8 text-center sm:hidden">
        <Link
          href={href}
          className="inline-block rounded-full border-2 border-ink px-6 py-3 text-sm font-bold uppercase tracking-wider"
        >
          {t("home.shopAll")} →
        </Link>
      </div>
    </section>
  );
}

export function DeliveryBand() {
  const { t } = useLocale();
  const badges = [
    { flag: "🇺🇸", label: t("ship.us"), sub: t("ship.badge.us") },
    { flag: "🇨🇦", label: t("ship.ca"), sub: t("ship.badge.ca") },
    { flag: "🇲🇽", label: t("ship.mx"), sub: t("ship.badge.mx") },
    { flag: "🇪🇺", label: t("ship.eu"), sub: t("ship.badge.eu") },
  ];
  return (
    <section className="bg-jungle text-cream">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            {t("ship.title")}
          </h2>
          <p className="mt-3 text-cream/80">{t("ship.sub")}</p>
          <div className="mt-6 rounded-2xl bg-cream p-4 text-ink shadow-xl sm:p-5">
            <ZipChecker />
          </div>
        </div>
        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {badges.map((b) => (
            <div
              key={b.label}
              className="rounded-xl border border-cream/15 bg-cream/5 px-4 py-3 text-center"
            >
              <span className="text-xl">{b.flag}</span>
              <p className="mt-1 text-sm font-bold">{b.label}</p>
              <p className="text-[11px] text-cream/60">{b.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function StoryTeaser() {
  const { t } = useLocale();
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="grid items-center gap-8 rounded-3xl bg-sand px-6 py-10 sm:px-10 lg:grid-cols-2">
        <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-2xl bg-ink">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src="/videos/studio-loop-a.mp4"
            poster="/videos/studio-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label="Magda painting in the Mad Mojo studio"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent" />
        </div>
        <div>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            {t("home.story.title")}
          </h2>
          <p className="mt-4 leading-relaxed text-ink/70">
            {t("home.story.body")}
          </p>
          <Link
            href="/about"
            className="mt-6 inline-block rounded-full bg-ink px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-cream transition-colors hover:bg-mojo"
          >
            {t("home.story.cta")}
          </Link>
        </div>
      </div>
    </section>
  );
}

const REVIEWS = [
  {
    name: "Sarah K.",
    place: "Austin, TX",
    en: "The parrot print turned my beige apartment into a place people actually comment on. Shipping to Texas took five days, tracked the whole way.",
    es: "La lámina del loro convirtió mi apartamento beige en un lugar del que la gente de verdad habla. El envío a Texas tardó cinco días, con seguimiento todo el camino.",
  },
  {
    name: "Daniel R.",
    place: "Toronto, CA",
    en: "Bought the crane kimono for my wife. She refuses to take it off. Quality is far beyond what I expected at this price.",
    es: "Compré el kimono de la grulla para mi esposa. Se niega a quitárselo. La calidad supera con creces lo que esperaba por este precio.",
  },
  {
    name: "Lucía M.",
    place: "CDMX, MX",
    en: "Ordered to Mexico City — arrived in a week, perfectly packed in a tube. The colors are even crazier in person.",
    es: "Pedí a la Ciudad de México — llegó en una semana, perfectamente empacado en un tubo. Los colores son aún más locos en persona.",
  },
];

export function Reviews() {
  const { t, pick } = useLocale();
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h2 className="mb-8 text-center font-display text-3xl font-bold">
        {t("home.reviews.title")}
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        {REVIEWS.map((review) => (
          <figure
            key={review.name}
            className="rounded-2xl border border-ink/10 bg-white p-6"
          >
            <div className="mb-3 flex gap-0.5 text-sun" aria-label="5 stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                  <path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.8L10 1.5z" />
                </svg>
              ))}
            </div>
            <blockquote className="text-sm leading-relaxed text-ink/80">
              “{pick(review.en, review.es)}”
            </blockquote>
            <figcaption className="mt-4 text-xs font-bold uppercase tracking-wider text-ink/50">
              {review.name} — {review.place}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
