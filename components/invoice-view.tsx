"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { ArrowLeft, Download, Edit, QrCode } from "lucide-react"
import { QRCodeCanvas } from "qrcode.react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

interface InvoiceViewProps {
  invoice: any
  businessProfile: any
}

export function InvoiceView({ invoice, businessProfile }: InvoiceViewProps) {
  const invoiceRef = useRef<HTMLDivElement>(null)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>
      case "sent":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Sent</Badge>
      case "overdue":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Overdue</Badge>
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Cancelled</Badge>
      default:
        return <Badge variant="secondary">Draft</Badge>
    }
  }

  const handleDownloadPDF = async () => {
  if (!invoiceRef.current) return

  try {
    // Use html2canvas with proper options
    const canvas = await html2canvas(invoiceRef.current, {
      scale: 2,             // Higher resolution
      useCORS: true,        // Allow cross-origin images (like QR code)
      logging: true,
      scrollY: -window.scrollY, // Avoid scroll issues
    })

    const imgData = canvas.toDataURL("image/png")
    const pdf = new jsPDF("p", "mm", "a4")
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
    pdf.save(`${invoice.invoice_number}.pdf`)
  } catch (error) {
    console.error("Error generating PDF:", error)
    alert("Failed to download PDF. Check console for errors.")
  }
}



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/invoices">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{invoice.invoice_number}</h1>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(invoice.status)}
              <span className="text-gray-600">•</span>
              <span className="text-gray-600">{new Date(invoice.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Invoice Content */}
      <Card className="max-w-4xl">
        <CardContent ref={invoiceRef} className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              {businessProfile ? (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{businessProfile.business_name}</h2>
                  {businessProfile.business_address && (
                    <p className="text-gray-600 mt-1 whitespace-pre-line">{businessProfile.business_address}</p>
                  )}
                  {businessProfile.phone && <p className="text-gray-600">{businessProfile.phone}</p>}
                  {businessProfile.email && <p className="text-gray-600">{businessProfile.email}</p>}
                  {businessProfile.gst_number && <p className="text-gray-600">GST: {businessProfile.gst_number}</p>}
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Your Business</h2>
                  <p className="text-gray-600">Please update your business profile</p>
                </div>
              )}
            </div>
            <div className="text-right">
              <h3 className="text-xl font-bold text-gray-900">INVOICE</h3>
              <p className="text-gray-600">{invoice.invoice_number}</p>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Bill To:</h4>
              {invoice.customers ? (
                <div>
                  <p className="font-medium">{invoice.customers.name}</p>
                  {invoice.customers.email && <p className="text-gray-600">{invoice.customers.email}</p>}
                </div>
              ) : (
                <p className="text-gray-600">No customer selected</p>
              )}
            </div>
            <div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Invoice Date:</span>
                  <span>{new Date(invoice.invoice_date).toLocaleDateString()}</span>
                </div>
                {invoice.due_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Due Date:</span>
                    <span>{new Date(invoice.due_date).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  {getStatusBadge(invoice.status)}
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Invoice Items */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-semibold">Description</th>
                  <th className="text-right py-2 font-semibold">Qty</th>
                  <th className="text-right py-2 font-semibold">Unit Price</th>
                  <th className="text-right py-2 font-semibold">Discount</th>
                  <th className="text-right py-2 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.invoice_items.map((item: any) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3">{item.description}</td>
                    <td className="text-right py-3">{item.quantity}</td>
                    <td className="text-right py-3">${Number(item.unit_price).toFixed(2)}</td>
                    <td className="text-right py-3">{item.discount_percentage}%</td>
                    <td className="text-right py-3 font-medium">${Number(item.line_total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${Number(invoice.subtotal).toFixed(2)}</span>
              </div>
              {Number(invoice.tax_amount) > 0 && (
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${Number(invoice.tax_amount).toFixed(2)}</span>
                </div>
              )}
              {Number(invoice.discount_amount) > 0 && (
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-${Number(invoice.discount_amount).toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${Number(invoice.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-8">
              <h4 className="font-semibold text-gray-900 mb-2">Notes:</h4>
              <p className="text-gray-600 whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}

          {/* QR Code */}
          <div className="mt-8 flex justify-center">
            <div className="text-center">
              <QRCodeCanvas
                value={`${window.location.origin}/invoice/${invoice.invoice_number}`}
                size={128}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
                includeMargin={true}
              />
              <p className="text-xs text-gray-600 mt-2">Scan to view invoice</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
