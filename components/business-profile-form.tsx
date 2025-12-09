"use client"

import type React from "react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Building, Save } from "lucide-react"

interface BusinessProfile {
  id?: string
  business_name?: string
  business_address?: string
  gst_number?: string
  phone?: string
  email?: string
  logo_url?: string
}

interface BusinessProfileFormProps {
  initialData?: BusinessProfile | null
}

export function BusinessProfileForm({ initialData }: BusinessProfileFormProps) {
  const [formData, setFormData] = useState({
    business_name: initialData?.business_name || "",
    business_address: initialData?.business_address || "",
    gst_number: initialData?.gst_number || "",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    logo_url: initialData?.logo_url || "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

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
      const { error } = await supabase.from("business_profiles").upsert({
        id: user.id,
        ...formData,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="flex justify-center items-start min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name *</Label>
                  <Input
                    id="business_name"
                    name="business_name"
                    value={formData.business_name}
                    onChange={handleChange}
                    placeholder="Your Business Name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_address">Business Address</Label>
                <Textarea
                  id="business_address"
                  name="business_address"
                  value={formData.business_address}
                  onChange={handleChange}
                  placeholder="123 Business St, City, State, PIN"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Business Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="business@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gst_number">GST Number</Label>
                  <Input
                    id="gst_number"
                    name="gst_number"
                    value={formData.gst_number}
                    onChange={handleChange}
                    placeholder="GST123456789"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  name="logo_url"
                  type="url"
                  value={formData.logo_url}
                  onChange={handleChange}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

              {success && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                  Business profile updated successfully!
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={handleSubmit} disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}