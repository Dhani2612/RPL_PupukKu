import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: Request) {
  try {
    const { username, password, role } = await req.json()

    if (!username || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Cari user di Supabase
    let { data, error } = await supabase
      .from(role === 'distributor' ? 'distributor' : 'pelanggan')
      .select('*')
      .eq(role === 'distributor' ? 'username' : 'nik', username)
      .eq('password', password)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Cek status verifikasi pelanggan
    if (role === 'pelanggan' && !data.status_verifikasi) {
      return NextResponse.json(
        { error: 'Akun belum diverifikasi. Hubungi admin.' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      user: data,
      role
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
