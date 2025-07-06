import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const nik = searchParams.get('nik')  // ✅ Tambahkan ini
    const limit = searchParams.get('limit')  // ✅ Untuk aktivitas terakhir

    let query = supabase
      .from('distribusi')
      .select(`
        id_distribusi,
        tanggal_distribusi,
        status_acc,
        nik,
        jenis_pupuk,
        jumlah
      `)
      .order('tanggal_distribusi', { ascending: false })

    if (status) {
      query = query.eq('status_acc', status)
    }

    if (startDate && endDate) {
      query = query.gte('tanggal_distribusi', startDate).lte('tanggal_distribusi', endDate)
    }

    if (nik) {
      query = query.eq('nik', nik)
    }

    if (limit) {
      query = query.limit(Number(limit))
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Error fetching distribusi:', error)
      return NextResponse.json({ error: 'Gagal mengambil data distribusi' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

