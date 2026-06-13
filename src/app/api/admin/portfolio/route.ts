import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('portfolio_items')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('[Portfolio GET]', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const admin = createAdminClient()
    
    if (!body.title || !body.slug || !body.item_type) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('portfolio_items')
      .insert([body])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('[Portfolio POST]', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
