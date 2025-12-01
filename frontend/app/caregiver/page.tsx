"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Users, BarChart3, Lock, Plus } from "lucide-react"

export default function CaregiverDashboard() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  if (!isAuthenticated || user?.role !== "caregiver") {
    router.push("/login")
    return null
  }

  const managedUsersCount = user.managedUserIds?.length || 0

  return (
    <main className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Bảng Điều Khiển Caregiver</h1>
          <p className="text-muted-foreground">Quản lý và theo dõi người dùng của bạn</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Người Dùng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{managedUsersCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Số lượng người dùng bạn quản lý</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Hoạt Động</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">Lần nhận diện hôm nay</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Trạng Thái</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">Hoạt Động</div>
              <p className="text-xs text-muted-foreground mt-1">Hệ thống đang hoạt động bình thường</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Quản Lý Người Dùng
              </CardTitle>
              <CardDescription>Tạo profile mới hoặc chỉnh sửa thông tin người dùng hiện tại</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/caregiver/users">
                <Button className="w-full gap-2">
                  <Plus className="w-4 h-4" />
                  Quản Lý Người Dùng
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
              <CardDescription>Theo dõi tiến độ và thống kê sử dụng của người dùng</CardDescription>
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
              <CardDescription>Quản lý quyền riêng tư và dữ liệu của người dùng</CardDescription>
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
              <CardDescription>Sử dụng giao diện nhận diện cũng như người dùng</CardDescription>
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
      </div>
    </main>
  )
}
