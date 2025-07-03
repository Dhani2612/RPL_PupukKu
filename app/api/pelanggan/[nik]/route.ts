import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function DELETE(
  req: Request,
  { params }: { params: { nik: string } }
) {
  try {
    const { nik } = params

    const [result] = await pool.execute(
      'DELETE FROM pelanggan WHERE nik = ?',
      [nik]
    )

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Customer deleted successfully' })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { nik: string } }
) {
  try {
    const { nik } = params
    const data = await req.json()
    const { nama, kelompok_tani, alamat, tanggal_lahir } = data

    if (!nama) {
      return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 })
    }

    const query = `
      UPDATE pelanggan 
      SET nama = ?, 
          kelompok_tani = ?, 
          alamat = ?, 
          tanggal_lahir = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE nik = ?
    `

    const [result] = await pool.execute(query, [
      nama,
      kelompok_tani || null,
      alamat || null,
      tanggal_lahir || null,
      nik
    ])

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const [rows] = await pool.execute(
      `SELECT nik, nama, kelompok_tani, alamat, tanggal_lahir, status_verifikasi, created_at, updated_at FROM pelanggan WHERE nik = ?`,
      [nik]
    )

    return NextResponse.json((rows as any)[0])
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
