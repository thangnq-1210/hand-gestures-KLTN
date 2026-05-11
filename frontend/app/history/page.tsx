"use client"

import ProtectedPage from "@/components/auth/protected-page"
import RecognitionHistory from "@/components/recognition-history"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function HistoryPage() {
  return (
    <ProtectedPage allowRoles={["user", "caregiver", "admin"]}>
      <main className="min-h-screen bg-gradient-to-br from-background to-secondary/10 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Link href="/gesture-recognition">
              <Button variant="ghost" size="sm" className="gap-2 hover:bg-teal-600 hover:text-white">
                <ArrowLeft className="w-4 h-4" />
                Quay lại
              </Button>
            </Link>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-primary">Lịch sử nhận diện</h1>
            <p className="text-muted-foreground mt-2">
              Xem lại toàn bộ các lần nhận diện cử chỉ của bạn
            </p>
          </div>

          <RecognitionHistory pageSize={8} showPagination />
        </div>
      </main>
    </ProtectedPage>
  )
}