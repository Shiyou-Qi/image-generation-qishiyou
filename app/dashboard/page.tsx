'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import useSWR from 'swr'

interface Profile {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  created_at: string
}

interface GenerationRecord {
  id: string
  prompt: string
  model: string
  image_urls: string[]
  created_at: string
}

export default function DashboardPage() {
  const supabase = createClient()
  
  const { data: profile, isLoading: isLoadingProfile } = useSWR(
    '/api/profile',
    async (url) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch profile')
      return res.json()
    }
  )

  const { data: stats } = useSWR(
    '/api/stats',
    async (url) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch stats')
      return res.json()
    }
  )

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return (
    <div className="space-y-8 p-6 md:p-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          欢迎回来，{profile?.display_name || '用户'}
        </h1>
        <p className="text-muted-foreground">
          管理你的个人资料和查看创作历史
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-sm font-medium">总创作数</CardTitle>
            <CardDescription>
              {isLoadingProfile ? '-' : stats?.total || 0}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-sm font-medium">邮箱</CardTitle>
            <CardDescription className="truncate">
              {isLoadingProfile ? '-' : profile?.email}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-sm font-medium">账户状态</CardTitle>
            <CardDescription>
              {isLoadingProfile ? '加载中...' : '活跃'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">快速操作</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Button asChild className="h-12">
            <a href="/">开始创作</a>
          </Button>
          <Button asChild variant="outline" className="h-12">
            <a href="/dashboard/history">查看历史</a>
          </Button>
          <Button asChild variant="outline" className="h-12">
            <a href="/dashboard/profile">个人资料</a>
          </Button>
          <Button variant="destructive" className="h-12" onClick={handleSignOut}>
            登出
          </Button>
        </div>
      </div>
    </div>
  )
}
