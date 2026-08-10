import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { cookies } from "next/headers";
import type { Locale } from "@/lib/i18n/dictionaries";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["SOFT", "WONK", "opsz"],
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://madmojo.shop"
  ),
  title: {
    default: "Mad Mojo — Original Paintings & Wearable Art",
    template: "%s | Mad Mojo",
  },
  description:
    "Bold original paintings, art prints and wearable art, hand-painted in Poland by Magda. Shipping across the United States, Canada, Mexico and Europe with UPS tracking.",
  keywords: [
    "original paintings",
    "art prints",
    "wearable art",
    "kimono",
    "tropical art",
    "Mad Mojo",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Mad Mojo",
    title: "Mad Mojo — Original Paintings & Wearable Art",
    description:
      "Bold original paintings, art prints and wearable art, hand-painted in Poland by Magda.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mad Mojo — Original Paintings & Wearable Art",
    description:
      "Bold original paintings, art prints and wearable art, hand-painted in Poland by Magda.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("mm_locale")?.value;
  const initialLocale: Locale = cookieLocale === "es" ? "es" : "en";

  return (
    <html lang={initialLocale}>
      <body className={`${display.variable} ${body.variable}`}>
        <LocaleProvider initialLocale={initialLocale}>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
