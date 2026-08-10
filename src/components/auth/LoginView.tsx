"use client";

import { useState } from "react";
import { SunLogo } from "@/components/SunLogo";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

type Provider = "google" | "azure" | "github";

export function LoginView() {
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = supabaseConfigured();

  async function signInWith(provider: Provider) {
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        ...(provider === "azure" ? { scopes: "email" } : {}),
      },
    });
    if (err) setError(err.message);
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (err) setError(err.message);
    else setMagicSent(true);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mojo text-white">
          <SunLogo className="h-10 w-10" />
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold">
          {t("auth.title")}
        </h1>
        <p className="mt-2 text-sm text-ink/60">{t("auth.sub")}</p>
      </div>

      {!configured && (
        <p className="mt-8 rounded-2xl bg-sun/20 px-5 py-4 text-center text-sm font-medium">
          {t("auth.notConfigured")}
        </p>
      )}

      <div className="mt-8 space-y-3">
        <button
          onClick={() => signInWith("google")}
          disabled={!configured}
          className="flex w-full items-center justify-center gap-3 rounded-full border border-ink/15 bg-white py-3.5 text-sm font-semibold transition-colors hover:border-ink disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5">
            <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.02.15 3.5 2.7.24.03c2.2-2.1 3.5-5.1 3.5-8.6z" />
            <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.2 0-5.8-2.1-6.8-5l-.14.01-3.7 2.8-.05.13C3.3 21.3 7.3 24 12 24z" />
            <path fill="#FBBC05" d="M5.2 14.4c-.3-.7-.4-1.5-.4-2.4s.2-1.6.4-2.4l-.01-.16-3.7-2.9-.12.06C.5 8.2 0 10 0 12s.5 3.8 1.4 5.4l3.8-3z" />
            <path fill="#EB4335" d="M12 4.6c2.3 0 3.8 1 4.7 1.8l3.4-3.3C18 1.2 15.2 0 12 0 7.3 0 3.3 2.7 1.4 6.6l3.8 3c1-2.9 3.6-5 6.8-5z" />
          </svg>
          {t("auth.google")}
        </button>

        <button
          onClick={() => signInWith("azure")}
          disabled={!configured}
          className="flex w-full items-center justify-center gap-3 rounded-full border border-ink/15 bg-white py-3.5 text-sm font-semibold transition-colors hover:border-ink disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5">
            <rect x="1" y="1" width="10.5" height="10.5" fill="#F25022" />
            <rect x="12.5" y="1" width="10.5" height="10.5" fill="#7FBA00" />
            <rect x="1" y="12.5" width="10.5" height="10.5" fill="#00A4EF" />
            <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900" />
          </svg>
          {t("auth.microsoft")}
        </button>

        <button
          onClick={() => signInWith("github")}
          disabled={!configured}
          className="flex w-full items-center justify-center gap-3 rounded-full border border-ink/15 bg-white py-3.5 text-sm font-semibold transition-colors hover:border-ink disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.53-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.66.41.36.77 1.05.77 2.13v3.16c0 .3.21.67.8.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
          </svg>
          {t("auth.github")}
        </button>
      </div>

      <div className="my-7 flex items-center gap-4">
        <span className="h-px flex-1 bg-ink/10" />
        <span className="text-xs font-bold uppercase tracking-wider text-ink/40">
          {t("auth.or")}
        </span>
        <span className="h-px flex-1 bg-ink/10" />
      </div>

      {magicSent ? (
        <p className="rounded-2xl bg-jungle/10 px-5 py-4 text-center text-sm font-medium text-jungle">
          {t("auth.magicSent")}
        </p>
      ) : (
        <form onSubmit={sendMagicLink} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("auth.email")}
            disabled={!configured}
            className="w-full rounded-full border border-ink/15 bg-white px-5 py-3.5 text-sm focus:border-ink focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!configured}
            className="w-full rounded-full bg-ink py-3.5 text-sm font-bold text-cream transition-colors hover:bg-mojo disabled:opacity-50"
          >
            {t("auth.magic")}
          </button>
        </form>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-mojo/10 px-4 py-3 text-sm font-medium text-mojo-dark">
          {error}
        </p>
      )}
    </div>
  );
}
