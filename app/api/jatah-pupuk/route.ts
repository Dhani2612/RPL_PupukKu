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
