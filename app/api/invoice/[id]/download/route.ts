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

    // Generate HTML that auto-downloads PDF immediately
    const html = generateAutoDownloadHTML(invoice, businessProfile)

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}

function generateAutoDownloadHTML(invoice: any, businessProfile: any) {
  const invoiceHTML = generateInvoiceContent(invoice, businessProfile)
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Downloading ${invoice.invoice_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      padding: 48px 32px;
      border-radius: 24px;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.4);
      text-align: center;
      max-width: 480px;
      width: 100%;
      animation: slideUp 0.3s ease-out;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .spinner {
      border: 5px solid #f3f3f3;
      border-top: 5px solid #667eea;
      border-radius: 50%;
      width: 64px;
      height: 64px;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 24px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    h1 { 
      color: #1f2937; 
      font-size: 26px; 
      margin-bottom: 12px;
      font-weight: 700;
    }
    p { 
      color: #6b7280; 
      line-height: 1.6;
      font-size: 15px;
    }
    .success { 
      color: #10b981; 
      font-weight: 600; 
      display: none;
      font-size: 18px;
    }
    .error { 
      color: #ef4444; 
      display: none;
      font-size: 15px;
    }
    .btn {
      display: inline-block;
      margin-top: 24px;
      padding: 14px 28px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 15px;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    .btn:hover { 
      background: #5568d3; 
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
    }
    .btn:active { transform: translateY(0); }
    #invoice-content { 
      position: absolute; 
      left: -99999px; 
      width: 800px; 
      background: white; 
      padding: 60px;
    }
    .progress {
      width: 100%;
      height: 4px;
      background: #e5e7eb;
      border-radius: 2px;
      margin: 20px 0;
      overflow: hidden;
    }
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      width: 0%;
      transition: width 0.3s ease;
      animation: progress 2s ease-in-out;
    }
    @keyframes progress {
      0% { width: 0%; }
      50% { width: 70%; }
      100% { width: 100%; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner" id="spinner"></div>
    <h1 id="title">Preparing Your PDF</h1>
    <div class="progress"><div class="progress-bar"></div></div>
    <p id="message">Generating invoice ${invoice.invoice_number}...</p>
    <p class="success" id="success">✓ Download Started!</p>
    <p class="error" id="error">Download failed. Try manual download.</p>
    <a href="/dashboard/invoices/${invoice.id}" class="btn" id="backBtn" style="display:none;">View Invoice</a>
  </div>

  <div id="invoice-content">${invoiceHTML}</div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  
  <script>
    (async function() {
      try {
        await new Promise(r => setTimeout(r, 800));
        
        const element = document.getElementById('invoice-content');
        if (!element) throw new Error('Content not found');
        
        const canvas = await html2canvas(element, {
          scale: 2.5,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: 800,
          windowHeight: element.scrollHeight
        });
        
        const imgData = canvas.toDataURL('image/png', 1.0);
        const { jsPDF } = window.jspdf;
        
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: true
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        
        const margin = 8;
        const availableWidth = pdfWidth - (margin * 2);
        const availableHeight = pdfHeight - (margin * 2);
        
        const ratio = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
        const scaledWidth = imgWidth * ratio;
        const scaledHeight = imgHeight * ratio;
        const xOffset = (pdfWidth - scaledWidth) / 2;
        
        pdf.addImage(imgData, 'PNG', xOffset, margin, scaledWidth, scaledHeight);
        
        // FORCE DOWNLOAD
        const pdfBlob = pdf.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = '${invoice.invoice_number}.pdf';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          URL.revokeObjectURL(url);
          document.body.removeChild(link);
        }, 100);
        
        document.getElementById('spinner').style.display = 'none';
        document.getElementById('title').textContent = 'Download Started!';
        document.getElementById('message').style.display = 'none';
        document.getElementById('success').style.display = 'block';
        document.getElementById('backBtn').style.display = 'inline-block';
        
        setTimeout(() => {
          window.location.href = '/dashboard/invoices/${invoice.id}';
        }, 3000);
        
      } catch (error) {
        console.error('PDF Error:', error);
        document.getElementById('spinner').style.display = 'none';
        document.getElementById('title').textContent = 'Download Failed';
        document.getElementById('message').style.display = 'none';
        document.getElementById('error').style.display = 'block';
        document.getElementById('backBtn').style.display = 'inline-block';
      }
    })();
  </script>
</body>
</html>`
}

function generateInvoiceContent(invoice: any, businessProfile: any) {
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
  
  const invoiceDate = new Date(invoice.invoice_date).toLocaleDateString()
  const dueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : ''
  
  const itemsHTML = invoice.invoice_items.map((item: any, index: number) => `
    <tr style="border-bottom: 1px solid #e5e7eb; background: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'};">
      <td style="padding: 16px; color: #111827; font-size: 15px;">${item.description}</td>
      <td style="padding: 16px; color: #111827; font-size: 15px; font-weight: 600; text-align: center;">${item.quantity}</td>
      <td style="padding: 16px; color: #111827; font-size: 15px; text-align: right;">₹${Number(item.unit_price).toFixed(2)}</td>
      <td style="padding: 16px; color: ${item.discount_percentage > 0 ? '#dc2626' : '#111827'}; font-size: 15px; font-weight: ${item.discount_percentage > 0 ? '600' : '400'}; text-align: center;">
        ${item.discount_percentage > 0 ? `-${item.discount_percentage}%` : '0%'}
      </td>
      <td style="padding: 16px; color: #111827; font-size: 16px; font-weight: bold; text-align: right;">₹${Number(item.line_total).toFixed(2)}</td>
    </tr>
  `).join('')

  return `
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
          <p style="font-size: 18px; font-weight: 500; margin-bottom: 15px; color: #6b7280;">${invoice.invoice_number}</p>
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
            <span style="color: #111827;">Total:</span>
            <span style="color: #059669; background: #d1fae5; padding: 8px 16px; border-radius: 8px;">₹${Number(invoice.total_amount).toFixed(2)}</span>
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
  `
}