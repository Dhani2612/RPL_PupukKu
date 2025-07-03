import { NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function DELETE(
  req: Request,
  { params }: { params: { nik: string } }
) {
  try {
    const { nik } = params

    // Cek apakah pelanggan ada dulu
    const { data: existing, error: fetchError } = await supabase
      .from('pelanggan')
      .select('nik')
      .eq('nik', nik)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Lanjutkan hapus
    const { error: deleteError } = await supabase
      .from('pelanggan')
      .delete()
      .eq('nik', nik)

    if (deleteError) {
      console.error('Supabase delete error:', deleteError)
      return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Customer deleted successfully' })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}