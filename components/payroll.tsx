"use client"

import { useState } from "react"
import Image from "next/image"
import { 
  Bell,
  Plus,
  Send,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  Download,
  FileText,
  Pause,
  StopCircle,
  Gift,
  Wallet,
  Copy,
  Users,
  ArrowLeftRight,
  DollarSign
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"


const employees = [
  { 
    id: 1, 
    name: "Sarah Adams", 
    walletAddress: "3Kp4h...9x2Lm", 
    fullWallet: "3Kp4h2V8Qz9x2LmA7B3CdE4fG5hI6jK", 
    salary: 4500, 
    status: "active",
    avatar: "SA" 
  },
  { 
    id: 2, 
    name: "Mike Chen", 
    walletAddress: "7Wx3n...4yRp8", 
    fullWallet: "7Wx3nQ2mP4yRp8V9zF6bH7iJ8kL", 
    salary: 5200, 
    status: "active",
    avatar: "MC" 
  },
  { 
    id: 3, 
    name: "Jessica Liu", 
    walletAddress: "9Zr5t...6uMv2", 
    fullWallet: "9Zr5tY7wE6uMv2S3aD4gH5jK8lN", 
    salary: 4800, 
    status: "paused",
    avatar: "JL" 
  },
  { 
    id: 4, 
    name: "Alex Rivera", 
    walletAddress: "2Bq8k...1xFw7", 
    fullWallet: "2Bq8kP5nM1xFw7C9vB2eH4iJ6kL", 
    salary: 5500, 
    status: "active",
    avatar: "AR" 
  },
  { 
    id: 5, 
    name: "Emma Thompson", 
    walletAddress: "6Lt9m...3zHj4", 
    fullWallet: "6Lt9mR4vK3zHj4X8cF7bG9iL2nP", 
    salary: 4200, 
    status: "active",
    avatar: "ET" 
  },
]

export function Payroll() {
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    walletAddress: "",
    salary: "",
    frequency: ""
  })

  const totalLockedFunds = employees.reduce((total, emp) => total + emp.salary, 0)

  const handleAddEmployee = () => {
    // Handle add employee logic here
    console.log("Adding employee:", newEmployee)
    // Reset form
    setNewEmployee({ name: "", walletAddress: "", salary: "", frequency: "" })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Could add toast notification here
  }

  return (
    <div className="space-y-8">
          {/* Payroll Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900">Payroll Management</h2>
            <p className="text-slate-600 mt-1">Manage your team's streaming payments and USDC payroll.</p>
          </div>

          {/* Payroll Overview Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-900">Payroll Overview</h3>
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-slate-50/80 rounded-xl p-6">
                <div className="text-3xl font-bold text-slate-900 mb-2">${totalLockedFunds.toLocaleString()}</div>
                <div className="text-sm text-slate-600 mb-4">Total USDC balance locked in contract</div>
                <div className="text-xs text-green-600 flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Contract secured and active
                </div>
              </div>
              <div className="bg-slate-50/80 rounded-xl p-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">{employees.length}</div>
                <div className="text-sm text-slate-600 mb-4">Active employees on payroll</div>
                <div className="text-xs text-blue-600 flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  {employees.filter(emp => emp.status === 'active').length} currently streaming
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="neo" size="lg" className="flex-1">
                <Plus className="h-5 w-5 mr-2" />
                Fund Payroll
              </Button>
              <Button variant="neoOutline" size="lg" className="flex-1">
                <ArrowLeftRight className="h-5 w-5 mr-2" />
                Withdraw Unused Funds
              </Button>
            </div>
          </div>

          {/* Employees Table */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-900">Employees</h3>
              <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                {employees.length} total
              </Badge>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Wallet Address</TableHead>
                    <TableHead>Salary (USDC)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                              {employee.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{employee.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-slate-100 px-2 py-1 rounded">
                            {employee.walletAddress}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(employee.fullWallet)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">${employee.salary.toLocaleString()}</span>
                        <span className="text-sm text-slate-600 ml-1">/month</span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={
                            employee.status === 'active' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-amber-100 text-amber-700'
                          }
                        >
                          {employee.status === 'active' ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <Pause className="h-3 w-3 mr-1" />
                              Paused
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Pause className="h-4 w-4 text-amber-600" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <StopCircle className="h-4 w-4 text-red-600" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Gift className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Add Employee Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-900">Add Employee</h3>
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="employeeName">Employee Name</Label>
                  <Input
                    id="employeeName"
                    placeholder="Enter full name"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="walletAddress">Wallet Address</Label>
                  <Input
                    id="walletAddress"
                    placeholder="Enter Solana wallet address"
                    value={newEmployee.walletAddress}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, walletAddress: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="salaryAmount">Salary Amount (USDC)</Label>
                  <Input
                    id="salaryAmount"
                    type="number"
                    placeholder="0.00"
                    value={newEmployee.salary}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, salary: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="paymentFrequency">Payment Frequency</Label>
                  <Select
                    value={newEmployee.frequency}
                    onValueChange={(value) => setNewEmployee(prev => ({ ...prev, frequency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stream">Stream (continuous)</SelectItem>
                      <SelectItem value="milestone">Milestone (project-based)</SelectItem>
                      <SelectItem value="bonus">Bonus (one-time)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <Button 
                variant="neo" 
                size="lg" 
                onClick={handleAddEmployee}
                className="w-full md:w-auto"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Employee
              </Button>
            </div>
          </div>

          {/* Reports Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-900">Reports & Data</h3>
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50/80 rounded-xl">
                <h4 className="font-semibold text-slate-900 mb-2">Tax Reporting</h4>
                <p className="text-sm text-slate-600 mb-4">Download comprehensive tax reports for accounting and compliance.</p>
                <Button variant="neoOutline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download Tax Report
                </Button>
              </div>
              
              <div className="p-4 bg-slate-50/80 rounded-xl">
                <h4 className="font-semibold text-slate-900 mb-2">Payroll Data</h4>
                <p className="text-sm text-slate-600 mb-4">Export all payroll data in CSV format for external analysis.</p>
                <Button variant="neoOutline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Payroll Data
                </Button>
              </div>
            </div>
          </div>
    </div>
  )
}
