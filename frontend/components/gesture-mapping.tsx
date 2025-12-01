"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"

interface GestureClass {
  id: string | number
  name: string
  text: string
}

export default function GestureMapping() {
  const [gestures, setGestures] = useState<GestureClass[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Default gesture mapping (fallback)
  const defaultGestures: GestureClass[] = [
    { id: 0, name: "Cử chỉ 0", text: "Xin chào" },
    { id: 1, name: "Cử chỉ 1", text: "Tôi cần giúp đỡ" },
    { id: 2, name: "Cử chỉ 2", text: "Vâng" },
    { id: 3, name: "Cử chỉ 3", text: "Không" },
    { id: 4, name: "Cử chỉ 4", text: "Cảm ơn" },
    { id: 5, name: "Cử chỉ 5", text: "Tôi đang đau" },
  ]

  useEffect(() => {
    const fetchGestures = async () => {
      try {
        setIsLoading(true)

        // ✅ Gọi API lấy danh sách cử chỉ
        const response = await fetch("/api/gesture/classes")

        if (!response.ok) {
          throw new Error("Failed to fetch gesture classes")
        }

        const data = await response.json()
        setGestures(data.classes || defaultGestures)
      } catch (error) {
        console.error("Error fetching gesture classes:", error)
        setGestures(defaultGestures)
      } finally {
        setIsLoading(false)
      }
    }

    fetchGestures()
  }, [])

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-primary">Bảng Cử Chỉ</h2>

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Đang tải danh sách cử chỉ...</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {gestures.map((gesture) => (
            <Card
              key={gesture.id}
              className="bg-secondary/10 border-2 border-secondary/30 p-4 hover:bg-secondary/20 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-secondary-foreground flex-shrink-0">
                    {gesture.id}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">
                      {gesture.name}
                    </p>
                  </div>
                </div>
                <p className="text-lg font-bold text-primary ml-13 leading-tight">
                  "{gesture.text}"
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {gestures.length === 0 && !isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Không có cử chỉ nào được cấu hình.</p>
        </div>
      )}
    </div>
  )
}
