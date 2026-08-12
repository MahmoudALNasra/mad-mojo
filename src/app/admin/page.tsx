import Link from "next/link";
import { getCategories, getProducts } from "@/lib/data";
import { createClient, supabaseServerConfigured } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const [products, categories] = await Promise.all([
    getProducts({ includeInactive: true }),
    getCategories({ includeHidden: true }),
  ]);

  let orderCount = 0;
  let revenueCents = 0;
  if (supabaseServerConfigured()) {
    const supabase = await createClient();
    const { data: orders } = await supabase
      .from("orders")
      .select("amount_total, status");
    if (orders) {
      orderCount = orders.length;
      revenueCents = orders
        .filter((o) => o.status === "paid")
        .reduce((sum, o) => sum + (o.amount_total ?? 0), 0);
    }
  }

  const stats = [
    { label: "Products", value: products.length, href: "/admin/products" },
    { label: "Categories", value: categories.length, href: "/admin/categories" },
    { label: "Orders", value: orderCount, href: "/admin/orders" },
    {
      label: "Revenue",
      value: `$${(revenueCents / 100).toLocaleString("en-US")}`,
      href: "/admin/orders",
    },
  ];

  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 3);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-mojo px-5 py-2.5 text-sm font-bold text-white hover:bg-mojo-dark"
        >
          + New product
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-2xl border border-ink/10 bg-white p-5 transition-shadow hover:shadow-md"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-ink/50">
              {stat.label}
            </p>
            <p className="mt-1 font-display text-3xl font-bold">{stat.value}</p>
          </Link>
        ))}
      </div>

      {lowStock.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-lg font-bold">Low stock</h2>
          <ul className="mt-3 space-y-2">
            {lowStock.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm"
              >
                <span className="font-medium">{p.nameEn}</span>
                <span className="rounded-full bg-mojo/10 px-3 py-1 text-xs font-bold text-mojo-dark">
                  {p.stock} left
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
