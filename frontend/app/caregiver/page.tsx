
"use client"

import { useAuth } from "@/lib/auth-context"
import ProtectedPage from "@/components/auth/protected-page"
import { useEffect, useMemo, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { Users, BarChart3, Lock, Plus, AlertCircle, Activity } from "lucide-react"
import {
  apiCaregiverGetPatients,
  apiCaregiverGetPatientStats,
  type CaregiverPatientRelation,
} from "@/lib/api"

type PatientStatRow = {
  patientId: number
  patientName: string
  total_predictions: number
  most_used_gesture: string
  avg_confidence: number
}

export default function CaregiverDashboard() {
  const { user, isAuthenticated, token } = useAuth()

  const [patients, setPatients] = useState<CaregiverPatientRelation[]>([])
  const [patientStats, setPatientStats] = useState<PatientStatRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // useEffect(() => {
  //   if (!isAuthenticated) router.push("/login")
  // }, [isAuthenticated, router])

  // useEffect(() => {
  //   if (isAuthenticated && user && user.role !== "caregiver") {
  //     router.push("/")
  //   }
  // }, [isAuthenticated, user, router])

  const loadDashboard = useCallback(async () => {
    if (!token) return

    try {
      setIsLoading(true)
      setError(null)

      const caregiverPatients = await apiCaregiverGetPatients(token)
      setPatients(caregiverPatients)

      if (caregiverPatients.length === 0) {
        setPatientStats([])
        return
      }

      const statsResults = await Promise.allSettled(
        caregiverPatients.map(async (item) => {
          const stats = await apiCaregiverGetPatientStats(token, item.patient.id, 7)
          return {
            patientId: item.patient.id,
            patientName: item.patient.name,
            total_predictions: stats.total_predictions,
            most_used_gesture: stats.most_used_gesture,
            avg_confidence: stats.avg_confidence,
          }
        })
      )

      const okStats = statsResults
        .filter((r): r is PromiseFulfilledResult<PatientStatRow> => r.status === "fulfilled")
        .map((r) => r.value)

      setPatientStats(okStats)
    } catch (e: any) {
      console.error(e)
      setError(e?.message || "Không tải được dữ liệu dashboard caregiver.")
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const managedUsersCount = patients.length

  const totalPredictions7Days = useMemo(() => {
    return patientStats.reduce((sum, item) => sum + item.total_predictions, 0)
  }, [patientStats])

  const activePatientsCount = useMemo(() => {
    return patients.filter((p) => p.patient.is_active).length
  }, [patients])

  const topActivePatients = useMemo(() => {
    return [...patientStats]
      .sort((a, b) => b.total_predictions - a.total_predictions)
      .slice(0, 5)
  }, [patientStats])

  if (!isAuthenticated || !user || user.role !== "caregiver") return null

  return (
    <ProtectedPage allowRoles={["caregiver"]}>
    <main className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-primary mb-2">Bảng Điều Khiển Caregiver</h1>
          <p className="text-muted-foreground">Quản lý và theo dõi bệnh nhân bạn đang hỗ trợ</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Bệnh Nhân
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {isLoading ? "..." : managedUsersCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Số lượng bệnh nhân bạn đang quản lý
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Hoạt Động 7 Ngày
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {isLoading ? "..." : totalPredictions7Days}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Tổng số lần nhận diện của tất cả bệnh nhân trong 7 ngày gần nhất
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Trạng Thái</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {isLoading ? "..." : `${activePatientsCount}/${managedUsersCount}`}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Số bệnh nhân đang hoạt động
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Quản Lý Bệnh Nhân
              </CardTitle>
              <CardDescription>
                Liên kết, xem hồ sơ và theo dõi bệnh nhân đang được bạn hỗ trợ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/caregiver/users">
                <Button className="w-full gap-2">
                  <Plus className="w-4 h-4" />
                  Quản Lý Bệnh Nhân
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Xem Thống Kê
              </CardTitle>
              <CardDescription>
                Theo dõi thống kê sử dụng thật của từng bệnh nhân
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/caregiver/statistics">
                <Button className="w-full gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Thống Kê
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Quyền Riêng Tư
              </CardTitle>
              <CardDescription>
                Quản lý quyền riêng tư và dữ liệu của các bệnh nhân
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/caregiver/privacy">
                <Button className="w-full gap-2 bg-transparent" variant="outline">
                  <Lock className="w-4 h-4" />
                  Quyền Riêng Tư
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Nhận Diện Cử Chỉ</CardTitle>
              <CardDescription>
                Truy cập giao diện nhận diện như người dùng cuối
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/">
                <Button className="w-full gap-2 bg-transparent" variant="outline">
                  Nhận Diện
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Hoạt động nổi bật</CardTitle>
            <CardDescription>
              Top bệnh nhân có số lần nhận diện nhiều nhất trong 7 ngày gần đây
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
            ) : topActivePatients.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Chưa có dữ liệu hoạt động hoặc bạn chưa liên kết bệnh nhân nào.
              </p>
            ) : (
              <div className="space-y-3">
                {topActivePatients.map((item) => (
                  <div
                    key={item.patientId}
                    className="border rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                  >
                    <div>
                      <p className="font-semibold">{item.patientName}</p>
                      <p className="text-sm text-muted-foreground">
                        Cử chỉ dùng nhiều nhất: {item.most_used_gesture || "-"}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Nhận diện: </span>
                        <span className="font-bold">{item.total_predictions}</span>
                      </div>

                      <div className="text-sm">
                        <span className="text-muted-foreground">Độ tin cậy TB: </span>
                        <span className="font-bold">
                          {(item.avg_confidence * 100).toFixed(1)}%
                        </span>
                      </div>

                      <Link href={`/caregiver/patients/${item.patientId}`}>
                        <Button size="sm">Xem chi tiết</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
    </ProtectedPage>
  )
}