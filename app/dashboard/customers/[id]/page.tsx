import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Edit, Mail, Phone, MapPin, Calendar, FileText } from "lucide-react"

interface CustomerDetailPageProps {
  params: {
    id: string
  }
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
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

  // Fetch customer's invoices
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, total_amount, status, created_at")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-gray-600 mt-1">Customer details and invoice history</p>
          </div>
          <div className="flex gap-3">
            <Button asChild>
              <Link href={`/dashboard/customers/${customer.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Customer
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/invoices/new" className="bg-blue-600 text-white hover:bg-blue-700">
                <FileText className="mr-2 h-4 w-4" />
                Create Invoice
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Information */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {customer.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{customer.email}</p>
                      </div>
                    </div>
                  )}

                  {customer.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium">{customer.phone}</p>
                      </div>
                    </div>
                  )}

                  {(customer.address || customer.city || customer.state || customer.country) && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Address</p>
                        <div className="font-medium">
                          {customer.address && <p>{customer.address}</p>}
                          {(customer.city || customer.state || customer.zip_code) && (
                            <p>{[customer.city, customer.state, customer.zip_code].filter(Boolean).join(", ")}</p>
                          )}
                          {customer.country && <p>{customer.country}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Customer Since</p>
                      <p className="font-medium">{new Date(customer.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoice History */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Invoice History</CardTitle>
                <Button asChild size="sm">
                  <Link href={`/dashboard/invoices/new?customer=${customer.id}`}>
                    <FileText className="mr-2 h-4 w-4" />
                    New Invoice
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {invoices && invoices.length > 0 ? (
                  <div className="space-y-3">
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <Link
                            href={`/dashboard/invoices/${invoice.id}`}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {invoice.invoice_number}
                          </Link>
                          <p className="text-sm text-gray-600">{new Date(invoice.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
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
                    <p className="mb-4">No invoices yet for this customer.</p>
                    <Button asChild>
                      <Link href={`/dashboard/invoices/new?customer=${customer.id}`}>
                        <FileText className="mr-2 h-4 w-4" />
                        Create First Invoice
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
