"use client"

import { useState } from "react"
import GestureRecognition from "@/components/gesture-recognition"
import GestureMapping from "@/components/gesture-mapping"
import RecognitionHistory from "@/components/recognition-history"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Page() {
  const [currentGesture, setCurrentGesture] = useState<{ gesture: string; text: string; confidence: number } | null>(
    null,
  )
  const handleGestureDetected = (gesture: string, text: string, confidence: number) => {
    setCurrentGesture({ gesture, text, confidence })
  }
  const [recognitionMode, setRecognitionMode] = useState<"resnet" | "landmark">("resnet")

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
            <div className="mb-6">
              <Tabs value={recognitionMode} onValueChange={(v) => setRecognitionMode(v as "resnet" | "landmark")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="resnet">Mô hình Resnet</TabsTrigger>
                  <TabsTrigger value="landmark">Hand Landmarks</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left: Camera & Recognition (takes 2 columns on desktop) */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-2 border-primary/20 shadow-lg">
              <div className="p-6">
                {/* <GestureRecognition onGestureDetected={handleGestureDetected} /> */}
                <GestureRecognition
                  recognitionMode={recognitionMode}
                  onGestureDetected={handleGestureDetected}
                />
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
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-teal-500">Lịch Sử Nhận Diện</h2>

              <Link href="/history">
                <Button variant="outline" className="text-sm hover:bg-teal-600">
                  Xem toàn bộ lịch sử
                </Button>
              </Link>
            </div>

            <RecognitionHistory limit={4} pageSize={4} showPagination={false} />
          </div>
        </Card>
      </div>
    </main>
  )
}
