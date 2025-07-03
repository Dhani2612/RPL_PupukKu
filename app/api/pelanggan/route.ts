import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

interface Pelanggan {
  nik: string
  nama: string
  kelompok_tani?: string
  alamat?: string
  tanggal_lahir?: string
  status_verifikasi: boolean
  created_at?: string
  updated_at?: string
}

// GET: Ambil semua data pelanggan atau berdasarkan NIK
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const nik = searchParams.get('nik')

    let query = supabase
      .from('pelanggan')
      .select('nik, nama, kelompok_tani, alamat, tanggal_lahir, status_verifikasi, created_at, updated_at')
      .returns<Pelanggan[]>()

if (nik) {
const { data, error } = await (supabase
  .from('pelanggan')
  // @ts-ignore
  .eq('nik', nik)
  .select('*')
  .single()) // ← abaikan error TypeScript-nya
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  return NextResponse.json(data)
}


    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: Update status verifikasi pelanggan
export async function PATCH(req: Request) {
  try {
    const { nik, status_verifikasi } = await req.json()

    if (!nik) {
      return NextResponse.json({ error: 'NIK is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('pelanggan')
      .update({ status_verifikasi })
      .eq('nik', nik)
      .select()
      .single<Pelanggan>()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
