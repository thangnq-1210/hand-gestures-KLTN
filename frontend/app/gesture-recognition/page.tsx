"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import GestureRecognition from "@/components/gesture-recognition"
import GestureMapping from "@/components/gesture-mapping"
import RecognitionHistory from "@/components/recognition-history"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function Page() {
  const { user } = useAuth()
  const [history, setHistory] = useState<
    Array<{ id: string; gesture: string; text: string; confidence: number; timestamp: Date }>
  >([])
  const [currentGesture, setCurrentGesture] = useState<{ gesture: string; text: string; confidence: number } | null>(
    null,
  )

  const handleGestureDetected = (gesture: string, text: string, confidence: number) => {
    setCurrentGesture({ gesture, text, confidence })

    const newEntry = {
      id: Date.now().toString(),
      gesture,
      text,
      confidence,
      timestamp: new Date(),
    }

    setHistory((prev) => [newEntry, ...prev].slice(0, 10))
  }

  const handleClearHistory = () => {
    setHistory([])
    setCurrentGesture(null)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2 hover:bg-teal-600">
                  <ArrowLeft className="w-4 h-4" />
                  Quay lại
                </Button>
              </Link>
            </div>
            {/* <h1 className="text-4xl md:text-5xl font-bold text-primary">Nhận Diện Cử Chỉ Tay</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Hỗ trợ giao tiếp cho người khiếm khuyết thông qua nhận diện cử chỉ tay theo thời gian thực
            </p> */}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left: Camera & Recognition (takes 2 columns on desktop) */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-2 border-primary/20 shadow-lg">
              <div className="p-6">
                <GestureRecognition onGestureDetected={handleGestureDetected} />
              </div>
            </Card>
          </div>

          {/* Right: Gesture Mapping */}
          <div>
            <Card className="bg-card border-2 border-secondary/20 shadow-lg h-full">
              <div className="p-6">
                <GestureMapping />
              </div>
            </Card>
          </div>
        </div>

        {/* Bottom: History */}
        <Card className="bg-card border-2 border-accent/20 shadow-lg">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-teal-500">Lịch Sử Nhận Diện</h2>
              {history.length > 0 && (
                <Button onClick={handleClearHistory} variant="outline" className="text-sm bg-transparent">
                  Xóa Lịch Sử
                </Button>
              )}
            </div>
            <RecognitionHistory history={history} />
          </div>
        </Card>
      </div>
    </main>
  )
}
