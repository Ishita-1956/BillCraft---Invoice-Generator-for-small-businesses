import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CustomerForm } from "@/components/customer-form"

interface EditCustomerPageProps {
  params: {
    id: string
  }
}

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch customer data
  const { data: customer, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (error || !customer) {
    notFound()
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Customer</h1>
          <p className="text-gray-600 mt-1">Update customer information for {customer.name}.</p>
        </div>

        <CustomerForm initialData={customer} />
      </div>
    </DashboardLayout>
  )
}
