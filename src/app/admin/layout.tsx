import Link from "next/link";
import { SunLogo } from "@/components/SunLogo";
import { supabaseServerConfigured } from "@/lib/supabase/server";

export const metadata = { title: "Admin" };

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const configured = supabaseServerConfigured();

  return (
    <div className="flex min-h-screen bg-sand/50">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-ink/10 bg-ink text-cream md:flex">
        <Link href="/" className="flex items-center gap-2.5 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mojo">
            <SunLogo className="h-6 w-6 text-white" />
          </span>
          <div>
            <p className="font-display text-lg font-bold leading-none">
              Mad Mojo
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-cream/50">
              Admin
            </p>
          </div>
        </Link>
        <nav className="mt-4 flex-1 space-y-1 px-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-cream/80 transition-colors hover:bg-cream/10 hover:text-cream"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/"
          className="border-t border-cream/10 px-5 py-4 text-xs font-medium text-cream/50 hover:text-cream"
        >
          ← Back to storefront
        </Link>
      </aside>

      <div className="flex-1">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 overflow-x-auto border-b border-ink/10 bg-ink px-4 py-3 text-cream md:hidden">
          <SunLogo className="h-5 w-5 shrink-0 text-mojo" />
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap text-sm font-medium text-cream/80"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <main className="p-5 sm:p-8">
          {!configured && (
            <div className="mb-6 rounded-2xl border border-sun bg-sun/15 p-5 text-sm leading-relaxed">
              <p className="font-bold">Supabase isn&apos;t connected yet.</p>
              <p className="mt-1 text-ink/70">
                The storefront is running on the built-in demo catalog. To
                manage products here: create a Supabase project, run{" "}
                <code className="rounded bg-ink/10 px-1.5 py-0.5">
                  supabase/schema.sql
                </code>{" "}
                and{" "}
                <code className="rounded bg-ink/10 px-1.5 py-0.5">
                  supabase/seed.sql
                </code>{" "}
                in the SQL editor, then fill in <code>.env.local</code> — full
                steps are in the README.
              </p>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
