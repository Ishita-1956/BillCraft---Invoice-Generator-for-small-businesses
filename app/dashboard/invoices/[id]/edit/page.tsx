import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { InvoiceForm } from "@/components/invoice-form"

export default async function EditInvoicePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch the invoice with its items
  const { data: invoice } = await supabase
    .from("invoices")
    .select(`
      *,
      invoice_items (*)
    `)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (!invoice) {
    redirect("/dashboard/invoices")
  }

  // Fetch products and customers for the form
  const [{ data: products }, { data: customers }] = await Promise.all([
    supabase.from("products").select("*").eq("user_id", user.id).order("name"),
    supabase.from("customers").select("*").eq("user_id", user.id).order("name"),
  ])

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Invoice</h1>
          <p className="text-gray-600 mt-1">Update invoice #{invoice.invoice_number}</p>
        </div>

        <InvoiceForm products={products || []} customers={customers || []} initialData={invoice} />
      </div>
    </DashboardLayout>
  )
}
