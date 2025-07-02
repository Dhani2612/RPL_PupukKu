"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import CustomerLayout from "@/components/customer-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit, Save, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CustomerProfile {
  nik: string
  nama: string
  kelompok_tani: string | null
  alamat: string | null
  tanggal_lahir: string | null
  status_verifikasi: boolean
  created_at: string
  updated_at: string
}

export default function CustomerProfilePage() {
  const [profile, setProfile] = useState<CustomerProfile>({
    nik: "",
    nama: "",
    kelompok_tani: null,
    alamat: null,
    tanggal_lahir: null,
    status_verifikasi: false,
    created_at: "",
    updated_at: ""
  })
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<CustomerProfile>(profile)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const role = localStorage.getItem("userRole")
    const nik = localStorage.getItem("userNik")

    if (role !== "pelanggan") {
      router.push("/login")
      return
    }

    if (!nik) {
      toast({
        title: "Error",
        description: "User NIK not found. Please login again.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    fetchProfile(nik)
  }, [router, toast])

  const fetchProfile = async (nik: string) => {
    try {
      const response = await fetch(`/api/pelanggan?nik=${nik}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Profile not found')
        }
        throw new Error('Failed to fetch profile')
      }
      const data = await response.json()
      setProfile(data)
      setEditedProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch profile data",
        variant: "destructive",
      })
      if (error instanceof Error && error.message === 'Profile not found') {
        router.push("/login")
      }
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditedProfile(profile)
  }

  const validateProfile = () => {
    if (!editedProfile.nama || editedProfile.nama.trim() === '') {
      toast({
        title: "Validation Error",
        description: "Name is required",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleSave = async () => {
    if (!validateProfile()) return

    try {
      const response = await fetch(`/api/pelanggan/${profile.nik}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nama: editedProfile.nama,
          kelompok_tani: editedProfile.kelompok_tani,
          alamat: editedProfile.alamat,
          tanggal_lahir: editedProfile.tanggal_lahir,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update profile')
      }

      const updatedData = await response.json()
      setProfile(updatedData)
      setIsEditing(false)

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated",
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedProfile(profile)
  }

  const handleInputChange = (field: keyof CustomerProfile, value: string) => {
    setEditedProfile((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <CustomerLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Profile Customer</h1>
          {!isEditing ? (
            <Button onClick={handleEdit} className="bg-blue-500 hover:bg-blue-600">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button onClick={handleSave} className="bg-green-500 hover:bg-green-600">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        <Card>
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src="/placeholder.svg?height=96&width=96" alt="Profile" />
                  <AvatarFallback className="text-2xl bg-green-100 text-green-600">
                    {profile.nama
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <CardTitle className="text-xl">{profile.nama}</CardTitle>
            <p className="text-gray-600">Customer</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nik">NIK</Label>
                <Input
                  id="nik"
                  value={profile.nik}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nama">Nama Lengkap</Label>
                <Input
                  id="nama"
                  value={isEditing ? editedProfile.nama : profile.nama}
                  onChange={(e) => handleInputChange("nama", e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="kelompok_tani">Kelompok Tani</Label>
                <Input
                  id="kelompok_tani"
                  value={isEditing ? editedProfile.kelompok_tani || '' : profile.kelompok_tani || ''}
                  onChange={(e) => handleInputChange("kelompok_tani", e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alamat">Alamat</Label>
                <Input
                  id="alamat"
                  value={isEditing ? editedProfile.alamat || '' : profile.alamat || ''}
                  onChange={(e) => handleInputChange("alamat", e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tanggal_lahir">Tanggal Lahir</Label>
                <Input
                  id="tanggal_lahir"
                  type="date"
                  value={isEditing ? editedProfile.tanggal_lahir || '' : profile.tanggal_lahir || ''}
                  onChange={(e) => handleInputChange("tanggal_lahir", e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label>Status Verifikasi</Label>
                <Input 
                  value={profile.status_verifikasi ? "Terverifikasi" : "Belum Terverifikasi"} 
                  disabled 
                  className="bg-gray-50" 
                />
              </div>

              <div className="space-y-2">
                <Label>Created At</Label>
                <Input 
                  value={new Date(profile.created_at).toLocaleString()} 
                  disabled 
                  className="bg-gray-50" 
                />
              </div>

              <div className="space-y-2">
                <Label>Last Updated</Label>
                <Input 
                  value={new Date(profile.updated_at).toLocaleString()} 
                  disabled 
                  className="bg-gray-50" 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CustomerLayout>
  )
}
