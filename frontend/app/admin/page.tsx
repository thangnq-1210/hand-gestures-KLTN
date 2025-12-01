"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Settings, Database, AlertCircle, TrendingUp } from "lucide-react"
import Link from "next/link"
import AdminUsers from "@/components/admin/admin-users"
import AdminSettings from "@/components/admin/admin-settings"
import AdminDataCollection from "@/components/admin/admin-data-collection"
import AdminSystemStatus from "@/components/admin/admin-system-status"

export default function AdminPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  if (!isAuthenticated) {
    router.push("/login")
    return null
  }

  if (user?.role !== "admin") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background to-secondary/10 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-destructive/20 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-destructive mb-4">Truy Cập Bị Từ Chối</h1>
            <p className="text-muted-foreground mb-6">Bạn không có quyền truy cập trang quản trị.</p>
            <Link href="/">
              <Button>Quay Lại Trang Chủ</Button>
            </Link>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary/10 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Bảng Điều Khiển Quản Trị</h1>
          <p className="text-muted-foreground">Quản lý hệ thống, người dùng, dữ liệu và cấu hình</p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 hidden sm:block" />
              <span className="hidden sm:inline">Tổng Quan</span>
              <span className="sm:hidden">Tổng</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4 hidden sm:block" />
              <span className="hidden sm:inline">Người Dùng</span>
              <span className="sm:hidden">User</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="w-4 h-4 hidden sm:block" />
              <span className="hidden sm:inline">Dữ Liệu</span>
              <span className="sm:hidden">Data</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4 hidden sm:block" />
              <span className="hidden sm:inline">Cài Đặt</span>
              <span className="sm:hidden">Cấu Hình</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-2 border-primary/20 p-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Tổng Người Dùng</p>
                  <p className="text-4xl font-bold text-primary">12</p>
                  <p className="text-xs text-muted-foreground">Tăng 2 tuần này</p>
                </div>
              </Card>

              <Card className="border-2 border-secondary/20 p-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Người Dùng Hoạt Động</p>
                  <p className="text-4xl font-bold text-secondary">8</p>
                  <p className="text-xs text-muted-foreground">Trong 24 giờ qua</p>
                </div>
              </Card>

              <Card className="border-2 border-accent/20 p-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Tổng Lần Dự Đoán</p>
                  <p className="text-4xl font-bold text-accent">1,248</p>
                  <p className="text-xs text-muted-foreground">Hôm nay</p>
                </div>
              </Card>

              <Card className="border-2 border-green-500/20 p-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Tỷ Lệ Lỗi</p>
                  <p className="text-4xl font-bold text-green-500">2.1%</p>
                  <p className="text-xs text-muted-foreground">Dựa trên feedback</p>
                </div>
              </Card>
            </div>

            <AdminSystemStatus />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <AdminUsers />
          </TabsContent>

          {/* Data Collection Tab */}
          <TabsContent value="data">
            <AdminDataCollection />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
