import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { InvoiceView } from "@/components/invoice-view"

interface InvoicePageProps {
  params: Promise<{ id: string }>
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch the invoice with all related data
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select(`
      *,
      customers (*),
      invoice_items (*)
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (error || !invoice) {
    notFound()
  }

  // Fetch business profile
  const { data: businessProfile } = await supabase.from("business_profiles").select("*").eq("id", user.id).single()

  return (
    <DashboardLayout>
      <InvoiceView invoice={invoice} businessProfile={businessProfile} />
    </DashboardLayout>
  )
}
