// app/dashboard/invoices/[id]/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useParams, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DashboardLayout } from "@/components/dashboard-layout"
import { InvoiceView } from "@/components/invoice-view"
import { Loader2 } from "lucide-react"

export default function InvoicePage() {
  const params = useParams()
  const [invoice, setInvoice] = useState<any>(null)
  const [businessProfile, setBusinessProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient()
        
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          window.location.href = "/auth/login"
          return
        }

        // Fetch the invoice with all related data
        const { data: invoiceData, error: invoiceError } = await supabase
          .from("invoices")
          .select(`
            *,
            customers (*),
            invoice_items (*)
          `)
          .eq("id", params.id as string)
          .eq("user_id", user.id)
          .single()

        if (invoiceError || !invoiceData) {
          setError(true)
          return
        }

        // Fetch business profile
        const { data: profileData } = await supabase
          .from("business_profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        setInvoice(invoiceData)
        setBusinessProfile(profileData)
      } catch (err) {
        console.error("Error fetching invoice:", err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Loading invoice...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !invoice) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h2>
            <p className="text-gray-600 mb-4">The invoice you're looking for doesn't exist.</p>
            <a href="/dashboard/invoices" className="text-blue-600 hover:underline">
              Back to Invoices
            </a>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <InvoiceView invoice={invoice} businessProfile={businessProfile} />
    </DashboardLayout>
  )
}