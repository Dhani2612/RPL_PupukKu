'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type Distributor = {
  id_distributor: number
  nama: string
  username: string
  password: string
  created_at: string
  updated_at: string
}

export default function Home() {
  const [data, setData] = useState<Distributor[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from('distributor').select('*')
      if (error) setError(error.message)
      else setData(data as Distributor[])
    }

    fetchData()
  }, [])

  if (error) return <p>Error: {error}</p>

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Data Distributor</h1>
      <ul className="space-y-2">
        {data.map((item) => (
          <li key={item.id_distributor} className="bg-gray-100 p-2 rounded">
            <div><strong>Nama:</strong> {item.nama}</div>
            <div><strong>Username:</strong> {item.username}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
