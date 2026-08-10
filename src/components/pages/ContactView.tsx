"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function ContactView() {
  const { t } = useLocale();
  const [sent, setSent] = useState(false);

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <header className="text-center">
        <h1 className="font-display text-4xl font-bold sm:text-5xl">
          {t("contact.title")}
        </h1>
        <p className="mt-3 text-ink/60">{t("contact.sub")}</p>
      </header>

      {sent ? (
        <p className="mt-10 rounded-2xl bg-jungle/10 px-6 py-5 text-center font-medium text-jungle">
          {t("contact.sent")}
        </p>
      ) : (
        <form
          className="mt-10 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <input
            required
            placeholder={t("contact.name")}
            className="w-full rounded-2xl border border-ink/15 bg-white px-5 py-3.5 text-sm focus:border-ink focus:outline-none"
          />
          <input
            required
            type="email"
            placeholder={t("contact.email")}
            className="w-full rounded-2xl border border-ink/15 bg-white px-5 py-3.5 text-sm focus:border-ink focus:outline-none"
          />
          <textarea
            required
            rows={6}
            placeholder={t("contact.message")}
            className="w-full rounded-2xl border border-ink/15 bg-white px-5 py-3.5 text-sm focus:border-ink focus:outline-none"
          />
          <button
            type="submit"
            className="w-full rounded-full bg-mojo py-4 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-mojo-dark"
          >
            {t("contact.send")}
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-ink/50">
        hello@madmojo.store
      </p>
    </div>
  );
}
