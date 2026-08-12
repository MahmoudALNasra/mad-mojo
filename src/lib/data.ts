import { fallbackCategories, fallbackProducts } from "./catalog-fallback";
import { createClient, supabaseServerConfigured } from "./supabase/server";
import {
  mapCategoryRow,
  mapProductRow,
  type Category,
  type Product,
} from "./types";

/**
 * Data layer: reads from Supabase when configured, otherwise serves the
 * built-in catalog so the site works out of the box.
 */

/** Temporarily hidden on the storefront (still available in admin). */
const STOREFRONT_HIDDEN_CATEGORIES = new Set(["clothing"]);

function isHiddenOnStorefront(categorySlug: string | null | undefined) {
  return !!categorySlug && STOREFRONT_HIDDEN_CATEGORIES.has(categorySlug);
}

function forStorefront(options?: { includeHidden?: boolean; includeInactive?: boolean }) {
  // Admin passes includeInactive / includeHidden to see everything.
  return !options?.includeHidden && !options?.includeInactive;
}

export async function getCategories(options?: {
  includeHidden?: boolean;
}): Promise<Category[]> {
  let categories: Category[];
  if (!supabaseServerConfigured()) {
    categories = fallbackCategories;
  } else {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort", { ascending: true });
      if (error || !data || data.length === 0) {
        categories = fallbackCategories;
      } else {
        categories = data.map(mapCategoryRow);
      }
    } catch {
      categories = fallbackCategories;
    }
  }

  if (!options?.includeHidden) {
    categories = categories.filter((c) => !isHiddenOnStorefront(c.slug));
  }
  return categories;
}

export async function getProducts(options?: {
  categorySlug?: string;
  includeInactive?: boolean;
  includeHidden?: boolean;
}): Promise<Product[]> {
  if (!supabaseServerConfigured()) {
    return filterFallback(options);
  }
  try {
    const supabase = await createClient();
    let query = supabase
      .from("products")
      .select("*, categories(slug)")
      .order("created_at", { ascending: false });
    if (!options?.includeInactive) query = query.eq("is_active", true);
    const { data, error } = await query;
    if (error || !data || data.length === 0) return filterFallback(options);
    let products = data.map(mapProductRow);
    if (options?.categorySlug) {
      products = products.filter(
        (p) => p.categorySlug === options.categorySlug
      );
    }
    if (forStorefront(options)) {
      products = products.filter((p) => !isHiddenOnStorefront(p.categorySlug));
    }
    return products;
  } catch {
    return filterFallback(options);
  }
}

function filterFallback(options?: {
  categorySlug?: string;
  includeInactive?: boolean;
  includeHidden?: boolean;
}): Product[] {
  let products = fallbackProducts;
  if (!options?.includeInactive) products = products.filter((p) => p.isActive);
  if (options?.categorySlug) {
    products = products.filter((p) => p.categorySlug === options.categorySlug);
  }
  if (forStorefront(options)) {
    products = products.filter((p) => !isHiddenOnStorefront(p.categorySlug));
  }
  return products;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  let product: Product | null = null;
  if (!supabaseServerConfigured()) {
    product = fallbackProducts.find((p) => p.slug === slug) ?? null;
  } else {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(slug)")
        .eq("slug", slug)
        .maybeSingle();
      if (error || !data) {
        product = fallbackProducts.find((p) => p.slug === slug) ?? null;
      } else {
        product = mapProductRow(data);
      }
    } catch {
      product = fallbackProducts.find((p) => p.slug === slug) ?? null;
    }
  }

  if (product && isHiddenOnStorefront(product.categorySlug)) return null;
  return product;
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (!supabaseServerConfigured()) {
    return fallbackProducts.filter((p) => ids.includes(p.id));
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(slug)")
      .in("id", ids);
    if (error || !data || data.length === 0) {
      return fallbackProducts.filter((p) => ids.includes(p.id));
    }
    return data.map(mapProductRow);
  } catch {
    return fallbackProducts.filter((p) => ids.includes(p.id));
  }
}
