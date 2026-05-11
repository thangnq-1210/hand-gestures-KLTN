"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { ArrowLeft } from "lucide-react"
import ProtectedPage from "@/components/auth/protected-page"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Lock, Shield, Users, AlertCircle, Eye, BarChart3 } from "lucide-react"
import { apiCaregiverGetPatients, type CaregiverPatientRelation } from "@/lib/api"

export default function CaregiverPrivacyPage() {
  const { token, isAuthenticated, user } = useAuth()

  const [patients, setPatients] = useState<CaregiverPatientRelation[]>([])
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

  const loadPatients = useCallback(async () => {
    if (!token) return
    try {
      setIsLoading(true)
      setError(null)
      const data = await apiCaregiverGetPatients(token)
      setPatients(data)
    } catch (e: any) {
      console.error(e)
      setError(e?.message || "Không tải được dữ liệu caregiver.")
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    void loadPatients()
  }, [loadPatients])

  const activePatientsCount = useMemo(
    () => patients.filter((p) => p.patient.is_active).length,
    [patients]
  )

  if (!isAuthenticated || !user || user.role !== "caregiver") return null

  return (
    <ProtectedPage allowRoles={["caregiver"]}>
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary/10 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <Link href="/caregiver">
          <Button variant="ghost" size="sm" className="gap-2 hover:bg-teal-600">
            <ArrowLeft className="w-4 h-4" />
            Quay lại bảng điều khiển
          </Button>
        </Link>


        <div>
          <h1 className="text-3xl font-bold text-primary">Quyền riêng tư caregiver</h1>
          <p className="text-muted-foreground">
            Quản lý phạm vi truy cập dữ liệu bệnh nhân và các quyền hỗ trợ được cấp
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Bệnh nhân đang quản lý</p>
            <p className="text-2xl font-bold text-primary">
              {isLoading ? "..." : patients.length}
            </p>
          </Card>

          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Bệnh nhân đang hoạt động</p>
            <p className="text-2xl font-bold text-primary">
              {isLoading ? "..." : activePatientsCount}
            </p>
          </Card>

          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Vai trò hiện tại</p>
            <div className="pt-2">
              <Badge>Caregiver</Badge>
            </div>
          </Card>
        </div>

        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Quyền được cấp
          </h2>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="border rounded-xl p-4">
              <p className="font-semibold flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Xem dữ liệu bệnh nhân
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Xem hồ sơ, lịch sử nhận diện và thông tin liên quan của các bệnh nhân đã liên kết.
              </p>
            </div>

            <div className="border rounded-xl p-4">
              <p className="font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Xem thống kê sử dụng
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Theo dõi số lần nhận diện, độ tin cậy và mức độ sử dụng của từng bệnh nhân.
              </p>
            </div>

            <div className="border rounded-xl p-4">
              <p className="font-semibold flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Chỉnh câu nói theo cử chỉ
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Cập nhật câu nói tùy chỉnh để phù hợp hơn với nhu cầu giao tiếp của bệnh nhân.
              </p>
            </div>

            <div className="border rounded-xl p-4">
              <p className="font-semibold flex items-center gap-2">
                <Users className="w-4 h-4" />
                Quản lý liên kết bệnh nhân
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Liên kết hoặc hủy liên kết với bệnh nhân để xác định đúng phạm vi hỗ trợ.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-bold text-primary">Giới hạn quyền truy cập</h2>

          <div className="space-y-3">
            <div className="border rounded-xl p-4">
              <p className="font-semibold">Chỉ truy cập bệnh nhân đã liên kết</p>
              <p className="text-sm text-muted-foreground mt-2">
                Caregiver chỉ xem và chỉnh sửa dữ liệu của những bệnh nhân có quan hệ liên kết hợp lệ trong hệ thống.
              </p>
            </div>

            <div className="border rounded-xl p-4">
              <p className="font-semibold">Không có quyền quản trị hệ thống</p>
              <p className="text-sm text-muted-foreground mt-2">
                Caregiver không có quyền thao tác trên dữ liệu toàn hệ thống hoặc thực hiện các chức năng dành riêng cho admin.
              </p>
            </div>

            <div className="border rounded-xl p-4">
              <p className="font-semibold">Dữ liệu được dùng cho mục đích hỗ trợ giao tiếp</p>
              <p className="text-sm text-muted-foreground mt-2">
                Việc truy cập và cập nhật dữ liệu nhằm hỗ trợ người khiếm ngôn giao tiếp hiệu quả hơn trong thực tế.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-3">
            <Link href="/caregiver/users">
              <Button>Quản lý bệnh nhân</Button>
            </Link>

            <Link href="/caregiver/statistics">
              <Button variant="outline">Xem thống kê</Button>
            </Link>
          </div>
        </Card>
      </div>
    </main>
    </ProtectedPage>
  )
}