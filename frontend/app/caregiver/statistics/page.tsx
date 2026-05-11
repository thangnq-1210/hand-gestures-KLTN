"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import ProtectedPage from "@/components/auth/protected-page"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, BarChart3, ArrowLeft } from "lucide-react"
import {
  apiCaregiverGetPatients,
  apiCaregiverGetPatientStats,
  type CaregiverPatientRelation,
} from "@/lib/api"

type CaregiverStats = {
  total_predictions: number
  most_used_gesture: string
  avg_confidence: number
  gesture_stats: { gesture: string; count: number }[]
  time_stats: { time: string; predictions: number }[]
  days: number
}

export default function CaregiverStatisticsPage() {
  const { token, isAuthenticated, user } = useAuth()

  const [patients, setPatients] = useState<CaregiverPatientRelation[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null)
  const [stats, setStats] = useState<CaregiverStats | null>(null)
  const [isLoadingPatients, setIsLoadingPatients] = useState(true)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // useEffect(() => {
  //   if (!isAuthenticated) router.push("/login")
  // }, [isAuthenticated, router])

  // useEffect(() => {
  //   if (isAuthenticated && user && user.role !== "caregiver") {
  //     router.push("/")
  //   }
  // }, [isAuthenticated, user, router])

  const loadPatients = useCallback(async () => {
    if (!token) return

    try {
      setIsLoadingPatients(true)
      setError(null)

      const data = await apiCaregiverGetPatients(token)
      setPatients(data)

      if (data.length > 0) {
        setSelectedPatientId(data[0].patient.id)
      } else {
        setSelectedPatientId(null)
      }
    } catch (e: any) {
      console.error(e)
      setError(e?.message || "Không tải được danh sách bệnh nhân.")
    } finally {
      setIsLoadingPatients(false)
    }
  }, [token])

  const loadStats = useCallback(async () => {
    if (!token || !selectedPatientId) return

    try {
      setIsLoadingStats(true)
      setError(null)

      const data = await apiCaregiverGetPatientStats(token, selectedPatientId, 7)
      setStats(data)
    } catch (e: any) {
      console.error(e)
      setError(e?.message || "Không tải được thống kê bệnh nhân.")
    } finally {
      setIsLoadingStats(false)
    }
  }, [token, selectedPatientId])

  useEffect(() => {
    void loadPatients()
  }, [loadPatients])

  useEffect(() => {
    if (selectedPatientId) {
      void loadStats()
    } else {
      setStats(null)
    }
  }, [selectedPatientId, loadStats])

  const selectedPatient = patients.find((p) => p.patient.id === selectedPatientId)

  if (!isAuthenticated || !user || user.role !== "caregiver") return null

  return (
    <ProtectedPage allowRoles={["caregiver"]}>
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary/10 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="gap-2 hover:bg-teal-600">
                  <ArrowLeft className="w-4 h-4" />
                  Quay lại
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-primary">Thống kê bệnh nhân</h1>
          <p className="text-muted-foreground">
            Theo dõi thống kê sử dụng thật của từng bệnh nhân
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Chọn bệnh nhân
              </h2>
              <p className="text-sm text-muted-foreground">
                Chọn một bệnh nhân để xem thống kê 7 ngày gần nhất
              </p>
            </div>

            <Button variant="outline" onClick={() => void loadPatients()} disabled={isLoadingPatients}>
              {isLoadingPatients ? "Đang tải..." : "Tải lại"}
            </Button>
          </div>

          {isLoadingPatients ? (
            <p className="text-sm text-muted-foreground">Đang tải danh sách bệnh nhân...</p>
          ) : patients.length === 0 ? (
            <p className="text-sm text-muted-foreground">Bạn chưa liên kết với bệnh nhân nào.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {patients.map((item) => {
                const active = item.patient.id === selectedPatientId
                return (
                  <Button
                    key={item.patient.id}
                    type="button"
                    variant={active ? "default" : "outline"}
                    onClick={() => setSelectedPatientId(item.patient.id)}
                  >
                    {item.patient.name}
                  </Button>
                )
              })}
            </div>
          )}
        </Card>

        {selectedPatient && (
          <Card className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-primary">{selectedPatient.patient.name}</h2>
                <p className="text-sm text-muted-foreground">{selectedPatient.patient.email}</p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">
                  {selectedPatient.patient.preferred_language || "vi"}
                </Badge>
                <Badge variant={selectedPatient.patient.is_active ? "secondary" : "destructive"}>
                  {selectedPatient.patient.is_active ? "Đang hoạt động" : "Không hoạt động"}
                </Badge>
                <Link href={`/caregiver/patients/${selectedPatient.patient.id}`}>
                  <Button size="sm">Xem chi tiết</Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {isLoadingStats ? (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Đang tải thống kê...</p>
          </Card>
        ) : !stats ? (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Chưa có dữ liệu thống kê.</p>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Tổng số lần nhận diện</p>
                <p className="text-2xl font-bold text-primary">{stats.total_predictions}</p>
              </Card>

              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Cử chỉ dùng nhiều nhất</p>
                <p className="text-2xl font-bold text-primary">
                  {stats.most_used_gesture || "-"}
                </p>
              </Card>

              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Độ tin cậy trung bình</p>
                <p className="text-2xl font-bold text-primary">
                  {(stats.avg_confidence * 100).toFixed(1)}%
                </p>
              </Card>
            </div>

            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-bold text-primary">Thống kê theo cử chỉ</h3>

              {stats.gesture_stats.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
              ) : (
                <div className="space-y-2">
                  {stats.gesture_stats.map((g) => (
                    <div
                      key={g.gesture}
                      className="flex items-center justify-between border rounded-lg px-4 py-3"
                    >
                      <span>Cử chỉ {g.gesture}</span>
                      <span className="font-bold">{g.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-bold text-primary">Thống kê theo khung giờ</h3>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {stats.time_stats.map((t) => (
                  <div key={t.time} className="border rounded-lg p-3 text-center">
                    <p className="text-sm text-muted-foreground">{t.time}</p>
                    <p className="font-bold">{t.predictions}</p>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </main>
    </ProtectedPage>
  )
}
