import { createClient, supabaseServerConfigured } from "@/lib/supabase/server";

interface OrderRow {
  id: string;
  stripe_session_id: string;
  email: string | null;
  amount_total: number;
  currency: string;
  status: string;
  created_at: string;
  items: { name: string; qty: number }[] | null;
  shipping: {
    name?: string;
    address?: { city?: string; state?: string; country?: string };
  } | null;
}

export default async function AdminOrdersPage() {
  let orders: OrderRow[] = [];
  if (supabaseServerConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    orders = (data as OrderRow[] | null) ?? [];
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Orders</h1>

      {orders.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-ink/10 bg-white p-10 text-center text-sm text-ink/60">
          No orders yet. Once Stripe checkout and the webhook are configured,
          paid orders appear here automatically.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-xs font-bold uppercase tracking-wider text-ink/50">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {orders.map((order) => (
                <tr key={order.id} className="align-top hover:bg-sand/40">
                  <td className="whitespace-nowrap px-4 py-3">
                    {new Date(order.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{order.shipping?.name ?? "—"}</p>
                    <p className="text-xs text-ink/50">{order.email}</p>
                  </td>
                  <td className="px-4 py-3 text-ink/70">
                    {order.items
                      ?.map((i) => `${i.name} × ${i.qty}`)
                      .join(", ") ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-ink/70">
                    {[
                      order.shipping?.address?.city,
                      order.shipping?.address?.state,
                      order.shipping?.address?.country,
                    ]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-bold">
                    ${(order.amount_total / 100).toFixed(2)}{" "}
                    <span className="text-xs font-normal uppercase text-ink/50">
                      {order.currency}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        order.status === "paid"
                          ? "bg-jungle/10 text-jungle"
                          : "bg-sun/30"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
