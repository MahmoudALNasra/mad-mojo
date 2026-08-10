import { getCategories, getProducts } from "@/lib/data";
import { supabaseServerConfigured } from "@/lib/supabase/server";
import { deleteCategory, saveCategory } from "../actions";

export default async function AdminCategoriesPage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ includeInactive: true }),
  ]);
  const editable = supabaseServerConfigured();

  const countBySlug = new Map<string, number>();
  for (const p of products) {
    countBySlug.set(p.categorySlug, (countBySlug.get(p.categorySlug) ?? 0) + 1);
  }

  const inputCls =
    "w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm focus:border-ink focus:outline-none";

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Categories</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-xs font-bold uppercase tracking-wider text-ink/50">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td className="px-4 py-3 font-semibold">
                    {cat.nameEn}
                    <span className="ml-2 text-xs font-normal text-ink/50">
                      {cat.nameEs}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink/60">/{cat.slug}</td>
                  <td className="px-4 py-3">{countBySlug.get(cat.slug) ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    {editable && (
                      <form action={deleteCategory}>
                        <input type="hidden" name="id" value={cat.id} />
                        <button className="text-xs font-bold text-mojo-dark hover:underline">
                          Delete
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white p-6">
          <h2 className="font-display text-lg font-bold">Add category</h2>
          {!editable && (
            <p className="mt-2 text-sm text-ink/50">
              Connect Supabase to manage categories.
            </p>
          )}
          <form action={saveCategory} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink/60" htmlFor="name_en">
                  Name (English) *
                </label>
                <input id="name_en" name="name_en" required disabled={!editable} className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink/60" htmlFor="name_es">
                  Name (Spanish)
                </label>
                <input id="name_es" name="name_es" disabled={!editable} className={inputCls} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink/60" htmlFor="slug">
                  Slug *
                </label>
                <input id="slug" name="slug" required pattern="[a-z0-9-]+" placeholder="e.g. stickers" disabled={!editable} className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink/60" htmlFor="sort">
                  Sort order
                </label>
                <input id="sort" name="sort" type="number" defaultValue={99} disabled={!editable} className={inputCls} />
              </div>
            </div>
            <button
              disabled={!editable}
              className="rounded-full bg-mojo px-6 py-2.5 text-sm font-bold text-white hover:bg-mojo-dark disabled:opacity-50"
            >
              Add category
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
