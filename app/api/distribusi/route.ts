import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const nik = searchParams.get('nik')
    const limit = searchParams.get('limit')

    console.log('🔍 Params:', { status, startDate, endDate, nik, limit })

    let query = supabase
      .from('distribusi_pupuk')
      .select('*') // ambil semua kolom dulu
      .order('tanggal', { ascending: false })

    if (status) query = query.eq('status_acc', status)
    if (nik) query = query.eq('nik', nik)
    if (startDate && endDate) {
      query = query.gte('tanggal', startDate).lte('tanggal', endDate)
    }
    if (limit) {
      const limitValue = parseInt(limit)
      if (!isNaN(limitValue)) query = query.limit(limitValue)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Supabase Error:', error)
      return NextResponse.json({ error: 'Gagal mengambil data distribusi' }, { status: 500 })
    }

    console.log('📦 Data distribusi:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Server Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
