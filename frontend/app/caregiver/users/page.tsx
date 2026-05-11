"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import ProtectedPage from "@/components/auth/protected-page"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Link2, Trash2, Eye } from "lucide-react"
import {
  apiCaregiverGetPatients,
  apiCaregiverLinkPatient,
  apiCaregiverUnlinkPatient,
  type CaregiverPatientRelation,
} from "@/lib/api"

export default function CaregiverUsersPage() {
  const { token, isAuthenticated, user } = useAuth()
  // const router = useRouter()

  const [patients, setPatients] = useState<CaregiverPatientRelation[]>([])
  const [patientEmail, setPatientEmail] = useState("")
  const [relationType, setRelationType] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [unlinkingPatient, setUnlinkingPatient] = useState<CaregiverPatientRelation | null>(null)
  const [search, setSearch] = useState("")
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
      setIsLoading(true)
      setError(null)
      const data = await apiCaregiverGetPatients(token)
      setPatients(data)
    } catch (e) {
      console.error(e)
      setError("Không tải được danh sách bệnh nhân.")
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    void loadPatients()
  }, [loadPatients])

  const handleLinkPatient = async () => {
    if (!token) return
    if (!patientEmail.trim()) {
      setError("Vui lòng nhập email bệnh nhân.")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      setSuccess(null)

      await apiCaregiverLinkPatient(token, patientEmail.trim(), relationType.trim() || undefined)

      setPatientEmail("")
      setRelationType("")
      setSuccess("Liên kết bệnh nhân thành công.")
      await loadPatients()
    } catch (e: any) {
      console.error(e)
      setError(e?.message || "Không thể liên kết bệnh nhân.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUnlinkPatient = async (patientId: number) => {
    if (!token) return

    try {
      setError(null)
      setSuccess(null)
      await apiCaregiverUnlinkPatient(token, patientId)
      setSuccess("Đã hủy liên kết bệnh nhân.")
      setUnlinkingPatient(null)
      await loadPatients()
    } catch (e: any) {
      console.error(e)
      setError(e?.message || "Không thể hủy liên kết.")
    }
  }

  const filteredPatients = patients.filter((item) => {
    const keyword = search.toLowerCase().trim()
    if (!keyword) return true

    return (
      item.patient.name.toLowerCase().includes(keyword) ||
      item.patient.email.toLowerCase().includes(keyword)
    )
  })

  // if (!isAuthenticated || !user || user.role !== "caregiver") return null

  return (
    <ProtectedPage allowRoles={["caregiver"]}>
      <main className="min-h-screen bg-gradient-to-br from-background to-secondary/10 p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Link href="/caregiver">
            <Button variant="ghost" size="sm" className="gap-2 hover:bg-teal-600">
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </Button>
          </Link>

          <div>
            <h1 className="text-3xl font-bold text-primary">Quản lý bệnh nhân</h1>
            <p className="text-muted-foreground mt-1">
              Liên kết, theo dõi và quản lý các bệnh nhân bạn đang hỗ trợ.
            </p>
          </div>

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

          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              Liên kết bệnh nhân
            </h2>

            <div className="grid gap-4 ">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email bệnh nhân</label>
                <Input
                  placeholder="user@email.com"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                />
              </div>

              {/* <div className="space-y-2">
              <label className="text-sm font-medium">Mối quan hệ (tùy chọn)</label>
              <Input
                placeholder="Người thân / người chăm sóc / giáo viên..."
                value={relationType}
                onChange={(e) => setRelationType(e.target.value)}
              />
            </div> */}
            </div>

            <Button onClick={handleLinkPatient} disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
              {isSubmitting ? "Đang liên kết..." : "Liên kết bệnh nhân"}
            </Button>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-primary">Danh sách bệnh nhân đang quản lý</h2>
              <Badge variant="secondary">{patients.length} bệnh nhân</Badge>
            </div>
            <Input
              placeholder="Tìm theo tên hoặc email bệnh nhân..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
            ) : patients.length === 0 ? (
              <p className="text-sm text-muted-foreground">Bạn chưa liên kết với bệnh nhân nào.</p>
            ) : filteredPatients.length === 0 ? (
              <p className="text-sm text-muted-foreground">Không tìm thấy bệnh nhân phù hợp.</p>
            ) : (
              <div className="space-y-3">
                {filteredPatients.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-xl p-4 bg-background hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-1">
                        <p className="font-bold text-lg">{item.patient.name}</p>
                        <p className="text-sm text-muted-foreground">{item.patient.email}</p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Badge variant="outline">{item.patient.preferred_language || "vi"}</Badge>
                          <Badge variant={item.patient.is_active ? "secondary" : "destructive"}>
                            {item.patient.is_active ? "Đang hoạt động" : "Không hoạt động"}
                          </Badge>
                          {item.relation_type && <Badge>{item.relation_type}</Badge>}
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Link href={`/caregiver/patients/${item.patient.id}`}>
                          <Button variant="default">
                            <Eye className="w-4 h-4 mr-2" />
                            Xem chi tiết
                          </Button>
                        </Link>

                        <AlertDialog
                          open={unlinkingPatient?.id === item.id}
                          onOpenChange={(open) => {
                            if (!open) setUnlinkingPatient(null)
                          }}
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              onClick={() => setUnlinkingPatient(item)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Hủy liên kết
                            </Button>
                          </AlertDialogTrigger>

                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xác nhận hủy liên kết</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn có chắc muốn hủy liên kết với bệnh nhân{" "}
                                <span className="font-semibold">{item.patient.name}</span> không?
                                Hành động này sẽ làm bạn không còn quyền xem hồ sơ, lịch sử nhận diện
                                và thống kê của bệnh nhân này.
                              </AlertDialogDescription>
                            </AlertDialogHeader>

                            <div className="flex justify-end gap-3">
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleUnlinkPatient(item.patient.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Xác nhận hủy liên kết
                              </AlertDialogAction>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>
    </ProtectedPage>
  )
}
