import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const { id } = await params

  const { error } = await supabase
    .from('generation_history')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('删除失败:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
