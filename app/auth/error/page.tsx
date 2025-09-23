import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BillCraftLogo } from "@/components/billcraft-logo"
import Link from "next/link"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <BillCraftLogo className="justify-center mb-4" />
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-red-600">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            {params?.error ? (
              <p className="text-sm text-gray-600 mb-4">Error: {params.error}</p>
            ) : (
              <p className="text-sm text-gray-600 mb-4">An authentication error occurred.</p>
            )}

            <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Return to Login
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
