"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Edit, Trash2, Check, X, Plus } from "lucide-react"
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

interface Customer {
  nik: string
  nama: string
  alamat: string | null
  status_verifikasi: boolean
  tanggal_lahir: string | null
  kelompok_tani: string | null
}

interface ConfirmationDialog {
  isOpen: boolean
  title: string
  description: string
  action: () => void
}

export default function DataPelangganPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [confirmDialog, setConfirmDialog] = useState<ConfirmationDialog>({
    isOpen: false,
    title: "",
    description: "",
    action: () => {},
  })
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const role = localStorage.getItem("userRole")
    if (role !== "distributor") {
      router.push("/login")
      return
    }

    fetchCustomers()
  }, [router])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/pelanggan')
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      toast({
        title: "Gagal memuat data",
        description: "Terjadi kesalahan saat mengambil data pelanggan",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (nik: string) => {
    try {
      const response = await fetch(`/api/pelanggan/${nik}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error()
      setCustomers((prev) => prev.filter((c) => c.nik !== nik))
      toast({ title: "Berhasil", description: "Pelanggan dihapus" })
    } catch {
      toast({ title: "Gagal", description: "Tidak bisa menghapus pelanggan", variant: "destructive" })
    }
  }

  const handleVerification = async (nik: string, status: boolean) => {
    try {
      const response = await fetch(`/api/pelanggan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nik, status_verifikasi: status }),
      })
      if (!response.ok) throw new Error()
      setCustomers((prev) => prev.map((c) => c.nik === nik ? { ...c, status_verifikasi: status } : c))
      toast({ title: "Berhasil", description: status ? "Pelanggan diverifikasi" : "Registrasi ditolak" })
    } catch {
      toast({ title: "Gagal", description: "Gagal memverifikasi pelanggan", variant: "destructive" })
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('id-ID')
  }

  const filtered = customers.filter(c => {
    const s = searchQuery.toLowerCase()
    return c.nik.toLowerCase().includes(s) || c.nama.toLowerCase().includes(s) || (c.kelompok_tani || '').toLowerCase().includes(s)
  })

  const verifiedCustomers = filtered.filter(c => c.status_verifikasi)
  const pendingCustomers = filtered.filter(c => !c.status_verifikasi)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Data Pelanggan</h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Tambah
          </Button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <Input
            placeholder="Cari berdasarkan NIK, nama, atau kelompok..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs defaultValue="verified">
          <TabsList className="mt-4">
            <TabsTrigger value="verified">Terverifikasi</TabsTrigger>
            <TabsTrigger value="pending">Menunggu</TabsTrigger>
          </TabsList>
          <TabsContent value="verified">
            <Card>
              <CardHeader>
                <CardTitle>Pelanggan Terverifikasi</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NIK</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Alamat</TableHead>
                      <TableHead>Kelompok Tani</TableHead>
                      <TableHead>Tgl Lahir</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {verifiedCustomers.map((c) => (
                      <TableRow key={c.nik}>
                        <TableCell>{c.nik}</TableCell>
                        <TableCell>{c.nama}</TableCell>
                        <TableCell>{c.alamat || '-'}</TableCell>
                        <TableCell>{c.kelompok_tani || '-'}</TableCell>
                        <TableCell>{formatDate(c.tanggal_lahir)}</TableCell>
                        <TableCell className="flex gap-2">
                          <Button size="sm" onClick={() => {
                            setEditingCustomer(c)
                            setIsEditDialogOpen(true)
                          }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => {
                            setConfirmDialog({
                              isOpen: true,
                              title: "Hapus Pelanggan",
                              description: `Yakin ingin menghapus ${c.nama}?`,
                              action: () => handleDelete(c.nik)
                            })
                          }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pelanggan Menunggu Verifikasi</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NIK</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Alamat</TableHead>
                      <TableHead>Kelompok Tani</TableHead>
                      <TableHead>Tgl Lahir</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingCustomers.map((c) => (
                      <TableRow key={c.nik}>
                        <TableCell>{c.nik}</TableCell>
                        <TableCell>{c.nama}</TableCell>
                        <TableCell>{c.alamat || '-'}</TableCell>
                        <TableCell>{c.kelompok_tani || '-'}</TableCell>
                        <TableCell>{formatDate(c.tanggal_lahir)}</TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleVerification(c.nik, true)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleVerification(c.nik, false)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <AlertDialog open={confirmDialog.isOpen} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, isOpen: open }))}>
          <AlertDialogContent className="sm:max-w-[425px]">
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
              <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                confirmDialog.action()
                setConfirmDialog(prev => ({ ...prev, isOpen: false }))
              }}>
                Lanjutkan
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  )
}