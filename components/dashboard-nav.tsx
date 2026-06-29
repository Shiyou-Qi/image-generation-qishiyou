'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Home, History, User } from 'lucide-react'
import { toast } from 'sonner'

interface DashboardNavProps {
  user: any
}

export default function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  const navItems = [
    {
      href: '/dashboard',
      icon: Home,
      label: '仪表板',
    },
    {
      href: '/dashboard/history',
      icon: History,
      label: '历史',
    },
    {
      href: '/dashboard/profile',
      icon: User,
      label: '资料',
    },
  ]

  return (
    <nav className="border-b bg-background">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="font-bold text-lg">
            🎨 图像生成
          </Link>
          <div className="hidden md:flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              {user?.email?.split('@')[0]}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">登出</span>
          </Button>
        </div>
      </div>
    </nav>
  )
}
