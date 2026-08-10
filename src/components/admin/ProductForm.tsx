"use client";

import { useRef, useState, useTransition } from "react";
import { ProductImage } from "@/components/ProductImage";
import { fileToWebp } from "@/lib/image-upload";
import { createClient } from "@/lib/supabase/client";
import type { Category, Product } from "@/lib/types";

export function ProductForm({
  product,
  categories,
  categoryIdBySlug,
  action,
  deleteAction,
}: {
  product: Product | null;
  categories: Category[];
  categoryIdBySlug: Record<string, string>;
  action: (formData: FormData) => Promise<void>;
  deleteAction?: (formData: FormData) => Promise<void>;
}) {
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      const supabase = createClient();
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const { blob } = await fileToWebp(file);
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
        const { error } = await supabase.storage
          .from("product-images")
          .upload(path, blob, {
            cacheControl: "31536000",
            contentType: "image/webp",
            upsert: false,
          });
        if (error) throw new Error(error.message);
        const { data } = supabase.storage
          .from("product-images")
          .getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch (e) {
      setUploadError(
        e instanceof Error
          ? `Upload failed: ${e.message}`
          : "Upload failed — is the product-images bucket created?"
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const inputCls =
    "w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm focus:border-ink focus:outline-none";
  const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink/60";

  return (
    <form
      action={(fd) => startTransition(() => action(fd))}
      className="max-w-3xl space-y-6"
    >
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="images" value={images.join("\n")} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="name_en">Name (English) *</label>
          <input id="name_en" name="name_en" required defaultValue={product?.nameEn} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="name_es">Name (Spanish)</label>
          <input id="name_es" name="name_es" defaultValue={product?.nameEs} className={inputCls} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="slug">URL slug *</label>
          <input
            id="slug"
            name="slug"
            required
            defaultValue={product?.slug}
            placeholder="e.g. sunset-tiger"
            pattern="[a-z0-9-]+"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="category_id">Category *</label>
          <select
            id="category_id"
            name="category_id"
            required
            defaultValue={
              product ? categoryIdBySlug[product.categorySlug] : undefined
            }
            className={inputCls}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameEn}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-4">
        <div>
          <label className={labelCls} htmlFor="price">Price (USD) *</label>
          <input id="price" name="price" required type="number" step="0.01" min="0" defaultValue={product ? product.priceCents / 100 : undefined} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="compare_at">Compare-at (USD)</label>
          <input id="compare_at" name="compare_at" type="number" step="0.01" min="0" defaultValue={product?.compareAtCents ? product.compareAtCents / 100 : undefined} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="stock">Stock *</label>
          <input id="stock" name="stock" required type="number" min="0" defaultValue={product?.stock ?? 10} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="badge">Badge</label>
          <select id="badge" name="badge" defaultValue={product?.badge ?? ""} className={inputCls}>
            <option value="">None</option>
            <option value="new">NEW</option>
            <option value="bestseller">BEST SELLER</option>
            <option value="restocked">RESTOCKED</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="sizes">
          Sizes (comma-separated — leave empty for art prints)
        </label>
        <input id="sizes" name="sizes" defaultValue={product?.sizes?.join(", ") ?? ""} placeholder="XS, S, M, L, XL or One Size" className={inputCls} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="description_en">Description (English)</label>
          <textarea id="description_en" name="description_en" rows={4} defaultValue={product?.descriptionEn} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="description_es">Description (Spanish)</label>
          <textarea id="description_es" name="description_es" rows={4} defaultValue={product?.descriptionEs} className={inputCls} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="details_en">Details line (English)</label>
          <input id="details_en" name="details_en" defaultValue={product?.detailsEn} placeholder="Giclée print · 50 × 70 cm · ..." className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="details_es">Details line (Spanish)</label>
          <input id="details_es" name="details_es" defaultValue={product?.detailsEs} className={inputCls} />
        </div>
      </div>

      {/* Images */}
      <div>
        <label className={labelCls}>Images (first = cover)</label>
        <div className="flex flex-wrap gap-3">
          {images.map((src, i) => (
            <div key={src} className="group relative h-28 w-24 overflow-hidden rounded-xl border border-ink/10 bg-sand">
              <ProductImage src={src} alt="" fill sizes="96px" className="object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-ink/70 px-1.5 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                {i > 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setImages((prev) => {
                        const next = [...prev];
                        [next[i - 1], next[i]] = [next[i], next[i - 1]];
                        return next;
                      })
                    }
                    className="text-xs text-white"
                    aria-label="Move left"
                  >
                    ←
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                  className="text-xs font-bold text-white"
                  aria-label="Remove"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex h-28 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-ink/20 text-ink/50 transition-colors hover:border-mojo hover:text-mojo disabled:opacity-50"
          >
            <span className="text-2xl leading-none">+</span>
            <span className="text-[10px] font-bold uppercase">
              {uploading ? "Uploading…" : "Upload"}
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => uploadFiles(e.target.files)}
          />
        </div>
        {uploadError && (
          <p className="mt-2 text-sm font-medium text-mojo-dark">{uploadError}</p>
        )}
      </div>

      <label className="flex items-center gap-2.5 text-sm font-medium">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={product?.isActive ?? true}
          className="h-4 w-4 accent-mojo"
        />
        Visible in the store
      </label>

      <div className="flex items-center gap-3 border-t border-ink/10 pt-6">
        <button
          type="submit"
          disabled={pending || uploading}
          className="rounded-full bg-mojo px-8 py-3 text-sm font-bold text-white hover:bg-mojo-dark disabled:opacity-60"
        >
          {pending ? "Saving…" : product ? "Save changes" : "Create product"}
        </button>
        {product && deleteAction && (
          <button
            formAction={(fd) => startTransition(() => deleteAction(fd))}
            formNoValidate
            disabled={pending}
            className="rounded-full border border-mojo/40 px-6 py-3 text-sm font-bold text-mojo-dark hover:bg-mojo/10 disabled:opacity-60"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
