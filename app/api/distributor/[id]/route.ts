import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const [rows] = await pool.execute(
      `SELECT 
        id_distributor, nama, username, 
        created_at, updated_at
      FROM distributor 
      WHERE id_distributor = ?`,
      [id]
    )

    if (!rows || (rows as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Distributor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json((rows as any)[0])
  } catch (error) {
    console.error('Error fetching distributor:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const data = await req.json()
    const { nama, username } = data

    // Validate required fields
    if (!nama || !username) {
      return NextResponse.json(
        { error: 'Name and username are required' },
        { status: 400 }
      )
    }

    // Check if username is already taken by another distributor
    const [existingUsers] = await pool.execute(
      'SELECT id_distributor FROM distributor WHERE username = ? AND id_distributor != ?',
      [username, id]
    )

    if ((existingUsers as any[]).length > 0) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 400 }
      )
    }

    // Update distributor
    const query = `
      UPDATE distributor 
      SET nama = ?, 
          username = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id_distributor = ?
    `

    const [result] = await pool.execute(query, [
      nama,
      username,
      id
    ])

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: 'Distributor not found' },
        { status: 404 }
      )
    }

    // Fetch updated distributor data
    const [rows] = await pool.execute(
      `SELECT 
        id_distributor, nama, username, 
        created_at, updated_at
      FROM distributor 
      WHERE id_distributor = ?`,
      [id]
    )

    return NextResponse.json((rows as any)[0])
  } catch (error) {
    console.error('Error updating distributor:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 