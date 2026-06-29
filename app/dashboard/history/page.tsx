'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import useSWR from 'swr'
import { Trash2, Copy, Download } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface GenerationRecord {
  id: string
  prompt: string
  model: string
  image_urls: string[]
  created_at: string
}

export default function HistoryPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: records = [], isLoading, mutate } = useSWR(
    '/api/history',
    async (url) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error('获取历史失败')
      return res.json()
    }
  )

  const supabase = createClient()

  const handleDelete = async (recordId: string) => {
    if (!confirm('确定要删除这条记录吗？')) return

    try {
      const res = await fetch(`/api/history/${recordId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('删除失败')
      
      toast.success('记录已删除')
      mutate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除失败')
    }
  }

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt)
    toast.success('提示词已复制')
  }

  const handleDownloadImage = async (imageUrl: string, recordId: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `generation-${recordId}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('图像已下载')
    } catch (error) {
      toast.error('下载失败')
    }
  }

  const filteredRecords = records.filter((record: GenerationRecord) =>
    record.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-8 p-6 md:p-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">创作历史</h1>
        <p className="text-muted-foreground">
          查看和管理你所有的生成记录
        </p>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="搜索提示词..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">暂无创作记录</p>
            <Button asChild>
              <a href="/">开始创作</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRecords.map((record: GenerationRecord) => (
            <Card key={record.id} className="overflow-hidden">
              <CardContent className="p-0">
                {record.image_urls.length > 0 && (
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <Image
                      src={record.image_urls[0]}
                      alt={record.prompt}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="space-y-3 p-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">模型</p>
                    <p className="text-sm font-semibold">{record.model}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">提示词</p>
                    <p className="line-clamp-2 text-sm">{record.prompt}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {new Date(record.created_at).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyPrompt(record.prompt)}
                      className="flex-1"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {record.image_urls[0] && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleDownloadImage(record.image_urls[0], record.id)
                        }
                        className="flex-1"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(record.id)}
                      className="flex-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
