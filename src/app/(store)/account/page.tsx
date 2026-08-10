import { redirect } from "next/navigation";
import { AccountView } from "@/components/auth/AccountView";
import { createClient, supabaseServerConfigured } from "@/lib/supabase/server";

export const metadata = { title: "Account" };

interface OrderRow {
  id: string;
  amount_total: number;
  currency: string;
  status: string;
  created_at: string;
  items: { name: string; qty: number }[] | null;
}

export default async function AccountPage() {
  if (!supabaseServerConfigured()) {
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, amount_total, currency, status, created_at, items")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <AccountView
      email={user.email ?? ""}
      name={
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        null
      }
      isAdmin={profile?.role === "admin"}
      orders={(orders as OrderRow[] | null) ?? []}
    />
  );
}
