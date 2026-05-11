// "use client"

// import { useState, useRef } from "react"
// import { Button } from "@/components/ui/button"

// interface TextToSpeechProps {
//   text: string
// }

// export default function TextToSpeech({ text }: TextToSpeechProps) {
//   const [isPlaying, setIsPlaying] = useState(false)
//   const [isLoading, setIsLoading] = useState(false)
//   const audioRef = useRef<HTMLAudioElement | null>(null)

//   const handleSpeak = async () => {
//     if (!text.trim()) return

//     // Nếu đang phát thì bấm lần nữa để dừng
//     if (isPlaying && audioRef.current) {
//       audioRef.current.pause()
//       audioRef.current.currentTime = 0
//       setIsPlaying(false)
//       return
//     }

//     try {
//       setIsLoading(true)

//       // Gọi backend TTS
//       const res = await fetch("http://127.0.0.1:8000/tts/vi", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ text }),
//       })

//       if (!res.ok) {
//         console.error("TTS API error:", res.status, await res.text())
//         setIsLoading(false)
//         return
//       }

//       const blob = await res.blob()
//       const url = URL.createObjectURL(blob)

//       // Tạo audio và phát
//       const audio = new Audio(url)
//       audioRef.current = audio

//       audio.onended = () => {
//         setIsPlaying(false)
//         URL.revokeObjectURL(url)
//       }

//       audio.onerror = (e) => {
//         console.error("Error playing TTS audio:", e)
//         setIsPlaying(false)
//         URL.revokeObjectURL(url)
//       }

//       await audio.play()
//       setIsPlaying(true)
//     } catch (error) {
//       console.error("Error during TTS request:", error)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const label = isPlaying ? "⏹ Dừng Phát Âm" : "🔊 Phát Âm"

//   return (
//     <Button
//       onClick={handleSpeak}
//       size="lg"
//       disabled={isLoading}
//       className={`w-full font-bold text-lg py-6 transition-all ${
//         isPlaying ? "bg-red-500 hover:bg-red-600 text-white" : "bg-primary hover:bg-primary/90 text-white"
//       }`}
//     >
//       {isLoading ? "⏳ Đang tạo giọng nói..." : label}
//     </Button>
//   )
// }

"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"

interface TextToSpeechProps {
  text: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000"

export default function TextToSpeech({ text }: TextToSpeechProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentUrlRef = useRef<string | null>(null)

  const stopCurrentAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current.onended = null
      audioRef.current.onerror = null
      audioRef.current = null
    }

    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current)
      currentUrlRef.current = null
    }

    setIsPlaying(false)
  }

  const waitForCanPlay = (audio: HTMLAudioElement) =>
    new Promise<void>((resolve, reject) => {
      const onCanPlay = () => {
        cleanup()
        resolve()
      }

      const onError = () => {
        cleanup()
        reject(new Error("Audio cannot be played"))
      }

      const cleanup = () => {
        audio.removeEventListener("canplaythrough", onCanPlay)
        audio.removeEventListener("error", onError)
      }

      audio.addEventListener("canplaythrough", onCanPlay, { once: true })
      audio.addEventListener("error", onError, { once: true })
    })

  const handleSpeak = async () => {
    const cleanedText = text.normalize("NFC").replace(/\s+/g, " ").trim()
    if (!cleanedText) return

    // Nếu đang phát thì bấm lại để dừng
    if (isPlaying) {
      stopCurrentAudio()
      return
    }

    try {
      setIsLoading(true)

      // luôn dọn audio cũ trước khi tạo audio mới
      stopCurrentAudio()

      const res = await fetch(`${API_BASE_URL}/tts/vi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanedText }),
      })

      if (!res.ok) {
        console.error("TTS API error:", res.status, await res.text())
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      currentUrlRef.current = url

      const audio = new Audio(url)
      audio.preload = "auto"
      audioRef.current = audio

      audio.onended = () => {
        stopCurrentAudio()
      }

      audio.onerror = (e) => {
        console.error("Error playing TTS audio:", e)
        stopCurrentAudio()
      }

      await waitForCanPlay(audio)

      // delay rất ngắn để tránh nuốt âm đầu trên một số máy/trình duyệt
      await new Promise((r) => setTimeout(r, 80))

      await audio.play()
      setIsPlaying(true)
    } catch (error) {
      console.error("Error during TTS request:", error)
      stopCurrentAudio()
    } finally {
      setIsLoading(false)
    }
  }

  const label = isPlaying ? "⏹ Dừng Phát Âm" : "🔊 Phát Âm"

  return (
    <Button
      onClick={handleSpeak}
      size="lg"
      disabled={isLoading}
      className={`w-full font-bold text-lg py-6 transition-all ${
        isPlaying ? "bg-red-500 hover:bg-red-600 text-white" : "bg-primary hover:bg-primary/90 text-white"
      }`}
    >
      {isLoading ? "⏳ Đang tạo giọng nói..." : label}
    </Button>
  )
}
