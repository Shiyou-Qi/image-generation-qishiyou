"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  getAnonymousGenerations,
  saveAnonymousGeneration,
  clearAnonymousGenerations,
  deleteAnonymousGeneration,
} from "@/lib/anonymous-generations"
import type { Generation } from "../types"

// Browser-only history: generations are persisted to localStorage. The image
// files live in Vercel Blob; there is no database and no auth.
export function usePersistentHistory(_onToast?: (message: string, type: "success" | "error") => void) {
  const [generations, setGenerations] = useState<Generation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false)

  // Hydrate from localStorage on mount (client-only, avoids SSR mismatch).
  useEffect(() => {
    setGenerations(getAnonymousGenerations())
    setIsLoading(false)
    setHasInitiallyLoaded(true)
  }, [])

  const addGeneration = useCallback(async (generation: Generation) => {
    setGenerations((prev) => {
      const existingIndex = prev.findIndex((g) => g.id === generation.id)
      return existingIndex >= 0
        ? prev.map((g) => (g.id === generation.id ? generation : g))
        : [generation, ...prev]
    })
    // Persist only finished generations (skip transient loading rows).
    if (generation.status !== "loading") {
      saveAnonymousGeneration(generation)
      
      // Also try to save to database if user is logged in
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      
      if (user && generation.imageUrl) {
        try {
          const { error } = await supabase
            .from('generation_history')
            .insert({
              user_id: user.id,
              prompt: generation.prompt,
              model: (generation as any).model || 'unknown',
              image_urls: [generation.imageUrl],
            })
          
          if (error) {
            console.error('Failed to save generation to database:', error)
          }
        } catch (err) {
          console.error('Error saving generation:', err)
        }
      }
    }
  }, [])

  const updateGeneration = useCallback((id: string, updates: Partial<Generation>) => {
    setGenerations((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)))
  }, [])

  const clearHistory = useCallback(async () => {
    clearAnonymousGenerations()
    setGenerations([])
  }, [])

  const deleteGeneration = useCallback(async (id: string) => {
    deleteAnonymousGeneration(id)
    setGenerations((prev) => prev.filter((g) => g.id !== id))
  }, [])

  // No pagination without a database — keep the same shape for callers.
  const loadMore = useCallback(async () => {}, [])

  return {
    generations,
    setGenerations,
    addGeneration,
    clearHistory,
    deleteGeneration,
    isLoading,
    hasInitiallyLoaded,
    hasMore: false,
    loadMore,
    isLoadingMore: false,
    updateGeneration,
  }
}
