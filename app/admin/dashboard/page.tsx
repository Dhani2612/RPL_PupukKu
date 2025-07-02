"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Package, TrendingUp, AlertCircle, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DashboardStats {
  totalPelanggan: number
  distribusiBulanIni: number
  pendingApproval: number
  efisiensiDistribusi: number
}

export default function AdminDashboard() {
  const [userName, setUserName] = useState("")
  const [stats, setStats] = useState<DashboardStats>({
    totalPelanggan: 0,
    distribusiBulanIni: 0,
    pendingApproval: 0,
    efisiensiDistribusi: 0,
  })
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const role = localStorage.getItem("userRole")
    const name = localStorage.getItem("userName")

    if (role !== "distributor") {
      router.push("/login")
      return
    }

    setUserName(name || "Administrator")
  }, [router])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total customers
        const customersRes = await fetch('/api/pelanggan')
        if (!customersRes.ok) throw new Error('Failed to fetch customers')
        const customers = await customersRes.json()

        // Fetch distributions for current month
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
        
        const distribusiRes = await fetch(
          `/api/distribusi?startDate=${startOfMonth}&endDate=${endOfMonth}`
        )
        if (!distribusiRes.ok) throw new Error('Failed to fetch distributions')
        const distribusi = await distribusiRes.json()

        // Fetch pending distributions
        const pendingRes = await fetch('/api/distribusi?status=pending')
        if (!pendingRes.ok) throw new Error('Failed to fetch pending distributions')
        const pending = await pendingRes.json()

        // Calculate efficiency (approved distributions / total distributions) * 100
        const allDistribusiRes = await fetch('/api/distribusi')
        if (!allDistribusiRes.ok) throw new Error('Failed to fetch all distributions')
        const allDistribusi = await allDistribusiRes.json()
        const approvedDistribusi = allDistribusi.filter((d: any) => d.status_acc === 'approved')
        const efisiensi = allDistribusi.length > 0 
          ? (approvedDistribusi.length / allDistribusi.length) * 100 
          : 100

        setStats({
          totalPelanggan: customers.length,
          distribusiBulanIni: distribusi.length,
          pendingApproval: pending.length,
          efisiensiDistribusi: Math.round(efisiensi),
        })
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        toast({
          title: "Error",
          description: "Failed to fetch dashboard statistics",
          variant: "destructive",
        })
      }
    }

    fetchStats()
  }, [toast])

  const statsCards = [
    {
      title: "Total Pelanggan",
      value: stats.totalPelanggan.toString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      link: "/admin/data-pelanggan"
    },
    {
      title: "Distribusi Bulan Ini",
      value: stats.distribusiBulanIni.toString(),
      icon: Package,
      color: "text-green-600",
      bgColor: "bg-green-50",
      link: "/admin/distribusi-pupuk"
    },
    {
      title: "Pending Approval",
      value: stats.pendingApproval.toString(),
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      link: "/admin/distribusi-pupuk"
    },
    {
      title: "Efisiensi Distribusi",
      value: `${stats.efisiensiDistribusi}%`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      link: "/admin/distribusi-pupuk"
    },
  ]

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-green-400 to-green-600 p-8 text-white">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">
              HALO, <span className="text-green-100">{userName}</span>!
            </h1>
            <p className="text-xl text-green-100">SELAMAT DATANG DI PUPUK KU</p>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-green-500/50 to-transparent" />
          <div className="absolute -right-8 top-1/2 -translate-y-1/2 text-9xl opacity-20">
            👨‍🌾
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => (
            <Card 
              key={index} 
              className="hover-scale card-shadow cursor-pointer"
              onClick={() => router.push(stat.link)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-full ${stat.bgColor} p-2`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Agricultural Images */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover-scale overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-green-400 to-green-600 p-6 flex flex-col justify-center items-center text-white">
              <span className="text-4xl mb-2">🚜</span>
              <h3 className="text-lg font-semibold">Distribusi Efisien</h3>
            </div>
          </Card>
          <Card className="hover-scale overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-blue-400 to-blue-600 p-6 flex flex-col justify-center items-center text-white">
              <span className="text-4xl mb-2">🌱</span>
              <h3 className="text-lg font-semibold">Pertanian Modern</h3>
            </div>
          </Card>
          <Card className="hover-scale overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-yellow-400 to-yellow-600 p-6 flex flex-col justify-center items-center text-white">
              <span className="text-4xl mb-2">🌾</span>
              <h3 className="text-lg font-semibold">Hasil Berkualitas</h3>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
