"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  Legend,
} from "recharts"
import { DollarSign, FileText, TrendingUp, TrendingDown, Package, Calendar, Target, Users } from "lucide-react"

interface AnalyticsDashboardProps {
  invoices: any[]
  products: any[]
  recentInvoices: any[]
  invoiceItems: any[]
}

export function AnalyticsDashboard({ invoices, products, recentInvoices, invoiceItems }: AnalyticsDashboardProps) {
  // Safely convert to number and filter invalid data
  const validInvoices = invoices.filter(inv => 
    inv && inv.total_amount != null && !isNaN(Number(inv.total_amount))
  )

  const paidInvoices = validInvoices.filter((inv) => inv.status === "paid")
  const pendingInvoices = validInvoices.filter((inv) => inv.status === "sent")
  const overdueInvoices = validInvoices.filter((inv) => inv.status === "overdue")
  const draftInvoices = validInvoices.filter((inv) => inv.status === "draft")

  // Calculate total revenue from paid invoices only
  const totalRevenue = paidInvoices.reduce((sum, inv) => {
    const amount = Number(inv.total_amount)
    return sum + (isNaN(amount) ? 0 : amount)
  }, 0)

  const totalInvoices = validInvoices.length
  const averageInvoiceValue = paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0

  // Monthly revenue data - group by month
  const monthlyDataMap = new Map<string, { revenue: number; invoices: number }>()
  
  recentInvoices.forEach((invoice) => {
    if (invoice.status === "paid" && invoice.created_at) {
      const date = new Date(invoice.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
      
      const amount = Number(invoice.total_amount)
      if (!isNaN(amount)) {
        const existing = monthlyDataMap.get(monthKey)
        if (existing) {
          existing.revenue += amount
          existing.invoices += 1
        } else {
          monthlyDataMap.set(monthKey, { revenue: amount, invoices: 1 })
        }
      }
    }
  })

  const monthlyData = Array.from(monthlyDataMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([key, data]) => {
      const [year, month] = key.split('-')
      const date = new Date(Number(year), Number(month) - 1)
      return {
        month: date.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        revenue: Math.round(data.revenue * 100) / 100,
        invoices: data.invoices,
      }
    })

  // Invoice status distribution
  const statusData = [
    { name: "Paid", value: paidInvoices.length, color: "#10B981" },
    { name: "Sent", value: pendingInvoices.length, color: "#3B82F6" },
    { name: "Overdue", value: overdueInvoices.length, color: "#EF4444" },
    { name: "Draft", value: draftInvoices.length, color: "#6B7280" },
  ].filter((item) => item.value > 0)

  // Top products by revenue
  const productRevenueMap = new Map<string, number>()
  
  invoiceItems.forEach((item) => {
    if (item && item.description && item.line_total != null) {
      const productName = item.description.trim() || "Unknown Product"
      const lineTotal = Number(item.line_total)
      if (!isNaN(lineTotal)) {
        const current = productRevenueMap.get(productName) || 0
        productRevenueMap.set(productName, current + lineTotal)
      }
    }
  })

  const topProducts = Array.from(productRevenueMap.entries())
    .map(([name, revenue]) => ({ 
      name: name.length > 30 ? name.substring(0, 30) + '...' : name, 
      revenue: Math.round(revenue * 100) / 100 
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Growth calculation (last 30 days vs previous 30 days)
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  const recentRevenue = validInvoices
    .filter((inv) => {
      const invDate = new Date(inv.created_at)
      return invDate >= thirtyDaysAgo && inv.status === "paid"
    })
    .reduce((sum, inv) => {
      const amount = Number(inv.total_amount)
      return sum + (isNaN(amount) ? 0 : amount)
    }, 0)

  const previousRevenue = validInvoices
    .filter((inv) => {
      const invDate = new Date(inv.created_at)
      return invDate >= sixtyDaysAgo && invDate < thirtyDaysAgo && inv.status === "paid"
    })
    .reduce((sum, inv) => {
      const amount = Number(inv.total_amount)
      return sum + (isNaN(amount) ? 0 : amount)
    }, 0)

  const growthRate = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0

  // Customer analytics
  const uniqueCustomers = new Set(validInvoices.map(inv => inv.customer_id).filter(Boolean)).size

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">₹{totalRevenue.toFixed(2)}</div>
            <div className="flex items-center mt-1">
              {growthRate >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
              )}
              <p className={`text-xs ${growthRate >= 0 ? "text-green-600" : "text-red-600"}`}>
                {growthRate === 0 ? "No change" : `${Math.abs(growthRate).toFixed(1)}% from last month`}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalInvoices}</div>
            <p className="text-xs text-gray-600 mt-1">
              {paidInvoices.length} paid • {pendingInvoices.length} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Invoice</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">₹{averageInvoiceValue.toFixed(2)}</div>
            <p className="text-xs text-gray-600 mt-1">Per paid invoice</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Customers</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{uniqueCustomers}</div>
            <p className="text-xs text-gray-600 mt-1">{products.length} products</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Monthly Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any, name: string) => {
                      if (name === "revenue") return [`₹${Number(value).toFixed(2)}`, "Revenue"]
                      return [value, name]
                    }} 
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.2} 
                    name="Revenue"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No revenue data available yet.</p>
                  <p className="text-sm mt-2">Create and mark invoices as paid to see trends.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {statusData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-sm text-gray-600">
                        {entry.name} ({entry.value})
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No invoices created yet.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Top Products by Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, "Revenue"]} />
                <Bar dataKey="revenue" fill="#10B981" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <div className="text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No product data available yet.</p>
                <p className="text-sm mt-2">Add items to invoices to see top products.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentInvoices.length > 0 ? (
            <div className="space-y-3">
              {recentInvoices.slice(0, 10).map((invoice, index) => {
                const amount = Number(invoice.total_amount)
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        invoice.status === 'paid' ? 'bg-green-500' :
                        invoice.status === 'sent' ? 'bg-blue-500' :
                        invoice.status === 'overdue' ? 'bg-red-500' : 'bg-gray-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {isNaN(amount) ? '₹0.00' : `₹${amount.toFixed(2)}`}
                        </p>
                        <p className="text-xs text-gray-600">
                          {invoice.invoice_number || 'N/A'} • {new Date(invoice.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={
                        invoice.status === "paid"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : invoice.status === "sent"
                            ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                            : invoice.status === "overdue"
                              ? "bg-red-100 text-red-800 hover:bg-red-100"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                      }
                    >
                      {invoice.status}
                    </Badge>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No recent invoices to display.</p>
                <p className="text-sm mt-2">Create your first invoice to get started.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}