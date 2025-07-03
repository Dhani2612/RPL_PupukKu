import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let query = supabase
      .from('distribusi')
      .select(`
        id_distribusi,
        tanggal_distribusi,
        status_acc,
        pelanggan:nik (
          nik,
          nama,
          kelompok_tani,
          alamat
        ),
        pupuk: id_pupuk (
          jenis_pupuk,
          jumlah_kg
        )
      `)
      .order('tanggal_distribusi', { ascending: false })

    // Filter by status
    if (status) {
      query = query.eq('status_acc', status)
    }

    // Filter by date
    if (startDate && endDate) {
      query = query.gte('tanggal_distribusi', startDate).lte('tanggal_distribusi', endDate)
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
