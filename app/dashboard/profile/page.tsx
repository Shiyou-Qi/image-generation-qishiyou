'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import useSWR from 'swr'

interface Profile {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  created_at: string
}

export default function ProfilePage() {
  const [displayName, setDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { data: profile, isLoading: isLoadingProfile, mutate } = useSWR(
    '/api/profile',
    async (url) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error('获取资料失败')
      return res.json()
    }
  )

  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name)
    }
  }, [profile])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('未登录')

      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', user.id)

      if (error) throw error

      toast.success('个人资料已更新')
      mutate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    const supabase = createClient()
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        profile?.email,
        {
          redirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
            `${window.location.origin}/auth/callback`,
        }
      )

      if (error) throw error

      toast.success('重置密码邮件已发送，请检查邮箱')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '发送失败')
    }
  }

  return (
    <div className="space-y-8 p-6 md:p-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">个人资料</h1>
        <p className="text-muted-foreground">
          管理你的账户信息
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>账户信息</CardTitle>
          <CardDescription>
            查看和更新你的账户信息
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="email">邮箱地址</Label>
              <Input
                id="email"
                type="email"
                value={profile?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                邮箱地址无法修改
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="display-name">显示名称</Label>
              <Input
                id="display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="输入你的名字"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="joined-date">加入日期</Label>
              <Input
                id="joined-date"
                type="text"
                value={
                  profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString('zh-CN')
                    : '-'
                }
                disabled
                className="bg-muted"
              />
            </div>

            <Button type="submit" disabled={isLoading || isLoadingProfile}>
              {isLoading ? '保存中...' : '保存更改'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>安全设置</CardTitle>
          <CardDescription>
            管理你的账户安全
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleChangePassword}>
            更改密码
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            点击按钮将发送重置密码邮件到你的邮箱
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
