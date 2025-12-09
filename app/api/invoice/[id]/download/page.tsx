// app/dashboard/invoices/[id]/download-pdf/page.tsx
"use client"

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Download, Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function DownloadPDFPage() {
  const params = useParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [invoice, setInvoice] = useState<any>(null)
  const [businessProfile, setBusinessProfile] = useState<any>(null)
  const invoiceId = params.id as string

  useEffect(() => {
    const fetchDataAndDownload = async () => {
      try {
        setStatus('loading')
        
        const supabase = createClient()
        
        // Fetch invoice data
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .select(`
            *,
            customers (*),
            invoice_items (*)
          `)
          .eq('id', invoiceId)
          .single()

        if (invoiceError || !invoiceData) {
          throw new Error('Invoice not found')
        }

        // Fetch business profile
        const { data: profileData } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('id', invoiceData.user_id)
          .single()

        setInvoice(invoiceData)
        setBusinessProfile(profileData)

        // Wait a moment for state to update
        await new Promise(resolve => setTimeout(resolve, 800))
        
        // Import libraries dynamically
        const html2canvas = (await import('html2canvas')).default
        const { jsPDF } = await import('jspdf')
        
        // Create temporary container with invoice HTML
        const container = document.createElement('div')
        container.style.position = 'absolute'
        container.style.left = '-99999px'
        container.style.width = '800px'
        container.style.background = 'white'
        container.style.padding = '60px'
        container.innerHTML = generateInvoiceHTML(invoiceData, profileData)
        document.body.appendChild(container)
        
        // Wait for rendering
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Generate canvas
        const canvas = await html2canvas(container, {
          scale: 2.5,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: 800,
          windowHeight: container.scrollHeight
        })
        
        // Create PDF
        const imgData = canvas.toDataURL('image/png', 1.0)
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: true
        })
        
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = pdf.internal.pageSize.getHeight()
        const imgWidth = canvas.width
        const imgHeight = canvas.height
        
        const margin = 8
        const availableWidth = pdfWidth - (margin * 2)
        const availableHeight = pdfHeight - (margin * 2)
        
        const ratio = Math.min(availableWidth / imgWidth, availableHeight / imgHeight)
        const scaledWidth = imgWidth * ratio
        const scaledHeight = imgHeight * ratio
        const xOffset = (pdfWidth - scaledWidth) / 2
        
        // Handle multi-page PDFs
        let heightLeft = scaledHeight
        let position = margin
        
        pdf.addImage(imgData, 'PNG', xOffset, position, scaledWidth, scaledHeight)
        heightLeft -= availableHeight
        
        while (heightLeft > 0) {
          position = heightLeft - scaledHeight + margin
          pdf.addPage()
          pdf.addImage(imgData, 'PNG', xOffset, position, scaledWidth, scaledHeight)
          heightLeft -= availableHeight
        }
        
        // Download PDF
        pdf.save(`${invoiceData.invoice_number}.pdf`)
        
        // Cleanup
        document.body.removeChild(container)
        
        setStatus('success')
        
        // Redirect after success
        setTimeout(() => {
          router.push(`/dashboard/invoices/${invoiceId}`)
        }, 2500)
        
      } catch (error) {
        console.error('Download error:', error)
        setStatus('error')
      }
    }
    
    fetchDataAndDownload()
  }, [invoiceId, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full text-center relative overflow-hidden">
        {/* Animated background decoration */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse"></div>
        
        {status === 'loading' && (
          <div className="space-y-6">
            <div className="relative">
              <Loader2 className="h-20 w-20 text-indigo-600 animate-spin mx-auto" />
              <div className="absolute inset-0 h-20 w-20 mx-auto rounded-full border-4 border-indigo-200 animate-ping"></div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-3">Preparing Your Invoice</h1>
              <p className="text-gray-600 text-lg">Generating high-quality PDF...</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full animate-[progress_2s_ease-in-out_infinite]"></div>
            </div>
          </div>
        )}
        
        {status === 'success' && (
          <div className="space-y-6">
            <div className="relative">
              <CheckCircle className="h-20 w-20 text-green-600 mx-auto animate-[bounce_1s_ease-in-out]" />
              <div className="absolute inset-0 h-20 w-20 mx-auto rounded-full border-4 border-green-200 animate-ping"></div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-3">Download Complete! 🎉</h1>
              <p className="text-gray-600 text-lg mb-2">Your PDF has been downloaded successfully.</p>
              <p className="text-sm text-gray-500">Redirecting you back...</p>
            </div>
          </div>
        )}
        
        {status === 'error' && (
          <div className="space-y-6">
            <XCircle className="h-20 w-20 text-red-600 mx-auto" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-3">Download Failed</h1>
              <p className="text-gray-600 text-lg mb-6">We couldn't generate the PDF automatically.</p>
            </div>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => router.push(`/dashboard/invoices/${invoiceId}`)}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                size="lg"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Go Back to Invoice
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Download className="mr-2 h-5 w-5" />
                Try Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to format dates consistently
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

// HTML generation function
function generateInvoiceHTML(invoice: any, businessProfile: any): string {
  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { bg: string; color: string; text: string } } = {
      paid: { bg: '#dcfce7', color: '#166534', text: 'Paid' },
      sent: { bg: '#dbeafe', color: '#1e40af', text: 'Sent' },
      overdue: { bg: '#fee2e2', color: '#991b1b', text: 'Overdue' },
      cancelled: { bg: '#f3f4f6', color: '#374151', text: 'Cancelled' },
    }
    const badge = badges[status] || { bg: '#f3f4f6', color: '#4b5563', text: 'Draft' }
    return `<span style="background-color: ${badge.bg}; color: ${badge.color}; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500; display: inline-block;">${badge.text}</span>`
  }

  const businessName = businessProfile?.business_name || 'Your Business'
  const businessAddress = businessProfile?.business_address || ''
  const businessPhone = businessProfile?.phone || ''
  const businessEmail = businessProfile?.email || ''
  const businessGST = businessProfile?.gst_number || ''
  
  const customerName = invoice.customers?.name || 'No customer'
  const customerEmail = invoice.customers?.email || ''
  
  // Use consistent date formatting to avoid hydration errors
  const invoiceDate = formatDate(invoice.invoice_date)
  const dueDate = invoice.due_date ? formatDate(invoice.due_date) : ''
  
  const itemsHTML = invoice.invoice_items?.map((item: any, index: number) => `
    <tr style="border-bottom: 1px solid #e5e7eb; background: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'};">
      <td style="padding: 16px; color: #111827; font-size: 15px;">${item.description || ''}</td>
      <td style="padding: 16px; color: #111827; font-size: 15px; font-weight: 600; text-align: center;">${item.quantity || 0}</td>
      <td style="padding: 16px; color: #111827; font-size: 15px; text-align: right;">₹${Number(item.unit_price || 0).toFixed(2)}</td>
      <td style="padding: 16px; color: ${(item.discount_percentage || 0) > 0 ? '#dc2626' : '#111827'}; font-size: 15px; font-weight: ${(item.discount_percentage || 0) > 0 ? '600' : '400'}; text-align: center;">
        ${(item.discount_percentage || 0) > 0 ? `-${item.discount_percentage}%` : '0%'}
      </td>
      <td style="padding: 16px; color: #111827; font-size: 16px; font-weight: bold; text-align: right;">₹${Number(item.line_total || 0).toFixed(2)}</td>
    </tr>
  `).join('') || ''

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <div style="border-bottom: 3px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px;">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div style="flex: 1;">
            <h2 style="font-size: 28px; font-weight: bold; margin-bottom: 15px; color: #111827;">${businessName}</h2>
            <div style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              ${businessAddress ? `<p style="margin-bottom: 4px;">${businessAddress.replace(/\n/g, '<br>')}</p>` : ''}
              ${businessPhone ? `<p style="margin-bottom: 4px;">📞 ${businessPhone}</p>` : ''}
              ${businessEmail ? `<p style="margin-bottom: 4px;">✉️ ${businessEmail}</p>` : ''}
              ${businessGST ? `<p style="margin-top: 10px;"><strong>GST:</strong> ${businessGST}</p>` : ''}
            </div>
          </div>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; min-width: 200px; text-align: right;">
            <h3 style="font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #111827;">INVOICE</h3>
            <p style="font-size: 18px; font-weight: 500; margin-bottom: 15px; color: #6b7280;">${invoice.invoice_number || ''}</p>
            ${getStatusBadge(invoice.status)}
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px;">
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h4 style="color: #6b7280; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 15px;">Bill To:</h4>
          <p style="font-weight: bold; font-size: 18px; margin-bottom: 5px; color: #111827;">${customerName}</p>
          ${customerEmail ? `<p style="color: #6b7280; font-size: 14px;">✉️ ${customerEmail}</p>` : ''}
        </div>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <div style="font-size: 14px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #6b7280; font-weight: 600;">Invoice Date:</span>
              <span style="color: #111827; font-weight: 500;">${invoiceDate}</span>
            </div>
            ${dueDate ? `
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6b7280; font-weight: 600;">Due Date:</span>
                <span style="color: #111827; font-weight: 500;">${dueDate}</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
        <thead>
          <tr style="background: #1f2937; border-top: 2px solid #111827; border-bottom: 2px solid #111827;">
            <th style="color: white; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; padding: 16px; text-align: left;">Description</th>
            <th style="color: white; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; padding: 16px; text-align: center; width: 80px;">Qty</th>
            <th style="color: white; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; padding: 16px; text-align: right; width: 120px;">Unit Price</th>
            <th style="color: white; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; padding: 16px; text-align: center; width: 100px;">Discount</th>
            <th style="color: white; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; padding: 16px; text-align: right; width: 130px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
        <div style="width: 380px; background: #f9fafb; padding: 24px; border-radius: 12px; border: 2px solid #e5e7eb;">
          <div style="margin-bottom: 15px; padding-bottom: 10px; display: flex; justify-content: space-between; font-size: 16px;">
            <span style="color: #6b7280; font-weight: 600;">Subtotal:</span>
            <span style="color: #111827; font-weight: 600;">₹${Number(invoice.subtotal || 0).toFixed(2)}</span>
          </div>
          ${Number(invoice.tax_amount || 0) > 0 ? `
            <div style="margin-bottom: 15px; padding-bottom: 10px; display: flex; justify-content: space-between; font-size: 16px;">
              <span style="color: #6b7280; font-weight: 600;">Tax:</span>
              <span style="color: #111827; font-weight: 600;">₹${Number(invoice.tax_amount).toFixed(2)}</span>
            </div>
          ` : ''}
          ${Number(invoice.discount_amount || 0) > 0 ? `
            <div style="margin-bottom: 15px; padding-bottom: 10px; display: flex; justify-content: space-between; font-size: 16px;">
              <span style="color: #6b7280; font-weight: 600;">Discount:</span>
              <span style="color: #dc2626; font-weight: 600;">-₹${Number(invoice.discount_amount).toFixed(2)}</span>
            </div>
          ` : ''}
          <div style="border-top: 2px solid #d1d5db; margin: 16px 0; padding-top: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 22px; font-weight: bold;">
              <span style="color: #111827;">Total:</span>
              <span style="color: #059669; background: #d1fae5; padding: 8px 16px; border-radius: 8px;">₹${Number(invoice.total_amount || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      ${invoice.notes ? `
        <div style="background: #fef3c7; border: 2px solid #fbbf24; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
          <h4 style="color: #92400e; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 15px;">📝 Notes:</h4>
          <p style="color: #78350f; font-size: 15px; line-height: 1.7; white-space: pre-line;">${invoice.notes}</p>
        </div>
      ` : ''}

      <div style="text-align: center; padding-top: 30px; border-top: 3px solid #1f2937; margin-top: 30px;">
        <p style="color: #111827; font-size: 16px; font-weight: 600; margin-bottom: 8px;">Thank you for your business!</p>
        <p style="color: #6b7280; font-size: 13px;">For any queries, please contact us.</p>
      </div>
    </div>
  `
}