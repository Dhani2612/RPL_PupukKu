"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import CustomerLayout from "@/components/customer-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, CheckCircle, Clock, AlertTriangle, Plus, AlertOctagon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface QuotaData {
  jenis_pupuk: string
  remaining: number
  total: number
  used: number
  unit: string
}

interface RecentActivity {
  id_transaksi: number
  jenis_pupuk: string
  jumlah: number
  tanggal: string
  status_acc: "pending" | "approved" | "rejected"
}

export default function CustomerDashboard() {
  const [userName, setUserName] = useState("")
  const [quotaData, setQuotaData] = useState<QuotaData[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [newRequest, setNewRequest] = useState({
    jenis_pupuk: "",
    jumlah: 0
  })
  const [distributorId, setDistributorId] = useState<string | null>(null)
  const [hasQuota, setHasQuota] = useState<boolean | null>(null)
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const role = localStorage.getItem("userRole")
    const name = localStorage.getItem("userName")
    const nik = localStorage.getItem("userNik")

    if (role !== 'pelanggan') {
      router.push("/login")
      return
    }

    setUserName(name || "Petani")

    if (nik) {
      checkVerificationStatus(nik)
      fetchQuota(nik)
      fetchRecentActivity(nik)
      fetchDistributorId()
    }
  }, [router])

  const checkVerificationStatus = async (nik: string) => {
    try {
      const response = await fetch(`/api/pelanggan?nik=${nik}`)
      if (!response.ok) throw new Error('Failed to fetch user data')
      const data = await response.json()
      setIsVerified(data.status_verifikasi)
    } catch (error) {
      console.error('Error checking verification status:', error)
      setIsVerified(false)
    }
  }

  const fetchDistributorId = async () => {
    try {
      const response = await fetch('/api/distributor')
      if (!response.ok) throw new Error('Failed to fetch distributor')
      const data = await response.json()
      if (data && data.length > 0) {
        setDistributorId(data[0].id_distributor)
      }
    } catch (error) {
      console.error('Error fetching distributor:', error)
      toast({
        title: "Error",
        description: "Failed to fetch distributor information",
        variant: "destructive",
      })
    }
  }

  const fetchQuota = async (nik: string) => {
    try {
      const quotaResponse = await fetch(`/api/jatah-pupuk?nik=${nik}`)
      if (!quotaResponse.ok) {
        if (quotaResponse.status === 404) {
          setHasQuota(false)
          return
        }
        throw new Error('Failed to fetch data')
      }

      const quotaData = await quotaResponse.json()
      
      if (!quotaData.quotas) {
        setHasQuota(false)
        return
      }

      setHasQuota(true)

      const distributionsResponse = await fetch(`/api/distribusi?nik=${nik}&status=approved`)
      if (!distributionsResponse.ok) {
        throw new Error('Failed to fetch distributions')
      }
      const distributions = await distributionsResponse.json()

      const usedAmounts = {
        Urea: 0,
        Phonska: 0,
        Organik: 0
      }

    distributions.forEach((dist: any) => {
      const jenis = dist.jenis_pupuk as string;
      if (jenis in usedAmounts) {
        usedAmounts[jenis as keyof typeof usedAmounts] += dist.jumlah;
      }
    });


      const quotas: QuotaData[] = [
        {
          jenis_pupuk: "Urea",
          total: quotaData.quotas.urea,
          used: usedAmounts.Urea,
          remaining: Math.max(0, quotaData.quotas.urea - usedAmounts.Urea),
          unit: "kg"
        },
        {
          jenis_pupuk: "Phonska",
          total: quotaData.quotas.phonska,
          used: usedAmounts.Phonska,
          remaining: Math.max(0, quotaData.quotas.phonska - usedAmounts.Phonska),
          unit: "kg"
        },
        {
          jenis_pupuk: "Organik",
          total: quotaData.quotas.organik,
          used: usedAmounts.Organik,
          remaining: Math.max(0, quotaData.quotas.organik - usedAmounts.Organik),
          unit: "kg"
        }
      ]

      setQuotaData(quotas)
    } catch (error) {
      console.error('Error fetching quota:', error)
      setHasQuota(false)
      toast({
        title: "Error",
        description: "Failed to fetch quota data",
        variant: "destructive",
      })
    }
  }

  const fetchRecentActivity = async (nik: string) => {
    try {
      const response = await fetch(`/api/distribusi?nik=${nik}&limit=3`)
      if (!response.ok) throw new Error('Failed to fetch activity')
      const data = await response.json()
      setRecentActivity(data)
    } catch (error) {
      console.error('Error fetching recent activity:', error)
      toast({
        title: "Error",
        description: "Failed to fetch recent activity",
        variant: "destructive",
      })
    }
  }

  const handleRequestSubmit = async () => {
    const nik = localStorage.getItem("userNik")

    if (!nik || !distributorId) {
      toast({
        title: "Error",
        description: "Missing required information. Please try again later.",
        variant: "destructive",
      })
      return
    }

    if (!newRequest.jenis_pupuk || !newRequest.jumlah) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    const quota = quotaData.find(q => q.jenis_pupuk === newRequest.jenis_pupuk)
    if (!quota || quota.remaining < newRequest.jumlah) {
      toast({
        title: "Error",
        description: `Permintaan melebihi batas jatah pupuk ${newRequest.jenis_pupuk} yang tersedia (${quota?.remaining || 0}kg)`,
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('/api/distribusi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nik,
          id_distributor: distributorId,
          jenis_pupuk: newRequest.jenis_pupuk,
          jumlah: newRequest.jumlah,
          tanggal: new Date().toISOString().split('T')[0]
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit request')
      }

      setIsRequestDialogOpen(false)
      setNewRequest({ jenis_pupuk: "", jumlah: 0 })
      
      toast({
        title: "Success",
        description: "Distribution request submitted successfully",
      })

      fetchQuota(nik)
      fetchRecentActivity(nik)
    } catch (error) {
      console.error('Error submitting request:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit distribution request",
        variant: "destructive",
      })
    }
  }

  if (!isVerified) {
    return (
      <CustomerLayout>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-800">
                HALO, <span className="text-green-600">{userName}</span>!
              </h1>
              <p className="text-xl text-gray-700">SELAMAT DATANG DI PUPUK KU</p>
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <AlertOctagon className="w-8 h-8 text-yellow-500" />
              <div>
                <CardTitle>Akun Belum Terverifikasi</CardTitle>
                <p className="text-gray-500 mt-2">
                  Akun Anda sedang menunggu verifikasi dari administrator. 
                  Anda tidak dapat mengakses fitur distribusi pupuk sampai akun Anda terverifikasi.
                </p>
              </div>
            </CardHeader>
          </Card>
        </div>
      </CustomerLayout>
    )
  }

  if (hasQuota === false) {
    return (
      <CustomerLayout>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-800">
                HALO, <span className="text-green-600">{userName}</span>!
              </h1>
              <p className="text-xl text-gray-700">SELAMAT DATANG DI PUPUK KU</p>
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <AlertOctagon className="w-8 h-8 text-orange-500" />
              <div>
                <CardTitle>Belum Ada Jatah Pupuk</CardTitle>
                <p className="text-gray-500 mt-2">
                  Anda belum memiliki jatah pupuk. Silakan hubungi administrator untuk mendapatkan alokasi jatah pupuk Anda.
                </p>
              </div>
            </CardHeader>
          </Card>
        </div>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-800">
              HALO, <span className="text-green-600">{userName}</span>!
            </h1>
            <p className="text-xl text-gray-700">SELAMAT DATANG DI PUPUK KU</p>
          </div>
          <div className="hidden md:block">
            <div className="w-48 h-32 bg-gradient-to-r from-green-200 to-yellow-200 rounded-lg flex items-center justify-center">
              <span className="text-6xl">👨‍🌾</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Jatah Pupuk</h2>
            <Button 
              onClick={() => setIsRequestDialogOpen(true)} 
              className="bg-green-500 hover:bg-green-600"
              disabled={!distributorId || quotaData.every(q => q.remaining <= 0)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajukan Permintaan
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quotaData.map((quota) => (
              <Card key={quota.jenis_pupuk} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Sisa Jatah {quota.jenis_pupuk}</CardTitle>
                  <Package className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-800">
                    {quota.remaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {quota.unit}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Total: {quota.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {quota.unit}</span>
                    <span>Terpakai: {Number(quota.used).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {quota.unit}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${Math.max(0, Math.min(100, ((quota.total - quota.used) / quota.total) * 100))}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajukan Permintaan Pupuk</DialogTitle>
              <DialogDescription>
                Pilih jenis pupuk dan masukkan jumlah yang dibutuhkan.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Jenis Pupuk</Label>
                <Select 
                  value={newRequest.jenis_pupuk} 
                  onValueChange={(value) => setNewRequest(prev => ({ ...prev, jenis_pupuk: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis pupuk" />
                  </SelectTrigger>
                  <SelectContent>
                    {quotaData.map((quota) => (
                      <SelectItem 
                        key={quota.jenis_pupuk} 
                        value={quota.jenis_pupuk}
                        disabled={quota.remaining <= 0}
                      >
                        {quota.jenis_pupuk} ({quota.remaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {quota.unit} tersedia)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Jumlah (kg)</Label>
                <Input
                  type="number"
                  min="1"
                  max={newRequest.jenis_pupuk ? quotaData.find(q => q.jenis_pupuk === newRequest.jenis_pupuk)?.remaining || 0 : 0}
                  value={newRequest.jumlah || ''}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, jumlah: parseInt(e.target.value) || 0 }))}
                />
                {newRequest.jenis_pupuk && (
                  <p className="text-sm text-gray-500">
                    Sisa jatah: {quotaData.find(q => q.jenis_pupuk === newRequest.jenis_pupuk)?.remaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRequestSubmit}>Submit Request</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Aktivitas Terakhir</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 col-span-3 text-center py-4">
                Belum ada aktivitas distribusi
              </p>
            ) : (
              recentActivity.map((activity) => (
                <Card key={activity.id_transaksi}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {activity.jenis_pupuk}
                    </CardTitle>
                    {activity.status_acc === "approved" ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : activity.status_acc === "pending" ? (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-800">
                      {activity.jumlah.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{new Date(activity.tanggal).toLocaleDateString('id-ID')}</span>
                      <span className={`font-medium ${
                        activity.status_acc === "approved" 
                          ? "text-green-600" 
                          : activity.status_acc === "pending"
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}>
                        {activity.status_acc === "approved" 
                          ? "Disetujui" 
                          : activity.status_acc === "pending"
                            ? "Menunggu"
                            : "Ditolak"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </CustomerLayout>
  )
}
