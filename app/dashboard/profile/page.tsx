import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { BusinessProfileForm } from "@/components/business-profile-form"

export default async function BusinessProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch existing business profile
  const { data: profile } = await supabase.from("business_profiles").select("*").eq("id", user.id).single()

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Business Profile</h1>
          <p className="text-gray-600 mt-1">Manage your business information that appears on invoices and documents.</p>
        </div>

        <BusinessProfileForm initialData={profile} />
      </div>
    </DashboardLayout>
  )
}
