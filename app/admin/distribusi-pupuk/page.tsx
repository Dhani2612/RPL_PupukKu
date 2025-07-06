"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Check, X, Download, Search, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Distribution {
  id_transaksi: number
  nik: string
  jenis_pupuk: 'Urea' | 'Phonska' | 'Organik'
  jumlah: number
  tanggal: string
  status_acc: 'pending' | 'approved' | 'rejected'
  pelanggan: {
    nama: string
    kelompok_tani: string | null
  }
  distributor: {
    nama: string
  }
}

interface ConfirmationDialog {
  isOpen: boolean
  title: string
  description: string
  action: () => void
}

export default function DistribusiPupukPage() {
  const [distributions, setDistributions] = useState<Distribution[]>([])
  const [confirmDialog, setConfirmDialog] = useState<ConfirmationDialog>({
    isOpen: false,
    title: "",
    description: "",
    action: () => {},
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const router = useRouter()
  const { toast } = useToast()

useEffect(() => {
  const role = localStorage.getItem("userRole")
  if (role !== "distributor") {
    router.push("/login")
    return
  }

  const fetchDistributions = async () => {
    try {
      const response = await fetch('/api/distribusi')
      const data = await response.json()

      if (!Array.isArray(data)) {
        console.error("Unexpected data format:", data)
        setDistributions([]) // Kosongkan agar tidak crash
        return
      }

      setDistributions(data)
    } catch (error) {
      console.error('Error fetching distributions:', error)
      toast({
        title: "Error",
        description: "Failed to fetch distribution data",
        variant: "destructive",
      })
      setDistributions([]) // Kosongkan agar tetap stabil
    }
  }

  fetchDistributions()
}, [router])


  const handleStatusUpdate = async (id: number, status: 'approved' | 'rejected') => {
    setConfirmDialog({
      isOpen: true,
      title: status === 'approved' ? "Approve Distribution" : "Reject Distribution",
      description: `Are you sure you want to ${status} this distribution request?`,
      action: async () => {
        try {
          const response = await fetch('/api/distribusi', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id_transaksi: id,
              status_acc: status,
            }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Failed to update distribution status')
          }

          setDistributions((prev) =>
            prev.map((dist) =>
              dist.id_transaksi === id ? data : dist
            )
          )

          toast({
            title: "Status Updated",
            description: `Distribution request has been ${status}`,
          })

          setConfirmDialog(prev => ({ ...prev, isOpen: false }))
        } catch (error) {
          console.error('Error updating distribution status:', error)
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to update distribution status",
            variant: "destructive",
          })
        }
      },
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">
            Approved
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600 bg-yellow-50">
            Pending
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600 bg-red-50">
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const filteredDistributions = distributions.filter(dist => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = 
      dist.nik.toLowerCase().includes(searchLower) ||
      dist.pelanggan.nama.toLowerCase().includes(searchLower) ||
      (dist.pelanggan.kelompok_tani?.toLowerCase() || '').includes(searchLower)
    
    if (statusFilter === "all") return matchesSearch
    return matchesSearch && dist.status_acc === statusFilter
  })

  const pendingDistributions = filteredDistributions.filter(d => d.status_acc === 'pending')
  const otherDistributions = filteredDistributions.filter(d => d.status_acc !== 'pending')

  const handleExport = () => {
    // Create CSV content
    const headers = [
      'ID',
      'Nama Pelanggan',
      'Kelompok Tani',
      'Jenis Pupuk',
      'Jumlah (kg)',
      'Tanggal',
      'Status',
      'Distributor'
    ]
    const rows = distributions.map(dist => [
      dist.id_transaksi,
      dist.pelanggan?.nama || '-',
      dist.pelanggan?.kelompok_tani || '-',
      dist.jenis_pupuk,
      dist.jumlah,
      new Date(dist.tanggal).toLocaleDateString('id-ID'),
      dist.status_acc,
      dist.distributor?.nama || '-'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `distribusi_pupuk_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export Success",
      description: "Distribution data has been exported to CSV",
    })
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Distribusi Pupuk</h1>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search distributions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleExport} className="shrink-0">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Pending Distributions */}
        <Card className="hover-scale">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Permintaan Distribusi Baru</span>
              {pendingDistributions.length > 0 && (
                <Badge className="bg-red-500">{pendingDistributions.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>NIK</TableHead>
                  <TableHead>Nama Pelanggan</TableHead>
                  <TableHead>Kelompok Tani</TableHead>
                  <TableHead>Jenis Pupuk</TableHead>
                  <TableHead>Jumlah (kg)</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingDistributions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Tidak ada permintaan distribusi baru
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingDistributions.map((distribution) => (
                    <TableRow key={distribution.id_transaksi} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{distribution.id_transaksi}</TableCell>
                      <TableCell className="font-medium">{distribution.nik}</TableCell>
                      <TableCell>{distribution.pelanggan?.nama || '-'}</TableCell>
                      <TableCell>{distribution.pelanggan?.kelompok_tani || '-'}</TableCell>
                      <TableCell>{distribution.jenis_pupuk}</TableCell>
                      <TableCell>{distribution.jumlah}</TableCell>
                      <TableCell>{new Date(distribution.tanggal).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell>{getStatusBadge(distribution.status_acc)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleStatusUpdate(distribution.id_transaksi, 'approved')}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleStatusUpdate(distribution.id_transaksi, 'rejected')}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Distribution List */}
        <Card className="hover-scale">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Riwayat Distribusi</span>
              <Badge variant="outline">{otherDistributions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>NIK</TableHead>
                  <TableHead>Nama Pelanggan</TableHead>
                  <TableHead>Kelompok Tani</TableHead>
                  <TableHead>Jenis Pupuk</TableHead>
                  <TableHead>Jumlah (kg)</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {otherDistributions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Belum ada riwayat distribusi
                    </TableCell>
                  </TableRow>
                ) : (
                  otherDistributions.map((distribution) => (
                    <TableRow key={distribution.id_transaksi} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{distribution.id_transaksi}</TableCell>
                      <TableCell className="font-medium">{distribution.nik}</TableCell>
                      <TableCell>{distribution.pelanggan?.nama || '-'}</TableCell>
                      <TableCell>{distribution.pelanggan?.kelompok_tani || '-'}</TableCell>
                      <TableCell>{distribution.jenis_pupuk}</TableCell>
                      <TableCell>{distribution.jumlah}</TableCell>
                      <TableCell>{new Date(distribution.tanggal).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell>{getStatusBadge(distribution.status_acc)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <AlertDialog open={confirmDialog.isOpen} onOpenChange={(open) => {
          if (!open) {
            setConfirmDialog(prev => ({ ...prev, isOpen: false }))
          }
        }}>
          <AlertDialogContent className="sm:max-w-[425px]">
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
              <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmDialog.action}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  )
}
