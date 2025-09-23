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
} from "recharts"
import { DollarSign, FileText, TrendingUp, TrendingDown, Package, Calendar, Target } from "lucide-react"

interface AnalyticsDashboardProps {
  invoices: any[]
  products: any[]
  recentInvoices: any[]
  invoiceItems: any[]
}

export function AnalyticsDashboard({ invoices, products, recentInvoices, invoiceItems }: AnalyticsDashboardProps) {
  // Calculate key metrics
  const totalRevenue = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + Number(inv.total_amount), 0)

  const totalInvoices = invoices.length
  const paidInvoices = invoices.filter((inv) => inv.status === "paid").length
  const pendingInvoices = invoices.filter((inv) => inv.status === "sent").length
  const overdueInvoices = invoices.filter((inv) => inv.status === "overdue").length

  const averageInvoiceValue = totalInvoices > 0 ? totalRevenue / paidInvoices : 0

  // Monthly revenue data
  const monthlyData = recentInvoices
    .reduce((acc: any[], invoice) => {
      const month = new Date(invoice.created_at).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })

      const existing = acc.find((item) => item.month === month)
      if (existing) {
        existing.revenue += Number(invoice.total_amount)
        existing.invoices += 1
      } else {
        acc.push({
          month,
          revenue: Number(invoice.total_amount),
          invoices: 1,
        })
      }
      return acc
    }, [])
    .slice(-6)
    .reverse()

  // Invoice status distribution
  const statusData = [
    { name: "Paid", value: paidInvoices, color: "#10B981" },
    { name: "Sent", value: pendingInvoices, color: "#3B82F6" },
    { name: "Overdue", value: overdueInvoices, color: "#EF4444" },
    { name: "Draft", value: invoices.filter((inv) => inv.status === "draft").length, color: "#6B7280" },
  ].filter((item) => item.value > 0)

  // Top products by revenue
  const productRevenue = invoiceItems.reduce((acc: any, item) => {
    const productName = item.description || "Unknown Product"
    if (!acc[productName]) {
      acc[productName] = 0
    }
    acc[productName] += Number(item.line_total)
    return acc
  }, {})

  const topProducts = Object.entries(productRevenue)
    .map(([name, revenue]) => ({ name, revenue: Number(revenue) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Growth calculation (comparing last 30 days to previous 30 days)
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  const recentRevenue = invoices
    .filter((inv) => new Date(inv.created_at) >= thirtyDaysAgo && inv.status === "paid")
    .reduce((sum, inv) => sum + Number(inv.total_amount), 0)

  const previousRevenue = invoices
    .filter(
      (inv) =>
        new Date(inv.created_at) >= sixtyDaysAgo && new Date(inv.created_at) < thirtyDaysAgo && inv.status === "paid",
    )
    .reduce((sum, inv) => sum + Number(inv.total_amount), 0)

  const growthRate = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0

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
            <div className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</div>
            <div className="flex items-center mt-1">
              {growthRate >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
              )}
              <p className={`text-xs ${growthRate >= 0 ? "text-green-600" : "text-red-600"}`}>
                {Math.abs(growthRate).toFixed(1)}% from last month
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
              {paidInvoices} paid, {pendingInvoices} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Invoice Value</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">${averageInvoiceValue.toFixed(2)}</div>
            <p className="text-xs text-gray-600 mt-1">Per paid invoice</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Products</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{products.length}</div>
            <p className="text-xs text-gray-600 mt-1">Active products</p>
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
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
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
            <ResponsiveContainer width="100%" height={300}>
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
              <BarChart data={topProducts} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Revenue"]} />
                <Bar dataKey="revenue" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No product data available yet.</p>
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
              {recentInvoices.slice(0, 10).map((invoice, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">${Number(invoice.total_amount).toFixed(2)}</p>
                      <p className="text-xs text-gray-600">{new Date(invoice.created_at).toLocaleDateString()}</p>
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
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No recent invoices to display.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
