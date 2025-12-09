// app/api/invoices/[id]/download/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Fetch complete invoice data
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customers (*),
        invoice_items (*)
      `)
      .eq('id', params.id)
      .single()

    if (error || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Fetch business profile
    const { data: businessProfile } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('id', invoice.user_id)
      .single()

    // Generate HTML for the invoice
    const html = generateInvoiceHTML(invoice, businessProfile)

    // Return HTML that auto-downloads PDF using client-side generation
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}

function generateInvoiceHTML(invoice: any, businessProfile: any) {
  const getStatusBadge = (status: string) => {
    const badges: any = {
      paid: { bg: '#dcfce7', color: '#166534', text: 'Paid' },
      sent: { bg: '#dbeafe', color: '#1e40af', text: 'Sent' },
      overdue: { bg: '#fee2e2', color: '#991b1b', text: 'Overdue' },
      cancelled: { bg: '#f3f4f6', color: '#374151', text: 'Cancelled' },
    }
    const badge = badges[status] || { bg: '#f3f4f6', color: '#4b5563', text: 'Draft' }
    return `<span style="background-color: ${badge.bg}; color: ${badge.color}; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500;">${badge.text}</span>`
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Downloading ${invoice.invoice_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .loading-container {
      background: white;
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      text-align: center;
      max-width: 500px;
      width: 100%;
    }
    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      width: 60px;
      height: 60px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    h1 { color: #333; font-size: 24px; margin-bottom: 15px; }
    p { color: #666; margin-bottom: 10px; line-height: 1.6; }
    .success { color: #10b981; font-weight: 600; display: none; font-size: 18px; }
    .error { color: #ef4444; display: none; }
    .btn {
      display: inline-block;
      margin-top: 20px;
      padding: 12px 24px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      transition: all 0.2s;
    }
    .btn:hover { background: #5568d3; transform: translateY(-2px); }
    #invoice-content { position: absolute; left: -9999px; width: 800px; background: white; padding: 60px; }
  </style>
</head>
<body>
  <div class="loading-container">
    <div class="spinner" id="spinner"></div>
    <h1 id="title">Generating Your Invoice PDF</h1>
    <p id="message">Please wait a moment while we prepare your document...</p>
    <p class="success" id="success">✓ PDF Downloaded Successfully!</p>
    <p class="error" id="error">Failed to generate PDF. Please try again.</p>
    <a href="/dashboard/invoices/${invoice.id}" class="btn" id="backBtn" style="display:none;">Back to Invoice</a>
  </div>

  <div id="invoice-content">
    <div style="border-bottom: 3px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px;">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div style="flex: 1;">
          ${businessProfile ? `
            <h2 style="font-size: 28px; font-weight: bold; margin-bottom: 15px; color: #111827;">${businessProfile.business_name}</h2>
            <div style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              ${businessProfile.business_address ? `<p>${businessProfile.business_address.replace(/\n/g, '<br>')}</p>` : ''}
              ${businessProfile.phone ? `<p>📞 ${businessProfile.phone}</p>` : ''}
              ${businessProfile.email ? `<p>✉️ ${businessProfile.email}</p>` : ''}
              ${businessProfile.gst_number ? `<p style="margin-top: 10px;"><strong>GST:</strong> ${businessProfile.gst_number}</p>` : ''}
            </div>
          ` : `
            <h2 style="font-size: 28px; font-weight: bold; color: #111827;">Your Business</h2>
          `}
        </div>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; min-width: 200px; text-align: right;">
          <h3 style="font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #111827;">INVOICE</h3>
          <p style="font-size: 18px; font-weight: 500; margin-bottom: 15px; color: #6b7280;">${invoice.invoice_number}</p>
          ${getStatusBadge(invoice.status)}
        </div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px;">
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
        <h4 style="color: #6b7280; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 15px;">Bill To:</h4>
        ${invoice.customers ? `
          <p style="font-weight: bold; font-size: 18px; margin-bottom: 5px; color: #111827;">${invoice.customers.name}</p>
          ${invoice.customers.email ? `<p style="color: #6b7280; font-size: 14px;">✉️ ${invoice.customers.email}</p>` : ''}
        ` : `<p style="color: #9ca3af;">No customer selected</p>`}
      </div>
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
        <div style="font-size: 14px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: #6b7280; font-weight: 600;">Invoice Date:</span>
            <span style="color: #111827; font-weight: 500;">${new Date(invoice.invoice_date).toLocaleDateString()}</span>
          </div>
          ${invoice.due_date ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #6b7280; font-weight: 600;">Due Date:</span>
              <span style="color: #111827; font-weight: 500;">${new Date(invoice.due_date).toLocaleDateString()}</span>
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
        ${invoice.invoice_items.map((item: any, index: number) => `
          <tr style="border-bottom: 1px solid #e5e7eb; background: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'};">
            <td style="padding: 16px; color: #111827; font-size: 15px;">${item.description}</td>
            <td style="padding: 16px; color: #111827; font-size: 15px; font-weight: 600; text-align: center;">${item.quantity}</td>
            <td style="padding: 16px; color: #111827; font-size: 15px; text-align: right;">₹${Number(item.unit_price).toFixed(2)}</td>
            <td style="padding: 16px; color: ${item.discount_percentage > 0 ? '#dc2626' : '#111827'}; font-size: 15px; font-weight: ${item.discount_percentage > 0 ? '600' : '400'}; text-align: center;">
              ${item.discount_percentage > 0 ? `-${item.discount_percentage}%` : '0%'}
            </td>
            <td style="padding: 16px; color: #111827; font-size: 16px; font-weight: bold; text-align: right;">₹${Number(item.line_total).toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
      <div style="width: 380px; background: #f9fafb; padding: 24px; border-radius: 12px; border: 2px solid #e5e7eb;">
        <div style="margin-bottom: 15px; padding-bottom: 10px; display: flex; justify-content: space-between; font-size: 16px;">
          <span style="color: #6b7280; font-weight: 600;">Subtotal:</span>
          <span style="color: #111827; font-weight: 600;">₹${Number(invoice.subtotal).toFixed(2)}</span>
        </div>
        ${Number(invoice.tax_amount) > 0 ? `
          <div style="margin-bottom: 15px; padding-bottom: 10px; display: flex; justify-content: space-between; font-size: 16px;">
            <span style="color: #6b7280; font-weight: 600;">Tax:</span>
            <span style="color: #111827; font-weight: 600;">₹${Number(invoice.tax_amount).toFixed(2)}</span>
          </div>
        ` : ''}
        ${Number(invoice.discount_amount) > 0 ? `
          <div style="margin-bottom: 15px; padding-bottom: 10px; display: flex; justify-content: space-between; font-size: 16px;">
            <span style="color: #6b7280; font-weight: 600;">Discount:</span>
            <span style="color: #dc2626; font-weight: 600;">-₹${Number(invoice.discount_amount).toFixed(2)}</span>
          </div>
        ` : ''}
        <div style="border-top: 2px solid #d1d5db; margin: 16px 0; padding-top: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 22px; font-weight: bold;">
            <span style="color: #111827;">Total Amount:</span>
            <span style="color: #059669; background: #d1fae5; padding: 8px 16px; border-radius: 8px;">₹${Number(invoice.total_amount).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>

    ${invoice.notes ? `
      <div style="background: #fef3c7; border: 2px solid #fbbf24; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
        <h4 style="color: #92400e; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 15px;">📝 Additional Notes:</h4>
        <p style="color: #78350f; font-size: 15px; line-height: 1.7; white-space: pre-line;">${invoice.notes}</p>
      </div>
    ` : ''}

    <div style="text-align: center; padding-top: 30px; border-top: 3px solid #1f2937; margin-top: 30px;">
      <p style="color: #111827; font-size: 16px; font-weight: 600; margin-bottom: 8px;">Thank you for your business!</p>
      <p style="color: #6b7280; font-size: 13px;">For any queries regarding this invoice, please contact us.</p>
    </div>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  
  <script>
    window.addEventListener('load', async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const element = document.getElementById('invoice-content')
        const canvas = await html2canvas(element, {
          scale: 2.5,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        })
        
        const imgData = canvas.toDataURL('image/png', 1.0)
        const { jsPDF } = window.jspdf
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
        
        pdf.addImage(imgData, 'PNG', xOffset, yOffset, scaledWidth, scaledHeight)
        pdf.save('${invoice.invoice_number}.pdf')
        
        document.getElementById('spinner').style.display = 'none'
        document.getElementById('title').textContent = 'Download Complete!'
        document.getElementById('message').style.display = 'none'
        document.getElementById('success').style.display = 'block'
        document.getElementById('backBtn').style.display = 'inline-block'
        
      } catch (error) {
        console.error('PDF generation error:', error)
        document.getElementById('spinner').style.display = 'none'
        document.getElementById('title').textContent = 'Download Failed'
        document.getElementById('message').style.display = 'none'
        document.getElementById('error').style.display = 'block'
        document.getElementById('error').textContent = 'Failed to generate PDF: ' + error.message
        document.getElementById('backBtn').style.display = 'inline-block'
      }
    })
  </script>
</body>
</html>`
}