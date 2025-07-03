import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(req: Request) {
  try {
    console.log('✅ [GET] /api/jatah-pupuk called')

    const { searchParams } = new URL(req.url)
    const nik = searchParams.get('nik')
    console.log('📥 NIK parameter:', nik)

    // Query data jatah + pelanggan
    const { data: quotasRaw, error: quotasError } = nik
      ? await supabase
          .from('jatah_pupuk')
          .select(`
            id_jatah,
            nik,
            urea,
            phonska,
            organik,
            pelanggan:nama,
            pelanggan!inner(kelompok_tani)
          `)
          .eq('nik', nik)
      : await supabase
          .from('jatah_pupuk')
          .select(`
            id_jatah,
            nik,
            urea,
            phonska,
            organik,
            pelanggan:nama,
            pelanggan!inner(kelompok_tani)
          `)

    if (quotasError) {
      console.error('❌ Supabase quota error:', quotasError)
      return NextResponse.json({ error: 'Failed to fetch quota' }, { status: 500 })
    }

    if (nik && quotasRaw.length === 0) {
      return NextResponse.json({ error: 'Quota not found' }, { status: 404 })
    }

    // Query total stats
    const { data: totalStats, error: totalErr } = await supabase
      .from('jatah_pupuk')
      .select('urea, phonska, organik')

    if (totalErr) {
      console.error('❌ Error fetching total stats:', totalErr)
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }

    const total = {
      urea: totalStats?.reduce((sum, row) => sum + Number(row.urea ?? 0), 0),
      phonska: totalStats?.reduce((sum, row) => sum + Number(row.phonska ?? 0), 0),
      organik: totalStats?.reduce((sum, row) => sum + Number(row.organik ?? 0), 0)
    }

    // Query used stats (approved only)
    const { data: usedStats, error: usedErr } = await supabase
      .from('distribusi_pupuk')
      .select('jenis_pupuk, jumlah')
      .eq('status_acc', 'approved')

    if (usedErr) {
      console.error('❌ Error fetching used stats:', usedErr)
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }

    const used = {
      urea: usedStats?.filter(r => r.jenis_pupuk === 'Urea').reduce((sum, r) => sum + Number(r.jumlah ?? 0), 0) || 0,
      phonska: usedStats?.filter(r => r.jenis_pupuk === 'Phonska').reduce((sum, r) => sum + Number(r.jumlah ?? 0), 0) || 0,
      organik: usedStats?.filter(r => r.jenis_pupuk === 'Organik').reduce((sum, r) => sum + Number(r.jumlah ?? 0), 0) || 0
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

    const quotas = quotasRaw.map((row: any) => ({
      id_jatah: row.id_jatah,
      nik: row.nik,
      urea: row.urea,
      phonska: row.phonska,
      organik: row.organik,
      pelanggan: {
        nama: row.pelanggan,
        kelompok_tani: row.kelompok_tani
      }
    }))

    return NextResponse.json({
      quotas: nik ? quotas[0] : quotas,
      stats
    })
  } catch (error) {
    console.error('❌ Uncaught error fetching quotas:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
