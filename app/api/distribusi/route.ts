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
      .select(`
        id_transaksi,
        nik,
        jenis_pupuk,
        jumlah,
        tanggal,
        status_acc,
        pelanggan:nik (
          nama,
          kelompok_tani
        ),
        distributor:id_distributor (
          nama
        )
      `)
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

    console.log('📦 Data distribusi (with join):', JSON.stringify(data, null, 2))
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Server Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


export async function PATCH(req: Request) {
  try {
    const { id_transaksi, status_acc } = await req.json()

    if (!id_transaksi || !status_acc) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Ambil data distribusi sebelum update, agar tahu nik, jenis, jumlah
    const { data: distribusi, error: distribusiError } = await supabase
      .from('distribusi_pupuk')
      .select('nik, jenis_pupuk, jumlah')
      .eq('id_transaksi', id_transaksi)
      .single()

    if (distribusiError || !distribusi) {
      return NextResponse.json({ error: 'Distribusi tidak ditemukan' }, { status: 404 })
    }

    const { nik, jenis_pupuk, jumlah } = distribusi

    // Update status distribusi
    const { data, error } = await supabase
      .from('distribusi_pupuk')
      .update({ status_acc })
      .eq('id_transaksi', id_transaksi)
      .select(`
        id_transaksi,
        nik,
        jenis_pupuk,
        jumlah,
        tanggal,
        status_acc,
        pelanggan:nik (
          nama,
          kelompok_tani
        ),
        distributor:id_distributor (
          nama
        )
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Jika disetujui, kurangi jatah pupuk
    if (status_acc === 'approved') {
      const kolom = jenis_pupuk.toLowerCase() // 'urea' | 'phonska' | 'organik'

      const { error: updateJatahError } = await supabase
        .rpc('kurangi_jatah_pupuk', {
          p_nik: nik,
          p_jenis: kolom,
          p_jumlah: jumlah
        })

      if (updateJatahError) {
        console.error('❌ Gagal mengurangi jatah pupuk:', updateJatahError)
        return NextResponse.json({ error: 'Gagal mengurangi jatah pupuk' }, { status: 500 })
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Error in PATCH /api/distribusi:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { nik, id_distributor, jenis_pupuk, jumlah, tanggal } = body

    if (!nik || !id_distributor || !jenis_pupuk || !jumlah || !tanggal) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('distribusi_pupuk')
      .insert([
        {
          nik,
          id_distributor,
          jenis_pupuk,
          jumlah,
          tanggal,
          status_acc: 'pending' // default status
        }
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data) // ✅ kembalikan data valid
  } catch (error) {
    console.error('❌ Error in POST /api/distribusi:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}