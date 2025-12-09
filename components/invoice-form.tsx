"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Save, ArrowLeft, Plus, Trash2 } from "lucide-react"
import Link from "next/link"

interface Product {
  id: string
  name: string
  price: number
}

interface Customer {
  id: string
  name: string
  email: string | null
}

interface InvoiceItem {
  id: string
  product_id: string | null
  description: string
  quantity: number
  unit_price: number
  discount_percentage: number
  line_total: number
}

interface InvoiceFormProps {
  products: Product[]
  customers: Customer[]
  initialData?: any
  isEditing?: boolean
}

export function InvoiceForm({ products, customers, initialData, isEditing = false }: InvoiceFormProps) {
  const [formData, setFormData] = useState({
    customer_id: initialData?.customer_id || "",
    invoice_date: initialData?.invoice_date || new Date().toISOString().split("T")[0],
    due_date: initialData?.due_date || "",
    notes: initialData?.notes || "",
    tax_amount: initialData?.tax_amount?.toString() || "0",
    discount_amount: initialData?.discount_amount?.toString() || "0",
  })

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: crypto.randomUUID(),
      product_id: null,
      description: "",
      quantity: 1,
      unit_price: 0,
      discount_percentage: 0,
      line_total: 0,
    },
  ])

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Load initial data when editing
  useEffect(() => {
    if (isEditing && initialData?.invoice_items) {
      const loadedItems = initialData.invoice_items.map((item: any) => ({
        id: crypto.randomUUID(),
        product_id: item.product_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        discount_percentage: Number(item.discount_percentage),
        line_total: Number(item.line_total),
      }))
      setItems(loadedItems)
    }
  }, [isEditing, initialData])

  const calculateLineTotal = (item: InvoiceItem) => {
    const subtotal = item.quantity * item.unit_price
    const discountAmount = (subtotal * item.discount_percentage) / 100
    return subtotal - discountAmount
  }

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + calculateLineTotal(item), 0)
    const taxAmount = Number.parseFloat(formData.tax_amount) || 0
    const discountAmount = Number.parseFloat(formData.discount_amount) || 0
    const total = subtotal + taxAmount - discountAmount
    return { subtotal, total }
  }

  const addItem = () => {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        product_id: null,
        description: "",
        quantity: 1,
        unit_price: 0,
        discount_percentage: 0,
        line_total: 0,
      },
    ])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }
          updatedItem.line_total = calculateLineTotal(updatedItem)
          return updatedItem
        }
        return item
      }),
    )
  }

  const handleProductSelect = (itemId: string, productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (product) {
      updateItem(itemId, "product_id", productId)
      updateItem(itemId, "description", product.name)
      updateItem(itemId, "unit_price", product.price)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError("User not authenticated")
      setIsLoading(false)
      return
    }

    try {
      const { subtotal, total } = calculateTotals()

      if (isEditing && initialData?.id) {
        // UPDATE existing invoice
        const invoiceData = {
          customer_id: formData.customer_id || null,
          invoice_date: formData.invoice_date,
          due_date: formData.due_date || null,
          subtotal,
          tax_amount: Number.parseFloat(formData.tax_amount) || 0,
          discount_amount: Number.parseFloat(formData.discount_amount) || 0,
          total_amount: total,
          notes: formData.notes || null,
          updated_at: new Date().toISOString(),
        }

        const { error: invoiceError } = await supabase
          .from("invoices")
          .update(invoiceData)
          .eq("id", initialData.id)

        if (invoiceError) throw invoiceError

        // Delete old items and insert new ones
        await supabase.from("invoice_items").delete().eq("invoice_id", initialData.id)

        const itemsData = items
          .filter((item) => item.description.trim())
          .map((item) => ({
            invoice_id: initialData.id,
            product_id: item.product_id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_percentage: item.discount_percentage,
            line_total: calculateLineTotal(item),
          }))

        if (itemsData.length > 0) {
          const { error: itemsError } = await supabase.from("invoice_items").insert(itemsData)
          if (itemsError) throw itemsError
        }

        router.push(`/dashboard/invoices/${initialData.id}`)
      } else {
        // CREATE new invoice
        const { data: existingInvoices } = await supabase
          .from("invoices")
          .select("invoice_number")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)

        let invoiceNumber = "INV-" + new Date().getFullYear() + "-0001"

        if (existingInvoices && existingInvoices.length > 0) {
          const lastNumber = existingInvoices[0].invoice_number
          const numberPart = Number.parseInt(lastNumber.split("-")[2]) || 0
          const newNumber = (numberPart + 1).toString().padStart(4, "0")
          invoiceNumber = `INV-${new Date().getFullYear()}-${newNumber}`
        }

        const invoiceData = {
          user_id: user.id,
          customer_id: formData.customer_id || null,
          invoice_number: invoiceNumber,
          invoice_date: formData.invoice_date,
          due_date: formData.due_date || null,
          subtotal,
          tax_amount: Number.parseFloat(formData.tax_amount) || 0,
          discount_amount: Number.parseFloat(formData.discount_amount) || 0,
          total_amount: total,
          notes: formData.notes || null,
          qr_code_data: `${window.location.origin}/invoice/${invoiceNumber}`,
          status: "draft",
        }

        const { data: invoice, error: invoiceError } = await supabase
          .from("invoices")
          .insert(invoiceData)
          .select()
          .single()

        if (invoiceError) throw invoiceError

        const itemsData = items
          .filter((item) => item.description.trim())
          .map((item) => ({
            invoice_id: invoice.id,
            product_id: item.product_id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_percentage: item.discount_percentage,
            line_total: calculateLineTotal(item),
          }))

        if (itemsData.length > 0) {
          const { error: itemsError } = await supabase.from("invoice_items").insert(itemsData)
          if (itemsError) throw itemsError
        }

        router.push(`/dashboard/invoices/${invoice.id}`)
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const { subtotal, total } = calculateTotals()

  return (
    <div className="flex justify-center items-start min-h-screen p-4">
      <div className="w-full max-w-6xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/invoices">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Link>
          </Button>
        </div>

        <div className="space-y-6">
          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {isEditing ? "Edit Invoice" : "Invoice Details"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_id">Customer</Label>
                  <Select
                    value={formData.customer_id}
                    onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice_date">Invoice Date</Label>
                  <Input
                    id="invoice_date"
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Invoice Items</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product/Description</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit Price (₹)</TableHead>
                    <TableHead>Discount %</TableHead>
                    <TableHead>Total (₹)</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="space-y-2">
                        <Select
                          value={item.product_id || ""}
                          onValueChange={(value) => handleProductSelect(item.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} - ₹{product.price}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(item.id, "description", e.target.value)}
                          placeholder="Item description"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, "quantity", Number.parseInt(e.target.value) || 1)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) => updateItem(item.id, "unit_price", Number.parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount_percentage}
                          onChange={(e) =>
                            updateItem(item.id, "discount_percentage", Number.parseFloat(e.target.value) || 0)
                          }
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell className="font-medium">₹{calculateLineTotal(item).toFixed(2)}</TableCell>
                      <TableCell>
                        {items.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Totals and Notes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes or terms..."
                  rows={4}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Invoice Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <Label htmlFor="tax_amount">Tax (₹):</Label>
                  <Input
                    id="tax_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.tax_amount}
                    onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
                    className="w-24 text-right"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <Label htmlFor="discount_amount">Discount (₹):</Label>
                  <Input
                    id="discount_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discount_amount}
                    onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                    className="w-24 text-right"
                  />
                </div>

                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/invoices">Cancel</Link>
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Invoice" : "Create Invoice")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}