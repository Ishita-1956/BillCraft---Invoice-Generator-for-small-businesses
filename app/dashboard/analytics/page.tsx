import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch analytics data
  const [{ data: invoices }, { data: products }, { data: recentInvoices }, { data: invoiceItems }] = await Promise.all([
    supabase.from("invoices").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("products").select("*").eq("user_id", user.id),
    supabase
      .from("invoices")
      .select("total_amount, created_at, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("invoice_items")
      .select(`
        *,
        invoices!inner(user_id)
      `)
      .eq("invoices.user_id", user.id),
  ])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Track your business performance and insights.</p>
        </div>

        <AnalyticsDashboard
          invoices={invoices || []}
          products={products || []}
          recentInvoices={recentInvoices || []}
          invoiceItems={invoiceItems || []}
        />
      </div>
    </DashboardLayout>
  )
}
