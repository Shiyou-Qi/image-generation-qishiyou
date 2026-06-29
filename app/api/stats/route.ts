import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const { data, error, count } = await supabase
    .from('generation_history')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)

  if (error) {
    console.error('获取统计失败:', error)
    return NextResponse.json({ error: '获取统计失败' }, { status: 500 })
  }

  const latestDate = data && data.length > 0 ? data[0].created_at : null

  return NextResponse.json({
    total: count || 0,
    latestDate,
  })
}
