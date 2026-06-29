import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@/lib/supabase/client'

export interface GenerationRecord {
  id: string
  user_id: string
  prompt: string
  model: string
  image_urls: string[]
  created_at: string
  updated_at: string
}

// 获取用户的创作历史
export async function getGenerationHistory(userId: string, limit = 50) {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase
    .from('generation_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('获取历史记录失败:', error)
    return []
  }

  return data as GenerationRecord[]
}

// 添加新的生成记录（客户端）
export async function addGenerationRecord(
  prompt: string,
  model: string,
  imageUrls: string[]
) {
  const supabase = createBrowserClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('未登录')
  }

  const { data, error } = await supabase
    .from('generation_history')
    .insert({
      user_id: user.id,
      prompt,
      model,
      image_urls: imageUrls,
    })
    .select()

  if (error) {
    console.error('添加历史记录失败:', error)
    throw error
  }

  return data[0] as GenerationRecord
}

// 删除生成记录
export async function deleteGenerationRecord(recordId: string) {
  const supabase = createBrowserClient()
  
  const { error } = await supabase
    .from('generation_history')
    .delete()
    .eq('id', recordId)

  if (error) {
    console.error('删除历史记录失败:', error)
    throw error
  }
}

// 获取用户的统计信息
export async function getUserStats(userId: string) {
  const supabase = await createServerClient()
  
  const { data, error, count } = await supabase
    .from('generation_history')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)

  if (error) {
    console.error('获取统计信息失败:', error)
    return { total: 0, latestDate: null }
  }

  const latestDate = data && data.length > 0 ? data[0].created_at : null

  return {
    total: count || 0,
    latestDate,
  }
}
