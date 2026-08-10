import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { getProducts } from "@/lib/data";
import { supabaseServerConfigured } from "@/lib/supabase/server";

export default async function AdminProductsPage() {
  const products = await getProducts({ includeInactive: true });
  const editable = supabaseServerConfigured();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-mojo px-5 py-2.5 text-sm font-bold text-white hover:bg-mojo-dark"
        >
          + New product
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-left text-xs font-bold uppercase tracking-wider text-ink/50">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-sand/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-md bg-sand">
                      {product.images[0] && (
                        <ProductImage
                          src={product.images[0]}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{product.nameEn}</p>
                      <p className="text-xs text-ink/50">/{product.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 capitalize">{product.categorySlug}</td>
                <td className="px-4 py-3 font-medium">
                  ${(product.priceCents / 100).toFixed(2)}
                </td>
                <td className="px-4 py-3">{product.stock}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      product.isActive
                        ? "bg-jungle/10 text-jungle"
                        : "bg-ink/10 text-ink/50"
                    }`}
                  >
                    {product.isActive ? "Active" : "Hidden"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {editable ? (
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="font-semibold text-mojo hover:underline"
                    >
                      Edit
                    </Link>
                  ) : (
                    <span className="text-xs text-ink/40">demo data</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
