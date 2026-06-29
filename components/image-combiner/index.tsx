"use client"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import type { ReactElement } from "react"
import { useState, useEffect, useRef, useCallback, memo, lazy, Suspense } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { useImageUpload } from "./hooks/use-image-upload"
import { useImageGeneration } from "./hooks/use-image-generation"
import { useAspectRatio } from "./hooks/use-aspect-ratio"
import { useImageActions } from "./hooks/use-image-actions"
import { useKeyboardShortcuts } from "./hooks/use-keyboard-shortcuts"
import { useDragDrop } from "./hooks/use-drag-drop"
import { usePasteHandler } from "./hooks/use-paste-handler"
import { usePersistentHistory } from "./hooks/use-persistent-history"
import { PromptComposer } from "./prompt-composer"
import { OutputSection } from "./output-section"
import { ToastNotification } from "./toast-notification"
import { HistorySidebar } from "./history-sidebar"
import { GlobalDropZone } from "./global-drop-zone"
import { Menu } from "lucide-react"
import type { ModelType, ThinkingLevel, Resolution, Quality } from "./types"
import { DEFAULT_MODEL_ID } from "./model-catalog"
import { useDraftState, getSavedDraft, clearDraft } from "./hooks/use-draft-state"

type AspectRatio = string

// Dithering shader — imported directly for instant render (no lazy flash)
const Dithering = dynamic(
  () => import("@paper-design/shaders-react").then((mod) => ({ default: mod.Dithering })),
  { ssr: false, loading: () => <div className="w-full h-full bg-black" /> }
)
const MemoizedDithering = memo(Dithering)

// Modals are only shown on user interaction - no need to load them upfront
const HowItWorksModal = lazy(() => import("./how-it-works-modal").then((mod) => ({ default: mod.HowItWorksModal })))
const FullscreenViewer = lazy(() => import("./fullscreen-viewer").then((mod) => ({ default: mod.FullscreenViewer })))

export function ImageCombiner(): ReactElement {
  const isMobile = useIsMobile()
  const router = useRouter()

  // UI State — restore from draft if available
  const [prompt, setPrompt] = useState("")
  const [useUrls, setUseUrls] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ModelType>(DEFAULT_MODEL_ID as ModelType)
  const [thinkingLevel, setThinkingLevel] = useState<ThinkingLevel>("minimal")
  const [resolution, setResolution] = useState<Resolution>("1K")
  const [quality, setQuality] = useState<Quality>("auto")
  const [useGrounding, setUseGrounding] = useState(false)
  const draftRef = useRef<ReturnType<typeof getSavedDraft>>(null)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const promptTextareaRef = useRef<HTMLTextAreaElement>(null)

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  // Aspect Ratio
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("square")
  const { availableAspectRatios, detectAspectRatio, closestAvailable } = useAspectRatio(selectedModel)
  const imageLoadCountRef = useRef(0)

  // When the model changes, snap to the closest aspect ratio it supports.
  useEffect(() => {
    setAspectRatio((current) => closestAvailable(current))
  }, [selectedModel, closestAvailable])

  // Image Upload
  const {
    image1,
    image1Preview,
    image1Url,
    image2,
    image2Preview,
    image2Url,
    handleImageUpload,
    handleUrlChange,
    clearImage,
    restoreImageFromDataUrl,
    showToast: uploadShowToast,
  } = useImageUpload({
    onImageLoaded: (width, height, imageNumber) => {
      // Only auto-detect aspect ratio from the first image uploaded;
      // the second image should not override the user's current ratio.
      if (imageLoadCountRef.current === 0) {
        const detectedRatio = detectAspectRatio(width, height)
        setAspectRatio(detectedRatio)
      }
      imageLoadCountRef.current++
    },
  })

  // Restore draft on mount (client-only, avoids SSR mismatch)
  const draftRestored = useRef(false)
  useEffect(() => {
    if (draftRestored.current) return
    draftRestored.current = true
    const draft = getSavedDraft()
    draftRef.current = draft
    if (!draft) return
    if (draft.prompt) setPrompt(draft.prompt)
    if (draft.aspectRatio) setAspectRatio(draft.aspectRatio as AspectRatio)
    if (draft.selectedModel) setSelectedModel(draft.selectedModel)
    if (draft.thinkingLevel) setThinkingLevel(draft.thinkingLevel)
    if (draft.resolution) setResolution(draft.resolution)
    if (draft.useGrounding) setUseGrounding(draft.useGrounding)
    if (draft.useUrls) {
      setUseUrls(true)
      if (draft.image1Url) handleUrlChange(draft.image1Url, 1)
      if (draft.image2Url) handleUrlChange(draft.image2Url, 2)
    } else {
      if (draft.image1Preview) restoreImageFromDataUrl(draft.image1Preview, 1)
      if (draft.image2Preview) restoreImageFromDataUrl(draft.image2Preview, 2)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-save draft on changes
  useDraftState({
    prompt,
    aspectRatio,
    selectedModel,
    thinkingLevel,
    resolution,
    useGrounding,
    useUrls,
    image1Url,
    image2Url,
    image1Preview,
    image2Preview,
  })

  // Persistent History
  const {
    generations: persistedGenerations,
    setGenerations: setPersistedGenerations,
    addGeneration,
    clearHistory,
    deleteGeneration,
    isLoading: historyLoading,
    hasInitiallyLoaded,
    hasMore,
    loadMore,
    isLoadingMore,
  } = usePersistentHistory(showToast)

  // Image Generation
  const {
    selectedGenerationId,
    setSelectedGenerationId,
    imageLoaded,
    setImageLoaded,
    generateImage: runGeneration,
    cancelGeneration,
    loadGeneratedAsInput,
    markGenerationComplete,
  } = useImageGeneration({
    prompt,
    aspectRatio,
    image1,
    image2,
    image1Url,
    image2Url,
    useUrls,
    selectedModel,
    thinkingLevel,
    resolution,
    quality,
    useGrounding,
    generations: persistedGenerations,
    setGenerations: setPersistedGenerations,
    addGeneration,
    onToast: showToast,
    onImageUpload: handleImageUpload,
  })

  // Derived state
  const selectedGeneration = persistedGenerations.find((g) => g.id === selectedGenerationId) || persistedGenerations[0]
  const isLoading = persistedGenerations.some((g) => g.status === "loading")
  const generatedImage =
    selectedGeneration?.status === "complete" && selectedGeneration.imageUrl
      ? { url: selectedGeneration.imageUrl, prompt: selectedGeneration.prompt }
      : null
  const hasImages = !!(useUrls ? image1Url || image2Url : image1 || image2)
  const currentMode = hasImages ? "image-editing" : "text-to-image"
  const canGenerate = prompt.trim().length > 0 && (currentMode === "text-to-image" || !!(useUrls ? image1Url : image1))

  // Image Actions (fullscreen, download, copy, etc.)
  const {
    showFullscreen,
    fullscreenImageUrl,
    setFullscreenImageUrl,
    openFullscreen,
    closeFullscreen,
    downloadImage,
    openImageInNewTab,
    copyImageToClipboard,
  } = useImageActions({
    isMobile: isMobile || false,
    currentMode,
    onToast: showToast,
  })

  // Drag & Drop
  const { isDraggingOver, dropZoneHover, setDropZoneHover, handleGlobalDrop } = useDragDrop({
    onImageUpload: handleImageUpload,
    setUseUrls,
    onToast: showToast,
  })

  // Paste Handler
  const { handlePromptPaste } = usePasteHandler({
    image1,
    image2,
    image1Url,
    image2Url,
    useUrls,
    setUseUrls,
    onImageUpload: handleImageUpload,
    onUrlChange: handleUrlChange,
    onToast: showToast,
  })

  // Keyboard Shortcuts
  const { handleKeyDown } = useKeyboardShortcuts({
    canGenerate,
    showFullscreen,
    fullscreenImageUrl,
    generatedImage,
    persistedGenerations,
    onGenerate: runGeneration,
    onCopyImage: () => copyImageToClipboard(generatedImage),
    onDownloadImage: () => downloadImage(generatedImage),
    onLoadAsInput: loadGeneratedAsInput,
    onCloseFullscreen: closeFullscreen,
    setFullscreenImageUrl,
    setSelectedGenerationId,
  })

  // Auto-select first generation on load
  useEffect(() => {
    if (!historyLoading && persistedGenerations.length > 0 && !selectedGenerationId) {
      const firstCompleted = persistedGenerations.find((g) => g.status === "complete")
      if (firstCompleted) {
        setSelectedGenerationId(firstCompleted.id)
      }
    }
  }, [historyLoading, persistedGenerations, selectedGenerationId, setSelectedGenerationId])

  // Keep imageLoaded in sync — no fade transition on selection change
  useEffect(() => {
    if (selectedGeneration?.status === "complete" && selectedGeneration?.imageUrl) {
      setImageLoaded(true)
    }
  }, [selectedGenerationId, selectedGeneration?.imageUrl, setImageLoaded])

  // Initialize upload toast ref
  useEffect(() => {
    uploadShowToast.current = showToast
  }, [showToast])

  const clearAll = useCallback(() => {
    setPrompt("")
    clearImage(1)
    clearImage(2)
    clearDraft()
    imageLoadCountRef.current = 0
    setTimeout(() => {
      promptTextareaRef.current?.focus()
    }, 0)
  }, [clearImage])

  const handleFullscreenNavigate = useCallback(
    (direction: "prev" | "next") => {
      const completedGenerations = (persistedGenerations ?? []).filter((g) => g.status === "complete" && g.imageUrl)
      const currentIndex = completedGenerations.findIndex((g) => g.imageUrl === fullscreenImageUrl)
      if (currentIndex === -1) return

      let newIndex: number
      if (direction === "prev") {
        newIndex = currentIndex === 0 ? completedGenerations.length - 1 : currentIndex - 1
      } else {
        newIndex = currentIndex === completedGenerations.length - 1 ? 0 : currentIndex + 1
      }

      setFullscreenImageUrl(completedGenerations[newIndex].imageUrl!)
      setSelectedGenerationId(completedGenerations[newIndex].id)
    },
    [persistedGenerations, fullscreenImageUrl, setFullscreenImageUrl, setSelectedGenerationId],
  )

  return (
    <div className="bg-background h-dvh overflow-hidden flex flex-col select-none font-sans overscroll-none touch-pan-x touch-pan-y">
      {/* JSON-LD structured data is in layout.tsx - single source of truth for SEO */}

      {toast && <ToastNotification message={toast.message} type={toast.type} />}

      {isDraggingOver && (
        <GlobalDropZone dropZoneHover={dropZoneHover} onSetDropZoneHover={setDropZoneHover} onDrop={handleGlobalDrop} />
      )}

      <div className="fixed inset-0 z-0 select-none shader-background bg-black">
        <MemoizedDithering
          colorBack="#00000000"
          colorFront="#FFFFFF"
          speed={0.43}
          shape="wave"
          type="4x4"
          pxSize={3}
          scale={0.6}
          style={{
            backgroundColor: "#000000",
            height: "100vh",
            width: "100vw",
          }}
        />
      </div>

      <div className="relative z-10 flex-1 min-h-0 flex">
        {/* Left Sidebar — Conversation History (desktop) */}
        <aside className="hidden lg:flex lg:flex-col w-72 flex-shrink-0 border-r border-white/10">
          <HistorySidebar
            generations={persistedGenerations}
            selectedId={selectedGenerationId}
            onSelect={setSelectedGenerationId}
            onCancel={cancelGeneration}
            onDelete={deleteGeneration}
            onNewChat={clearAll}
            isLoading={historyLoading}
            hasInitiallyLoaded={hasInitiallyLoaded}
            hasMore={hasMore}
            onLoadMore={loadMore}
            isLoadingMore={isLoadingMore}
          />
        </aside>

        {/* Mobile Sidebar — Drawer */}
        {showHistory && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHistory(false)} />
            <aside className="relative w-72 max-w-[80vw] h-full border-r border-white/10 animate-in slide-in-from-left duration-200">
              <HistorySidebar
                generations={persistedGenerations}
                selectedId={selectedGenerationId}
                onSelect={setSelectedGenerationId}
                onCancel={cancelGeneration}
                onDelete={deleteGeneration}
                onNewChat={clearAll}
                isLoading={historyLoading}
                hasInitiallyLoaded={hasInitiallyLoaded}
                hasMore={hasMore}
                onLoadMore={loadMore}
                isLoadingMore={isLoadingMore}
                onCloseMobile={() => setShowHistory(false)}
              />
            </aside>
          </div>
        )}

        {/* Right Main — Canvas + Composer */}
        <main className="flex-1 min-w-0 flex flex-col">
          {/* Top bar */}
          <header className="flex items-center justify-between gap-3 px-3 md:px-6 py-3 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setShowHistory(true)}
                aria-label="打开历史对话"
                className="lg:hidden p-2 rounded-md text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h2 className="text-sm md:text-base font-semibold text-white truncate">
                {currentMode === "image-editing" ? "图像编辑" : "文生图"}
              </h2>
            </div>
            <button
              onClick={() => setShowHowItWorks(true)}
              className="text-xs text-white/50 hover:text-white transition-colors flex-shrink-0"
            >
              使用说明
            </button>
          </header>

          {/* Canvas */}
          <div className="flex-1 min-h-0 flex items-center justify-center p-3 md:p-6">
            <div className="w-full h-full max-w-3xl">
              <OutputSection
                selectedGeneration={selectedGeneration}
                generations={persistedGenerations}
                selectedGenerationId={selectedGenerationId}
                setSelectedGenerationId={setSelectedGenerationId}
                imageLoaded={imageLoaded}
                setImageLoaded={setImageLoaded}
                onCancelGeneration={cancelGeneration}
                onDeleteGeneration={deleteGeneration}
                onOpenFullscreen={() => generatedImage && openFullscreen(generatedImage.url)}
                onLoadAsInput={loadGeneratedAsInput}
                onCopy={() => copyImageToClipboard(generatedImage)}
                onDownload={() => downloadImage(generatedImage)}
                onOpenInNewTab={() => openImageInNewTab(generatedImage)}
                onImageReady={markGenerationComplete}
              />
            </div>
          </div>

          {/* Bottom Composer */}
          <div className="flex-shrink-0 px-3 md:px-6 pb-4 md:pb-6 pt-1">
            <div className="w-full max-w-3xl mx-auto">
              <PromptComposer
                prompt={prompt}
                setPrompt={setPrompt}
                aspectRatio={aspectRatio}
                setAspectRatio={setAspectRatio}
                availableAspectRatios={availableAspectRatios}
                useUrls={useUrls}
                setUseUrls={setUseUrls}
                image1Preview={image1Preview}
                image2Preview={image2Preview}
                image1Url={image1Url}
                image2Url={image2Url}
                canGenerate={canGenerate}
                isLoading={isLoading}
                onGenerate={runGeneration}
                onImageUpload={handleImageUpload}
                onUrlChange={handleUrlChange}
                onClearImage={clearImage}
                onKeyDown={handleKeyDown}
                onPromptPaste={handlePromptPaste}
                onImageFullscreen={(url) => openFullscreen(url)}
                promptTextareaRef={promptTextareaRef}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                thinkingLevel={thinkingLevel}
                setThinkingLevel={setThinkingLevel}
                resolution={resolution}
                setResolution={setResolution}
                quality={quality}
                setQuality={setQuality}
                useGrounding={useGrounding}
                setUseGrounding={setUseGrounding}
              />
              <p className="mt-2 text-center text-[11px] text-white/30">
                按 Enter 生成，Shift + Enter 换行
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* Lazy-loaded modals - only loaded when opened */}
      <Suspense fallback={null}>
        {showHowItWorks && <HowItWorksModal open={showHowItWorks} onOpenChange={setShowHowItWorks} />}
        {showFullscreen && fullscreenImageUrl && (
          <FullscreenViewer
            imageUrl={fullscreenImageUrl}
            onClose={closeFullscreen}
            onNavigate={handleFullscreenNavigate}
            canNavigate={(persistedGenerations ?? []).filter((g) => g.status === "complete" && g.imageUrl).length > 1}
          />
        )}
      </Suspense>
    </div>
  )
}
