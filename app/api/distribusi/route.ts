import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let query = `
      SELECT 
        d.id_distribusi, d.tanggal_distribusi, d.status_acc, 
        p.nama as nama_pelanggan, 
        p.nik, p.kelompok_tani, p.alamat,
        pup.jenis_pupuk, pup.jumlah_kg 
      FROM distribusi d
      JOIN pelanggan p ON d.nik = p.nik
      JOIN pupuk pup ON d.id_pupuk = pup.id_pupuk
      WHERE 1 = 1
    `
    const params: any[] = []

    // 🔍 Filter by status (e.g. ?status=pending)
    if (status) {
      query += ` AND d.status_acc = ?`
      params.push(status)
    }

    // 🔍 Filter by date range (e.g. ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD)
    if (startDate && endDate) {
      query += ` AND DATE(d.tanggal_distribusi) BETWEEN ? AND ?`
      params.push(startDate, endDate)
    }

    query += ` ORDER BY d.tanggal_distribusi DESC`

    const [rows] = await pool.execute(query, params)

    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error fetching distribusi:", error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}