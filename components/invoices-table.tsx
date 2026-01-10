// components/invoices-table.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { MoreHorizontal, Eye, Edit, Trash2, Download, Calendar, DollarSign, AlertTriangle } from "lucide-react"
import { toast } from "sonner" // Optional: for better notifications

interface Invoice {
  id: string
  invoice_number: string
  invoice_date: string
  due_date: string | null
  total_amount: number
  status: string
  customers: {
    name: string
    email: string | null
  } | null
  created_at: string
}

interface InvoicesTableProps {
  invoices: Invoice[]
}

export function InvoicesTable({ invoices }: InvoicesTableProps) {
  const [deleteInvoice, setDeleteInvoice] = useState<Invoice | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!deleteInvoice) return

    setIsDeleting(true)
    const supabase = createClient()

    try {
      // First delete invoice items (child records)
      const { error: itemsError } = await supabase
        .from("invoice_items")
        .delete()
        .eq("invoice_id", deleteInvoice.id)

      if (itemsError) {
        console.error("Error deleting invoice items:", itemsError)
        throw new Error("Failed to delete invoice items")
      }

      // Then delete the invoice (parent record)
      const { error: invoiceError } = await supabase
        .from("invoices")
        .delete()
        .eq("id", deleteInvoice.id)

      if (invoiceError) {
        console.error("Error deleting invoice:", invoiceError)
        throw new Error("Failed to delete invoice")
      }

      // Success notification (optional - requires sonner package)
      // toast.success(`Invoice ${deleteInvoice.invoice_number} deleted successfully`)
      
      // Show success alert
      alert(`Invoice ${deleteInvoice.invoice_number} has been deleted successfully`)
      
      setDeleteInvoice(null)
      
      // Refresh the page to show updated invoice list
      router.refresh()
    } catch (error) {
      console.error("Error deleting invoice:", error)
      
      // Error notification (optional - requires sonner package)
      // toast.error("Failed to delete invoice. Please try again.")
      
      alert(`Failed to delete invoice: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDownloadPDF = (e: React.MouseEvent, invoiceId: string) => {
    e.stopPropagation()
    router.push(`/dashboard/invoices/${invoiceId}`)
  }

  const handleView = (e: React.MouseEvent, invoiceId: string) => {
    e.stopPropagation()
    router.push(`/dashboard/invoices/${invoiceId}`)
  }

  const handleEdit = (e: React.MouseEvent, invoiceId: string) => {
    e.stopPropagation()
    router.push(`/dashboard/invoices/${invoiceId}/edit`)
  }

  const handleDeleteClick = (e: React.MouseEvent, invoice: Invoice) => {
    e.stopPropagation()
    setDeleteInvoice(invoice)
  }

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

  if (invoices.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-2">No invoices found</p>
          <p className="text-gray-400 text-sm">Create your first invoice to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center items-start min-h-screen p-4">
      <div className="w-full max-w-7xl">
        {/* Desktop Table */}
        <div className="hidden md:block">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow 
                      key={invoice.id} 
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}
                    >
                      <TableCell>
                        <div className="font-medium text-gray-900">{invoice.invoice_number}</div>
                      </TableCell>
                      <TableCell>
                        {invoice.customers ? (
                          <div>
                            <div className="font-medium text-gray-900">{invoice.customers.name}</div>
                            {invoice.customers.email && (
                              <div className="text-sm text-gray-600">{invoice.customers.email}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">No customer</span>
                        )}
                      </TableCell>
                      <TableCell>{new Date(invoice.invoice_date).toLocaleDateString()}</TableCell>
                      <TableCell>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "—"}</TableCell>
                      <TableCell className="font-medium">₹{Number(invoice.total_amount).toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuItem onClick={(e) => handleView(e, invoice.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleEdit(e, invoice.id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleDownloadPDF(e, invoice.id)}>
                              <Download className="mr-2 h-4 w-4" />
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => handleDeleteClick(e, invoice)}
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {invoices.map((invoice) => (
            <Card 
              key={invoice.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-medium text-gray-900 text-lg">{invoice.invoice_number}</div>
                    {invoice.customers && <div className="text-sm text-gray-600 mt-1">{invoice.customers.name}</div>}
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {getStatusBadge(invoice.status)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuItem onClick={(e) => handleView(e, invoice.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleEdit(e, invoice.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleDownloadPDF(e, invoice.id)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => handleDeleteClick(e, invoice)}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-3 w-3" />
                    <span>Date: {new Date(invoice.invoice_date).toLocaleDateString()}</span>
                  </div>
                  {invoice.due_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-3 w-3" />
                      <span>Due: {new Date(invoice.due_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <DollarSign className="h-3 w-3" />
                    <span>₹{Number(invoice.total_amount).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteInvoice} onOpenChange={() => setDeleteInvoice(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="pt-3">
                Are you sure you want to delete invoice <strong>"{deleteInvoice?.invoice_number}"</strong>?
                <br />
                <br />
                This action cannot be undone and will permanently delete:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>The invoice record</li>
                  <li>All associated invoice items</li>
                  <li>Invoice history and data</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete} 
                disabled={isDeleting} 
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {isDeleting ? (
                  <>
                    <span className="mr-2">Deleting...</span>
                    <span className="animate-spin">⏳</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Invoice
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}