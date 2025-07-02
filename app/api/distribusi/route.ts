import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const nik = searchParams.get('nik')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let conditions: string[] = []
    let params: any[] = []

    if (nik) {
      conditions.push('d.nik = ?')
      params.push(nik)
    }
    if (status) {
      conditions.push('d.status_acc = ?')
      params.push(status)
    }
    if (startDate && endDate) {
      conditions.push('d.tanggal BETWEEN ? AND ?')
      params.push(startDate, endDate)
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : ''

    const query = `
      SELECT 
        d.id_transaksi, d.nik, d.jenis_pupuk, 
        d.jumlah, d.tanggal, d.status_acc,
        p.nama as pelanggan_nama, 
        p.kelompok_tani as pelanggan_kelompok_tani,
        dist.nama as distributor_nama
      FROM distribusi_pupuk d
      JOIN pelanggan p ON d.nik = p.nik
      JOIN distributor dist ON d.id_distributor = dist.id_distributor
      ${whereClause}
      ORDER BY d.tanggal DESC
    `

    const [rows] = await pool.execute(query, params)
    
    // Transform the data to match the expected format
    const distributions = (rows as any[]).map(row => ({
      id_transaksi: row.id_transaksi,
      nik: row.nik,
      jenis_pupuk: row.jenis_pupuk,
      jumlah: row.jumlah,
      tanggal: row.tanggal,
      status_acc: row.status_acc,
      pelanggan: {
        nama: row.pelanggan_nama,
        kelompok_tani: row.pelanggan_kelompok_tani
      },
      distributor: {
        nama: row.distributor_nama
      }
    }))

    return NextResponse.json(distributions)
  } catch (error) {
    console.error('Error fetching distributions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { nik, id_distributor, jenis_pupuk, jumlah, tanggal } = data

    // Validate input
    if (!nik || !id_distributor || !jenis_pupuk || !jumlah || !tanggal) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if customer exists and has verification status
    const [customers] = await pool.execute(
      'SELECT status_verifikasi FROM pelanggan WHERE nik = ?',
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

    // Check remaining quota and pending requests
    const [quotas] = await pool.execute(
      'SELECT * FROM jatah_pupuk WHERE nik = ?',
      [nik]
    )

    if (!quotas || (quotas as any[]).length === 0) {
      return NextResponse.json(
        { error: 'No fertilizer quota found' },
        { status: 404 }
      )
    }

    // Get pending requests for the same fertilizer type
    const [pendingRequests] = await pool.execute(
      'SELECT SUM(jumlah) as pending_total FROM distribusi_pupuk WHERE nik = ? AND jenis_pupuk = ? AND status_acc = ?',
      [nik, jenis_pupuk, 'pending']
    )

    const quota = (quotas as any[])[0]
    const quotaField = jenis_pupuk.toLowerCase()
    const pendingAmount = (pendingRequests as any[])[0].pending_total || 0

    // Check if total requested amount exceeds quota
    if (quota[quotaField] < jumlah) {
      return NextResponse.json(
        { error: `Permintaan melebihi batas jatah pupuk ${jenis_pupuk} yang tersedia` },
        { status: 400 }
      )
    }

    // Create distribution record
    const [result] = await pool.execute(
      `INSERT INTO distribusi_pupuk 
       (nik, id_distributor, jenis_pupuk, jumlah, tanggal, status_acc)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [nik, id_distributor, jenis_pupuk, jumlah, tanggal]
    )

    // Fetch the created distribution with related data
    const [distributions] = await pool.execute(
      `SELECT 
        d.id_transaksi, d.nik, d.jenis_pupuk, 
        d.jumlah, d.tanggal, d.status_acc,
        p.nama as pelanggan_nama, 
        p.kelompok_tani as pelanggan_kelompok_tani,
        dist.nama as distributor_nama
      FROM distribusi_pupuk d
      JOIN pelanggan p ON d.nik = p.nik
      JOIN distributor dist ON d.id_distributor = dist.id_distributor
      WHERE d.id_transaksi = ?`,
      [(result as any).insertId]
    )

    const distribution = (distributions as any[])[0]
    return NextResponse.json({
      id_transaksi: distribution.id_transaksi,
      nik: distribution.nik,
      jenis_pupuk: distribution.jenis_pupuk,
      jumlah: distribution.jumlah,
      tanggal: distribution.tanggal,
      status_acc: distribution.status_acc,
      pelanggan: {
        nama: distribution.pelanggan_nama,
        kelompok_tani: distribution.pelanggan_kelompok_tani
      },
      distributor: {
        nama: distribution.distributor_nama
      }
    })
  } catch (error) {
    console.error('Error creating distribution:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const data = await req.json()
    const { id_transaksi, status_acc } = data

    if (!id_transaksi || !status_acc) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Start transaction
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // Get distribution details first
      const [distributions] = await connection.execute(
        'SELECT nik, jenis_pupuk, jumlah, status_acc FROM distribusi_pupuk WHERE id_transaksi = ?',
        [id_transaksi]
      )

      if (!distributions || (distributions as any[]).length === 0) {
        await connection.rollback()
        return NextResponse.json(
          { error: 'Distribution not found' },
          { status: 404 }
        )
      }

      const distribution = (distributions as any)[0]
      const quotaField = distribution.jenis_pupuk.toLowerCase()

      // If current status is already approved and new status is rejected
      // OR if current status is rejected and new status is approved
      // We need to handle quota restoration/deduction
      if (distribution.status_acc === 'approved' && status_acc === 'rejected') {
        // Restore quota
        await connection.execute(
          `UPDATE jatah_pupuk 
           SET ${quotaField} = ${quotaField} + ? 
           WHERE nik = ?`,
          [distribution.jumlah, distribution.nik]
        )
      } else if (distribution.status_acc !== 'approved' && status_acc === 'approved') {
        // Check if there's enough quota
        const [quotas] = await connection.execute(
          'SELECT * FROM jatah_pupuk WHERE nik = ?',
          [distribution.nik]
        )

        if (!quotas || (quotas as any[]).length === 0) {
          await connection.rollback()
          return NextResponse.json(
            { error: 'No fertilizer quota found' },
            { status: 404 }
          )
        }

        // Get total approved distributions for this fertilizer type
        const [approvedDistributions] = await connection.execute(
          'SELECT COALESCE(SUM(jumlah), 0) as total_approved FROM distribusi_pupuk WHERE nik = ? AND jenis_pupuk = ? AND status_acc = ?',
          [distribution.nik, distribution.jenis_pupuk, 'approved']
        )

        const quota = (quotas as any)[0]
        const totalApproved = (approvedDistributions as any)[0].total_approved || 0
        const remainingQuota = Math.max(0, quota[quotaField] - totalApproved)

        if (remainingQuota === 0) {
          await connection.rollback()
          return NextResponse.json(
            { error: `Insufficient quota. Remaining quota: 0kg` },
            { status: 400 }
          )
        }

        if (remainingQuota < distribution.jumlah) {
          await connection.rollback()
          return NextResponse.json(
            { error: `Insufficient quota. Remaining quota: ${remainingQuota}kg` },
            { status: 400 }
          )
        }

        // Deduct quota
        await connection.execute(
          `UPDATE jatah_pupuk 
           SET ${quotaField} = ${quotaField} - ? 
           WHERE nik = ?`,
          [distribution.jumlah, distribution.nik]
        )
      }

      // Update distribution status
      await connection.execute(
        'UPDATE distribusi_pupuk SET status_acc = ? WHERE id_transaksi = ?',
        [status_acc, id_transaksi]
      )

      await connection.commit()

      // Fetch updated distribution with related data
      const [updatedDistributions] = await pool.execute(
        `SELECT 
          d.id_transaksi, d.nik, d.jenis_pupuk, 
          d.jumlah, d.tanggal, d.status_acc,
          p.nama as pelanggan_nama, 
          p.kelompok_tani as pelanggan_kelompok_tani,
          dist.nama as distributor_nama
        FROM distribusi_pupuk d
        JOIN pelanggan p ON d.nik = p.nik
        JOIN distributor dist ON d.id_distributor = dist.id_distributor
        WHERE d.id_transaksi = ?`,
        [id_transaksi]
      )

      const updatedDistribution = (updatedDistributions as any)[0]
      return NextResponse.json({
        id_transaksi: updatedDistribution.id_transaksi,
        nik: updatedDistribution.nik,
        jenis_pupuk: updatedDistribution.jenis_pupuk,
        jumlah: updatedDistribution.jumlah,
        tanggal: updatedDistribution.tanggal,
        status_acc: updatedDistribution.status_acc,
        pelanggan: {
          nama: updatedDistribution.pelanggan_nama,
          kelompok_tani: updatedDistribution.pelanggan_kelompok_tani
        },
        distributor: {
          nama: updatedDistribution.distributor_nama
        }
      })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error('Error updating distribution:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 