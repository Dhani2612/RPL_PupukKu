import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const nik = searchParams.get('nik')

    let query: string
    let params: string[] = []

    if (nik) {
      query = `
        SELECT 
          nik, nama, kelompok_tani, alamat, 
          tanggal_lahir, status_verifikasi, 
          created_at, updated_at
        FROM pelanggan 
        WHERE nik = ?
      `
      params = [nik]
    } else {
      query = `
        SELECT 
          nik, nama, kelompok_tani, alamat, 
          tanggal_lahir, status_verifikasi, 
          created_at, updated_at
        FROM pelanggan
      `
    }

    const [rows] = await pool.execute(query, params)

    if (nik && (!rows || (rows as any[]).length === 0)) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json(nik ? (rows as any[])[0] : rows)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const data = await req.json()
    const { nik, status_verifikasi } = data

    if (!nik || typeof status_verifikasi !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid or missing nik / status_verifikasi' },
        { status: 400 }
      )
    }

    const query = `
      UPDATE pelanggan 
      SET status_verifikasi = ?, updated_at = CURRENT_TIMESTAMP
      WHERE nik = ?
    `
    const [result] = await pool.execute(query, [status_verifikasi, nik])

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const [rows] = await pool.execute(
      `SELECT nik, nama, kelompok_tani, alamat, tanggal_lahir, status_verifikasi, created_at, updated_at FROM pelanggan WHERE nik = ?`,
      [nik]
    )

    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
