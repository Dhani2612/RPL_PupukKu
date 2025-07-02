"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("pelanggan")
  const [isLoading, setIsLoading] = useState(false)
  
  // Registration form states
  const [registerData, setRegisterData] = useState({
    nik: "",
    nama: "",
    kelompok_tani: "",
    password: "",
    alamat: "",
    tanggal_lahir: "",
  })
  
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Show specific error message for unverified accounts
        if (response.status === 403) {
          toast({
            title: "Account Not Verified",
            description: "Your account has not been verified. Please contact the administrator.",
            variant: "destructive",
            duration: 5000, // Show for 5 seconds
          })
        } else {
          toast({
            title: "Login Failed",
            description: data.error || "Invalid credentials",
            variant: "destructive",
          })
        }
        return
      }

      // Save user data to localStorage
      localStorage.setItem("userRole", role)
      localStorage.setItem("userName", data.user.nama)
      if (role === 'pelanggan') {
        localStorage.setItem("userNik", data.user.nik)
      } else {
        localStorage.setItem("userId", data.user.id_distributor.toString())
      }

      // Show success toast
      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.user.nama}!`,
        duration: 3000,
      })

      // Redirect based on role
      if (role === 'distributor') {
        router.push("/admin/dashboard")
      } else {
        router.push("/customer/dashboard")
      }
    } catch (error) {
      console.error('Login error:', error)
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "Registration Failed",
          description: data.error || "Failed to register account",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Registration Successful",
        description: "Your account has been registered and is pending verification by an administrator.",
        duration: 5000,
      })

      // Reset form
      setRegisterData({
        nik: "",
        nama: "",
        kelompok_tani: "",
        password: "",
        alamat: "",
        tanggal_lahir: "",
      })
    } catch (error) {
      console.error('Registration error:', error)
      toast({
        title: "Registration Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegisterInputChange = (field: string, value: string) => {
    setRegisterData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(to bottom, #f5f5dc 0%, #c8d68f 100%)",
      }}
    >
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🌾</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">PUPUK KU</h1>
          </div>
        </div>
      </div>

      {/* Login/Register Forms */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-3xl font-bold text-gray-800">WELCOME</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-gray-700">
                      Login Sebagai
                    </Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger className="h-12 rounded-lg border-gray-300">
                        <SelectValue placeholder="Pilih role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pelanggan">Pelanggan</SelectItem>
                        <SelectItem value="distributor">Distributor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-gray-700">
                      {role === 'pelanggan' ? 'NIK' : 'Username'}
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-12 rounded-lg border-gray-300"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-lg border-gray-300"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? "SIGNING IN..." : "SIGN IN"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-nik" className="text-gray-700">
                      NIK
                    </Label>
                    <Input
                      id="reg-nik"
                      type="text"
                      value={registerData.nik}
                      onChange={(e) => handleRegisterInputChange('nik', e.target.value)}
                      className="h-12 rounded-lg border-gray-300"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-nama" className="text-gray-700">
                      Nama Lengkap
                    </Label>
                    <Input
                      id="reg-nama"
                      type="text"
                      value={registerData.nama}
                      onChange={(e) => handleRegisterInputChange('nama', e.target.value)}
                      className="h-12 rounded-lg border-gray-300"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-kelompok-tani" className="text-gray-700">
                      Kelompok Tani
                    </Label>
                    <Input
                      id="reg-kelompok-tani"
                      type="text"
                      value={registerData.kelompok_tani}
                      onChange={(e) => handleRegisterInputChange('kelompok_tani', e.target.value)}
                      className="h-12 rounded-lg border-gray-300"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-password" className="text-gray-700">
                      Password
                    </Label>
                    <Input
                      id="reg-password"
                      type="password"
                      value={registerData.password}
                      onChange={(e) => handleRegisterInputChange('password', e.target.value)}
                      className="h-12 rounded-lg border-gray-300"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-alamat" className="text-gray-700">
                      Alamat
                    </Label>
                    <Input
                      id="reg-alamat"
                      type="text"
                      value={registerData.alamat}
                      onChange={(e) => handleRegisterInputChange('alamat', e.target.value)}
                      className="h-12 rounded-lg border-gray-300"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-tanggal-lahir" className="text-gray-700">
                      Tanggal Lahir
                    </Label>
                    <Input
                      id="reg-tanggal-lahir"
                      type="date"
                      value={registerData.tanggal_lahir}
                      onChange={(e) => handleRegisterInputChange('tanggal_lahir', e.target.value)}
                      className="h-12 rounded-lg border-gray-300"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? "REGISTERING..." : "REGISTER"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
