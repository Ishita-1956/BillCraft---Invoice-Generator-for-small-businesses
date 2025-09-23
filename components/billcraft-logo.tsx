interface BillCraftLogoProps {
  className?: string
}

export function BillCraftLogo({ className = "" }: BillCraftLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-lg">$</span>
      </div>
      <span className="text-2xl font-bold text-gray-900">BillCraft</span>
    </div>
  )
}
