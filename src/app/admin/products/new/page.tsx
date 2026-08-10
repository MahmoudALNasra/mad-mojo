import { ProductForm } from "@/components/admin/ProductForm";
import { getCategories } from "@/lib/data";
import { saveProduct } from "../../actions";

export default async function NewProductPage() {
  const categories = await getCategories();
  const categoryIdBySlug = Object.fromEntries(
    categories.map((c) => [c.slug, c.id])
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">New product</h1>
      <div className="mt-6">
        <ProductForm
          product={null}
          categories={categories}
          categoryIdBySlug={categoryIdBySlug}
          action={saveProduct}
        />
      </div>
    </div>
  );
}
