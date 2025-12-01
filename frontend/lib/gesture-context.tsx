"use client"

import type React from "react"

import { createContext, useContext, useState, useCallback } from "react"

export interface GestureConfig {
  userId: string
  gestures: {
    [gestureId: string]: {
      text: string
      isEnabled: boolean
    }
  }
  confidenceThreshold: number
  oneTabMode: boolean
  autoSpeak: boolean
  dataCollectionEnabled: boolean
}

export interface CapturedSample {
  id: string
  gestureId: string
  frameData: string
  timestamp: Date
}

interface GestureContextType {
  config: GestureConfig | null
  capturedSamples: { [gestureId: string]: CapturedSample[] }
  recognitionStatus: "idle" | "detecting" | "no_hand" | "hand_obscured" | "ready"
  updateGestureText: (gestureId: string, text: string) => Promise<void>
  toggleGestureEnabled: (gestureId: string) => Promise<void>
  setConfidenceThreshold: (threshold: number) => Promise<void>
  toggleOneTabMode: (enabled: boolean) => Promise<void>
  toggleAutoSpeak: (enabled: boolean) => Promise<void>
  enableDataCollection: (enabled: boolean) => Promise<void>
  saveSample: (gestureId: string, frameData: string) => Promise<void>
  getSampleCount: (gestureId: string) => number
  resetGestureConfig: () => Promise<void>
}

const GestureContext = createContext<GestureContextType | undefined>(undefined)

export function GestureProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<GestureConfig | null>(null)
  const [capturedSamples, setCapturedSamples] = useState<{ [gestureId: string]: CapturedSample[] }>({})
  const [recognitionStatus, setRecognitionStatus] = useState<
    "idle" | "detecting" | "no_hand" | "hand_obscured" | "ready"
  >("idle")

  const updateGestureText = useCallback(
    async (gestureId: string, text: string) => {
      setConfig((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          gestures: {
            ...prev.gestures,
            [gestureId]: {
              ...prev.gestures[gestureId],
              text,
            },
          },
        }
      })
      localStorage.setItem(`gesture_config_${config?.userId}`, JSON.stringify(config))
    },
    [config?.userId, config],
  )

  const toggleGestureEnabled = useCallback(async (gestureId: string) => {
    setConfig((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        gestures: {
          ...prev.gestures,
          [gestureId]: {
            ...prev.gestures[gestureId],
            isEnabled: !prev.gestures[gestureId].isEnabled,
          },
        },
      }
    })
  }, [])

  const setConfidenceThreshold = useCallback(async (threshold: number) => {
    setConfig((prev) => (prev ? { ...prev, confidenceThreshold: threshold } : prev))
  }, [])

  const toggleOneTabMode = useCallback(async (enabled: boolean) => {
    setConfig((prev) => (prev ? { ...prev, oneTabMode: enabled } : prev))
  }, [])

  const toggleAutoSpeak = useCallback(async (enabled: boolean) => {
    setConfig((prev) => (prev ? { ...prev, autoSpeak: enabled } : prev))
  }, [])

  const enableDataCollection = useCallback(async (enabled: boolean) => {
    setConfig((prev) => (prev ? { ...prev, dataCollectionEnabled: enabled } : prev))
  }, [])

  const saveSample = useCallback(async (gestureId: string, frameData: string) => {
    const newSample: CapturedSample = {
      id: `sample_${Date.now()}`,
      gestureId,
      frameData,
      timestamp: new Date(),
    }

    setCapturedSamples((prev) => ({
      ...prev,
      [gestureId]: [...(prev[gestureId] || []), newSample],
    }))
  }, [])

  const getSampleCount = useCallback(
    (gestureId: string) => {
      return capturedSamples[gestureId]?.length || 0
    },
    [capturedSamples],
  )

  const resetGestureConfig = useCallback(async () => {
    // Reset to default
    setConfig((prev) => {
      if (!prev) return prev
      const reset = { ...prev }
      Object.keys(reset.gestures).forEach((key) => {
        reset.gestures[key].isEnabled = true
      })
      return reset
    })
  }, [])

  return (
    <GestureContext.Provider
      value={{
        config,
        capturedSamples,
        recognitionStatus,
        updateGestureText,
        toggleGestureEnabled,
        setConfidenceThreshold,
        toggleOneTabMode,
        toggleAutoSpeak,
        enableDataCollection,
        saveSample,
        getSampleCount,
        resetGestureConfig,
      }}
    >
      {children}
    </GestureContext.Provider>
  )
}

export function useGesture() {
  const context = useContext(GestureContext)
  if (!context) {
    throw new Error("useGesture must be used within GestureProvider")
  }
  return context
}
