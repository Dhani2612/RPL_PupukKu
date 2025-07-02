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

    if (nik && (!rows || (rows as any[]).length === 0)) {
      return NextResponse.json(
        { error: 'Quota not found' },
        { status: 404 }
      )
    }

    // Get total stats
    const [totalStats] = await pool.execute(`
      SELECT 
        SUM(urea) as total_urea,
        SUM(phonska) as total_phonska,
        SUM(organik) as total_organik
      FROM jatah_pupuk
    `)

    // Get used stats from approved distributions
    const [usedStats] = await pool.execute(`
      SELECT 
        SUM(CASE WHEN jenis_pupuk = 'Urea' THEN jumlah ELSE 0 END) as used_urea,
        SUM(CASE WHEN jenis_pupuk = 'Phonska' THEN jumlah ELSE 0 END) as used_phonska,
        SUM(CASE WHEN jenis_pupuk = 'Organik' THEN jumlah ELSE 0 END) as used_organik
      FROM distribusi_pupuk
      WHERE status_acc = 'approved'
    `)

    const stats = {
      total: {
        urea: (totalStats as any)[0].total_urea || 0,
        phonska: (totalStats as any)[0].total_phonska || 0,
        organik: (totalStats as any)[0].total_organik || 0
      },
      used: {
        urea: (usedStats as any)[0].used_urea || 0,
        phonska: (usedStats as any)[0].used_phonska || 0,
        organik: (usedStats as any)[0].used_organik || 0
      }
    }

    stats.remaining = {
      urea: stats.total.urea - stats.used.urea,
      phonska: stats.total.phonska - stats.used.phonska,
      organik: stats.total.organik - stats.used.organik
    }

    // Transform the data to include pelanggan object
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

    return NextResponse.json({
      quotas: nik ? transformedRows[0] : transformedRows,
      stats
    })
  } catch (error) {
    console.error('Error fetching quotas:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { nik, urea, phonska, organik } = data

    if (!nik) {
      return NextResponse.json(
        { error: 'NIK is required' },
        { status: 400 }
      )
    }

    // Check if customer exists and is verified
    const [customers] = await pool.execute(
      'SELECT nama, kelompok_tani, status_verifikasi FROM pelanggan WHERE nik = ?',
      [nik]
    )

    if (!customers || (customers as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    const customer = (customers as any[])[0]
    if (!customer.status_verifikasi) {
      return NextResponse.json(
        { error: 'Customer is not verified' },
        { status: 403 }
      )
    }

    // Check if quota already exists
    const [existingQuotas] = await pool.execute(
      'SELECT id_jatah FROM jatah_pupuk WHERE nik = ?',
      [nik]
    )

    if ((existingQuotas as any[]).length > 0) {
      return NextResponse.json(
        { error: 'Quota already exists for this customer' },
        { status: 400 }
      )
    }

    // Insert new quota
    const [result] = await pool.execute(
      `INSERT INTO jatah_pupuk (nik, urea, phonska, organik)
       VALUES (?, ?, ?, ?)`,
      [nik, urea || 0, phonska || 0, organik || 0]
    )

    // Return the created quota with customer info
    const quota = {
      id_jatah: (result as any).insertId,
      nik,
      urea: urea || 0,
      phonska: phonska || 0,
      organik: organik || 0,
      pelanggan: {
        nama: customer.nama,
        kelompok_tani: customer.kelompok_tani
      }
    }

    return NextResponse.json(quota)
  } catch (error) {
    console.error('Error creating quota:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const data = await req.json()
    const { nik, urea, phonska, organik } = data

    if (!nik) {
      return NextResponse.json(
        { error: 'NIK is required' },
        { status: 400 }
      )
    }

    const updateFields: string[] = []
    const params: any[] = []

    if (urea !== undefined) {
      updateFields.push('urea = ?')
      params.push(urea)
    }
    if (phonska !== undefined) {
      updateFields.push('phonska = ?')
      params.push(phonska)
    }
    if (organik !== undefined) {
      updateFields.push('organik = ?')
      params.push(organik)
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    params.push(nik) // Add nik for WHERE clause

    const query = `
      UPDATE jatah_pupuk 
      SET ${updateFields.join(', ')}
      WHERE nik = ?
    `
    const [result] = await pool.execute(query, params)

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: 'Quota not found' },
        { status: 404 }
      )
    }

    // Fetch updated quota data with pelanggan info
    const [rows] = await pool.execute(
      `SELECT j.*, p.nama, p.kelompok_tani
       FROM jatah_pupuk j
       JOIN pelanggan p ON j.nik = p.nik
       WHERE j.nik = ?`,
      [nik]
    )

    // Transform the data to include pelanggan object
    const transformedData = {
      id_jatah: rows[0].id_jatah,
      nik: rows[0].nik,
      urea: rows[0].urea,
      phonska: rows[0].phonska,
      organik: rows[0].organik,
      pelanggan: {
        nama: rows[0].nama,
        kelompok_tani: rows[0].kelompok_tani
      }
    }

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Error updating quota:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 