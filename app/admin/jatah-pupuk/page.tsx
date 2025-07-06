"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Edit, Save, X, Download, Plus, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface FertilizerQuota {
  id_jatah: number
  nik: string
  urea: number
  phonska: number
  organik: number
  pelanggan: {
    nama: string
    kelompok_tani: string | null
  }
}

interface QuotaStats {
  total: {
    urea: number
    phonska: number
    organik: number
  }
  used: {
    urea: number
    phonska: number
    organik: number
  }
  remaining: {
    urea: number
    phonska: number
    organik: number
  }
}

interface Customer {
  nik: string
  nama: string
  kelompok_tani: string | null
}

export default function JatahPupukPage() {
  const [quotas, setQuotas] = useState<FertilizerQuota[]>([])
  const [stats, setStats] = useState<QuotaStats>({
    total: {
      urea: 0,
      phonska: 0,
      organik: 0
    },
    used: {
      urea: 0,
      phonska: 0,
      organik: 0
    },
    remaining: {
      urea: 0,
      phonska: 0,
      organik: 0
    }
  })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValues, setEditValues] = useState<Partial<FertilizerQuota>>({})
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [verifiedCustomers, setVerifiedCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>("")
  const [newQuota, setNewQuota] = useState({
    urea: 0,
    phonska: 0,
    organik: 0
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const role = localStorage.getItem("userRole")
    if (role !== "distributor") {
      router.push("/login")
      return
    }

    fetchQuotas()
    fetchVerifiedCustomers()

    // ⏱️ Tambahan: Refresh otomatis setiap 10 detik
    const interval = setInterval(() => {
      fetchQuotas()
    }, 10000)

    return () => clearInterval(interval) // 🔁 Bersihkan saat unmount
  }, [router])


  const fetchQuotas = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/jatah-pupuk')
      if (!response.ok) {
        throw new Error('Failed to fetch quota data')
      }
      const data = await response.json()
      
      setQuotas(data?.quotas || [])
      setStats({
        total: {
          urea: data?.stats?.total?.urea || 0,
          phonska: data?.stats?.total?.phonska || 0,
          organik: data?.stats?.total?.organik || 0
        },
        used: {
          urea: data?.stats?.used?.urea || 0,
          phonska: data?.stats?.used?.phonska || 0,
          organik: data?.stats?.used?.organik || 0
        },
        remaining: {
          urea: data?.stats?.remaining?.urea || 0,
          phonska: data?.stats?.remaining?.phonska || 0,
          organik: data?.stats?.remaining?.organik || 0
        }
      })
    } catch (error) {
      console.error('Error fetching quotas:', error)
      toast({
        title: "Error",
        description: "Failed to fetch quota data",
        variant: "destructive",
      })
      setQuotas([])
      setStats({
        total: { urea: 0, phonska: 0, organik: 0 },
        used: { urea: 0, phonska: 0, organik: 0 },
        remaining: { urea: 0, phonska: 0, organik: 0 }
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchVerifiedCustomers = async () => {
    try {
      const response = await fetch('/api/pelanggan')
      if (!response.ok) {
        throw new Error('Failed to fetch customers')
      }
      const data = await response.json()

      const verifiedOnes = data.filter((customer: any) => {
        if (!customer.status_verifikasi) return false
        const hasQuota = quotas.some(quota => quota.nik === customer.nik)
        return !hasQuota
      })

      setVerifiedCustomers(verifiedOnes)
    } catch (error) {
      console.error('Error fetching verified customers:', error)
      toast({
        title: "Error",
        description: "Failed to fetch verified customers",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (quota: FertilizerQuota) => {
    setEditingId(quota.id_jatah)
    setEditValues(quota)
  }

  const handleSave = async () => {
    if (editingId && editValues) {
      try {
        const response = await fetch('/api/jatah-pupuk', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nik: editValues.nik,
            urea: editValues.urea,
            phonska: editValues.phonska,
            organik: editValues.organik,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to update quota')
        }

        const updatedQuota = await response.json()
        setQuotas((prev) =>
          prev.map((quota) => (quota.id_jatah === editingId ? updatedQuota : quota))
        )

        setEditingId(null)
        setEditValues({})

        toast({
          title: "Quota Updated",
          description: "Fertilizer quota has been successfully updated",
        })

        fetchQuotas()
      } catch (error) {
        console.error('Error updating quota:', error)
        toast({
          title: "Error",
          description: "Failed to update quota",
          variant: "destructive",
        })
      }
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditValues({})
  }

  const handleAddQuota = async () => {
    if (!selectedCustomer) {
      toast({
        title: "Error",
        description: "Please select a customer",
        variant: "destructive",
      })
      return
    }

    if (newQuota.urea < 0 || newQuota.phonska < 0 || newQuota.organik < 0) {
      toast({
        title: "Error",
        description: "Quota values cannot be negative",
        variant: "destructive",
      })
      return
    }

    const selectedCustomerData = verifiedCustomers.find(c => c.nik === selectedCustomer)
    if (!selectedCustomerData) {
      toast({
        title: "Error",
        description: "Selected customer is no longer eligible for quota allocation",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('/api/jatah-pupuk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nik: selectedCustomer,
          ...newQuota,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add quota')
      }

      const addedQuota = await response.json()
      setQuotas((prev) => [...prev, addedQuota])
      setIsAddDialogOpen(false)
      setSelectedCustomer("")
      setNewQuota({
        urea: 0,
        phonska: 0,
        organik: 0
      })

      toast({
        title: "Quota Added",
        description: "New fertilizer quota has been successfully added",
      })

      fetchQuotas()
      fetchVerifiedCustomers()
    } catch (error) {
      console.error('Error adding quota:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add quota",
        variant: "destructive",
      })
    }
  }

  const handleExport = () => {
    const headers = ['NIK', 'Nama', 'Kelompok Tani', 'Urea (kg)', 'Phonska (kg)', 'Organik (kg)']
    const rows = quotas.map(quota => [
      quota.nik,
      quota.pelanggan.nama,
      quota.pelanggan.kelompok_tani || '-',
      quota.urea,
      quota.phonska,
      quota.organik
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `jatah_pupuk_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredQuotas = quotas.filter(quota => {
    const searchLower = searchQuery.toLowerCase()
    return (
      quota.nik.toLowerCase().includes(searchLower) ||
      quota.pelanggan.nama.toLowerCase().includes(searchLower) ||
      (quota.pelanggan.kelompok_tani?.toLowerCase() || '').includes(searchLower)
    )
  })

  const statsCards = [
    {
      title: "Total Jatah Pupuk",
      items: [
        { label: "Urea", value: stats.total.urea, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Phonska", value: stats.total.phonska, color: "text-green-600", bg: "bg-green-50" },
        { label: "Organik", value: stats.total.organik, color: "text-purple-600", bg: "bg-purple-50" }
      ]
    },
    {
      title: "Jatah Terpakai",
      items: [
        { label: "Urea", value: stats.used.urea, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Phonska", value: stats.used.phonska, color: "text-green-600", bg: "bg-green-50" },
        { label: "Organik", value: stats.used.organik, color: "text-purple-600", bg: "bg-purple-50" }
      ]
    },
    {
      title: "Sisa Jatah Pupuk",
      items: [
        { label: "Urea", value: stats.remaining.urea, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Phonska", value: stats.remaining.phonska, color: "text-green-600", bg: "bg-green-50" },
        { label: "Organik", value: stats.remaining.organik, color: "text-purple-600", bg: "bg-purple-50" }
      ]
    }
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Jatah Pupuk</h1>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search quotas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-green-500 hover:bg-green-600 shrink-0">
                <Plus className="w-4 h-4 mr-2" />
                Add New
              </Button>
              <Button variant="outline" onClick={handleExport} className="shrink-0">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statsCards.map((stat, idx) => (
            <Card key={idx} className="hover-scale">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stat.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className={`${item.bg} px-3 py-1 rounded-full`}>
                        <span className={`text-sm font-medium ${item.color}`}>{item.label}</span>
                      </div>
                      <div className="text-2xl font-bold">{item.value.toLocaleString()} kg</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="hover-scale">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Manajemen Jatah Pupuk Pelanggan</span>
              <Badge variant="outline">{filteredQuotas.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <p className="text-muted-foreground">Loading data...</p>
              </div>
            ) : filteredQuotas.length === 0 ? (
              <div className="flex justify-center items-center py-8">
                <p className="text-muted-foreground">Belum ada data jatah pupuk</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NIK</TableHead>
                    <TableHead>Nama Pelanggan</TableHead>
                    <TableHead>Kelompok Tani</TableHead>
                    <TableHead>Urea (kg)</TableHead>
                    <TableHead>Phonska (kg)</TableHead>
                    <TableHead>Organik (kg)</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotas.map((quota) => (
                    <TableRow key={quota.id_jatah} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{quota.nik}</TableCell>
                      <TableCell className="font-medium">{quota.pelanggan.nama}</TableCell>
                      <TableCell>{quota.pelanggan.kelompok_tani || '-'}</TableCell>
                      <TableCell>
                        {editingId === quota.id_jatah ? (
                          <Input
                            type="number"
                            value={editValues.urea || 0}
                            onChange={(e) =>
                              setEditValues((prev) => ({ ...prev, urea: Number(e.target.value) }))
                            }
                            className="w-24"
                          />
                        ) : (
                          quota.urea.toLocaleString()
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === quota.id_jatah ? (
                          <Input
                            type="number"
                            value={editValues.phonska || 0}
                            onChange={(e) =>
                              setEditValues((prev) => ({ ...prev, phonska: Number(e.target.value) }))
                            }
                            className="w-24"
                          />
                        ) : (
                          quota.phonska.toLocaleString()
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === quota.id_jatah ? (
                          <Input
                            type="number"
                            value={editValues.organik || 0}
                            onChange={(e) =>
                              setEditValues((prev) => ({ ...prev, organik: Number(e.target.value) }))
                            }
                            className="w-24"
                          />
                        ) : (
                          quota.organik.toLocaleString()
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === quota.id_jatah ? (
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={handleSave} className="text-green-600 hover:text-green-700 hover:bg-green-50">
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleCancel} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(quota)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add New Quota Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Quota</DialogTitle>
              <DialogDescription>
                Add fertilizer quota for a verified customer.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Select Customer</Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {verifiedCustomers.map((customer) => (
                      <SelectItem key={customer.nik} value={customer.nik}>
                        {customer.nama} - {customer.kelompok_tani || 'No Group'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Urea (kg)</Label>
                  <Input
                    type="number"
                    value={newQuota.urea}
                    onChange={(e) => setNewQuota(prev => ({ ...prev, urea: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phonska (kg)</Label>
                  <Input
                    type="number"
                    value={newQuota.phonska}
                    onChange={(e) => setNewQuota(prev => ({ ...prev, phonska: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Organik (kg)</Label>
                  <Input
                    type="number"
                    value={newQuota.organik}
                    onChange={(e) => setNewQuota(prev => ({ ...prev, organik: Number(e.target.value) }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddQuota}>Add Quota</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
