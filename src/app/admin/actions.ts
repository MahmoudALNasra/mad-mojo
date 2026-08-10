"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin mutations. RLS policies in supabase/schema.sql enforce that only
 * profiles with role = 'admin' can write, so these run with the caller's own
 * session — no service key involved.
 */

async function requireAdminClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") throw new Error("Not an admin");
  return supabase;
}

function parseImages(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseSizes(raw: string): string[] | null {
  const sizes = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return sizes.length > 0 ? sizes : null;
}

export async function saveProduct(formData: FormData) {
  const supabase = await requireAdminClient();

  const id = (formData.get("id") as string) || null;
  const priceDollars = parseFloat(formData.get("price") as string);
  const compareRaw = formData.get("compare_at") as string;
  const compareDollars = compareRaw ? parseFloat(compareRaw) : NaN;

  const row = {
    slug: (formData.get("slug") as string).trim().toLowerCase(),
    category_id: formData.get("category_id") as string,
    name_en: (formData.get("name_en") as string).trim(),
    name_es: (formData.get("name_es") as string).trim(),
    description_en: (formData.get("description_en") as string).trim(),
    description_es: (formData.get("description_es") as string).trim(),
    details_en: (formData.get("details_en") as string).trim(),
    details_es: (formData.get("details_es") as string).trim(),
    price_cents: Math.round(priceDollars * 100),
    compare_at_cents: Number.isFinite(compareDollars)
      ? Math.round(compareDollars * 100)
      : null,
    badge: (formData.get("badge") as string) || null,
    images: parseImages(formData.get("images") as string),
    sizes: parseSizes((formData.get("sizes") as string) ?? ""),
    stock: parseInt(formData.get("stock") as string, 10) || 0,
    is_active: formData.get("is_active") === "on",
  };

  if (!row.slug || !row.name_en || !Number.isFinite(priceDollars)) {
    throw new Error("Slug, English name and price are required");
  }

  if (id) {
    const { error } = await supabase.from("products").update(row).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("products").insert(row);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function deleteProduct(formData: FormData) {
  const supabase = await requireAdminClient();
  const id = formData.get("id") as string;
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function saveCategory(formData: FormData) {
  const supabase = await requireAdminClient();
  const row = {
    slug: (formData.get("slug") as string).trim().toLowerCase(),
    name_en: (formData.get("name_en") as string).trim(),
    name_es: (formData.get("name_es") as string).trim(),
    sort: parseInt(formData.get("sort") as string, 10) || 0,
  };
  if (!row.slug || !row.name_en) throw new Error("Slug and name are required");
  const { error } = await supabase.from("categories").insert(row);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  redirect("/admin/categories");
}

export async function deleteCategory(formData: FormData) {
  const supabase = await requireAdminClient();
  const id = formData.get("id") as string;
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  redirect("/admin/categories");
}
