export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: Request) {
  try {
    const { username, password, role } = await req.json()
    console.log('Login attempt:', { username, role })

    if (!username || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let data, error

    if (role === 'distributor') {
      const res = await supabase
        .from('distributor')
        .select('id_distributor, nama, username, password')
        .eq('username', username)
        .eq('password', password) // WARNING: ideally hash password
        .single()
      data = res.data
      error = res.error
    } else if (role === 'pelanggan') {
      const res = await supabase
        .from('pelanggan')
        .select('nik, nama, kelompok_tani, status_verifikasi, password')
        .eq('nik', username)
        .eq('password', password)
        .single()
      data = res.data
      error = res.error
    } else {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    if (error || !data) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

if (role === 'pelanggan') {
  if (!('status_verifikasi' in data) || !data.status_verifikasi) {
    return NextResponse.json(
      { error: 'Account not verified. Please contact admin.' },
      { status: 403 }
    )
  }
}

return NextResponse.json({ user: data, role })

  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
