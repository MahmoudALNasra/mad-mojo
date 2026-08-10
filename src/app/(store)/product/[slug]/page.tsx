import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductView } from "@/components/product/ProductView";
import { getProductBySlug, getProducts } from "@/lib/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.nameEn,
    description: product.descriptionEn,
    openGraph: {
      title: `${product.nameEn} | Mad Mojo`,
      description: product.descriptionEn,
      images: product.images[0] ? [product.images[0]] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.isActive) notFound();

  const all = await getProducts({ categorySlug: product.categorySlug });
  const related = all.filter((p) => p.id !== product.id).slice(0, 4);

  return <ProductView product={product} related={related} />;
}
