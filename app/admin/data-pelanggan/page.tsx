"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Check, X, Plus, Search } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
  const [newCustomer, setNewCustomer] = useState({
    nik: "",
    nama: "",
    alamat: "",
    tanggal_lahir: "",
    kelompok_tani: "",
    password: ""
  })
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
      console.error('Error fetching customers:', error)
      toast({
        title: "Error",
        description: "Failed to fetch customer data",
        variant: "destructive",
      })
    }
  }

  const handleVerification = async (nik: string, verified: boolean) => {
    setConfirmDialog({
      isOpen: true,
      title: verified ? "Verify Customer" : "Reject Registration",
      description: verified 
        ? "Are you sure you want to verify this customer? They will be able to access the system."
        : "Are you sure you want to reject this registration? This action cannot be undone.",
      action: async () => {
        try {
          if (!verified) {
            await handleDelete(nik)
            return
          }

          const response = await fetch('/api/pelanggan', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              nik,
              status_verifikasi: verified,
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to update verification status')
          }

          setCustomers((prev) =>
            prev.map((customer) =>
              customer.nik === nik ? { ...customer, status_verifikasi: verified } : customer
            )
          )

          toast({
            title: verified ? "Account Verified" : "Verification Rejected",
            description: `Customer account has been ${verified ? "verified" : "rejected"}`,
          })
        } catch (error) {
          console.error('Error updating verification status:', error)
          toast({
            title: "Error",
            description: "Failed to update verification status",
            variant: "destructive",
          })
        }
      },
    })
  }

  const handleDelete = async (nik: string) => {
    try {
      const response = await fetch(`/api/pelanggan/${nik}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete customer')
      }

      setCustomers((prev) => prev.filter((customer) => customer.nik !== nik))
      toast({
        title: "Customer Deleted",
        description: "Customer has been removed from the system",
      })
    } catch (error) {
      console.error('Error deleting customer:', error)
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive",
      })
    }
  }

  const handleDeleteConfirmation = (nik: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Customer",
      description: "Are you sure you want to delete this customer? This action cannot be undone.",
      action: () => handleDelete(nik),
    })
  }

  const handleAddCustomer = async () => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newCustomer,
          status_verifikasi: true, // Auto verify when added by admin
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add customer')
      }

      fetchCustomers() // Refresh the list
      setIsAddDialogOpen(false)
      setNewCustomer({
        nik: "",
        nama: "",
        alamat: "",
        tanggal_lahir: "",
        kelompok_tani: "",
        password: ""
      })

      toast({
        title: "Customer Added",
        description: "New customer has been successfully added",
      })
    } catch (error) {
      console.error('Error adding customer:', error)
      toast({
        title: "Error",
        description: "Failed to add customer",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setIsEditDialogOpen(true)
  }

  const handleUpdateCustomer = async () => {
    if (!editingCustomer) return

    try {
      const response = await fetch(`/api/pelanggan/${editingCustomer.nik}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingCustomer),
      })

      if (!response.ok) {
        throw new Error('Failed to update customer')
      }

      setCustomers((prev) =>
        prev.map((customer) =>
          customer.nik === editingCustomer.nik ? editingCustomer : customer
        )
      )

      setIsEditDialogOpen(false)
      setEditingCustomer(null)

      toast({
        title: "Customer Updated",
        description: "Customer information has been successfully updated",
      })
    } catch (error) {
      console.error('Error updating customer:', error)
      toast({
        title: "Error",
        description: "Failed to update customer",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('id-ID')
  }

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchQuery.toLowerCase()
    return (
      customer.nik.toLowerCase().includes(searchLower) ||
      customer.nama.toLowerCase().includes(searchLower) ||
      (customer.kelompok_tani?.toLowerCase() || '').includes(searchLower)
    )
  })

  const pendingCustomers = filteredCustomers.filter(c => !c.status_verifikasi)
  const verifiedCustomers = filteredCustomers.filter(c => c.status_verifikasi)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Data Pelanggan</h1>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} className="bg-green-500 hover:bg-green-600 shrink-0">
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </div>
        </div>

        <Tabs defaultValue="customers" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="customers">
              Data Pelanggan
              {verifiedCustomers.length > 0 && (
                <Badge variant="outline" className="ml-2">{verifiedCustomers.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests" className="relative">
              Permintaan Registrasi
              {pendingCustomers.length > 0 && (
                <Badge className="ml-2 bg-red-500">{pendingCustomers.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customers">
            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Daftar Pelanggan Terverifikasi</span>
                  <Badge variant="outline">{verifiedCustomers.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NIK</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Kelompok Tani</TableHead>
                      <TableHead>Alamat</TableHead>
                      <TableHead>Tanggal Lahir</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {verifiedCustomers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Belum ada pelanggan terverifikasi
                        </TableCell>
                      </TableRow>
                    ) : (
                      verifiedCustomers.map((customer) => (
                        <TableRow key={customer.nik} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{customer.nik}</TableCell>
                          <TableCell>{customer.nama}</TableCell>
                          <TableCell>{customer.kelompok_tani || '-'}</TableCell>
                          <TableCell>{customer.alamat || '-'}</TableCell>
                          <TableCell>{formatDate(customer.tanggal_lahir)}</TableCell>
                          <TableCell>
                            <Badge variant={customer.status_verifikasi ? "default" : "secondary"}>
                              {customer.status_verifikasi ? "Verified" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => handleEdit(customer)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteConfirmation(customer.nik)}
                              >
                                <Trash2 className="w-4 h-4" />
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
          </TabsContent>

          <TabsContent value="requests">
            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Permintaan Registrasi Baru</span>
                  {pendingCustomers.length > 0 && (
                    <Badge className="bg-red-500">{pendingCustomers.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NIK</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Kelompok Tani</TableHead>
                      <TableHead>Alamat</TableHead>
                      <TableHead>Tanggal Lahir</TableHead>
                      <TableHead className="w-[150px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingCustomers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          Tidak ada permintaan registrasi baru
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingCustomers.map((customer) => (
                        <TableRow key={customer.nik} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{customer.nik}</TableCell>
                          <TableCell>{customer.nama}</TableCell>
                          <TableCell>{customer.kelompok_tani || '-'}</TableCell>
                          <TableCell>{customer.alamat || '-'}</TableCell>
                          <TableCell>{formatDate(customer.tanggal_lahir)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleVerification(customer.nik, true)}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleVerification(customer.nik, false)}
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
          </TabsContent>
        </Tabs>

        <div className="text-sm text-muted-foreground">
          Total Pelanggan: {customers.length} (Terverifikasi: {verifiedCustomers.length}, Pending: {pendingCustomers.length})
        </div>

        {/* Confirmation Dialog */}
        <AlertDialog open={confirmDialog.isOpen} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, isOpen: open }))}>
          <AlertDialogContent className="sm:max-w-[425px]">
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
              <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                confirmDialog.action()
                setConfirmDialog(prev => ({ ...prev, isOpen: false }))
              }}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add Customer Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>
                Enter the customer details below. All fields are required.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nik" className="text-right">
                  NIK
                </Label>
                <Input
                  id="nik"
                  value={newCustomer.nik}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, nik: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nama" className="text-right">
                  Nama
                </Label>
                <Input
                  id="nama"
                  value={newCustomer.nama}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, nama: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={newCustomer.password}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, password: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="kelompok_tani" className="text-right">
                  Kelompok Tani
                </Label>
                <Input
                  id="kelompok_tani"
                  value={newCustomer.kelompok_tani}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, kelompok_tani: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="alamat" className="text-right">
                  Alamat
                </Label>
                <Input
                  id="alamat"
                  value={newCustomer.alamat}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, alamat: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tanggal_lahir" className="text-right">
                  Tanggal Lahir
                </Label>
                <Input
                  id="tanggal_lahir"
                  type="date"
                  value={newCustomer.tanggal_lahir}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, tanggal_lahir: e.target.value }))}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCustomer}>Add Customer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Customer Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
              <DialogDescription>
                Update the customer details below.
              </DialogDescription>
            </DialogHeader>
            {editingCustomer && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-nik" className="text-right">
                    NIK
                  </Label>
                  <Input
                    id="edit-nik"
                    value={editingCustomer.nik}
                    disabled
                    className="col-span-3 bg-muted"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-nama" className="text-right">
                    Nama
                  </Label>
                  <Input
                    id="edit-nama"
                    value={editingCustomer.nama}
                    onChange={(e) => setEditingCustomer(prev => ({ ...prev!, nama: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-kelompok_tani" className="text-right">
                    Kelompok Tani
                  </Label>
                  <Input
                    id="edit-kelompok_tani"
                    value={editingCustomer.kelompok_tani || ''}
                    onChange={(e) => setEditingCustomer(prev => ({ ...prev!, kelompok_tani: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-alamat" className="text-right">
                    Alamat
                  </Label>
                  <Input
                    id="edit-alamat"
                    value={editingCustomer.alamat || ''}
                    onChange={(e) => setEditingCustomer(prev => ({ ...prev!, alamat: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-tanggal_lahir" className="text-right">
                    Tanggal Lahir
                  </Label>
                  <Input
                    id="edit-tanggal_lahir"
                    type="date"
                    value={editingCustomer.tanggal_lahir || ''}
                    onChange={(e) => setEditingCustomer(prev => ({ ...prev!, tanggal_lahir: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsEditDialogOpen(false)
                setEditingCustomer(null)
              }}>
                Cancel
              </Button>
              <Button onClick={handleUpdateCustomer}>Update Customer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}


