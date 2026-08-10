"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatUsd } from "@/lib/cart";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { createClient } from "@/lib/supabase/client";

interface OrderRow {
  id: string;
  amount_total: number;
  currency: string;
  status: string;
  created_at: string;
  items: { name: string; qty: number }[] | null;
}

export function AccountView({
  email,
  name,
  isAdmin,
  orders,
}: {
  email: string;
  name: string | null;
  isAdmin: boolean;
  orders: OrderRow[];
}) {
  const { t, locale } = useLocale();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">
            {t("account.title")}
          </h1>
          <p className="mt-1 text-sm text-ink/60">{name ?? email}</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Link
              href="/admin"
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-cream hover:bg-mojo"
            >
              {t("nav.admin")}
            </Link>
          )}
          <button
            onClick={signOut}
            className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold hover:border-ink"
          >
            {t("auth.signOut")}
          </button>
        </div>
      </div>

      <h2 className="mt-10 font-display text-xl font-bold">
        {t("account.orders")}
      </h2>

      {orders.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-ink/10 bg-white p-8 text-center">
          <p className="text-ink/60">{t("account.noOrders")}</p>
          <Link
            href="/shop"
            className="mt-4 inline-block rounded-full bg-mojo px-6 py-3 text-sm font-bold text-white hover:bg-mojo-dark"
          >
            {t("cart.emptyCta")}
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {orders.map((order) => (
            <li
              key={order.id}
              className="rounded-2xl border border-ink/10 bg-white p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-bold">
                  {new Intl.DateTimeFormat(
                    locale === "es" ? "es-MX" : "en-US",
                    { dateStyle: "medium" }
                  ).format(new Date(order.created_at))}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                    order.status === "paid"
                      ? "bg-jungle/10 text-jungle"
                      : "bg-sun/30 text-ink"
                  }`}
                >
                  {order.status}
                </span>
              </div>
              {order.items && (
                <p className="mt-2 text-sm text-ink/70">
                  {order.items.map((i) => `${i.name} × ${i.qty}`).join(", ")}
                </p>
              )}
              <p className="mt-2 font-display font-bold">
                {formatUsd(order.amount_total)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
