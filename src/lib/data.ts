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

export async function getCategories(): Promise<Category[]> {
  if (!supabaseServerConfigured()) return fallbackCategories;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort", { ascending: true });
    if (error || !data || data.length === 0) return fallbackCategories;
    return data.map(mapCategoryRow);
  } catch {
    return fallbackCategories;
  }
}

export async function getProducts(options?: {
  categorySlug?: string;
  includeInactive?: boolean;
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
    return products;
  } catch {
    return filterFallback(options);
  }
}

function filterFallback(options?: {
  categorySlug?: string;
  includeInactive?: boolean;
}): Product[] {
  let products = fallbackProducts;
  if (!options?.includeInactive) products = products.filter((p) => p.isActive);
  if (options?.categorySlug) {
    products = products.filter((p) => p.categorySlug === options.categorySlug);
  }
  return products;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!supabaseServerConfigured()) {
    return fallbackProducts.find((p) => p.slug === slug) ?? null;
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(slug)")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) {
      return fallbackProducts.find((p) => p.slug === slug) ?? null;
    }
    return mapProductRow(data);
  } catch {
    return fallbackProducts.find((p) => p.slug === slug) ?? null;
  }
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
