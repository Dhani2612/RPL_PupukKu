import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const idDistributor = params.id

    if (!idDistributor) {
      return NextResponse.json(
        { error: 'ID distributor tidak ditemukan' },
        { status: 400 }
      )
    }

    // Ambil total pelanggan unik yang menerima distribusi dari distributor ini
    const { data: distribusiData, error: distribusiError } = await supabase
      .from('distribusi')
      .select('nik, id_distributor')
      .eq('id_distributor', idDistributor)

    if (distribusiError) {
      console.error('❌ Error ambil distribusi:', distribusiError)
      return NextResponse.json({ error: 'Gagal ambil distribusi' }, { status: 500 })
    }

    const pelangganSet = new Set<string>()
    distribusiData?.forEach((item) => {
      if (item.nik) pelangganSet.add(item.nik)
    })

    // Total distribusi = jumlah baris
    const totalDistribusi = distribusiData?.length || 0

    // Ambil jatah pupuk dari distributor ini
    const { data: jatahData, error: jatahError } = await supabase
      .from('jatah_pupuk')
      .select('id_jatah')
      .eq('id_distributor', idDistributor)

    if (jatahError) {
      console.error('❌ Error ambil jatah:', jatahError)
      return NextResponse.json({ error: 'Gagal ambil data jatah' }, { status: 500 })
    }

    return NextResponse.json({
      totalPelanggan: pelangganSet.size,
      totalDistribusi,
      totalJatah: jatahData?.length || 0
    })
  } catch (error) {
    console.error('❌ Error fetching distributor stats:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    )
  }
}
