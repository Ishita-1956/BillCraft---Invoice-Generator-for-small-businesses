// components/invoice-view.tsx
"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, Download, Edit } from "lucide-react"
import { QRCodeCanvas } from "qrcode.react"
import { formatDate } from "@/lib/utils/dateFormatter"

interface InvoiceViewProps {
  invoice: any
  businessProfile: any
}

export function InvoiceView({ invoice, businessProfile }: InvoiceViewProps) {
  const invoiceRef = useRef<HTMLDivElement>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (invoiceRef.current) {
        setIsReady(true)
      } else {
        setTimeout(() => {
          if (invoiceRef.current) {
            setIsReady(true)
          }
        }, 1000)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [invoice])

  const getStatusBadge = (status: string) => {
    const badges = {
      paid: { bg: '#dcfce7', color: '#166534', text: 'Paid' },
      sent: { bg: '#dbeafe', color: '#1e40af', text: 'Sent' },
      overdue: { bg: '#fee2e2', color: '#991b1b', text: 'Overdue' },
      cancelled: { bg: '#f3f4f6', color: '#374151', text: 'Cancelled' },
    }
    
    const badge = badges[status as keyof typeof badges] || { bg: '#f3f4f6', color: '#4b5563', text: 'Draft' }
    
    return (
      <span
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
        style={{ backgroundColor: badge.bg, color: badge.color }}
      >
        {badge.text}
      </span>
    )
  }

  const handleDownloadPDF = async () => {
    let element = invoiceRef.current || document.getElementById('invoice-content-to-print') as HTMLDivElement
    
    if (!element) {
      await new Promise(resolve => setTimeout(resolve, 500))
      element = invoiceRef.current || document.getElementById('invoice-content-to-print') as HTMLDivElement
    }
    
    if (!element) {
      alert("Invoice content not ready. Please refresh the page and try again.")
      return
    }

    let downloadBtn: HTMLButtonElement | null = null

    try {
      downloadBtn = document.querySelector('[data-download-btn]') as HTMLButtonElement
      
      if (downloadBtn) {
        downloadBtn.disabled = true
        const btnContent = downloadBtn.innerHTML
        downloadBtn.innerHTML = '<span>Generating PDF...</span>'
        downloadBtn.setAttribute('data-original-content', btnContent)
      }

      const html2canvas = (await import("html2canvas")).default
      const { jsPDF } = await import("jspdf")

      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        allowTaint: false,
        backgroundColor: '#ffffff',
        ignoreElements: (el) => {
          return el.classList?.contains('qr-download-section') || false
        },
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('invoice-content-to-print')
          if (clonedElement) {
            const allElements = clonedElement.querySelectorAll('*')
            allElements.forEach((el: any) => {
              const computedStyle = window.getComputedStyle(el)
              
              if (el.style.backgroundColor) {
                el.style.backgroundColor = computedStyle.backgroundColor
              }
              if (el.style.color) {
                el.style.color = computedStyle.color
              }
              if (el.style.borderColor) {
                el.style.borderColor = computedStyle.borderColor
              }
            })

            const badges = clonedElement.querySelectorAll('[style*="background"]')
            badges.forEach((badge: any) => {
              const bgColor = badge.style.backgroundColor
              if (bgColor.includes('220, 252, 231') || bgColor.includes('#dcfce7')) {
                badge.style.backgroundColor = '#dcfce7'
                badge.style.color = '#166534'
              } else if (bgColor.includes('219, 234, 254') || bgColor.includes('#dbeafe')) {
                badge.style.backgroundColor = '#dbeafe'
                badge.style.color = '#1e40af'
              } else if (bgColor.includes('254, 226, 226') || bgColor.includes('#fee2e2')) {
                badge.style.backgroundColor = '#fee2e2'
                badge.style.color = '#991b1b'
              } else if (bgColor.includes('243, 244, 246') || bgColor.includes('#f3f4f6')) {
                badge.style.backgroundColor = '#f3f4f6'
                badge.style.color = '#374151'
              }
            })
          }
        }
      })

      const imgData = canvas.toDataURL("image/png", 1.0)
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      
      const marginTop = 5
      const marginBottom = 5
      const marginLeft = 8
      const marginRight = 8
      
      const availableWidth = pdfWidth - marginLeft - marginRight
      const availableHeight = pdfHeight - marginTop - marginBottom
      
      const ratioWidth = availableWidth / imgWidth
      const ratioHeight = availableHeight / imgHeight
      const ratio = Math.min(ratioWidth, ratioHeight)
      
      const scaledWidth = imgWidth * ratio
      const scaledHeight = imgHeight * ratio
      
      const xOffset = (pdfWidth - scaledWidth) / 2
      const yOffset = marginTop
      
      pdf.addImage(imgData, "PNG", xOffset, yOffset, scaledWidth, scaledHeight)

      pdf.save(`${invoice.invoice_number}.pdf`)

      if (downloadBtn) {
        const originalContent = downloadBtn.getAttribute('data-original-content')
        downloadBtn.disabled = false
        if (originalContent) {
          downloadBtn.innerHTML = originalContent
        }
      }
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert(`Failed to download PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      if (downloadBtn) {
        const originalContent = downloadBtn.getAttribute('data-original-content')
        downloadBtn.disabled = false
        if (originalContent) {
          downloadBtn.innerHTML = originalContent
        }
      }
    }
  }

  const qrCodeValue = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/invoices/${invoice.id}/download` 
    : ''

  return (
    <div className="flex justify-center items-start min-h-screen p-4" style={{ backgroundColor: '#f9fafb' }}>
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/invoices">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Invoices
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: '#111827' }}>{invoice.invoice_number}</h1>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(invoice.status)}
                <span style={{ color: '#6b7280' }}>•</span>
                <span style={{ color: '#6b7280' }}>{formatDate(invoice.created_at)}</span>
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
            <Button 
              variant="outline" 
              onClick={handleDownloadPDF} 
              data-download-btn
              disabled={!isReady}
              title={!isReady ? "Loading invoice..." : "Download PDF"}
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>

        <Card style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' }}>
          <CardContent className="p-0">
            <div 
              ref={invoiceRef} 
              className="p-12"
              id="invoice-content-to-print"
              style={{ 
                backgroundColor: '#ffffff',
                maxWidth: '210mm',
                margin: '0 auto',
                minHeight: '280mm'
              }}
            >
              {/* Header with Company and Invoice Info */}
              <div className="flex justify-between items-start mb-10" style={{ borderBottom: '3px solid #e5e7eb', paddingBottom: '20px' }}>
                <div style={{ flex: '1' }}>
                  {businessProfile ? (
                    <div>
                      <h2 className="text-3xl font-bold mb-3" style={{ color: '#111827' }}>{businessProfile.business_name}</h2>
                      <div style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
                        {businessProfile.business_address && (
                          <p className="whitespace-pre-line mb-1">{businessProfile.business_address}</p>
                        )}
                        {businessProfile.phone && <p>📞 {businessProfile.phone}</p>}
                        {businessProfile.email && <p>✉️ {businessProfile.email}</p>}
                        {businessProfile.gst_number && <p className="mt-2"><strong>GST:</strong> {businessProfile.gst_number}</p>}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-3xl font-bold mb-3" style={{ color: '#111827' }}>Your Business</h2>
                      <p style={{ color: '#6b7280' }}>Please update your business profile</p>
                    </div>
                  )}
                </div>
                <div className="text-right" style={{ minWidth: '200px' }}>
                  <div style={{ backgroundColor: '#f3f4f6', padding: '20px', borderRadius: '8px' }}>
                    <h3 className="text-2xl font-bold mb-2" style={{ color: '#111827' }}>INVOICE</h3>
                    <p className="text-lg font-medium mb-3" style={{ color: '#6b7280' }}>{invoice.invoice_number}</p>
                    <div className="mb-2">{getStatusBadge(invoice.status)}</div>
                  </div>
                </div>
              </div>

              {/* Bill To and Invoice Details */}
              <div className="grid grid-cols-2 gap-10 mb-8">
                <div style={{ 
                  backgroundColor: '#f9fafb', 
                  padding: '20px', 
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <h4 className="font-bold text-sm mb-3" style={{ color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bill To:</h4>
                  {invoice.customers ? (
                    <div>
                      <p className="font-bold text-lg mb-1" style={{ color: '#111827' }}>{invoice.customers.name}</p>
                      {invoice.customers.email && <p style={{ color: '#6b7280', fontSize: '14px' }}>✉️ {invoice.customers.email}</p>}
                    </div>
                  ) : (
                    <p style={{ color: '#9ca3af' }}>No customer selected</p>
                  )}
                </div>
                <div style={{ 
                  backgroundColor: '#f9fafb', 
                  padding: '20px', 
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div className="space-y-2" style={{ fontSize: '14px' }}>
                    <div className="flex justify-between">
                      <span style={{ color: '#6b7280', fontWeight: '600' }}>Invoice Date:</span>
                      <span style={{ color: '#111827', fontWeight: '500' }}>{formatDate(invoice.invoice_date)}</span>
                    </div>
                    {invoice.due_date && (
                      <div className="flex justify-between">
                        <span style={{ color: '#6b7280', fontWeight: '600' }}>Due Date:</span>
                        <span style={{ color: '#111827', fontWeight: '500' }}>{formatDate(invoice.due_date)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Invoice Items Table */}
              <div className="mb-10">
                <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ 
                      backgroundColor: '#1f2937', 
                      borderTop: '2px solid #111827',
                      borderBottom: '2px solid #111827'
                    }}>
                      <th className="text-left py-4 px-4 font-bold" style={{ color: '#ffffff', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</th>
                      <th className="text-center py-4 px-4 font-bold" style={{ color: '#ffffff', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '80px' }}>Qty</th>
                      <th className="text-right py-4 px-4 font-bold" style={{ color: '#ffffff', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '120px' }}>Unit Price</th>
                      <th className="text-center py-4 px-4 font-bold" style={{ color: '#ffffff', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '100px' }}>Discount</th>
                      <th className="text-right py-4 px-4 font-bold" style={{ color: '#ffffff', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '130px' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.invoice_items.map((item: any, index: number) => (
                      <tr key={item.id} style={{ 
                        borderBottom: '1px solid #e5e7eb',
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb'
                      }}>
                        <td className="py-4 px-4" style={{ color: '#111827', fontSize: '15px', lineHeight: '1.5' }}>{item.description}</td>
                        <td className="text-center py-4 px-4" style={{ color: '#111827', fontSize: '15px', fontWeight: '600' }}>{item.quantity}</td>
                        <td className="text-right py-4 px-4" style={{ color: '#111827', fontSize: '15px' }}>₹{Number(item.unit_price).toFixed(2)}</td>
                        <td className="text-center py-4 px-4" style={{ 
                          color: item.discount_percentage > 0 ? '#dc2626' : '#111827', 
                          fontSize: '15px',
                          fontWeight: item.discount_percentage > 0 ? '600' : '400'
                        }}>
                          {item.discount_percentage > 0 ? `-${item.discount_percentage}%` : '0%'}
                        </td>
                        <td className="text-right py-4 px-4 font-bold" style={{ color: '#111827', fontSize: '16px' }}>₹{Number(item.line_total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Section */}
              <div className="flex justify-end mb-10">
                <div style={{ 
                  width: '380px', 
                  backgroundColor: '#f9fafb',
                  padding: '24px',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}>
                  <div className="space-y-4">
                    <div className="flex justify-between" style={{ fontSize: '16px', paddingBottom: '8px' }}>
                      <span style={{ color: '#6b7280', fontWeight: '600' }}>Subtotal:</span>
                      <span style={{ color: '#111827', fontWeight: '600' }}>₹{Number(invoice.subtotal).toFixed(2)}</span>
                    </div>
                    {Number(invoice.tax_amount) > 0 && (
                      <div className="flex justify-between" style={{ fontSize: '16px', paddingBottom: '8px' }}>
                        <span style={{ color: '#6b7280', fontWeight: '600' }}>Tax:</span>
                        <span style={{ color: '#111827', fontWeight: '600' }}>₹{Number(invoice.tax_amount).toFixed(2)}</span>
                      </div>
                    )}
                    {Number(invoice.discount_amount) > 0 && (
                      <div className="flex justify-between" style={{ fontSize: '16px', paddingBottom: '8px' }}>
                        <span style={{ color: '#6b7280', fontWeight: '600' }}>Discount:</span>
                        <span style={{ color: '#dc2626', fontWeight: '600' }}>-₹{Number(invoice.discount_amount).toFixed(2)}</span>
                      </div>
                    )}
                    <div style={{ 
                      borderTop: '2px solid #d1d5db', 
                      margin: '16px 0',
                      paddingTop: '16px'
                    }}>
                      <div className="flex justify-between" style={{ 
                        fontSize: '22px',
                        fontWeight: 'bold'
                      }}>
                        <span style={{ color: '#111827' }}>Total Amount:</span>
                        <span style={{ 
                          color: '#059669',
                          backgroundColor: '#d1fae5',
                          padding: '8px 16px',
                          borderRadius: '8px'
                        }}>₹{Number(invoice.total_amount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              {invoice.notes && (
                <div style={{ 
                  backgroundColor: '#fef3c7',
                  border: '2px solid #fbbf24',
                  padding: '24px',
                  borderRadius: '12px',
                  marginBottom: '24px'
                }}>
                  <h4 className="font-bold mb-3 text-base" style={{ color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📝 Additional Notes:</h4>
                  <p className="whitespace-pre-line" style={{ color: '#78350f', fontSize: '15px', lineHeight: '1.7' }}>{invoice.notes}</p>
                </div>
              )}

              {/* Payment Terms Section */}
              <div style={{ 
                backgroundColor: '#e0f2fe',
                border: '2px solid #38bdf8',
                padding: '24px',
                borderRadius: '12px',
                marginBottom: '24px'
              }}>
                <h4 className="font-bold mb-3 text-base" style={{ color: '#0c4a6e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>💳 Payment Information:</h4>
                <div style={{ color: '#075985', fontSize: '14px', lineHeight: '1.8' }}>
                  <p className="mb-2"><strong>Payment Terms:</strong> {invoice.due_date ? `Due by ${formatDate(invoice.due_date)}` : 'Due on receipt'}</p>
                  <p className="mb-2"><strong>Payment Methods:</strong> Bank Transfer, UPI, Cash</p>
                  <p><strong>Late Payment:</strong> Interest may be charged on overdue amounts</p>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-8" style={{ 
                borderTop: '3px solid #1f2937',
                marginTop: '30px'
              }}>
                <p style={{ color: '#111827', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                  Thank you for your business!
                </p>
                <p style={{ color: '#6b7280', fontSize: '13px' }}>
                  For any queries regarding this invoice, please contact us.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Code Card */}
        {qrCodeValue && (
          <Card className="qr-download-section" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-6">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#111827' }}>
                    📱 Download on Mobile
                  </h3>
                  <p className="text-sm mb-1" style={{ color: '#6b7280' }}>
                    Scan this QR code with your phone camera to instantly download this invoice as PDF
                  </p>
                  <p className="text-xs" style={{ color: '#9ca3af' }}>
                    Works on iPhone and Android - Direct PDF download
                  </p>
                </div>
                <div className="flex-shrink-0 p-4 rounded-lg shadow-sm" style={{ backgroundColor: '#ffffff', border: '2px solid #d1d5db' }}>
                  <QRCodeCanvas
                    value={qrCodeValue}
                    size={120}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}