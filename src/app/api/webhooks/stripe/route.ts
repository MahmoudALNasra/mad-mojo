import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, stripeConfigured } from "@/lib/stripe";

/**
 * Stripe webhook: records paid orders in Supabase and decrements stock.
 *
 * Local testing:
 *   stripe listen --forward-to localhost:3000/api/webhooks/stripe
 * Production: add the endpoint in the Stripe Dashboard and set
 * STRIPE_WEBHOOK_SECRET to the signing secret.
 */
export async function POST(request: Request) {
  if (!stripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const payload = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const supabase = createAdminClient();
    if (!supabase) {
      // Payment succeeded but we can't record it — return 500 so Stripe retries.
      console.error("Supabase service role not configured; order not recorded");
      return NextResponse.json({ error: "DB unavailable" }, { status: 500 });
    }

    const full = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["line_items"],
    });

    const items =
      full.line_items?.data.map((li) => ({
        name: li.description ?? "",
        qty: li.quantity ?? 1,
        amount: li.amount_total,
      })) ?? [];

    // Link the order to a signed-in customer when the email matches.
    let userId: string | null = null;
    const email = session.customer_details?.email ?? null;
    if (email) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      userId = profile?.id ?? null;
    }

    const { error } = await supabase.from("orders").upsert(
      {
        stripe_session_id: session.id,
        user_id: userId,
        email,
        amount_total: session.amount_total ?? 0,
        currency: session.currency ?? "usd",
        status: "paid",
        shipping: session.collected_information?.shipping_details ?? null,
        items,
      },
      { onConflict: "stripe_session_id" }
    );

    if (error) {
      console.error("Failed to record order:", error.message);
      return NextResponse.json({ error: "DB write failed" }, { status: 500 });
    }

    // Decrement stock based on the cart metadata.
    try {
      const cart = JSON.parse(session.metadata?.cart ?? "[]") as {
        id: string;
        qty: number;
      }[];
      for (const item of cart) {
        await supabase.rpc("decrement_stock", {
          p_product_id: item.id,
          p_qty: item.qty,
        });
      }
    } catch {
      // Stock decrement is best-effort; admins can adjust in the panel.
    }
  }

  return NextResponse.json({ received: true });
}
