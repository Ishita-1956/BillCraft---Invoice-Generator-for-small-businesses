import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CustomersTable } from "@/components/customers-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Users } from "lucide-react"

export default async function CustomersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch customers
  const { data: customers, error } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching customers:", error)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600 mt-1">Manage your customer information.</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/customers/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Link>
          </Button>
        </div>

        {/* Customers Table */}
        {customers && customers.length > 0 ? (
          <CustomersTable customers={customers} />
        ) : (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No customers yet</h3>
            <p className="text-gray-600 mb-6">Add your first customer to start creating invoices.</p>
            <Button asChild>
              <Link href="/dashboard/customers/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Customer
              </Link>
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
