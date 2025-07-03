export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: Request) {
  try {
    const { nik, nama, kelompok_tani, password, alamat, tanggal_lahir } = await req.json()


    // Validasi input
    if (!nik || !nama || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })



    }

    // Cek apakah NIK sudah terdaftar
    const { data: existingUser, error: checkError } = await supabase
      .from('pelanggan')
      .select('nik')
      .eq('nik', nik)
      .single()

    if (checkError === null && existingUser) {
      return NextResponse.json({ error: 'NIK already registered' }, { status: 400 })


    }

    // Insert user baru
    const { error: insertError } = await supabase.from('pelanggan').insert([
      {
        nik,
        nama,
        kelompok_tani: kelompok_tani || null,
        password, // ⚠️ nanti bisa diganti hash
        alamat: alamat || null,
        tanggal_lahir: tanggal_lahir || null,
        status_verifikasi: false
      }



    ])

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Registration successful. Please wait for admin verification.'
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })



  }
}