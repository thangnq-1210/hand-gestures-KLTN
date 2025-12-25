// "use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL

interface GestureClass {
  id: string | number
  name: string
  text: string
}

interface DbGestureMapping {
  model_label: string
  default_text: string
  custom_text?: string | null
  effective_text: string
}

export default function GestureMapping() {
  const [gestures, setGestures] = useState<GestureClass[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { token, isAuthenticated } = useAuth()

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
        setError(null)

        // ❌ Nếu chưa đăng nhập thì dùng cấu hình mặc định
        if (!isAuthenticated || !token || !API_BASE_URL) {
          setGestures(defaultGestures)
          return
        }

        // ✅ Gọi API lấy mapping cử chỉ từ DB (đã tuỳ chỉnh theo user)
        const response = await fetch(`${API_BASE_URL}/gestures/my-mapping`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          const text = await response.text()
          throw new Error(text || "Không lấy được mapping cử chỉ từ server")
        }

        const data: DbGestureMapping[] = await response.json()

        // Map về dạng GestureClass cho UI
        const mapped: GestureClass[] = data.map((g) => ({
          id: g.model_label,
          name: `Cử chỉ ${g.model_label}`,
          text: g.effective_text || g.custom_text || g.default_text,
        }))

        setGestures(mapped.length > 0 ? mapped : defaultGestures)
      } catch (err) {
        console.error("Error fetching gesture mapping:", err)
        setError("Không tải được cử chỉ từ máy chủ, dùng cấu hình mặc định.")
        setGestures(defaultGestures)
      } finally {
        setIsLoading(false)
      }
    }

    fetchGestures()
  }, [isAuthenticated, token])

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-teal-500">Bảng Cử Chỉ</h2>

      {error && (
        <p className="text-sm text-amber-500">
          {error}
        </p>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Đang tải danh sách cử chỉ...</p>
        </div>
      ) : (
        <div className="space-y-2">
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
                <p className="text-lg font-bold text-teal-500 ml-13 leading-tight">
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
