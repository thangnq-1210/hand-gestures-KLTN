"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Info, Camera, Lock, X, Upload, Image, Loader2 } from "lucide-react"
import TextToSpeech from "./text-to-speech"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"
// import { Hands } from "@mediapipe/hands"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Script from "next/script"
declare global {
  interface Window {
    Hands?: any
    drawConnectors?: any
    drawLandmarks?: any
    HAND_CONNECTIONS?: any
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL

type RecognitionMode = "resnet" | "landmark"

// interface GestureRecognitionProps {
//   onGestureDetected: (gesture: string, text: string, confidence: number, imageDataUrl?: string) => void
// }
interface GestureRecognitionProps {
  recognitionMode: RecognitionMode
  onGestureDetected: (gesture: string, text: string, confidence: number, imageDataUrl?: string) => void
}

type RecognitionStatus =
  | "idle"
  | "detecting"
  | "no_hand"
  | "hand_obscured"
  | "ready"
  | "high_confidence"
  | "permission_denied"
  | "not_supported"

type CollectionMethod = "none" | "image" | "camera"

interface GestureMapping {
  model_label: string
  default_text: string
  custom_text?: string | null
  effective_text: string
}

type UploadPredictResult = {
  gesture: string
  confidence: number
  text: string
  has_hand: boolean
}

type SampleRow = { label: string | number }

// export default function GestureRecognition({ onGestureDetected }: GestureRecognitionProps) {
export default function GestureRecognition({
  recognitionMode,
  onGestureDetected,
}: GestureRecognitionProps) {
  // const { token, isAuthenticated } = useAuth()
  const { token, isAuthenticated, user } = useAuth()
  const [gestureMappings, setGestureMappings] = useState<GestureMapping[] | null>(null)
  const [mappingError, setMappingError] = useState<string | null>(null)
  const [isMappingLoading, setIsMappingLoading] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)

  const latestLandmarksRef = useRef<any[] | null>(null)
  const latestHandLabelRef = useRef<"Left" | "Right" | null>(null)
  // const handsRef = useRef<Hands | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastSendTsRef = useRef<number>(0)
  const [hasHandOverlay, setHasHandOverlay] = useState(false)
  const latestHandsRef = useRef<
    Array<{
      landmarks: any[]
      label: "Left" | "Right" | null
    }>
  >([])

  const [modeDialogOpen, setModeDialogOpen] = useState(false)
  const [modeDialogMessage, setModeDialogMessage] = useState("")
  const prevRecognitionModeRef = useRef<RecognitionMode | null>(null)

  useEffect(() => {
    if (!modeDialogOpen) return

    const timer = setTimeout(() => {
      setModeDialogOpen(false)
    }, 1800)

    return () => clearTimeout(timer)
  }, [modeDialogOpen])

  const [isLoading, setIsLoading] = useState(false)
  const [currentResult, setCurrentResult] = useState<{
    gesture: string
    text: string
    confidence: number
  } | null>(null)

  const [isStreamActive, setIsStreamActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const [confidenceThreshold, setConfidenceThreshold] = useState(0.6)
  const [oneTabMode, setOneTabMode] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(false)
  const [dataCollectionMode, setDataCollectionMode] = useState(false)
  const [selectedGestureForCollection, setSelectedGestureForCollection] = useState("0")
  const [collectedSamples, setCollectedSamples] = useState<{ [key: string]: number }>({})
  const [recognitionStatus, setRecognitionStatus] = useState<RecognitionStatus>("idle")

  // trạng thái & timer cho thông báo + đọc sau 3s
  const [pendingSpeech, setPendingSpeech] = useState(false)
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSpokenGestureRef = useRef<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // ====== DATA COLLECTION UI STATES ======
  const [collectionMethod, setCollectionMethod] = useState<CollectionMethod>("none")

  // Upload image states
  const [uploadDataUrl, setUploadDataUrl] = useState<string | null>(null)
  const [uploadFileName, setUploadFileName] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isSavingUpload, setIsSavingUpload] = useState(false)

  // upload -> recognize -> then save
  const [isUploadPredicting, setIsUploadPredicting] = useState(false)
  const [uploadPredictResult, setUploadPredictResult] = useState<UploadPredictResult | null>(null)

  // size limit (10MB)
  const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
  const fileInputRef = useRef<HTMLInputElement>(null)

  const clearUploadedImage = useCallback(() => {
    setUploadDataUrl(null)
    setUploadFileName(null)
    setUploadError(null)
    setUploadPredictResult(null)

    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [])

  // ====== SAVE NOTICE (after saving sample) ======
  const [saveNotice, setSaveNotice] = useState<string | null>(null)
  const saveNoticeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const showSaveNotice = useCallback((msg: string) => {
    setSaveNotice(msg)
    if (saveNoticeTimeoutRef.current) clearTimeout(saveNoticeTimeoutRef.current)
    saveNoticeTimeoutRef.current = setTimeout(() => setSaveNotice(null), 10000)
  }, [])

  // ====== CAMERA COLLECT (batch + progress) ======
  const [collectBatchSize, setCollectBatchSize] = useState<1 | 5 | 10>(5)
  const [isCollecting, setIsCollecting] = useState(false)
  const [collectError, setCollectError] = useState<string | null>(null)
  const [collectProgress, setCollectProgress] = useState<{ saved: number; tried: number } | null>(null)

  const [canSaveCamera, setCanSaveCamera] = useState(false)
  const [cameraFrameForSave, setCameraFrameForSave] = useState<string | null>(null)
  const [handHint, setHandHint] = useState<string>("Chưa kiểm tra")

  // const [samplesPerSave, setSamplesPerSave] = useState(5)
  // const [isBurstSaving, setIsBurstSaving] = useState(false)
  // key lưu lịch sử (theo user)
  const HISTORY_KEY = user?.id ? `gesture_history_${user.id}` : "gesture_history_guest"

  type HistoryItem = {
    id: string
    gesture: string
    text: string
    confidence: number
    timestamp: number
    imageDataUrl?: string
  }

  const makeThumbFromCanvas = useCallback(() => {
    const src = canvasRef.current
    if (!src) return null
    const vw = src.width
    const vh = src.height
    if (!vw || !vh) return null

    const thumbW = 320
    const thumbH = Math.round((vh * thumbW) / vw)

    const c = document.createElement("canvas")
    c.width = thumbW
    c.height = thumbH
    const ctx = c.getContext("2d")
    if (!ctx) return null

    ctx.drawImage(src, 0, 0, thumbW, thumbH)
    return c.toDataURL("image/jpeg", 0.7)
  }, [])

  const saveHistoryToLocal = useCallback(
    (item: HistoryItem) => {
      if (!HISTORY_KEY) return
      try {
        const raw = localStorage.getItem(HISTORY_KEY)
        const prev: HistoryItem[] = raw ? JSON.parse(raw) : []
        const next = [item, ...prev].slice(0, 200)
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
      } catch (e) {
        console.error("saveHistoryToLocal error:", e)
      }
    },
    [HISTORY_KEY]
  )

  const playServerTTS = useCallback(async (text: string) => {
    try {
      if (!text.trim()) return

      const res = await fetch(`${API_BASE_URL}/tts/vi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })

      if (!res.ok) {
        console.error("TTS API error:", res.status, await res.text())
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)

      audio.onended = () => URL.revokeObjectURL(url)
      audio.onerror = (e) => {
        console.error("Error playing TTS audio:", e)
        URL.revokeObjectURL(url)
      }

      await audio.play()
    } catch (err) {
      console.error("playServerTTS error:", err)
    }
  }, [])

  const fallbackGestures = [
    { id: "0", name: "Cử chỉ 0", text: "Xin chào" },
    { id: "1", name: "Cử chỉ 1", text: "Tôi cần giúp đỡ" },
    { id: "2", name: "Cử chỉ 2", text: "Vâng" },
    { id: "3", name: "Cử chỉ 3", text: "Không" },
    { id: "4", name: "Cử chỉ 4", text: "Cảm ơn" },
    { id: "5", name: "Cử chỉ 5", text: "Tôi đang đau" },
  ]

  const gestureList = gestureMappings
    ? gestureMappings.map((m) => ({
      id: m.model_label,
      name: `Cử chỉ ${m.model_label}`,
      text: m.effective_text,
    }))
    : fallbackGestures

  const selectedGestureObj = gestureList.find((g) => g.id === selectedGestureForCollection)


  const getGestureTextById = useCallback(
    (gestureId: string) => {
      return gestureList.find((g) => String(g.id) === String(gestureId))?.text ?? `Cử chỉ ${gestureId}`
    },
    [gestureList]
  )

  const isFingerOpen = (lm: any[], tip: number, pip: number) => {
    return lm[tip].y < lm[pip].y
  }

  const isThumbOpen = (lm: any[], handLabel: "Left" | "Right" | null) => {
    if (!handLabel) return false

    return handLabel === "Right" ? lm[4].x < lm[3].x : lm[4].x > lm[3].x
  }

  const classifyLandmarkGesture = useCallback(
    (lm: any[], handLabel: "Left" | "Right" | null) => {
      const thumb = isThumbOpen(lm, handLabel)
      const index = isFingerOpen(lm, 8, 6)
      const middle = isFingerOpen(lm, 12, 10)
      const ring = isFingerOpen(lm, 16, 14)
      const pinky = isFingerOpen(lm, 20, 18)

      const pattern = [thumb, index, middle, ring, pinky].map((v) => (v ? "1" : "0")).join("")

      // Ánh xạ tối giản cho bộ số 0–5
      if (pattern === "00000") return { gesture: "0", confidence: 0.98 }
      if (pattern === "01000") return { gesture: "1", confidence: 0.98 }
      if (pattern === "01100") return { gesture: "2", confidence: 0.98 }
      if (pattern === "01110") return { gesture: "3", confidence: 0.98 }
      if (pattern === "01111") return { gesture: "4", confidence: 0.98 }
      if (pattern === "11111") return { gesture: "5", confidence: 0.98 }

      return null
    },
    []
  )

  // tải mapping cử chỉ từ backend (đã tuỳ chỉnh theo user)
  useEffect(() => {
    if (!token || !isAuthenticated) return

    const fetchMapping = async () => {
      try {
        setIsMappingLoading(true)
        setMappingError(null)

        const res = await fetch(`${API_BASE_URL}/gestures/my-mapping`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || "Không tải được mapping cử chỉ")
        }

        const data: GestureMapping[] = await res.json()
        setGestureMappings(data)
      } catch (err) {
        console.error("Load gesture mapping error:", err)
        setMappingError("Không tải được dữ liệu cử chỉ, đang dùng cấu hình mặc định.")
      } finally {
        setIsMappingLoading(false)
      }
    }

    void fetchMapping()
  }, [token, isAuthenticated])

  useEffect(() => {
    return () => {
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
      if (saveNoticeTimeoutRef.current) clearTimeout(saveNoticeTimeoutRef.current)
    }
  }, [])

  // Load sample counts from server (optional but recommended)
  // const refreshSampleCounts = useCallback(async () => {
  //   if (!token || !isAuthenticated) return
  //   try {
  //     const res = await fetch("/api/collect/my-sample-counts", {
  //       headers: { Authorization: `Bearer ${token}` },
  //     })
  //     if (!res.ok) return

  //     const rows = (await res.json()) as Array<{ label: string; count: number }>
  //     const map: Record<string, number> = {}
  //     for (const r of rows) map[r.label] = r.count
  //     setCollectedSamples(map)
  //   } catch (e) {
  //     console.error("refreshSampleCounts error:", e)
  //   }
  // }, [token, isAuthenticated])
  const refreshSampleCounts = useCallback(async () => {
    if (!isAuthenticated || !token || !user?.id) return

    try {
      const res = await fetch(`${API_BASE_URL}/collect/my-samples?user_id=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return

      const rows = (await res.json()) as SampleRow[]
      const map: Record<string, number> = {}

      for (const r of rows) {
        const k = String(r.label)
        map[k] = (map[k] || 0) + 1
      }

      setCollectedSamples(map)
    } catch (e) {
      console.error("refreshSampleCounts error:", e)
    }
  }, [API_BASE_URL, isAuthenticated, token, user?.id])

  useEffect(() => {
    if (dataCollectionMode) void refreshSampleCounts()
  }, [dataCollectionMode, refreshSampleCounts])

  const captureAndPredict = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return
    if (!isAuthenticated || !token) {
      setRecognitionStatus("idle")
      setCurrentResult({
        gesture: "-",
        text: "Vui lòng đăng nhập để sử dụng nhận diện cử chỉ",
        confidence: 0,
      })
      return
    }
    if (recognitionMode === "landmark") {
      try {
        setIsLoading(true)
        setRecognitionStatus("detecting")

        const hands = latestHandsRef.current

        if (!hands.length) {
          setRecognitionStatus("no_hand")
          setCurrentResult({
            gesture: "-",
            text: "Vui lòng giơ tay vào camera",
            confidence: 0,
          })

          if (!oneTabMode && !dataCollectionMode) {
            setTimeout(() => void captureAndPredict(), 1200)
          }
          return
        }

        let classified: { gesture: string; confidence: number } | null = null

        for (const hand of hands) {
          const result = classifyLandmarkGesture(hand.landmarks, hand.label)
          if (result) {
            classified = result
            break
          }
        }

        if (!classified) {
          setRecognitionStatus("no_hand")
          setCurrentResult({
            gesture: "Không chắc chắn",
            text: "Hand Landmarks chưa khớp mẫu cử chỉ 0–5",
            confidence: 0,
          })

          if (!oneTabMode && !dataCollectionMode) {
            setTimeout(() => void captureAndPredict(), 1200)
          }
          return
        }

        const effectiveGesture = classified.gesture
        const effectiveText = getGestureTextById(effectiveGesture)
        const effectiveConf = classified.confidence

        const thumb = makeThumbFromCanvas()

        setRecognitionStatus("high_confidence")
        setCurrentResult({
          gesture: effectiveGesture,
          text: effectiveText,
          confidence: effectiveConf,
        })

        onGestureDetected(effectiveGesture, effectiveText, effectiveConf, thumb ?? undefined)

        // Nếu bạn vẫn muốn lưu local tạm thời thì giữ đoạn này.
        // Nếu đã chuyển hẳn history sang DB thì có thể bỏ.
        saveHistoryToLocal({
          id: Date.now().toString(),
          gesture: effectiveGesture,
          text: effectiveText,
          confidence: effectiveConf,
          timestamp: Date.now(),
          imageDataUrl: thumb ?? undefined,
        })

        if (autoSpeak && !pendingSpeech) {
          const TOTAL_SECONDS = 3

          if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current)
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)

          setPendingSpeech(true)
          setCountdown(TOTAL_SECONDS)

          countdownIntervalRef.current = setInterval(() => {
            setCountdown((prev) => {
              if (prev === null) return null
              if (prev <= 1) {
                if (countdownIntervalRef.current) {
                  clearInterval(countdownIntervalRef.current)
                  countdownIntervalRef.current = null
                }
                return 0
              }
              return prev - 1
            })
          }, 1000)

          speechTimeoutRef.current = setTimeout(() => {
            setPendingSpeech(false)
            setCountdown(null)
            void playServerTTS(effectiveText)
          }, TOTAL_SECONDS * 1000)
        } else if (!autoSpeak) {
          if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current)
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
          setPendingSpeech(false)
          setCountdown(null)
        }

        return
      } catch (error) {
        console.error("Landmark prediction error:", error)
        setRecognitionStatus("no_hand")
        setCurrentResult({
          gesture: "Lỗi",
          text: "Lỗi khi xử lý Hand Landmarks.",
          confidence: 0,
        })
        return
      } finally {
        setIsLoading(false)
      }
    }

    try {
      setIsLoading(true)
      setRecognitionStatus("detecting")

      // Chỗ này xử lý sau (detect ở FE hay BE, cmt là dt ở BE)
      // if (!hasHandOverlay) {
      //   setRecognitionStatus("no_hand")
      //   setCurrentResult({
      //     gesture: "-",
      //     text: "Vui lòng giơ tay vào camera",
      //     confidence: 0,
      //   })

      //   if (!oneTabMode && !dataCollectionMode) {
      //     setTimeout(() => void captureAndPredict(), 800)
      //   }
      //   return
      // }

      const ctx = canvasRef.current.getContext("2d")
      if (!ctx) return

      canvasRef.current.width = videoRef.current.videoWidth
      canvasRef.current.height = videoRef.current.videoHeight
      ctx.drawImage(videoRef.current, 0, 0)

      const base64Image = canvasRef.current.toDataURL("image/jpeg", 0.9)
      const thumb = makeThumbFromCanvas() ?? base64Image
      // const response = await fetch("/api/gesture/predict-base64", {
      const response = await fetch(`${API_BASE_URL}/gesture/predict-base64`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ image: base64Image }),
      })

      if (!response.ok) {
        const msg = await response.text()
        console.error("API /api/gesture/predict-base64 error:", response.status, msg)
        throw new Error("API request failed")
      }

      const data = await response.json()
      console.log("🔥 API data:", data)

      const { gesture, confidence, text, has_hand } = data as {
        gesture: string
        confidence: number
        text: string
        has_hand: boolean
      }

      // 1) Không có tay
      if (has_hand === false || gesture === "no_hand") {
        setRecognitionStatus("no_hand")
        setCurrentResult({
          gesture: "-",
          text: "Vui lòng giơ tay vào camera",
          confidence: 0,
        })

        if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current)
        setPendingSpeech(false)

        if (!oneTabMode && !dataCollectionMode) {
          setTimeout(() => void captureAndPredict(), 1500)
        }
        return
      }

      // 2) Có tay nhưng độ tin cậy thấp
      if (confidence < confidenceThreshold) {
        setRecognitionStatus("no_hand")
        setCurrentResult({
          gesture: "Không chắc chắn",
          text: "Độ tin cậy thấp, hãy giữ tay rõ trong khung hình",
          confidence: confidence || 0,
        })

        if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current)
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
        setPendingSpeech(false)
        setCountdown(null)
        lastSpokenGestureRef.current = null

        if (!oneTabMode && !dataCollectionMode) {
          setTimeout(() => void captureAndPredict(), 1500)
        }
        return
      }

      // 3) Nhận diện OK
      const effectiveGesture = gesture || "Unknown"
      const effectiveText = text || "Không xác định"
      const effectiveConf = confidence || 0
      // const thumb = makeThumbFromCanvas()
      setRecognitionStatus("high_confidence")
      setCurrentResult({
        gesture: effectiveGesture,
        text: effectiveText,
        confidence: effectiveConf,
      })
      // onGestureDetected(effectiveGesture, effectiveText, effectiveConf)
      onGestureDetected(effectiveGesture, effectiveText, effectiveConf, thumb ?? undefined)
      saveHistoryToLocal({
        id: Date.now().toString(),
        gesture: effectiveGesture,
        text: effectiveText,
        confidence: effectiveConf,
        timestamp: Date.now(),
        imageDataUrl: thumb ?? undefined,
      })
      // Auto speak (nếu bật)
      if (autoSpeak && !pendingSpeech) {
        const TOTAL_SECONDS = 2

        if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current)
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)

        setPendingSpeech(true)
        setCountdown(TOTAL_SECONDS)

        countdownIntervalRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev === null) return null
            if (prev <= 1) {
              if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current)
                countdownIntervalRef.current = null
              }
              return 0
            }
            return prev - 1
          })
        }, 1000)

        speechTimeoutRef.current = setTimeout(() => {
          setPendingSpeech(false)
          setCountdown(null)
          void playServerTTS(effectiveText)
        }, TOTAL_SECONDS * 1000)
      } else if (!autoSpeak) {
        if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current)
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
        setPendingSpeech(false)
        setCountdown(null)
      }
    } catch (error) {
      console.error("Prediction error:", error)
      setRecognitionStatus("no_hand")
      setCurrentResult({
        gesture: "Lỗi",
        text: "Lỗi khi xử lý. Vui lòng thử lại.",
        confidence: 0,
      })

      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current)
      setPendingSpeech(false)

      if (!oneTabMode && !dataCollectionMode) {
        setTimeout(() => void captureAndPredict(), 2000)
      }
    } finally {
      setIsLoading(false)
    }
  }, [
    isAuthenticated,
    token,
    onGestureDetected,
    confidenceThreshold,
    autoSpeak,
    oneTabMode,
    pendingSpeech,
    playServerTTS,
    dataCollectionMode,
    // captureThumbnail,
    makeThumbFromCanvas,
    saveHistoryToLocal,
    recognitionMode,
    classifyLandmarkGesture,
    getGestureTextById,
  ])

  useEffect(() => {
    const video = videoRef.current
    const overlay = overlayCanvasRef.current
    if (!isStreamActive || !video || !overlay) return

    const ctx = overlay.getContext("2d")
    if (!ctx) return

    let rafId: number | null = null
    let cancelled = false

    const initAndRun = async () => {
      // đợi script load xong (window.Hands có)
      if (!window.Hands || !window.drawConnectors || !window.drawLandmarks || !window.HAND_CONNECTIONS) return

      const hands = new window.Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      })

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })

      hands.onResults((results: any) => {
        const w = video.videoWidth
        const h = video.videoHeight
        if (!w || !h) return

        overlay.width = w
        overlay.height = h
        ctx.clearRect(0, 0, w, h)

        const multiLandmarks = results.multiHandLandmarks ?? []
        const multiHandedness = results.multiHandedness ?? []

        if (!multiLandmarks.length) {
          latestHandsRef.current = []
          latestLandmarksRef.current = null
          latestHandLabelRef.current = null
          setHasHandOverlay(false)
          return
        }

        setHasHandOverlay(true)

        latestHandsRef.current = multiLandmarks.map((lm: any[], idx: number) => {
          const handLabel = multiHandedness?.[idx]?.label as "Left" | "Right" | undefined

          let minX = 1
          let minY = 1
          let maxX = 0
          let maxY = 0

          for (const p of lm) {
            minX = Math.min(minX, p.x)
            minY = Math.min(minY, p.y)
            maxX = Math.max(maxX, p.x)
            maxY = Math.max(maxY, p.y)
          }

          if (recognitionMode === "landmark") {
            if (window.drawConnectors && window.drawLandmarks && window.HAND_CONNECTIONS) {
              window.drawConnectors(ctx, lm, window.HAND_CONNECTIONS, {
                color: "#22c55e",
                lineWidth: 3,
              })

              window.drawLandmarks(ctx, lm, {
                color: "#16a34a",
                lineWidth: 1,
                radius: 4,
              })
            }
          } else {
            const x = minX * w
            const y = minY * h
            const bw = (maxX - minX) * w
            const bh = (maxY - minY) * h

            ctx.lineWidth = 4
            ctx.strokeStyle = "#22c55e"
            ctx.strokeRect(x, y, bw, bh)

            ctx.font = "16px sans-serif"
            ctx.fillStyle = "#22c55e"
            ctx.fillText("Hand detected", x, Math.max(18, y - 8))
          }

          if (idx === 0) {
            latestLandmarksRef.current = lm
            latestHandLabelRef.current = handLabel ?? null
          }

          return {
            landmarks: lm,
            label: handLabel ?? null,
          }
        })
      })

      let lastTs = 0
      const loop = async (ts: number) => {
        if (cancelled) return
        rafId = requestAnimationFrame(loop)

        // throttle ~10fps
        if (ts - lastTs < 100) return
        lastTs = ts

        if (video.readyState < 2) return
        try {
          await hands.send({ image: video })
        } catch { }
      }

      rafId = requestAnimationFrame(loop)
    }

    // chạy init vài lần cho tới khi script load (nhẹ)
    const timer = setInterval(() => {
      if (window.Hands && window.drawConnectors && window.drawLandmarks && window.HAND_CONNECTIONS) {
        clearInterval(timer)
        initAndRun()
      }
    }, 50)

    return () => {
      cancelled = true
      clearInterval(timer)
      if (rafId) cancelAnimationFrame(rafId)
      ctx.clearRect(0, 0, overlay.width, overlay.height)
      setHasHandOverlay(false)
    }
  }, [isStreamActive, recognitionMode])

  const initializeCamera = useCallback(async () => {
    try {
      setCameraError(null)
      setRecognitionStatus("idle")

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Trình duyệt của bạn không hỗ trợ truy cập camera")
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsStreamActive(true)
        setRecognitionStatus("ready")
        setTimeout(() => void captureAndPredict(), 500)
      }
    } catch (error: unknown) {
      setIsStreamActive(false)
      let errorMessage = "Không thể truy cập camera"

      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          errorMessage = "Quyền truy cập camera bị từ chối. Vui lòng cấp quyền camera trong cài đặt trình duyệt."
          setRecognitionStatus("permission_denied")
        } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
          errorMessage = "Không tìm thấy camera. Vui lòng kiểm tra xem camera có được kết nối không."
          setRecognitionStatus("not_supported")
        } else if (error.name === "NotReadableError") {
          errorMessage = "Camera đang được sử dụng bởi ứng dụng khác. Vui lòng đóng ứng dụng đó."
          setRecognitionStatus("not_supported")
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      console.error("[v0] Camera initialization error:", error)
      setCameraError(errorMessage)
    }
  }, [captureAndPredict])

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }

    setIsStreamActive(false)
    setRecognitionStatus("idle")
    setCurrentResult(null)

    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current)
      speechTimeoutRef.current = null
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    setPendingSpeech(false)
    setCountdown(null)
  }, [])

  const restartCameraForMode = useCallback(async () => {
    stopCamera()

    latestHandsRef.current = []
    latestLandmarksRef.current = null
    latestHandLabelRef.current = null
    setHasHandOverlay(false)
    setCurrentResult(null)
    setRecognitionStatus("idle")

    await new Promise((resolve) => setTimeout(resolve, 300))
    await initializeCamera()
  }, [initializeCamera, stopCamera])

  useEffect(() => {
    if (prevRecognitionModeRef.current === null) {
      prevRecognitionModeRef.current = recognitionMode
      return
    }

    if (prevRecognitionModeRef.current !== recognitionMode) {
      const cameraWasActive = isStreamActive

      setModeDialogMessage(
        cameraWasActive
          ? recognitionMode === "resnet"
            ? "Đã chuyển sang chế độ Mô hình Resnet. Camera đang khởi động lại..."
            : "Đã chuyển sang chế độ Hand Landmarks. Camera đang khởi động lại..."
          : recognitionMode === "resnet"
            ? "Đã chuyển sang chế độ Mô hình Resnet."
            : "Đã chuyển sang chế độ Hand Landmarks."
      )
      setModeDialogOpen(true)

      if (cameraWasActive) {
        void restartCameraForMode()
      }

      prevRecognitionModeRef.current = recognitionMode
    }
  }, [recognitionMode, isStreamActive, restartCameraForMode])

  const handlePrimaryButtonClick = useCallback(() => {
    if (!isStreamActive || !videoRef.current || !canvasRef.current) {
      console.warn("Không thể nhận diện: camera chưa sẵn sàng")
      return
    }

    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current)
      speechTimeoutRef.current = null
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }

    setPendingSpeech(false)
    setCountdown(null)

    if (recognitionStatus === "high_confidence") {
      setCurrentResult(null)
    }

    void captureAndPredict()
  }, [isStreamActive, recognitionStatus, captureAndPredict])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isStreamActive && oneTabMode && !dataCollectionMode && !pendingSpeech && isAuthenticated && token) {
      interval = setInterval(() => void captureAndPredict(), 2000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isStreamActive, oneTabMode, dataCollectionMode, pendingSpeech, isAuthenticated, token, captureAndPredict])

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

  const captureFrameBase64 = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null

    const vw = videoRef.current.videoWidth
    const vh = videoRef.current.videoHeight
    if (!vw || !vh) return null

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return null

    canvasRef.current.width = vw
    canvasRef.current.height = vh
    ctx.drawImage(videoRef.current, 0, 0)

    return canvasRef.current.toDataURL("image/jpeg", 0.9)
  }, [])




  const qualityCheck = useCallback(async (imageBase64: string) => {
    const res = await fetch(`${API_BASE_URL}/gesture/predict-base64`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ image: imageBase64 }),
    })
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json()
    return data
  }, [API_BASE_URL, token])


  const saveSampleFromCamera = useCallback(
    async (label: string, imageBase64: string) => {
      if (!user?.id) throw new Error("Missing user_id")

      const res = await fetch(`${API_BASE_URL}/collect/sample-base64`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // backend hiện chưa check token, nhưng để vẫn ok
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: String(user.id),
          label: String(label),
          image_base64: imageBase64,
        }),
      })

      if (!res.ok) throw new Error(await res.text())
      return await res.json()
    },
    [API_BASE_URL, token, user?.id]
  )

  useEffect(() => {
    // chỉ chạy khi: đang bật thu thập + chọn camera + camera đang bật
    if (!dataCollectionMode || collectionMethod !== "camera" || !isStreamActive) {
      setCanSaveCamera(false)
      setCameraFrameForSave(null)
      setHandHint("Chưa bật camera/thu thập")
      return
    }

    if (!isAuthenticated || !token) {
      setCanSaveCamera(false)
      setCameraFrameForSave(null)
      setHandHint("Cần đăng nhập")
      return
    }

    let alive = true

    const tick = async () => {
      const frame = captureFrameBase64()
      if (!frame) {
        if (!alive) return
        setCanSaveCamera(false)
        setHandHint("Đang chờ camera sẵn sàng...")
        return
      }

      try {
        // dùng đúng endpoint predict bạn đang dùng cho upload
        const res = await fetch(`${API_BASE_URL}/gesture/predict-base64`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ image: frame }),
        })

        if (!res.ok) {
          if (!alive) return
          setCanSaveCamera(false)
          setHandHint("Không kiểm tra được tay (API lỗi)")
          return
        }

        const data = (await res.json()) as { has_hand: boolean; gesture: string }

        if (!alive) return

        // const hasHand = data.has_hand !== false && data.gesture !== "no_hand"
        const hasHand = data.has_hand === true

        setCanSaveCamera(hasHand)
        setHandHint(hasHand ? "Đang thấy tay – có thể lưu" : "⚠️ Chưa thấy tay rõ")

        if (hasHand) setCameraFrameForSave(frame)
      } catch (e) {
        console.error(e)
        if (!alive) return
        setCanSaveCamera(false)
        setHandHint("Lỗi khi kiểm tra tay")
      }
    }

    // chạy ngay và lặp
    tick()
    const id = setInterval(tick, 1200)

    return () => {
      alive = false
      clearInterval(id)
    }
  }, [
    dataCollectionMode,
    collectionMethod,
    isStreamActive,
    isAuthenticated,
    token,
    API_BASE_URL,
    captureFrameBase64,
  ])


  // ====== COLLECT FROM CAMERA (SAVE DIRECTLY) ======

  const handleCollectSample = useCallback(async () => {
    if (!isAuthenticated || !token) return
    if (!user?.id) {
      showSaveNotice("Thiếu user_id")
      return
    }
    if (!isStreamActive) {
      showSaveNotice("Camera chưa bật")
      return
    }
    if (!canSaveCamera) {
      showSaveNotice("Chưa thấy tay trong khung hình nên chưa thể lưu")
      return
    }

    setIsCollecting(true)
    setCollectProgress({ saved: 0, tried: 0 })

    let ok = 0

    try {
      for (let i = 0; i < collectBatchSize; i++) {
        const frame = captureFrameBase64()
        if (!frame) {
          setCollectProgress((p) => (p ? { ...p, tried: p.tried + 1 } : { saved: ok, tried: 1 }))
          continue
        }

        const res = await fetch(`${API_BASE_URL}/collect/sample-base64`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: String(user.id),
            label: String(selectedGestureForCollection),
            image_base64: frame,
          }),
        })

        if (res.ok) ok++

        setCollectProgress((p) =>
          p ? { saved: ok, tried: p.tried + 1 } : { saved: ok, tried: 1 }
        )

        await sleep(200) // để frame khác nhau
      }

      if (ok > 0) {
        setCollectedSamples((prev) => ({
          ...prev,
          [selectedGestureForCollection]: (prev[selectedGestureForCollection] || 0) + ok,
        }))
      }

      showSaveNotice(`Đã lưu ${ok}/${collectBatchSize} mẫu cho cử chỉ ${selectedGestureForCollection}`)
    } catch (e) {
      console.error(e)
      showSaveNotice("Lưu mẫu thất bại")
    } finally {
      setIsCollecting(false)
      setCollectProgress(null)
    }
  }, [
    isAuthenticated,
    token,
    user?.id,
    isStreamActive,
    canSaveCamera,
    collectBatchSize,
    selectedGestureForCollection,
    API_BASE_URL,
    captureFrameBase64,
    showSaveNotice,
  ])


  // ====== UPLOAD IMAGE FLOW: SELECT -> RECOGNIZE -> THEN SAVE ======
  const handleUploadFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    setUploadPredictResult(null)
    setUploadFileName(file.name)

    if (!file.type.startsWith("image/")) {
      setUploadError("Vui lòng chọn đúng file ảnh.")
      return
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError("Ảnh quá lớn. Giới hạn 10MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setUploadDataUrl(reader.result as string)
    }
    reader.onerror = () => setUploadError("Không đọc được file ảnh, vui lòng thử lại.")
    reader.readAsDataURL(file)
  }, [])

  const handleRecognizeUploadedImage = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setUploadError("Vui lòng đăng nhập để nhận diện.")
      return
    }
    if (!uploadDataUrl) {
      setUploadError("Bạn chưa chọn ảnh.")
      return
    }

    try {
      setIsUploadPredicting(true)
      setUploadError(null)
      setUploadPredictResult(null)

      const res = await fetch(`${API_BASE_URL}/gesture/predict-base64`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ image: uploadDataUrl }),
      })

      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as UploadPredictResult
      setUploadPredictResult(data)

      // (tuỳ chọn) auto set label theo kết quả nhận diện
      if (data?.gesture && data.gesture !== "no_hand") {
        setSelectedGestureForCollection(String(data.gesture))
      }
    } catch (e) {
      console.error(e)
      setUploadError("Không nhận diện được ảnh. Vui lòng thử lại.")
    } finally {
      setIsUploadPredicting(false)
    }
  }, [isAuthenticated, token, uploadDataUrl])


  const canSaveUpload =
    !!uploadPredictResult &&
    uploadPredictResult.has_hand !== false &&
    uploadPredictResult.gesture !== "no_hand"

  const handleSaveUploadedSample = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setUploadError("Vui lòng đăng nhập để thu thập dữ liệu.")
      return
    }
    if (!user?.id) {
      setUploadError("Thiếu user_id.")
      return
    }
    if (!uploadDataUrl) {
      setUploadError("Bạn chưa chọn ảnh.")
      return
    }
    if (!uploadPredictResult) {
      setUploadError('Hãy bấm "Nhận diện" trước khi quyết định lưu.')
      return
    }
    if (uploadPredictResult.has_hand === false || uploadPredictResult.gesture === "no_hand") {
      setUploadError("Ảnh này không thấy tay/không hợp lệ để lưu làm mẫu.")
      return
    }

    try {
      setIsSavingUpload(true)
      setUploadError(null)

      const res = await fetch(`${API_BASE_URL}/collect/sample-base64`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          user_id: String(user.id),
          label: String(uploadPredictResult.gesture),
          image_base64: uploadDataUrl,
        }),
      })

      if (!res.ok) throw new Error(await res.text())

      setCollectedSamples((prev) => ({
        ...prev,
        [String(uploadPredictResult.gesture)]: (prev[String(uploadPredictResult.gesture)] || 0) + 1,
      }))
      showSaveNotice(`Đã lưu mẫu cử chỉ nhãn ${uploadPredictResult!.gesture} thành công!`)
      clearUploadedImage()
    } catch (e) {
      console.error(e)
      setUploadError("Không lưu được mẫu từ ảnh. Vui lòng thử lại.")
    } finally {
      setIsSavingUpload(false)
    }
  }, [isAuthenticated, token, user?.id, uploadDataUrl, uploadPredictResult, clearUploadedImage])


  const getStatusIcon = () => {
    switch (recognitionStatus) {
      case "ready":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case "detecting":
        return <AlertCircle className="w-5 h-5 text-blue-500 animate-pulse" />
      case "no_hand":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case "high_confidence":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case "permission_denied":
        return <Lock className="w-5 h-5 text-red-500" />
      case "not_supported":
        return <Camera className="w-5 h-5 text-red-500" />
      default:
        return <Info className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusText = () => {
    switch (recognitionStatus) {
      case "ready":
        return "Sẵn sàng nhận diện"
      case "detecting":
        return "Đang nhận diện..."
      case "no_hand":
        return "Không thấy tay hoặc độ tin cậy thấp"
      case "hand_obscured":
        return "Tay bị che khuất"
      case "high_confidence":
        return "Nhận diện thành công"
      case "permission_denied":
        return "Quyền truy cập bị từ chối"
      case "not_supported":
        return "Camera không khả dụng"
      default:
        return "Chế độ nhàn rỗi"
    }
  }

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"
        strategy="afterInteractive"
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"
        strategy="afterInteractive"
      />
      <div className="space-y-6">
        {/* Camera Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-teal-500">Camera nhận diện</h2>
            <div className="flex items-center gap-2 text-sm">
              {getStatusIcon()}
              <span className="text-muted-foreground">{getStatusText()}</span>
            </div>
          </div>

          {cameraError && (
            <Alert variant="destructive" className="border-red-500 bg-red-50 dark:bg-red-950">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 dark:text-red-200">{cameraError}</AlertDescription>
            </Alert>
          )}

          <div className="relative w-full bg-black rounded-lg overflow-hidden border-2 border-primary/30">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full aspect-video object-cover"
              aria-label="Webcam feed for gesture recognition"
            />

            <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
            <canvas ref={canvasRef} className="hidden" />

            {!isStreamActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white text-center p-4">
                <Camera className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-semibold">Camera chưa khởi động</p>
                {cameraError && <p className="text-sm mt-2 text-gray-300">Bấm nút dưới để cấp quyền camera</p>}
              </div>
            )}
          </div>

          <div className="flex gap-3 flex-wrap">
            {!isStreamActive ? (
              <Button
                onClick={initializeCamera}
                size="lg"
                className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-bold text-lg py-6"
                disabled={cameraError !== null && recognitionStatus === "not_supported"}
              >
                <Camera className="w-5 h-5 mr-2" />
                Khởi động camera
              </Button>
            ) : (
              <>
                <Button
                  onClick={handlePrimaryButtonClick}
                  disabled={isLoading || !isStreamActive}
                  size="lg"
                  className={`flex-1 font-bold text-lg py-6 text-white transition-colors
                  ${recognitionStatus === "high_confidence" ? "bg-primary hover:bg-primary/90" : "bg-accent hover:bg-accent/90"}`}
                >
                  {isLoading ? "Đang xử lý..." : recognitionStatus === "high_confidence" ? "Tiếp tục nhận diện" : "Đang nhận diện..."}
                </Button>

                <Button
                  onClick={stopCamera}
                  variant="outline"
                  size="lg"
                  className="px-6 py-6 font-bold text-lg text-white-600 border-red-600 hover:bg-red-50 hover:text-white-600 dark:hover:bg-red-900/30"
                >
                  Tắt camera
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Result Display */}
        {currentResult && !dataCollectionMode && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-primary">Kết quả nhận diện</h3>

            <Card className="bg-primary/5 border-2 border-primary/30 p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-muted-foreground">Cử chỉ:</span>
                <span className="text-2xl font-bold text-primary">{currentResult.gesture}</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-muted-foreground">Độ tin cậy:</span>
                  <span className="text-xl font-bold text-accent">{(currentResult.confidence * 100).toFixed(1)}%</span>
                </div>

                <div className="w-full h-3 bg-muted rounded-full overflow-hidden border border-border">
                  <div
                    className="h-full bg-gradient-to-r from-secondary to-accent transition-all duration-300"
                    style={{ width: `${currentResult.confidence * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-lg font-semibold text-muted-foreground block">Văn bản:</span>
                <div className="text-3xl font-bold text-primary text-center bg-primary/10 p-4 rounded-lg border border-primary/20">
                  {currentResult.text}
                </div>
              </div>

              {pendingSpeech && (
                <p className="mt-2 text-sm font-semibold text-amber-500 text-center">
                  Hãy giữ vị trí tay của bạn trong <span className="font-bold">{countdown ?? 0}</span> giây, hệ thống sẽ tự phát âm...
                </p>
              )}

              <TextToSpeech text={currentResult.text} />
            </Card>
          </div>
        )}



        {mappingError && (
          <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{mappingError}</AlertDescription>
          </Alert>
        )}

        {isMappingLoading && <p className="text-sm text-muted-foreground">Đang tải cấu hình cử chỉ của bạn...</p>}

        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings">Cài Đặt</TabsTrigger>
            <TabsTrigger value="collection">Thu Thập Dữ Liệu</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4">
            <Card className="border-2 border-secondary/20 p-6 space-y-6 ">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-semibold">Ngưỡng độ tin cậy</Label>
                  <span className="text-lg font-bold text-teal-500 ">{(confidenceThreshold * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  value={[confidenceThreshold]}
                  onValueChange={(value: number[]) => setConfidenceThreshold(value[0])}
                  min={0.3}
                  max={0.95}
                  step={0.05}
                  className="w-full bg-teal-500"
                />
                <p className="text-sm text-muted-foreground">Chỉ chấp nhận cử chỉ có độ tin cậy cao hơn ngưỡng này</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                <div className="space-y-1">
                  <Label className="text-base font-semibold">Chế độ 1 Chạm</Label>
                  <p className="text-sm text-muted-foreground">Tự động xử lý cử chỉ mà không cần bấm nút</p>
                </div>
                <Switch checked={oneTabMode} onCheckedChange={setOneTabMode} />
              </div>

              <div className="flex items-center justify-between p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                <div className="space-y-1">
                  <Label className="text-base font-semibold">Đọc tự động</Label>
                  <p className="text-sm text-muted-foreground">Khi bật, hệ thống sẽ hiển thị thông báo giữ tay và tự đọc sau 2 giây</p>
                </div>
                <Switch checked={autoSpeak} onCheckedChange={setAutoSpeak} />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="collection" className="space-y-4">
            <Card className="border-2 border-accent/20 p-6 space-y-6">
              {!dataCollectionMode ? (
                <>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>Chế độ thu thập dữ liệu cho phép bạn ghi lại các mẫu cử chỉ để huấn luyện model.</AlertDescription>
                  </Alert>

                  <Button
                    onClick={() => {
                      setDataCollectionMode(true)
                      setCollectionMethod("none")
                      setUploadDataUrl(null)
                      setUploadFileName(null)
                      setUploadError(null)
                      setUploadPredictResult(null)
                      refreshSampleCounts()
                    }}
                    className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-6"
                  >
                    Bật chế độ thu thập dữ liệu
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      {/* <p className="text-lg font-bold text-teal-500">Thu thập dữ liệu</p> */}

                    </div>

                    <Button
                      variant="outline"
                      className="hover:bg-teal-500"
                      onClick={() => {
                        setDataCollectionMode(false)
                        setCollectionMethod("none")
                        setUploadDataUrl(null)
                        setUploadFileName(null)
                        setUploadError(null)
                        setUploadPredictResult(null)
                      }}
                    >
                      Tắt chế độ
                    </Button>
                  </div>

                  {collectionMethod === "none" ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card className="p-5 border-2 border-blue-200 bg-blue-50/40">
                        <div className="flex items-center gap-2">
                          <Image className="w-6 h-6 text-blue-700" />
                          <p className="text-lg font-bold text-blue-700">Thu thập bằng ảnh</p>
                        </div>
                        <Button
                          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6"
                          onClick={() => {
                            setCollectionMethod("image")
                            setUploadError(null)
                            setUploadPredictResult(null)
                          }}
                        >
                          Chọn phương thức ảnh
                        </Button>
                      </Card>

                      <Card className="p-5 border-2 border-green-200 bg-green-50/40">
                        <div className="flex items-center gap-2">
                          <Camera className="w-6 h-6 text-green-700" />
                          <p className="text-lg font-bold text-green-700">Thu thập bằng camera</p>
                        </div>
                        <Button
                          className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6"
                          onClick={() => setCollectionMethod("camera")}
                        >
                          Chọn phương thức camera
                        </Button>
                      </Card>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-3 rounded-lg border p-4 bg-muted/20">
                        <div>
                          <p className="font-semibold">
                            Phương thức đang dùng:{" "}
                            <span className={collectionMethod === "image" ? "text-blue-700 font-bold" : "text-green-700 font-bold"}>
                              {collectionMethod === "image" ? "Thu thập bằng ảnh" : "Thu thập bằng camera"}
                            </span>
                          </p>
                          <p className="text-sm text-muted-foreground">Bạn có thể đổi phương thức bất kỳ lúc nào.</p>
                        </div>

                        <Button
                          variant="outline"
                          className="hover:bg-teal-500"
                          onClick={() => {
                            setCollectionMethod("none")
                            setUploadDataUrl(null)
                            setUploadFileName(null)
                            setUploadError(null)
                            setUploadPredictResult(null)
                          }}
                        >
                          Đổi phương thức
                        </Button>
                      </div>
                      {saveNotice && (
                        <Alert className="mb-4 border-green-500/80 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-100">
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <AlertDescription className="text-green-700 dark:text-green-100">
                            {saveNotice}
                          </AlertDescription>
                        </Alert>
                      )}
                      {/* IMAGE UPLOAD METHOD - giữ UI cũ nhưng chạy đúng chức năng */}
                      {collectionMethod === "image" && (
                        <Card className="p-6 border-2 border-blue-200 bg-blue-50/30">
                          <div className="mt-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-base font-bold text-foreground">Tải Ảnh Cử Chỉ Lên</h3>
                              <Badge variant="outline" className="text-xs">
                                Giới hạn: 10MB
                              </Badge>
                            </div>

                            {uploadError && (
                              <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/30 border-red-200">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-sm">{uploadError}</AlertDescription>
                              </Alert>
                            )}

                            {uploadDataUrl ? (
                              <div className="space-y-4">
                                <div className="relative w-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl overflow-hidden border border-border/50 shadow-inner">
                                  <img
                                    src={uploadDataUrl || "/placeholder.svg"}
                                    alt="Uploaded gesture"
                                    className="w-full aspect-video object-contain"
                                  />
                                  <Button
                                    onClick={clearUploadedImage}
                                    size="sm"
                                    variant="destructive"
                                    className="absolute top-3 right-3 shadow-lg"
                                    aria-label="Remove uploaded image"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>

                                <Button
                                  onClick={handleRecognizeUploadedImage}
                                  disabled={isUploadPredicting || !uploadDataUrl}
                                  size="lg"
                                  className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-bold text-base h-14 shadow-md hover:shadow-lg transition-all"
                                >
                                  {isUploadPredicting ? (
                                    <span className="flex items-center gap-2">
                                      <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                      Đang nhận diện...
                                    </span>
                                  ) : (
                                    "Nhận Diện"
                                  )}
                                </Button>

                                {uploadPredictResult && (
                                  <Card className="p-4 border border-blue-200 bg-white/70 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-muted-foreground">Kết quả:</span>
                                      <span className="font-bold text-blue-700">
                                        {uploadPredictResult.has_hand === false || uploadPredictResult.gesture === "no_hand"
                                          ? "Không thấy tay"
                                          : `Cử chỉ ${uploadPredictResult.gesture}`}
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-muted-foreground">Độ tin cậy:</span>
                                      <span className="font-bold">
                                        {(Number(uploadPredictResult.confidence || 0) * 100).toFixed(1)}%
                                      </span>
                                    </div>

                                    <div className="space-y-1">
                                      <span className="text-sm text-muted-foreground">Văn bản:</span>
                                      <div className="font-bold text-lg text-center rounded-md border p-3">
                                        {uploadPredictResult.text || "Không xác định"}
                                      </div>
                                    </div>

                                    {!canSaveUpload && (
                                      <Alert>
                                        <Info className="h-4 w-4" />
                                        <AlertDescription>Ảnh này không thấy tay rõ nên hệ thống không cho lưu làm mẫu.</AlertDescription>
                                      </Alert>
                                    )}
                                  </Card>
                                )}

                                <Button
                                  onClick={handleSaveUploadedSample}
                                  disabled={isSavingUpload || !uploadPredictResult || !canSaveUpload}
                                  size="lg"
                                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-14 shadow-md hover:shadow-lg transition-all"
                                >
                                  {isSavingUpload ? "Đang lưu..." : "Lưu ảnh này làm mẫu"}
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/*"
                                  onChange={handleUploadFileChange}
                                  className="hidden"
                                  id="image-upload"
                                />
                                <label
                                  htmlFor="image-upload"
                                  className="flex flex-col items-center justify-center w-full h-48 px-4 border-2 border-dashed border-border/50 rounded-xl cursor-pointer bg-gradient-to-br from-secondary/5 to-transparent hover:from-secondary/10 hover:to-secondary/5 transition-all group"
                                >
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <div className="p-3 bg-primary/10 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                      <Upload className="w-8 h-8 text-primary" />
                                    </div>
                                    <p className="mb-2 text-base font-semibold text-foreground">Nhấp để tải ảnh lên hoặc kéo thả vào đây</p>
                                    <p className="text-sm text-muted-foreground">PNG, JPG, JPEG (tối đa 5MB)</p>
                                  </div>
                                </label>
                              </div>
                            )}
                          </div>
                        </Card>
                      )}

                      {/* CAMERA METHOD (giữ nguyên) */}
                      {/* {collectionMethod === "camera" && (
                      <Card className="p-6 border-2 border-green-200 bg-green-50/30 space-y-4">
                        <div className="space-y-1">
                          <p className="text-lg font-bold text-green-700">Chụp từ camera để thu thập</p>
                          <p className="text-sm text-green-700/80">Bật camera ở phía trên, giơ tay đúng cử chỉ rồi bấm “Lưu mẫu”.</p>
                        </div>

                        <Button
                          onClick={handleCollectSample}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6"
                          disabled={!isStreamActive}
                        >
                          Lưu mẫu từ camera
                        </Button>

                        {!isStreamActive && (
                          <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>Camera chưa bật. Hãy khởi động camera ở phần trên trước khi lưu mẫu.</AlertDescription>
                          </Alert>
                        )}
                      </Card>
                    )} */}
                      {collectionMethod === "camera" && (
                        <Card className="p-6 border-2 border-green-200 bg-green-50/30 space-y-4">
                          <div className="space-y-1">
                            <p className="text-lg font-bold text-green-700">Chụp từ camera để thu thập</p>
                            <p className="text-sm text-green-700/80">
                              Chọn nhãn → giơ tay đúng cử chỉ → bấm “Lưu mẫu”. Hệ thống chỉ lưu khi thấy tay rõ và đủ độ tin cậy.
                            </p>
                          </div>

                          {/* error riêng cho collect */}
                          {collectError && (
                            <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/30 border-red-200">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription className="text-sm">{collectError}</AlertDescription>
                            </Alert>
                          )}

                          {/* Chọn nhãn cần thu thập */}
                          <div className="space-y-2">
                            <p className="font-semibold text-green-800">
                              Nhãn đang thu thập: <span className="font-bold">{selectedGestureForCollection}</span>{" "}
                              <span className="text-sm text-muted-foreground">
                                (hiện có {collectedSamples[selectedGestureForCollection] || 0} mẫu)
                              </span>
                            </p>

                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                              {gestureList.map((g) => {
                                const id = String(g.id)
                                const active = id === String(selectedGestureForCollection)
                                return (
                                  <Button
                                    key={id}
                                    type="button"
                                    variant={active ? "default" : "outline"}
                                    className={active ? "bg-green-600 hover:bg-green-700" : ""}
                                    onClick={() => setSelectedGestureForCollection(id)}
                                    disabled={isCollecting}
                                  >
                                    {id}
                                  </Button>
                                )
                              })}
                            </div>
                          </div>

                          {/* Chọn batch size */}
                          <div className="space-y-2">
                            <p className="font-semibold text-green-800">Số mẫu mỗi lần lưu</p>
                            <div className="flex gap-2 flex-wrap">
                              {([1, 5, 10] as const).map((n) => {
                                const active = n === collectBatchSize
                                return (
                                  <Button
                                    key={n}
                                    type="button"
                                    variant={active ? "default" : "outline"}
                                    className={active ? "bg-green-600 hover:bg-green-700" : ""}
                                    onClick={() => setCollectBatchSize(n)}
                                    disabled={isCollecting}
                                  >
                                    {n} mẫu
                                  </Button>
                                )
                              })}
                            </div>
                          </div>

                          {/* Progress */}
                          {isCollecting && collectProgress && (
                            <Alert className="border-blue-300 bg-blue-50">
                              <Info className="h-4 w-4" />
                              <AlertDescription className="text-sm">
                                Đang thu thập... đã lưu {collectProgress.saved}/{collectProgress.tried} (mục tiêu {collectBatchSize})
                              </AlertDescription>
                            </Alert>
                          )}

                          {/* <Button
                          onClick={handleCollectSample}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6"
                          disabled={!isStreamActive || isCollecting}
                        >
                          {isCollecting ? "Đang lưu..." : `Lưu ${collectBatchSize} mẫu từ camera`}
                        </Button> */}

                          <p className="text-sm text-muted-foreground">{handHint}</p>

                          <Button
                            onClick={handleCollectSample}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6"
                            disabled={!isStreamActive || !canSaveCamera || isCollecting}
                          >
                            {isCollecting
                              ? `Đang lưu... ${collectProgress?.saved ?? 0}/${collectBatchSize}`
                              : `Lưu ${collectBatchSize} mẫu`}
                          </Button>



                          {!isStreamActive && (
                            <Alert>
                              <Info className="h-4 w-4" />
                              <AlertDescription>Camera chưa bật. Hãy khởi động camera ở phần trên trước khi lưu mẫu.</AlertDescription>
                            </Alert>
                          )}
                        </Card>
                      )}


                      <div className="grid grid-cols-3 gap-2">
                        {gestureList.map((gesture) => (
                          <div key={gesture.id} className="text-center p-3 bg-primary/5 rounded-lg border border-primary/20">
                            <p className="text-lg font-bold text-primary">{gesture.id}</p>
                            <p className="text-xs text-muted-foreground mb-1">{gesture.text}</p>
                            <p className="text-2xl font-bold text-accent">{collectedSamples[gesture.id] || 0}</p>
                            <p className="text-xs text-muted-foreground">mẫu</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Dialog open={modeDialogOpen} onOpenChange={setModeDialogOpen}>
        <DialogContent className="sm:max-w-md [&>button]:hidden">
          <DialogHeader>
            <DialogTitle>Đang chuyển chế độ nhận diện</DialogTitle>
            <DialogDescription>
              {modeDialogMessage}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
