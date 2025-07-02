import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(req: Request) {
  try {
    const [rows] = await pool.execute(
      `SELECT id_distributor, nama
       FROM distributor`
    )

    if (!rows || (rows as any[]).length === 0) {
      return NextResponse.json([])
    }

    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error fetching distributors:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 