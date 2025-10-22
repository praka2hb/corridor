import { InvestmentPreferences } from "@/components/investment-preferences"

export default function InvestmentsPage() {
  // In a real app, you would get employeeId from session/auth
  const demoEmployeeId = "demo-employee"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Investment Management</h1>
          <p className="text-slate-600 mt-2">
            Deposit crypto assets into Kamino Lend to earn competitive yields
          </p>
        </div>

        <InvestmentPreferences employeeId={demoEmployeeId} />
      </main>
    </div>
  )
}

