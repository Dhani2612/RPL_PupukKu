export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: Request) {
  try {
    const { nik, nama, kelompok_tani, password, alamat, tanggal_lahir } = await req.json()

    // 1. Validasi input
    if (!nik || !nama || !password) {
      return NextResponse.json(
        { error: 'NIK, nama, dan password wajib diisi.' },
        { status: 400 }
      )
    }

    // 2. Cek apakah sudah ada
    const { data: existing, error: checkError } = await supabase
      .from('pelanggan')
      .select('nik')
      .eq('nik', nik)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = “No rows found” biasa saat single dan kosong
      console.error('Error checking existing pelanggan:', checkError)
      return NextResponse.json(
        { error: 'Gagal cek NIK: ' + checkError.message },
        { status: 500 }
      )
    }
    if (existing) {
      return NextResponse.json(
        { error: 'NIK sudah terdaftar.' },
        { status: 400 }
      )
    }

    // 3. Insert data baru
    const { data: inserted, error: insertError } = await supabase
      .from('pelanggan')
      .insert([
        {
          nik,
          nama,
          kelompok_tani: kelompok_tani || null,
          password,
          alamat: alamat || null,
          tanggal_lahir: tanggal_lahir || null,
          status_verifikasi: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])

      .select()              // minta Supabase mengembalikan baris yang baru dibuat

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      return NextResponse.json(
        { error: 'Gagal registrasi: ' + insertError.message },
        { status: 500 }
      )
    }

    // 4. Sukses
    return NextResponse.json(
      {
        message: 'Registrasi berhasil. Silakan menunggu verifikasi admin.',
        pelanggan: inserted![0]
      },
      { status: 201 }
    )
  } catch (err: any) {
    console.error('Unhandled registration error:', err)
    return NextResponse.json(
      { error: 'Internal server error: ' + err.message },
      { status: 500 }
    )
  }
}
