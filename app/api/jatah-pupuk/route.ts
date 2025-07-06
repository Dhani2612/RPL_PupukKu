import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(req: Request) {
  try {
    console.log('✅ [GET] /api/jatah-pupuk called')

    const { searchParams } = new URL(req.url)
    const nik = searchParams.get('nik')
    console.log('📥 NIK parameter:', nik)

    // Ambil semua jatah pupuk
    const { data: jatahData, error: jatahError } = await supabase
      .from('jatah_pupuk')
      .select('*')

    if (jatahError) {
      console.error('❌ Gagal ambil jatah_pupuk:', jatahError)
      return NextResponse.json({ error: jatahError.message }, { status: 500 })
    }

    // Ambil semua pelanggan (untuk digabungkan info nama & kelompok)
    const { data: pelangganData, error: pelangganError } = await supabase
      .from('pelanggan')
      .select('nik, nama, kelompok_tani')

    if (pelangganError) {
      console.error('❌ Gagal ambil pelanggan:', pelangganError)
      return NextResponse.json({ error: pelangganError.message }, { status: 500 })
    }

    // Gabungkan data jatah dengan data pelanggan berdasarkan NIK
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

    // Jika pakai filter NIK
    const filtered = nik ? merged.find((item) => item.nik === nik) : merged
    if (nik && !filtered) {
      return NextResponse.json({ error: 'Quota not found' }, { status: 404 })
    }

    return NextResponse.json({ quotas: filtered })
  } catch (error) {
    console.error('❌ Error in /api/jatah-pupuk:', error)
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
