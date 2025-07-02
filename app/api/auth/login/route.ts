import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { username, password, role } = body

    // Validasi input
    if (!username || !password || !role) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      )
    }

    // Tentukan tabel dan kolom berdasarkan role
    const isDistributor = role === 'distributor'
    const tableName = isDistributor ? 'distributor' : 'pelanggan'
    const idColumn = isDistributor ? 'username' : 'nik'

    // Query ke Supabase
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq(idColumn, username)
      .eq('password', password)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      )
    }

    // Verifikasi status jika pelanggan
    if (!isDistributor && !data.status_verifikasi) {
      return NextResponse.json(
        { error: 'Akun belum diverifikasi' },
        { status: 403 }
      )
    }

    // Kirim data user & role
    return NextResponse.json({
      user: data,
      role,
    })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    )
  }
}
