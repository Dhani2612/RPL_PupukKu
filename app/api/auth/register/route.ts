import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { nik, nama, kelompok_tani, password, alamat, tanggal_lahir } = data

    // Validate required fields
    if (!nik || !nama || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if NIK already exists
    const [existingUsers] = await pool.execute(
      'SELECT nik FROM pelanggan WHERE nik = ?',
      [nik]
    )

    if ((existingUsers as any[]).length > 0) {
      return NextResponse.json(
        { error: 'NIK already registered' },
        { status: 400 }
      )
    }

    // Insert new user
    const query = `
      INSERT INTO pelanggan 
      (nik, nama, kelompok_tani, password, alamat, tanggal_lahir, status_verifikasi)
      VALUES (?, ?, ?, ?, ?, ?, FALSE)
    `
    
    await pool.execute(query, [
      nik,
      nama,
      kelompok_tani || null,
      password,
      alamat || null,
      tanggal_lahir || null,
    ])

    return NextResponse.json({
      message: 'Registration successful. Please wait for admin verification.',
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 