"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Info, Camera, Lock } from "lucide-react"
import TextToSpeech from "./text-to-speech"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface GestureRecognitionProps {
  onGestureDetected: (gesture: string, text: string, confidence: number) => void
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

export default function GestureRecognition({ onGestureDetected }: GestureRecognitionProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
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

  // trạng thái & timer cho thông báo + đọc sau 5s
  const [pendingSpeech, setPendingSpeech] = useState(false)
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSpokenGestureRef = useRef<string | null>(null)
  // dem nguoc
  const [countdown, setCountdown] = useState<number | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Gọi API TTS backend để phát tiếng Việt chuẩn
  const playServerTTS = useCallback(async (text: string) => {
    try {
      if (!text.trim()) return

      const res = await fetch("http://127.0.0.1:8000/tts/vi", {
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

      audio.onended = () => {
        URL.revokeObjectURL(url)
      }
      audio.onerror = (e) => {
        console.error("Error playing TTS audio:", e)
        URL.revokeObjectURL(url)
      }

      await audio.play()
    } catch (err) {
      console.error("playServerTTS error:", err)
    }
  }, [])


  const defaultGestures = [
    { id: "0", name: "Cử chỉ 0", text: "Xin chào" },
    { id: "1", name: "Cử chỉ 1", text: "Tôi cần giúp đỡ" },
    { id: "2", name: "Cử chỉ 2", text: "Vâng" },
    { id: "3", name: "Cử chỉ 3", text: "Không" },
    { id: "4", name: "Cử chỉ 4", text: "Cảm ơn" },
    { id: "5", name: "Cử chỉ 5", text: "Tôi đang đau" },
  ]

  // dọn dẹp timer khi unmount
  useEffect(() => {
    return () => {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current)
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [])

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
  }, [])

  const stopCamera = useCallback(() => {
    // Dừng stream nếu đang bật
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }

    setIsStreamActive(false)
    setRecognitionStatus("idle")

    // Xoá kết quả hiện tại (tuỳ bạn, có thể giữ lại nếu muốn)
    setCurrentResult(null)

    // Huỷ các timer đếm ngược / auto speak
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

  const captureAndPredict = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

    try {
      setIsLoading(true)
      setRecognitionStatus("detecting")

      const ctx = canvasRef.current.getContext("2d")
      if (!ctx) return

      canvasRef.current.width = videoRef.current.videoWidth
      canvasRef.current.height = videoRef.current.videoHeight
      ctx.drawImage(videoRef.current, 0, 0)

      const base64Image = canvasRef.current.toDataURL("image/jpeg", 0.9)

      const response = await fetch("/api/gesture/predict-base64", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      })

      if (!response.ok) {
        const msg = await response.text()
        console.error("API /api/gesture/predict-base64 error:", response.status, msg)
        throw new Error("API request failed")
      }

      const data = await response.json()
      // 👇 thêm has_hand ở đây (backend phải trả về)
      const { gesture, confidence, text, has_hand } = data

      // 1) Không có tay trong khung -> hiện đúng câu bạn muốn
      if (has_hand === false || gesture === "no_hand") {
        setRecognitionStatus("no_hand")
        setCurrentResult({
          gesture: "-",                               // không hiển thị lớp
          text: "Vui lòng giơ tay vào camera",        // 👈 thông báo
          confidence: 0,                              // thanh % = 0
        })

        // tắt mọi hẹn giờ đọc, tắt thông báo
        if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current)
        setPendingSpeech(false)
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
      } else {
        // nhận diện thành công
        const effectiveGesture = gesture || "Unknown"
        const effectiveText = text || "Không xác định"
        const effectiveConf = confidence || 0

        setRecognitionStatus("high_confidence")
        setCurrentResult({
          gesture: effectiveGesture,
          text: effectiveText,
          confidence: effectiveConf,
        })
        onGestureDetected(effectiveGesture, effectiveText, effectiveConf)

        // 🔊 Đọc tự động sau 3s nếu autoSpeak bật
        if (autoSpeak && !pendingSpeech) {
          const TOTAL_SECONDS = 3

          // huỷ timer cũ nếu có
          if (speechTimeoutRef.current) {
            clearTimeout(speechTimeoutRef.current)
          }
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current)
          }

          // bật thông báo giữ tay + set countdown
          setPendingSpeech(true)
          setCountdown(TOTAL_SECONDS)

          // interval đếm ngược mỗi 1 giây
          countdownIntervalRef.current = setInterval(() => {
            setCountdown((prev) => {
              if (prev === null) return null
              if (prev <= 1) {
                // tới 0 thì dừng đếm
                if (countdownIntervalRef.current) {
                  clearInterval(countdownIntervalRef.current)
                  countdownIntervalRef.current = null
                }
                return 0
              }
              return prev - 1
            })
          }, 1000)

          // sau 3 giây thì phát âm
          speechTimeoutRef.current = setTimeout(() => {
            setPendingSpeech(false)
            setCountdown(null)

            // dùng TTS từ server, không dùng speechSynthesis nữa
            void playServerTTS(effectiveText)
          }, TOTAL_SECONDS * 1000)
        } else if (!autoSpeak) {
          // tắt autoSpeak → huỷ timer và reset
          if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current)
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
          setPendingSpeech(false)
          setCountdown(null)
        }

        if (oneTabMode && confidence >= confidenceThreshold) {
          console.log("[v0] One-tap mode enabled, gesture processed automatically")
        }
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
    } finally {
      setIsLoading(false)
    }
  }, [onGestureDetected, confidenceThreshold, autoSpeak, oneTabMode, pendingSpeech, playServerTTS])

  const handlePrimaryButtonClick = useCallback(() => {
    if (recognitionStatus === "high_confidence") {
      // Vừa nhận diện xong, giờ muốn nhận tiếp cử chỉ khác:
      // reset trạng thái về "ready", xoá kết quả cũ, huỷ timer
      setRecognitionStatus("ready")
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
    } else {
      void captureAndPredict()
    }
  }, [recognitionStatus, captureAndPredict])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    // 👇 khi đang đếm ngược (pendingSpeech = true) thì TẠM DỪNG auto nhận diện
    if (isStreamActive && !dataCollectionMode && !pendingSpeech && recognitionStatus !== "high_confidence") {
      interval = setInterval(() => {
        captureAndPredict()
      }, 2000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isStreamActive, captureAndPredict, dataCollectionMode, pendingSpeech, recognitionStatus])

  const handleCollectSample = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    canvasRef.current.width = videoRef.current.videoWidth
    canvasRef.current.height = videoRef.current.videoHeight
    ctx.drawImage(videoRef.current, 0, 0)

    const base64Image = canvasRef.current.toDataURL("image/jpeg", 0.9)

    setCollectedSamples((prev) => ({
      ...prev,
      [selectedGestureForCollection]: (prev[selectedGestureForCollection] || 0) + 1,
    }))

    localStorage.setItem(
      `gesture_samples_${selectedGestureForCollection}`,
      JSON.stringify({
        count: (collectedSamples[selectedGestureForCollection] || 0) + 1,
        samples: [base64Image],
        timestamp: new Date(),
      }),
    )
  }, [selectedGestureForCollection, collectedSamples])

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
    <div className="space-y-6">
      {/* Camera Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-primary">Camera Nhận Diện</h2>
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

        {/* Video Feed */}
        <div className="relative w-full bg-black rounded-lg overflow-hidden border-2 border-primary/30">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full aspect-video object-cover"
            aria-label="Webcam feed for gesture recognition"
          />
          <canvas ref={canvasRef} className="hidden" />

          {!isStreamActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white text-center p-4">
              <Camera className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-semibold">Camera chưa khởi động</p>
              {cameraError && <p className="text-sm mt-2 text-gray-300">Bấm nút dưới để cấp quyền camera</p>}
            </div>
          )}
        </div>

        {/* Camera Controls */}
        <div className="flex gap-3 flex-wrap">
          {!isStreamActive ? (
            <Button
              onClick={initializeCamera}
              size="lg"
              className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold text-lg py-6"
              disabled={cameraError !== null && recognitionStatus === "not_supported"}
            >
              <Camera className="w-5 h-5 mr-2" />
              Khởi động camera
            </Button>
          ) : (
            <>
              {/* <Button
                onClick={captureAndPredict}
                disabled={isLoading}
                size="lg"
                className="flex-1 bg-accent hover:bg-accent/90 text-white font-bold text-lg py-6"
                aria-label={isLoading ? "Processing gesture..." : "Detect gesture"}
              >
                {isLoading ? "Đang xử lý..." : "Đang nhận diện..."}
              </Button> */}
              <Button
                onClick={handlePrimaryButtonClick}
                disabled={isLoading}
                size="lg"
                className={`flex-1 font-bold text-lg py-6 text-white transition-colors
                  ${recognitionStatus === "high_confidence"
                    ? "bg-primary hover:bg-primary/90"       // 👉 giống nút Khởi động camera
                    : "bg-accent hover:bg-accent/90"         // 👉 trạng thái bình thường
                  }`}
                aria-label={
                  isLoading
                    ? "Processing gesture..."
                    : recognitionStatus === "high_confidence"
                      ? "Continue detection"
                      : "Detect gesture"
                }
              >
                {isLoading
                  ? "Đang xử lý..."
                  : recognitionStatus === "high_confidence"
                    ? "Tiếp tục nhận diện"
                    : "Đang nhận diện..."}
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
          <h3 className="text-xl font-bold text-primary">Kết Quả Nhận Diện</h3>

          <Card className="bg-primary/5 border-2 border-primary/30 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-muted-foreground">Cử Chỉ:</span>
              <span className="text-2xl font-bold text-primary">{currentResult.gesture}</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-muted-foreground">Độ Tin Cậy:</span>
                <span className="text-xl font-bold text-accent">
                  {(currentResult.confidence * 100).toFixed(1)}%
                </span>
              </div>

              <div className="w-full h-3 bg-muted rounded-full overflow-hidden border border-border">
                <div
                  className="h-full bg-gradient-to-r from-secondary to-accent transition-all duration-300"
                  style={{ width: `${currentResult.confidence * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-lg font-semibold text-muted-foreground block">Văn Bản:</span>
              <div className="text-3xl font-bold text-primary text-center bg-primary/10 p-4 rounded-lg border border-primary/20">
                {currentResult.text}
              </div>
            </div>

            {/* 🔔 Thông báo giữ tay + tự nói sau 10s */}
            {pendingSpeech && (
              <p className="mt-2 text-sm font-semibold text-amber-500 text-center">
                Hãy giữ vị trí tay của bạn trong{" "}
                <span className="font-bold">{countdown ?? 0}</span> giây, hệ thống sẽ tự phát âm...
              </p>
            )}

            <TextToSpeech text={currentResult.text} />
          </Card>
        </div>
      )}

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="settings">Cài Đặt</TabsTrigger>
          <TabsTrigger value="collection">Thu Thập Dữ Liệu</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Card className="border-2 border-secondary/20 p-6 space-y-6">
            {/* Confidence Threshold */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-base font-semibold">Ngưỡng Độ Tin Cậy</Label>
                <span className="text-lg font-bold text-primary">
                  {(confidenceThreshold * 100).toFixed(0)}%
                </span>
              </div>
              <Slider
                value={[confidenceThreshold]}
                onValueChange={(value: number[]) => setConfidenceThreshold(value[0])}
                min={0.3}
                max={0.95}
                step={0.05}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Chỉ chấp nhận cử chỉ có độ tin cậy cao hơn ngưỡng này
              </p>
            </div>

            {/* One-Tap Mode */}
            <div className="flex items-center justify-between p-4 bg-secondary/10 rounded-lg border border-secondary/20">
              <div className="space-y-1">
                <Label className="text-base font-semibold">Chế Độ 1 Chạm</Label>
                <p className="text-sm text-muted-foreground">Tự động xử lý cử chỉ mà không cần bấm nút</p>
              </div>
              <Switch checked={oneTabMode} onCheckedChange={setOneTabMode} />
            </div>

            {/* Auto-Speak */}
            <div className="flex items-center justify-between p-4 bg-secondary/10 rounded-lg border border-secondary/20">
              <div className="space-y-1">
                <Label className="text-base font-semibold">Đọc Tự Động</Label>
                <p className="text-sm text-muted-foreground">
                  Khi bật, hệ thống sẽ hiển thị thông báo giữ tay và tự đọc sau 3 giây
                </p>
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
                  <AlertDescription>
                    Chế độ thu thập dữ liệu cho phép bạn ghi lại các mẫu cử chỉ để huấn luyện model.
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={() => setDataCollectionMode(true)}
                  className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-6"
                >
                  Bật Chế Độ Thu Thập Dữ Liệu
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Chọn Cử Chỉ Để Ghi Dữ Liệu</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {defaultGestures.map((gesture) => (
                      <Button
                        key={gesture.id}
                        variant={selectedGestureForCollection === gesture.id ? "default" : "outline"}
                        onClick={() => setSelectedGestureForCollection(gesture.id)}
                        className="flex flex-col items-center gap-2 py-4"
                      >
                        <span className="text-lg font-bold">{gesture.id}</span>
                        <span className="text-xs">{collectedSamples[gesture.id] || 0} mẫu</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Giơ cử chỉ "{selectedGestureForCollection}" rồi bấm "Lưu Mẫu" để ghi lại
                  </p>
                  <Button
                    onClick={handleCollectSample}
                    className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-6"
                  >
                    Lưu Mẫu
                  </Button>

                  <Button onClick={() => setDataCollectionMode(false)} variant="outline" className="w-full">
                    Tắt Chế Độ Thu Thập
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {defaultGestures.map((gesture) => (
                    <div
                      key={gesture.id}
                      className="text-center p-3 bg-primary/5 rounded-lg border border-primary/20"
                    >
                      <p className="text-lg font-bold text-primary">{gesture.id}</p>
                      <p className="text-2xl font-bold text-accent">
                        {collectedSamples[gesture.id] || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">mẫu</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
