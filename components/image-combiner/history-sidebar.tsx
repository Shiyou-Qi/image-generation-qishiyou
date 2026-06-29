"use client"

import type React from "react"
import { memo, useState, useCallback, useRef, useEffect } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import type { Generation } from "./types"
import { Loader2, Plus, ImageIcon, Trash2, X, ChevronLeft, User } from "lucide-react"

interface HistorySidebarProps {
  generations: Generation[]
  selectedId?: string | null
  onSelect: (id: string) => void
  onCancel: (id: string) => void
  onDelete?: (id: string) => Promise<void>
  onNewChat: () => void
  isLoading?: boolean
  hasInitiallyLoaded?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  isLoadingMore?: boolean
  onCloseMobile?: () => void
  onUserClick?: () => void
  onCollapse?: () => void
  isCollapsed?: boolean
}

function formatTime(ts: number): string {
  const now = Date.now()
  const diff = now - ts
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < minute) return "刚刚"
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`
  const d = new Date(ts)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

const HistoryRow = memo(function HistoryRow({
  gen,
  index,
  isSelected,
  onSelect,
  onCancel,
  onDelete,
  deletingId,
  onDeleteClick,
}: {
  gen: Generation
  index: number
  isSelected: boolean
  onSelect: (id: string) => void
  onCancel: (id: string) => void
  onDelete?: (id: string) => Promise<void>
  deletingId: string | null
  onDeleteClick: (e: React.MouseEvent, id: string) => void
}) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const title = gen.prompt?.trim() || "未命名生成"

  return (
    <div
      onClick={() => onSelect(gen.id)}
      role="button"
      tabIndex={0}
      aria-label={`对话 ${index + 1}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect(gen.id)
        }
      }}
      className={cn(
        "group relative flex items-center gap-3 w-full rounded-lg p-2 text-left transition-colors cursor-pointer",
        isSelected ? "bg-white/10" : "hover:bg-white/5",
        deletingId === gen.id && "opacity-50 pointer-events-none",
      )}
    >
      {/* Thumbnail */}
      <div className="relative flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border border-white/10 bg-white/5">
        {gen.imageUrl && gen.status !== "error" ? (
          <Image
            src={gen.imageUrl || "/placeholder.svg"}
            alt={title}
            width={96}
            height={96}
            quality={70}
            unoptimized={gen.imageUrl?.startsWith("data:") || gen.imageUrl?.startsWith("blob:")}
            className={cn("absolute inset-0 w-full h-full object-cover transition-opacity", imageLoaded ? "opacity-100" : "opacity-0")}
            onLoad={() => setImageLoaded(true)}
          />
        ) : null}

        {gen.status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="text-[10px] font-mono text-white/90">{Math.round(gen.progress)}%</span>
          </div>
        )}

        {gen.status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center text-white/40">
            <X className="w-5 h-5" />
          </div>
        )}

        {!gen.imageUrl && gen.status !== "loading" && gen.status !== "error" && (
          <div className="absolute inset-0 flex items-center justify-center text-white/30">
            <ImageIcon className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/90 truncate leading-tight">{title}</p>
        <p className="text-[11px] text-white/40 mt-0.5">
          {gen.status === "loading" ? "生成中…" : gen.status === "error" ? "生成失败" : formatTime(gen.timestamp)}
        </p>
      </div>

      {/* Actions */}
      {gen.status === "loading" ? (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onCancel(gen.id)
          }}
          className="flex-shrink-0 text-[11px] px-2 py-1 rounded-full bg-white/10 hover:bg-white hover:text-black text-white/80 transition-colors"
        >
          取消
        </button>
      ) : onDelete ? (
        <button
          onClick={(e) => onDeleteClick(e, gen.id)}
          disabled={deletingId === gen.id}
          aria-label="删除对话"
          className="flex-shrink-0 p-1.5 rounded-full text-white/40 opacity-0 group-hover:opacity-100 hover:bg-white/10 hover:text-white transition-all"
        >
          {deletingId === gen.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      ) : null}
    </div>
  )
})

export const HistorySidebar = memo(function HistorySidebar({
  generations,
  selectedId,
  onSelect,
  onCancel,
  onDelete,
  onNewChat,
  isLoading = false,
  hasInitiallyLoaded = false,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  onCloseMobile,
  onUserClick,
  onCollapse,
}: HistorySidebarProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const handleDelete = useCallback(
    async (e: React.MouseEvent, id: string) => {
      e.stopPropagation()
      if (!onDelete) return
      setDeletingId(id)
      try {
        await onDelete(id)
      } catch (error) {
        console.error("Failed to delete generation:", error)
      } finally {
        setDeletingId(null)
      }
    },
    [onDelete],
  )

  useEffect(() => {
    const sentinel = sentinelRef.current
    const root = scrollContainerRef.current
    if (!sentinel || !root || !hasMore || !onLoadMore) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMore()
      },
      { root, rootMargin: "200px 0px" },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, onLoadMore])

  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id)
      onCloseMobile?.()
    },
    [onSelect, onCloseMobile],
  )

  return (
    <div className="flex flex-col h-full min-h-0 bg-black/60">
      {/* Top bar: Branding + User + Controls */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 border-b border-white/10">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <h1 className="text-sm font-bold text-white leading-none whitespace-nowrap">
            <span className="text-white/40">v0</span> 图像生成
          </h1>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* User profile button */}
          <button
            onClick={onUserClick}
            aria-label="用户账户"
            title="用户账户"
            className="p-2 rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <User className="w-4 h-4" />
          </button>
          {/* Collapse button - desktop only */}
          <button
            onClick={onCollapse}
            aria-label="折叠侧栏"
            title="折叠侧栏"
            className="hidden lg:flex p-2 rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {/* Close button - mobile only */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              aria-label="关闭侧栏"
              className="lg:hidden p-2 rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* New chat */}
      <div className="px-3 pb-3 flex-shrink-0">
              <button
                onClick={() => {
                  onNewChat()
                  onCloseMobile?.()
                }}
                className="flex items-center justify-center gap-2 w-full h-10 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors"
              >
          <Plus className="w-4 h-4" />
          新建对话
        </button>
      </div>

      <div className="px-4 pb-2 flex-shrink-0">
        <p className="text-[11px] font-medium text-white/40 uppercase tracking-wider">历史对话</p>
      </div>

      {/* List */}
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto px-2 pb-4 space-y-0.5">
        {generations.length === 0 && hasInitiallyLoaded ? (
          <div className="flex flex-col items-center justify-center h-40 text-white/30 gap-2">
            <ImageIcon className="w-8 h-8" />
            <p className="text-xs">暂无历史对话</p>
          </div>
        ) : generations.length === 0 && isLoading ? (
          <div className="flex items-center justify-center h-40 text-white/30">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <>
            {generations.map((gen, index) => (
              <HistoryRow
                key={gen.id}
                gen={gen}
                index={index}
                isSelected={selectedId === gen.id}
                onSelect={handleSelect}
                onCancel={onCancel}
                onDelete={onDelete}
                deletingId={deletingId}
                onDeleteClick={handleDelete}
              />
            ))}
            {hasMore && (
              <div ref={sentinelRef} className="flex items-center justify-center py-4 text-white/30">
                {isLoadingMore && <Loader2 className="w-5 h-5 animate-spin" />}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
})
