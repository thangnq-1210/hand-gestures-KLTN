"use client"

import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { Card } from "@/components/ui/card"

interface HistoryEntry {
  id: string
  gesture: string
  text: string
  confidence: number
  timestamp: Date
}

interface RecognitionHistoryProps {
  history: HistoryEntry[]
}

export default function RecognitionHistory({ history }: RecognitionHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">Chưa có lịch sử nhận diện nào. Hãy bắt đầu nhận diện cử chỉ!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {history.map((entry) => (
        <Card key={entry.id} className="bg-accent/5 border-2 border-accent/20 p-4 hover:bg-accent/10 transition-colors">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            {/* Gesture */}
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">Cử Chỉ</p>
              <p className="text-lg font-bold text-primary">{entry.gesture}</p>
            </div>

            {/* Recognized Text */}
            <div className="md:col-span-2">
              <p className="text-xs text-muted-foreground font-semibold uppercase">Văn Bản</p>
              <p className="text-lg font-semibold text-foreground">"{entry.text}"</p>
            </div>

            {/* Confidence & Time */}
            <div className="flex justify-between md:justify-start md:flex-col gap-2">
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase">Độ Tin Cậy</p>
                <p className="text-lg font-bold text-secondary">{(entry.confidence * 100).toFixed(0)}%</p>
              </div>
              <div className="text-right md:text-left">
                <p className="text-xs text-muted-foreground font-semibold uppercase">Lúc</p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(entry.timestamp), {
                    addSuffix: true,
                    locale: vi,
                  })}
                </p>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
