import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: Request) {
  try {
    const { username, password, role } = await req.json()

    if (!username || !password || !role) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    // Tentukan tabel dan field sesuai role
    const table = role === 'distributor' ? 'distributor' : 'pelanggan'
    const idField = role === 'distributor' ? 'username' : 'nik'

    // Ambil data dari Supabase
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq(idField, username)
      .eq('password', password)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 })
    }

    // Tambahkan verifikasi khusus pelanggan
    if (role === 'pelanggan' && !data.status_verifikasi) {
      return NextResponse.json({ error: 'Akun belum diverifikasi' }, { status: 403 })
    }

    return NextResponse.json({
      user: data,
      role,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
