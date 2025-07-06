import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const nik = searchParams.get('nik')

    // Ambil semua jatah pupuk
    const { data: jatahData, error: jatahError } = await supabase
      .from('jatah_pupuk')
      .select('*')

    if (jatahError) {
      console.error('❌ Gagal ambil jatah_pupuk:', jatahError)
      return NextResponse.json({ error: jatahError.message }, { status: 500 })
    }

    // Ambil data pelanggan untuk digabungkan
    const { data: pelangganData, error: pelangganError } = await supabase
      .from('pelanggan')
      .select('nik, nama, kelompok_tani')

    if (pelangganError) {
      console.error('❌ Gagal ambil pelanggan:', pelangganError)
      return NextResponse.json({ error: pelangganError.message }, { status: 500 })
    }

    // Gabungkan data jatah dan pelanggan
    const merged = jatahData.map((jatah) => {
      const match = pelangganData.find((p) => p.nik === jatah.nik)
      return {
        ...jatah,
        pelanggan: {
          nama: match?.nama || '-',
          kelompok_tani: match?.kelompok_tani || '-'
        }
      }
    })

    // Hitung total jatah pupuk
    const total = {
      urea: merged.reduce((sum, q) => sum + (q.urea || 0), 0),
      phonska: merged.reduce((sum, q) => sum + (q.phonska || 0), 0),
      organik: merged.reduce((sum, q) => sum + (q.organik || 0), 0),
    }

    // Ambil distribusi pupuk yang approved
    const { data: distribusiData, error: distribusiError } = await supabase
      .from('distribusi_pupuk')
      .select('jenis_pupuk, jumlah')
      .eq('status_acc', 'approved')

    if (distribusiError) {
      console.error('❌ Gagal ambil distribusi_pupuk:', distribusiError)
      return NextResponse.json({ error: distribusiError.message }, { status: 500 })
    }

    // Hitung jumlah pupuk yang sudah digunakan
    const used = { urea: 0, phonska: 0, organik: 0 }
    for (const item of distribusiData || []) {
      if (item.jenis_pupuk === 'Urea') used.urea += item.jumlah || 0
      if (item.jenis_pupuk === 'Phonska') used.phonska += item.jumlah || 0
      if (item.jenis_pupuk === 'Organik') used.organik += item.jumlah || 0
    }

    // Hitung sisa jatah
    const remaining = {
      urea: total.urea - used.urea,
      phonska: total.phonska - used.phonska,
      organik: total.organik - used.organik
    }

    const filtered = nik ? merged.find((item) => item.nik === nik) : merged

    return NextResponse.json({
      quotas: filtered || [],
      stats: { total, used, remaining }
    })

  } catch (error) {
    console.error('❌ Error in GET /api/jatah-pupuk:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { nik, urea, phonska, organik } = body

    if (!nik) {
      return NextResponse.json({ error: 'NIK is required' }, { status: 400 })
    }

    // Cek apakah pelanggan ada dan terverifikasi
    const { data: customer, error: customerError } = await supabase
      .from('pelanggan')
      .select('status_verifikasi')
      .eq('nik', nik)
      .single()

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    if (!customer.status_verifikasi) {
      return NextResponse.json({ error: 'Customer is not verified' }, { status: 403 })
    }

    // Cek apakah quota sudah ada
    const { data: existing, error: existingError } = await supabase
      .from('jatah_pupuk')
      .select('id_jatah')
      .eq('nik', nik)

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 })
    }

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Quota already exists for this customer' }, { status: 400 })
    }

    // Insert jatah baru
    const { data: inserted, error: insertError } = await supabase
      .from('jatah_pupuk')
      .insert([
        {
          nik,
          urea: urea || 0,
          phonska: phonska || 0,
          organik: organik || 0
        }
      ])
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Ambil info pelanggan
    const { data: pelangganData } = await supabase
      .from('pelanggan')
      .select('nama, kelompok_tani')
      .eq('nik', nik)
      .single()

    return NextResponse.json({
      ...inserted,
      pelanggan: {
        nama: pelangganData?.nama || '-',
        kelompok_tani: pelangganData?.kelompok_tani || '-'
      }
    })
  } catch (error) {
    console.error('❌ Error in POST /api/jatah-pupuk:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { nik, urea, phonska, organik } = body

    if (!nik) {
      return NextResponse.json({ error: 'NIK is required' }, { status: 400 })
    }

    const updates: Record<string, number> = {}
    if (urea !== undefined) updates.urea = urea
    if (phonska !== undefined) updates.phonska = phonska
    if (organik !== undefined) updates.organik = organik

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No data to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('jatah_pupuk')
      .update(updates)
      .eq('nik', nik)
      .select()
      .single()

    if (error) {
      console.error('❌ Supabase update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: pelanggan } = await supabase
      .from('pelanggan')
      .select('nama, kelompok_tani')
      .eq('nik', nik)
      .single()

    return NextResponse.json({
      ...data,
      pelanggan: {
        nama: pelanggan?.nama || '-',
        kelompok_tani: pelanggan?.kelompok_tani || '-'
      }
    })
  } catch (error) {
    console.error('❌ PATCH error in /api/jatah-pupuk:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
