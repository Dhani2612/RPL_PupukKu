import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

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
