import { ShopView } from "@/components/shop/ShopView";
import { getCategories, getProducts } from "@/lib/data";

export const metadata = { title: "Shop All" };

export default async function ShopPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  return <ShopView products={products} categories={categories} />;
}
