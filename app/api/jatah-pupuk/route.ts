import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(req: Request) {
  try {
    console.log('✅ [GET] /api/jatah-pupuk called')

    const { searchParams } = new URL(req.url)
    const nik = searchParams.get('nik')
    console.log('📥 NIK parameter:', nik)

    let query: string
    let params: string[] = []

    if (nik) {
      query = `
        SELECT j.*, p.nama, p.kelompok_tani
        FROM jatah_pupuk j
        JOIN pelanggan p ON j.nik = p.nik
        WHERE j.nik = ?
      `
      params = [nik]
    } else {
      query = `
        SELECT j.*, p.nama, p.kelompok_tani
        FROM jatah_pupuk j
        JOIN pelanggan p ON j.nik = p.nik
      `
    }

    const [rows] = await pool.execute(query, params)
    console.log('📦 Fetched quota rows:', rows)

    if (nik && (!rows || (rows as any[]).length === 0)) {
      console.warn('⚠️ Quota not found for NIK:', nik)
      return NextResponse.json(
        { error: 'Quota not found' },
        { status: 404 }
      )
    }

    const [totalStats] = await pool.execute(`
      SELECT 
        SUM(urea) as total_urea,
        SUM(phonska) as total_phonska,
        SUM(organik) as total_organik
      FROM jatah_pupuk
    `)
    console.log('📊 Total stats:', totalStats)

    const [usedStats] = await pool.execute(`
      SELECT 
        SUM(CASE WHEN jenis_pupuk = 'Urea' THEN jumlah ELSE 0 END) as used_urea,
        SUM(CASE WHEN jenis_pupuk = 'Phonska' THEN jumlah ELSE 0 END) as used_phonska,
        SUM(CASE WHEN jenis_pupuk = 'Organik' THEN jumlah ELSE 0 END) as used_organik
      FROM distribusi_pupuk
      WHERE status_acc = 'approved'
    `)
    console.log('📉 Used stats:', usedStats)

    const total = {
      urea: (totalStats as any)[0].total_urea || 0,
      phonska: (totalStats as any)[0].total_phonska || 0,
      organik: (totalStats as any)[0].total_organik || 0
    }

    const used = {
      urea: (usedStats as any)[0].used_urea || 0,
      phonska: (usedStats as any)[0].used_phonska || 0,
      organik: (usedStats as any)[0].used_organik || 0
    }

    const stats = {
      total,
      used,
      remaining: {
        urea: total.urea - used.urea,
        phonska: total.phonska - used.phonska,
        organik: total.organik - used.organik
      }
    }
    console.log('📈 Final stats (total/used/remaining):', stats)

    const transformedRows = (rows as any[]).map(row => ({
      id_jatah: row.id_jatah,
      nik: row.nik,
      urea: row.urea,
      phonska: row.phonska,
      organik: row.organik,
      pelanggan: {
        nama: row.nama,
        kelompok_tani: row.kelompok_tani
      }
    }))
    console.log('✅ Transformed rows:', transformedRows)

    return NextResponse.json({
      quotas: nik ? transformedRows[0] : transformedRows,
      stats
    })
  } catch (error) {
    console.error('❌ Error fetching quotas:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
