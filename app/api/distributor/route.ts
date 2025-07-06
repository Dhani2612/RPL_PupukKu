import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(req: Request) {
  try {
    const { data, error } = await supabase
      .from('distributor')
      .select('id_distributor, nama')

    if (error) {
      console.error('❌ Error fetching distributors:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
