"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import ProtectedPage from "@/components/auth/protected-page"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import { AlertCircle, X } from "lucide-react"
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog"
import {
  apiCaregiverGetPatientProfile,
  apiCaregiverGetPatientPredictions,
  apiCaregiverGetPatientStats,
  apiCaregiverGetPatientGestureMapping,
  apiCaregiverUpdatePatientGestureMapping,
} from "@/lib/api"
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL
type PatientProfile = {
  id: number
  email: string
  name: string
  role: string
  preferred_language: string
  avatar_url?: string | null
  is_active: boolean
  created_at?: string | null
}

type PredictionItem = {
  id: number
  gesture_label: string
  predicted_text?: string | null
  confidence: number
  has_hand: boolean
  created_at: string
  image_url?: string | null
}

type PatientStats = {
  total_predictions: number
  most_used_gesture: string
  avg_confidence: number
  gesture_stats: { gesture: string; count: number }[]
  time_stats: { time: string; predictions: number }[]
  days: number
}

type GestureMapping = {
  model_label: string
  default_text: string
  custom_text?: string | null
  effective_text: string
}

export default function CaregiverPatientDetailPage() {
  const { id } = useParams()
  const patientId = Number(id)
  // const router = useRouter()
  const { token, isAuthenticated, user } = useAuth()

  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [predictions, setPredictions] = useState<PredictionItem[]>([])
  const [stats, setStats] = useState<PatientStats | null>(null)
  const [mappings, setMappings] = useState<GestureMapping[]>([])
  const [mappingInputs, setMappingInputs] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [savingLabel, setSavingLabel] = useState<string | null>(null)
  const [viewingImage, setViewingImage] = useState<string | null>(null)
  const [historyPage, setHistoryPage] = useState(1)
  const HISTORY_PAGE_SIZE = 5
  const [gestureFilter, setGestureFilter] = useState("all")
  const [timeFilter, setTimeFilter] = useState("all")

  // useEffect(() => {
  //   if (!isAuthenticated) router.push("/login")
  // }, [isAuthenticated, router])

  // useEffect(() => {
  //   if (isAuthenticated && user && user.role !== "caregiver") {
  //     router.push("/")
  //   }
  // }, [isAuthenticated, user, router])

  const loadAll = useCallback(async () => {
    if (!token || !patientId) return

    try {
      setLoading(true)
      setError(null)

      const [profileData, predictionData, statsData, mappingData] = await Promise.all([
        apiCaregiverGetPatientProfile(token, patientId),
        apiCaregiverGetPatientPredictions(token, patientId),
        apiCaregiverGetPatientStats(token, patientId, 7),
        apiCaregiverGetPatientGestureMapping(token, patientId),
      ])

      setProfile(profileData)
      setPredictions(predictionData)
      setStats(statsData)
      setMappings(mappingData)

      const initialInputs: Record<string, string> = {}
      for (const m of mappingData) {
        initialInputs[m.model_label] = m.custom_text || ""
      }
      setMappingInputs(initialInputs)
    } catch (e: any) {
      console.error(e)
      setError(e?.message || "Không tải được dữ liệu bệnh nhân.")
    } finally {
      setLoading(false)
    }
  }, [token, patientId])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  const handleSaveMapping = async (label: string) => {
    if (!token) return
    try {
      setSavingLabel(label)
      setError(null)
      setSuccess(null)

      await apiCaregiverUpdatePatientGestureMapping(
        token,
        patientId,
        label,
        mappingInputs[label] || ""
      )

      setSuccess(`Đã cập nhật câu nói cho cử chỉ ${label}.`)
      const newMappings = await apiCaregiverGetPatientGestureMapping(token, patientId)
      setMappings(newMappings)
    } catch (e: any) {
      console.error(e)
      setError(e?.message || "Không lưu được cấu hình câu nói.")
    } finally {
      setSavingLabel(null)
    }
  }
  const filteredPredictions = predictions.filter((item) => {
    const matchGesture =
      gestureFilter === "all" ? true : item.gesture_label === gestureFilter

    let matchTime = true
    if (timeFilter !== "all") {
      const createdAt = new Date(item.created_at).getTime()
      const now = Date.now()

      if (timeFilter === "1d") {
        matchTime = now - createdAt <= 24 * 60 * 60 * 1000
      } else if (timeFilter === "7d") {
        matchTime = now - createdAt <= 7 * 24 * 60 * 60 * 1000
      } else if (timeFilter === "30d") {
        matchTime = now - createdAt <= 30 * 24 * 60 * 60 * 1000
      }
    }

    return matchGesture && matchTime
  })

  const totalHistoryPages = Math.max(1, Math.ceil(filteredPredictions.length / HISTORY_PAGE_SIZE))

  const paginatedPredictions = filteredPredictions.slice(
    (historyPage - 1) * HISTORY_PAGE_SIZE,
    historyPage * HISTORY_PAGE_SIZE
  )

  useEffect(() => {
    setHistoryPage(1)
  }, [patientId, predictions.length, gestureFilter, timeFilter])

  // if (!isAuthenticated || !user || user.role !== "caregiver") return null

  return (
    <ProtectedPage allowRoles={["caregiver"]}>
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary/10 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Link href="/caregiver/users">
          <Button variant="ghost" size="sm" className="gap-2 hover:bg-teal-600">
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Button>
        </Link>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-emerald-500 bg-emerald-50 text-emerald-800">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Đang tải dữ liệu bệnh nhân...</p>
          </Card>
        ) : !profile ? (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Không tìm thấy bệnh nhân.</p>
          </Card>
        ) : (
          <>
            <div>
              <h1 className="text-3xl font-bold text-primary">{profile.name}</h1>
              <p className="text-muted-foreground">{profile.email}</p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Hồ sơ</TabsTrigger>
                <TabsTrigger value="history">Lịch sử</TabsTrigger>
                <TabsTrigger value="stats">Thống kê</TabsTrigger>
                <TabsTrigger value="mapping">Câu nói</TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <Card className="p-6 space-y-4">
                  <h2 className="text-xl font-bold text-primary">Thông tin bệnh nhân</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Họ tên</p>
                      <p className="font-semibold">{profile.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-semibold">{profile.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ngôn ngữ</p>
                      <p className="font-semibold">{profile.preferred_language || "vi"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Trạng thái</p>
                      <Badge variant={profile.is_active ? "secondary" : "destructive"}>
                        {profile.is_active ? "Đang hoạt động" : "Không hoạt động"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ngày tạo</p>
                      <p className="font-semibold">
                        {profile.created_at ? new Date(profile.created_at).toLocaleString("vi-VN") : "-"}
                      </p>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="history">
                <Card className="p-6 space-y-4">
                  <h2 className="text-xl font-bold text-primary">Lịch sử nhận diện</h2>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Lọc theo cử chỉ</label>
                      <select
                        value={gestureFilter}
                        onChange={(e) => setGestureFilter(e.target.value)}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      >
                        <option value="all">Tất cả</option>
                        <option value="0">Cử chỉ 0</option>
                        <option value="1">Cử chỉ 1</option>
                        <option value="2">Cử chỉ 2</option>
                        <option value="3">Cử chỉ 3</option>
                        <option value="4">Cử chỉ 4</option>
                        <option value="5">Cử chỉ 5</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Lọc theo thời gian</label>
                      <select
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value)}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      >
                        <option value="all">Tất cả</option>
                        <option value="1d">24 giờ gần đây</option>
                        <option value="7d">7 ngày gần đây</option>
                        <option value="30d">30 ngày gần đây</option>
                      </select>
                    </div>
                  </div>

                  {predictions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Không có lịch sử phù hợp.</p>
                  ) : (
                    <div className="space-y-3">
                      {paginatedPredictions.map((item) => (
                        <div key={item.id} className="border rounded-xl p-4">
                          <div className="flex flex-col md:flex-row gap-4">
                            <div className="w-full md:w-48 shrink-0">
                              <div className="relative group aspect-video rounded-lg overflow-hidden border bg-muted">
                                {item.image_url ? (
                                  <>
                                    <img
                                      src={`${API_BASE_URL}${item.image_url}`}
                                      alt={`Prediction ${item.id}`}
                                      className="w-full h-full object-cover"
                                    />

                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <Button
                                        size="icon"
                                        variant="secondary"
                                        className="h-9 w-9"
                                        onClick={() => setViewingImage(`${API_BASE_URL}${item.image_url}`)}
                                      >
                                        Xem
                                      </Button>
                                    </div>
                                  </>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                                    Không có ảnh
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex-1 flex flex-col md:flex-row md:justify-between gap-3">
                              <div className="space-y-2">
                                <div className="flex gap-2 flex-wrap">
                                  <Badge>Cử chỉ {item.gesture_label}</Badge>
                                  <Badge variant="outline">
                                    {(item.confidence * 100).toFixed(1)}%
                                  </Badge>
                                  <Badge variant={item.has_hand ? "secondary" : "destructive"}>
                                    {item.has_hand ? "Có tay" : "Không có tay"}
                                  </Badge>
                                </div>

                                <div>
                                  <p className="text-sm text-muted-foreground">Văn bản</p>
                                  <p className="font-semibold">{item.predicted_text || "-"}</p>
                                </div>
                              </div>

                              <div className="text-sm text-muted-foreground">
                                {new Date(item.created_at).toLocaleString("vi-VN")}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* {filteredPredictions.length > HISTORY_PAGE_SIZE && (
                        <div className="flex items-center justify-between pt-4">
                          <p className="text-sm text-muted-foreground">
                            Trang {historyPage}/{totalHistoryPages}
                          </p>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
                              disabled={historyPage === 1}
                            >
                              Trang trước
                            </Button>

                            <Button
                              variant="outline"
                              onClick={() => setHistoryPage((prev) => Math.min(totalHistoryPages, prev + 1))}
                              disabled={historyPage === totalHistoryPages}
                            >
                              Trang sau
                            </Button>
                          </div>
                        </div>
                      )} */}
                    </div>
                  )}
                </Card>
              </TabsContent>
              {predictions.length > HISTORY_PAGE_SIZE && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Trang {historyPage}/{totalHistoryPages}
                  </p>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
                      disabled={historyPage === 1}
                    >
                      Trang trước
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setHistoryPage((prev) => Math.min(totalHistoryPages, prev + 1))}
                      disabled={historyPage === totalHistoryPages}
                    >
                      Trang sau
                    </Button>
                  </div>
                </div>
              )}

              <TabsContent value="stats">
                <Card className="p-6 space-y-6">
                  <h2 className="text-xl font-bold text-primary">Thống kê sử dụng thật</h2>

                  {!stats ? (
                    <p className="text-sm text-muted-foreground">Không có dữ liệu thống kê.</p>
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

                      <div className="space-y-3">
                        <h3 className="font-bold">Thống kê theo cử chỉ</h3>
                        {stats.gesture_stats.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
                        ) : (
                          <div className="space-y-2">
                            {stats.gesture_stats.map((g) => (
                              <div key={g.gesture} className="flex justify-between border rounded-lg px-4 py-3">
                                <span>Cử chỉ {g.gesture}</span>
                                <span className="font-bold">{g.count}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <h3 className="font-bold">Theo khung giờ</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {stats.time_stats.map((t) => (
                            <div key={t.time} className="border rounded-lg p-3 text-center">
                              <p className="text-sm text-muted-foreground">{t.time}</p>
                              <p className="font-bold">{t.predictions}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="mapping">
                <Card className="p-6 space-y-4">
                  <h2 className="text-xl font-bold text-primary">Cấu hình câu nói theo cử chỉ</h2>

                  <div className="space-y-4">
                    {mappings.map((m) => (
                      <div key={m.model_label} className="border rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge>Cử chỉ {m.model_label}</Badge>
                          <span className="text-sm text-muted-foreground">
                            Mặc định: {m.default_text}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Câu nói tùy chỉnh</label>
                          <Input
                            value={mappingInputs[m.model_label] || ""}
                            onChange={(e) =>
                              setMappingInputs((prev) => ({
                                ...prev,
                                [m.model_label]: e.target.value,
                              }))
                            }
                            placeholder={m.default_text}
                          />
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm text-muted-foreground">
                            Hiện tại: <span className="font-semibold text-foreground">{m.effective_text}</span>
                          </p>

                          <Button
                            onClick={() => handleSaveMapping(m.model_label)}
                            disabled={savingLabel === m.model_label}
                          >
                            {savingLabel === m.model_label ? "Đang lưu..." : "Lưu"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
      <Dialog open={!!viewingImage} onOpenChange={(open) => !open && setViewingImage(null)}>
        <DialogContent className="max-w-[98vw] max-h-[98vh] p-0 border-none bg-transparent shadow-none [&>button]:hidden">
          <div className="w-full h-full flex items-center justify-center p-4">
            {viewingImage && (
              <div className="relative inline-block">
                <DialogClose asChild>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute -top-3 -right-3 z-20 rounded-full shadow-md"
                    onClick={() => setViewingImage(null)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </DialogClose>

                <img
                  src={viewingImage}
                  alt="Xem chi tiết ảnh nhận diện"
                  className="w-[32vw] max-w-none max-h-[72vh] object-contain"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
    </ProtectedPage>
  )
}