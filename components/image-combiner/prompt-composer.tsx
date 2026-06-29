"use client"

import type React from "react"
import { memo, useCallback } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ModelSelector } from "./model-selector"
import { cn } from "@/lib/utils"
import { isImageFile } from "@/lib/image-utils"
import { ArrowUp, ImagePlus, Search, Settings2, X, Loader2, Link2 } from "lucide-react"
import type { ModelType, ThinkingLevel, Resolution, Quality } from "./types"

interface PromptComposerProps {
  prompt: string
  setPrompt: (prompt: string) => void
  aspectRatio: string
  setAspectRatio: (ratio: string) => void
  availableAspectRatios: Array<{ value: string; label: string; icon: React.ReactNode }>
  selectedModel: ModelType
  setSelectedModel: (model: ModelType) => void
  thinkingLevel: ThinkingLevel
  setThinkingLevel: (level: ThinkingLevel) => void
  resolution: Resolution
  setResolution: (res: Resolution) => void
  quality: Quality
  setQuality: (q: Quality) => void
  useGrounding: boolean
  setUseGrounding: (use: boolean) => void
  useUrls: boolean
  setUseUrls: (use: boolean) => void
  image1Preview: string | null
  image2Preview: string | null
  image1Url: string
  image2Url: string
  canGenerate: boolean
  isLoading: boolean
  onGenerate: () => void
  onImageUpload: (file: File, slot: 1 | 2) => Promise<void>
  onUrlChange: (url: string, slot: 1 | 2) => void
  onClearImage: (slot: 1 | 2) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onPromptPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void
  onImageFullscreen: (url: string) => void
  promptTextareaRef: React.RefObject<HTMLTextAreaElement | null>
}

const ImageChip = memo(function ImageChip({
  preview,
  label,
  onClear,
  onView,
}: {
  preview: string
  label: string
  onClear: () => void
  onView: () => void
}) {
  return (
    <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-white/15 bg-white/5 group/chip flex-shrink-0">
      <img
        src={preview || "/placeholder.svg"}
        alt={label}
        className="w-full h-full object-cover cursor-pointer"
        onClick={onView}
      />
      <button
        onClick={onClear}
        aria-label={`移除${label}`}
        className="absolute top-0.5 right-0.5 p-0.5 rounded-md bg-black/80 text-white hover:bg-white hover:text-black transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
})

export const PromptComposer = memo(function PromptComposer({
  prompt,
  setPrompt,
  aspectRatio,
  setAspectRatio,
  availableAspectRatios,
  selectedModel,
  setSelectedModel,
  thinkingLevel,
  setThinkingLevel,
  resolution,
  setResolution,
  quality,
  setQuality,
  useGrounding,
  setUseGrounding,
  useUrls,
  setUseUrls,
  image1Preview,
  image2Preview,
  image1Url,
  image2Url,
  canGenerate,
  isLoading,
  onGenerate,
  onImageUpload,
  onUrlChange,
  onClearImage,
  onKeyDown,
  onPromptPaste,
  onImageFullscreen,
  promptTextareaRef,
}: PromptComposerProps) {
  const handleFileChange = useCallback(
    (slot: 1 | 2) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        onImageUpload(file, slot)
        e.target.value = ""
      }
    },
    [onImageUpload],
  )

  const handlePromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value),
    [setPrompt],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file && isImageFile(file)) {
        const slot = image1Preview ? 2 : 1
        onImageUpload(file, slot)
      }
    },
    [onImageUpload, image1Preview],
  )

  const handleAddImageClick = useCallback(() => {
    const slot = image1Preview ? 2 : 1
    document.getElementById(`composer-file${slot}`)?.click()
  }, [image1Preview])

  const hasFileImages = !!(image1Preview || image2Preview)
  const bothFilled = !!(image1Preview && image2Preview)

  const isAdvancedModel =
    selectedModel === "google/gemini-3.1-flash-image-preview" || selectedModel.startsWith("openai/")

  return (
    <div
      className="w-full rounded-2xl border border-white/15 bg-black/70 backdrop-blur-md p-3 shadow-2xl"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* URL inputs OR image chips */}
      {useUrls ? (
        <div className="flex flex-col gap-2 mb-3">
          <div className="relative">
            <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
            <input
              type="url"
              value={image1Url}
              onChange={(e) => onUrlChange(e.target.value, 1)}
              placeholder="第一张图片链接"
              aria-label="第一张图片链接"
              className="w-full h-9 pl-8 pr-8 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-white/40 select-text"
            />
            {image1Url && (
              <button
                onClick={() => onClearImage(2)}
                aria-label="移除第二张图片"
                className="absolute top-1 right-1 p-1.5 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 hover:bg-black/80 text-white/60 hover:text-white transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="relative">
            <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
            <input
              type="url"
              value={image2Url}
              onChange={(e) => onUrlChange(e.target.value, 2)}
              placeholder="第二张图片链接（可选）"
              aria-label="第二张图片链接"
              className="w-full h-9 pl-8 pr-8 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-white/40 select-text"
            />
            {image2Url && (
              <button
                onClick={() => onClearImage(2)}
                aria-label="清除第二张图片链接"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        hasFileImages && (
          <div className="flex items-center gap-2 mb-3">
            {image1Preview && (
              <ImageChip
                preview={image1Preview}
                label="图片 1"
                onClear={() => onClearImage(1)}
                onView={() => onImageFullscreen(image1Preview)}
              />
            )}
            {image2Preview && (
              <ImageChip
                preview={image2Preview}
                label="图片 2"
                onClear={() => onClearImage(2)}
                onView={() => onImageFullscreen(image2Preview)}
              />
            )}
          </div>
        )
      )}

      {/* Textarea */}
      <textarea
        ref={promptTextareaRef}
        value={prompt}
        onChange={handlePromptChange}
        onKeyDown={onKeyDown}
        onPaste={onPromptPaste}
        placeholder="描述你想生成的图像，或上传图片进行编辑…"
        aria-label="图像生成提示词"
        rows={2}
        className="w-full resize-none bg-transparent px-1 text-white placeholder:text-white/40 focus:outline-none select-text max-h-40 min-h-[44px]"
        style={{ fontSize: "16px", WebkitUserSelect: "text", userSelect: "text" }}
      />

      {/* Controls row */}
      <div className="flex items-center justify-between gap-2 mt-2">
        <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto">
          {/* Add image / file vs url toggle */}
          {!useUrls && (
            <>
              <button
                onClick={handleAddImageClick}
                disabled={bothFilled}
                aria-label="上传图片"
                title="上传图片"
                className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-white/5 border border-white/10 text-white/80 hover:text-white hover:border-white/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <ImagePlus className="w-4 h-4" />
                <span className="text-xs hidden sm:inline">图片</span>
              </button>
              <input id="composer-file1" type="file" accept="image/*,.heic,.heif" className="hidden" onChange={handleFileChange(1)} />
              <input id="composer-file2" type="file" accept="image/*,.heic,.heif" className="hidden" onChange={handleFileChange(2)} />
            </>
          )}

          {/* Files / URLs mode toggle */}
          <button
            onClick={() => setUseUrls(!useUrls)}
            aria-label="切换图片来源"
            title={useUrls ? "使用本地文件" : "使用图片链接"}
            className={cn(
              "flex items-center gap-1.5 h-9 px-3 rounded-full border transition-colors flex-shrink-0 text-xs",
              useUrls
                ? "bg-white text-black border-white"
                : "bg-white/5 border-white/10 text-white/80 hover:text-white hover:border-white/30",
            )}
          >
            <Link2 className="w-4 h-4" />
            <span className="hidden sm:inline">链接</span>
          </button>

          <ModelSelector value={selectedModel} onChange={setSelectedModel} />

          {/* Aspect ratio */}
          <Select value={aspectRatio} onValueChange={setAspectRatio}>
            <SelectTrigger
              aria-label="选择宽高比"
              className="w-[80px] md:w-[110px] !h-9 px-2 md:px-3 !py-0 rounded-full bg-white/5 border border-white/10 text-white text-xs focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-shrink-0"
            >
              <SelectValue placeholder="1:1" />
            </SelectTrigger>
            <SelectContent className="bg-black/95 border-white/15 text-white">
              {availableAspectRatios.map((option) => (
                <SelectItem key={option.value} value={option.value} textValue={option.label} className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className="hidden md:inline">{option.icon}</span>
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Advanced settings */}
          {isAdvancedModel && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  aria-label="高级设置"
                  title="高级设置"
                  className="flex items-center justify-center h-9 w-9 rounded-full bg-white/5 border border-white/10 text-white/80 hover:text-white hover:border-white/30 transition-colors flex-shrink-0"
                >
                  <Settings2 className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" side="top" className="w-64 bg-black/95 border-white/15 text-white p-3 space-y-3">
                {selectedModel === "google/gemini-3.1-flash-image-preview" && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] md:text-xs text-white/50 uppercase tracking-wider">思考强度</label>
                      <p className="text-[10px] text-white/40">生成前模型推理的程度</p>
                      <div className="inline-flex w-full rounded-md overflow-hidden bg-white/5 border border-white/10">
                        <button
                          onClick={() => setThinkingLevel("minimal")}
                          className={cn(
                            "flex-1 px-2 py-1.5 text-xs font-medium transition-all",
                            thinkingLevel === "minimal" ? "bg-white text-black" : "text-white/70 hover:text-white",
                          )}
                        >
                          最低
                        </button>
                        <button
                          onClick={() => setThinkingLevel("high")}
                          className={cn(
                            "flex-1 px-2 py-1.5 text-xs font-medium transition-all",
                            thinkingLevel === "high" ? "bg-white text-black" : "text-white/70 hover:text-white",
                          )}
                        >
                          高
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] md:text-xs text-white/50 uppercase tracking-wider">分辨率</label>
                      <p className="text-[10px] text-white/40">输出图像尺寸</p>
                      <div className="inline-flex w-full rounded-md overflow-hidden bg-white/5 border border-white/10">
                        {(["1K", "2K", "4K"] as const).map((r) => (
                          <button
                            key={r}
                            onClick={() => setResolution(r)}
                            className={cn(
                              "flex-1 px-2 py-1.5 text-xs font-medium transition-all",
                              resolution === r ? "bg-white text-black" : "text-white/70 hover:text-white",
                            )}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] md:text-xs text-white/50 uppercase tracking-wider">联网搜索</label>
                      <p className="text-[10px] text-white/40">使用实时网络结果辅助生成</p>
                      <button
                        onClick={() => setUseGrounding(!useGrounding)}
                        className={cn(
                          "flex items-center gap-2 w-full px-2 py-1.5 text-xs font-medium border rounded-md transition-all",
                          useGrounding
                            ? "bg-white text-black border-white"
                            : "bg-white/5 border-white/10 text-white/70 hover:text-white hover:border-white/30",
                        )}
                      >
                        <Search className="w-3 h-3 flex-shrink-0" />
                        <span className="whitespace-nowrap">Google 搜索</span>
                      </button>
                    </div>
                  </>
                )}
                {selectedModel.startsWith("openai/") && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] md:text-xs text-white/50 uppercase tracking-wider">质量</label>
                    <p className="text-[10px] text-white/40">更高质量会消耗更多算力</p>
                    <div className="inline-flex w-full rounded-md overflow-hidden bg-white/5 border border-white/10">
                      {(["auto", "low", "medium", "high"] as const).map((q) => (
                        <button
                          key={q}
                          onClick={() => setQuality(q)}
                          className={cn(
                            "flex-1 px-2 py-1.5 text-xs font-medium transition-all capitalize",
                            quality === q ? "bg-white text-black" : "text-white/70 hover:text-white",
                          )}
                        >
                          {q === "auto" ? "自动" : q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Send button */}
        <button
          onClick={onGenerate}
          disabled={!canGenerate || isLoading}
          aria-label="生成图像"
          className="flex items-center justify-center h-9 w-9 rounded-full bg-white text-black hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-5 h-5" />}
        </button>
      </div>
    </div>
  )
})
