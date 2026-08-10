import { NextResponse } from "next/server";
import { getProductsByIds } from "@/lib/data";
import { getStripe, stripeConfigured } from "@/lib/stripe";

interface CheckoutItem {
  productId: string;
  size: string | null;
  qty: number;
}

function siteUrl(request: Request): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    new URL(request.url).origin
  );
}

export async function POST(request: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json(
      {
        error:
          "Stripe isn't configured yet. Add STRIPE_SECRET_KEY to .env.local and restart the server.",
      },
      { status: 503 }
    );
  }

  let body: { items?: CheckoutItem[]; locale?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const items = (body.items ?? []).filter(
    (i) => i && typeof i.productId === "string" && Number.isInteger(i.qty) && i.qty > 0 && i.qty <= 50
  );
  if (items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  // Prices always come from the catalog (server-side), never from the client.
  const products = await getProductsByIds(items.map((i) => i.productId));
  const productMap = new Map(products.map((p) => [p.id, p]));

  const origin = siteUrl(request);
  const locale = body.locale === "es" ? "es" : "en";

  const lineItems = [];
  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product || !product.isActive) {
      return NextResponse.json(
        { error: `Product unavailable: ${item.productId}` },
        { status: 400 }
      );
    }
    const name = locale === "es" && product.nameEs ? product.nameEs : product.nameEn;
    lineItems.push({
      quantity: item.qty,
      price_data: {
        currency: "usd",
        unit_amount: product.priceCents,
        product_data: {
          name: item.size ? `${name} — ${item.size}` : name,
          metadata: {
            product_id: product.id,
            slug: product.slug,
            size: item.size ?? "",
          },
          ...(product.images[0]?.startsWith("http")
            ? { images: [product.images[0]] }
            : { images: [`${origin}${product.images[0]}`] }),
        },
      },
    });
  }

  const subtotal = items.reduce((sum, i) => {
    const product = productMap.get(i.productId)!;
    return sum + product.priceCents * i.qty;
  }, 0);
  const freeUsShipping = subtotal >= 15000;

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // No payment_method_types on purpose: dynamic payment methods let the
      // Stripe Dashboard control what's shown (cards, Apple Pay, Google Pay,
      // BLIK, OXXO, Cash App, Klarna...) per buyer location & device.
      line_items: lineItems,
      locale: locale === "es" ? "es" : "en",
      shipping_address_collection: {
        allowed_countries: [
          "US", "CA", "MX",
          // Europe
          "PL", "DE", "FR", "ES", "IT", "NL", "BE", "AT", "PT", "IE", "SE",
          "DK", "FI", "CZ", "SK", "HU", "RO", "BG", "HR", "SI", "LT", "LV",
          "EE", "LU", "GR", "CY", "MT", "GB", "CH", "NO",
        ],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: freeUsShipping
              ? "UPS Tracked — FREE (US orders $150+)"
              : "UPS Tracked Shipping",
            fixed_amount: {
              amount: freeUsShipping ? 0 : 1500,
              currency: "usd",
            },
            delivery_estimate: {
              minimum: { unit: "business_day", value: 3 },
              maximum: { unit: "business_day", value: 9 },
            },
          },
        },
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: "UPS Express Saver",
            fixed_amount: { amount: 3900, currency: "usd" },
            delivery_estimate: {
              minimum: { unit: "business_day", value: 2 },
              maximum: { unit: "business_day", value: 4 },
            },
          },
        },
      ],
      phone_number_collection: { enabled: true },
      allow_promotion_codes: true,
      metadata: {
        cart: JSON.stringify(
          items.map((i) => ({ id: i.productId, size: i.size, qty: i.qty }))
        ).slice(0, 490),
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not create checkout session";
    console.error("Stripe checkout error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
