"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client"; // uses createBrowserClient
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CustomerFormProps {
  initialData?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
  };
}

export function CustomerForm({ initialData }: CustomerFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    address: initialData?.address || "",
    city: initialData?.city || "",
    state: initialData?.state || "",
    zip_code: initialData?.zip_code || "",
    country: initialData?.country || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createClient(); // ✅ uses your new client.ts
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("User not authenticated");

      if (initialData) {
        // Update customer
        const { error } = await supabase
          .from("customers")
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq("id", initialData.id);

        if (error) throw error;

        toast({ title: "Customer updated", description: "Customer info updated." });
      } else {
        // Create new customer
        const { error } = await supabase.from("customers").insert({
          ...formData,
          user_id: user.id,
        });

        if (error) throw error;

        toast({ title: "Customer created", description: "New customer added." });
      }

      router.push("/dashboard/customers");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err.message || "Failed to save customer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto mt-10">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Customer" : "Add Customer"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Customer Name *</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="Name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="Email" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" name="address" value={formData.address} onChange={handleChange} rows={2} placeholder="Street address" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input id="city" name="city" value={formData.city} onChange={handleChange} placeholder="City" />
            <Input id="state" name="state" value={formData.state} onChange={handleChange} placeholder="State" />
            <Input id="zip_code" name="zip_code" value={formData.zip_code} onChange={handleChange} placeholder="ZIP" />
          </div>

          <Input id="country" name="country" value={formData.country} onChange={handleChange} placeholder="Country" />

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Update" : "Create"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard/customers")}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
