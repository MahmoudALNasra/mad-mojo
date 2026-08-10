export type Badge = "new" | "bestseller" | "restocked" | null;

export interface Category {
  id: string;
  slug: string;
  nameEn: string;
  nameEs: string;
  sort: number;
}

export interface Product {
  id: string;
  slug: string;
  categorySlug: string;
  nameEn: string;
  nameEs: string;
  descriptionEn: string;
  descriptionEs: string;
  detailsEn: string;
  detailsEs: string;
  priceCents: number;
  compareAtCents: number | null;
  badge: Badge;
  images: string[];
  sizes: string[] | null;
  stock: number;
  isActive: boolean;
  createdAt?: string;
}

export interface CartItem {
  productId: string;
  slug: string;
  nameEn: string;
  nameEs: string;
  priceCents: number;
  image: string;
  size: string | null;
  qty: number;
}

export interface OrderRecord {
  id: string;
  stripeSessionId: string;
  email: string | null;
  amountTotal: number;
  currency: string;
  status: string;
  shipping: unknown;
  items: unknown;
  createdAt: string;
}

/** Maps a snake_case product row from Supabase to the app's Product shape. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapProductRow(row: any): Product {
  return {
    id: row.id,
    slug: row.slug,
    categorySlug: row.category_slug ?? row.categories?.slug ?? "",
    nameEn: row.name_en,
    nameEs: row.name_es ?? row.name_en,
    descriptionEn: row.description_en ?? "",
    descriptionEs: row.description_es ?? row.description_en ?? "",
    detailsEn: row.details_en ?? "",
    detailsEs: row.details_es ?? row.details_en ?? "",
    priceCents: row.price_cents,
    compareAtCents: row.compare_at_cents,
    badge: row.badge,
    images: Array.isArray(row.images) ? row.images : [],
    sizes: Array.isArray(row.sizes) && row.sizes.length > 0 ? row.sizes : null,
    stock: row.stock ?? 0,
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapCategoryRow(row: any): Category {
  return {
    id: row.id,
    slug: row.slug,
    nameEn: row.name_en,
    nameEs: row.name_es ?? row.name_en,
    sort: row.sort ?? 0,
  };
}
