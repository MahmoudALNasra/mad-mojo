import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { getCategories } from "@/lib/data";
import { createClient, supabaseServerConfigured } from "@/lib/supabase/server";
import { mapProductRow } from "@/lib/types";
import { deleteProduct, saveProduct } from "../../actions";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!supabaseServerConfigured()) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, categories(slug)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const product = mapProductRow(data);
  const categories = await getCategories();
  const categoryIdBySlug = Object.fromEntries(
    categories.map((c) => [c.slug, c.id])
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">
        Edit: {product.nameEn}
      </h1>
      <div className="mt-6">
        <ProductForm
          product={product}
          categories={categories}
          categoryIdBySlug={categoryIdBySlug}
          action={saveProduct}
          deleteAction={deleteProduct}
        />
      </div>
    </div>
  );
}
