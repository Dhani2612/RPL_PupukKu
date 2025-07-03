import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const idDistributor = params.id

    // Cek ID valid
    if (!idDistributor) {
      return NextResponse.json(
        { error: 'ID distributor tidak ditemukan' },
        { status: 400 }
      )
    }

    // Ambil total pelanggan yang menerima distribusi dari distributor ini
    const [pelangganResult] = await pool.execute(
      `SELECT COUNT(DISTINCT nik) AS totalPelanggan 
       FROM distribusi 
       WHERE id_distributor = ?`,
      [idDistributor]
    )

    // Ambil total distribusi yang dilakukan
    const [distribusiResult] = await pool.execute(
      `SELECT COUNT(*) AS totalDistribusi 
       FROM distribusi 
       WHERE id_distributor = ?`,
      [idDistributor]
    )

    // Ambil total jatah pupuk yang terdata
    const [jatahResult] = await pool.execute(
      `SELECT COUNT(*) AS totalJatah 
       FROM jatah_pupuk 
       WHERE id_distributor = ?`,
      [idDistributor]
    )

    return NextResponse.json({
      totalPelanggan: (pelangganResult as any)[0]?.totalPelanggan || 0,
      totalDistribusi: (distribusiResult as any)[0]?.totalDistribusi || 0,
      totalJatah: (jatahResult as any)[0]?.totalJatah || 0,
    })
  } catch (error) {
    console.error('Error fetching distributor stats:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    )
  }
}
