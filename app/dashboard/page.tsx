// app/dashboard/page.tsx
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { DollarSign, FileText, Package, Users, Plus } from "lucide-react"
import { formatDate } from "@/lib/utils/dateFormatter"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: businessProfile } = await supabase
    .from("business_profiles")
    .select("business_name")
    .eq("id", user.id)
    .single()

  // Fetch dashboard statistics
  const [{ count: invoiceCount }, { count: productCount }, { count: customerCount }, { data: recentInvoices }] =
    await Promise.all([
      supabase.from("invoices").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("products").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("customers").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase
        .from("invoices")
        .select("id, invoice_number, total_amount, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ])

  // Calculate total revenue
  const { data: invoices } = await supabase
    .from("invoices")
    .select("total_amount")
    .eq("user_id", user.id)
    .eq("status", "paid")

  const totalRevenue = invoices?.reduce((sum, invoice) => sum + Number(invoice.total_amount), 0) || 0

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {businessProfile?.business_name ? (
              <>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{businessProfile.business_name}</h1>
                <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your business.</p>
              </>
            ) : (
              <>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">
                  Welcome back! Complete your{" "}
                  <Link href="/dashboard/profile" className="text-blue-600 hover:underline">
                    business profile
                  </Link>{" "}
                  to get started.
                </p>
              </>
            )}
          </div>
          <div className="flex gap-3">
            <Button asChild size="sm" className="sm:size-default">
              <Link href="/dashboard/invoices/new">
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">New Invoice</span>
                <span className="sm:hidden">Invoice</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-gray-600 mt-1">From paid invoices</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{invoiceCount || 0}</div>
              <p className="text-xs text-gray-600 mt-1">All time invoices</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Products</CardTitle>
              <Package className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{productCount || 0}</div>
              <p className="text-xs text-gray-600 mt-1">Active products</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Customers</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{customerCount || 0}</div>
              <p className="text-xs text-gray-600 mt-1">Total customers</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button asChild variant="outline" className="h-16 sm:h-20 flex-col bg-transparent">
<Link href="/dashboard/invoices/new">
<FileText className="h-5 w-5 sm:h-6 sm:w-6 mb-2" />
<span className="text-sm sm:text-base">Create Invoice</span>
</Link>
</Button>
<Button asChild variant="outline" className="h-16 sm:h-20 flex-col bg-transparent">
<Link href="/dashboard/products/new">
<Package className="h-5 w-5 sm:h-6 sm:w-6 mb-2" />
<span className="text-sm sm:text-base">Add Product</span>
</Link>
</Button>
<Button asChild variant="outline" className="h-16 sm:h-20 flex-col bg-transparent">
<Link href="/dashboard/customers/new">
<Users className="h-5 w-5 sm:h-6 sm:w-6 mb-2" />
<span className="text-sm sm:text-base">Add Customer</span>
</Link>
</Button>
</div>
</CardContent>
</Card>
    {/* Recent Invoices */}
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-gray-900">Recent Invoices</CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/invoices">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {recentInvoices && recentInvoices.length > 0 ? (
          <div className="space-y-3">
            {recentInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-2"
              >
                <div>
                  <p className="font-medium text-gray-900">{invoice.invoice_number}</p>
                  <p className="text-sm text-gray-600">{formatDate(invoice.created_at)}</p>
                </div>
                <div className="flex sm:flex-col sm:text-right items-start sm:items-end gap-2">
                  <p className="font-medium text-gray-900">${Number(invoice.total_amount).toFixed(2)}</p>
                  <span
                    className={`
                    inline-flex px-2 py-1 text-xs font-medium rounded-full
                    ${
                      invoice.status === "paid"
                        ? "bg-green-100 text-green-800"
                        : invoice.status === "sent"
                          ? "bg-blue-100 text-blue-800"
                          : invoice.status === "overdue"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                    }
                  `}
                  >
                    {invoice.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm sm:text-base">No invoices yet. Create your first invoice to get started!</p>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
</DashboardLayout>
)
}