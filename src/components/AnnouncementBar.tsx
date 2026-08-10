"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { DictKey } from "@/lib/i18n/dictionaries";

const MESSAGES: DictKey[] = ["announce.1", "announce.2", "announce.3"];

export function AnnouncementBar() {
  const { t } = useLocale();
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % MESSAGES.length);
        setVisible(true);
      }, 250);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-ink text-cream">
      <p
        className={`mx-auto max-w-7xl px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.14em] transition-all duration-250 sm:text-xs ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
        }`}
      >
        {t(MESSAGES[index])}
      </p>
    </div>
  );
}
