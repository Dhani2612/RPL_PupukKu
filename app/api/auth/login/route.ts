import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { username, password, role } = await req.json()
    console.log('Login attempt:', { username, role }) // Debug log

    if (!username || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    let query, params;
    
    if (role === 'distributor') {
      query = `
        SELECT id_distributor, nama, username
        FROM distributor 
        WHERE username = ? AND password = ?
      `
      params = [username, password]
    } else if (role === 'pelanggan') {
      query = `
        SELECT nik, nama, kelompok_tani, status_verifikasi
        FROM pelanggan 
        WHERE nik = ? AND password = ?
      `
      params = [username, password]
    } else {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    const [rows]: any = await pool.execute(query, params)
    console.log('Query result:', rows) // Debug log

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const user = rows[0]

    // Check verification status for pelanggan
    if (role === 'pelanggan' && !user.status_verifikasi) {
      return NextResponse.json(
        { error: 'Account not verified. Please contact administrator.' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      user,
      role
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 