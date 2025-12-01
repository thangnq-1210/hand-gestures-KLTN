"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, Users, TrendingUp } from "lucide-react"

export default function CaregiverStatisticsPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  if (!isAuthenticated || user?.role !== "caregiver") {
    router.push("/login")
    return null
  }

  const mockUserStats = [
    {
      userId: "user_1",
      name: "Bệnh Nhân 1",
      totalPredictions: 234,
      topGesture: "Tôi mệt",
      usageHours: [2, 5, 3, 8, 4, 6, 7],
      successRate: 92,
    },
    {
      userId: "user_2",
      name: "Bệnh Nhân 2",
      totalPredictions: 156,
      topGesture: "Giúp tôi",
      usageHours: [1, 3, 2, 4, 3, 5, 2],
      successRate: 88,
    },
  ]

  return (
    <main className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Thống Kê Bệnh Nhân</h1>
          <p className="text-muted-foreground">Xem thống kê chi tiết cho từng người dùng bạn quản lý</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Tổng Quan</TabsTrigger>
            <TabsTrigger value="individual">Chi Tiết Từng Người</TabsTrigger>
            <TabsTrigger value="trends">Xu Hướng</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Tổng Bệnh Nhân
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{mockUserStats.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    Tổng Lần Nhận Diện
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {mockUserStats.reduce((sum, s) => sum + s.totalPredictions, 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Tỷ Lệ Thành Công TB
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {Math.round(mockUserStats.reduce((sum, s) => sum + s.successRate, 0) / mockUserStats.length)}%
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="individual" className="space-y-6">
            {mockUserStats.map((stat) => (
              <Card key={stat.userId}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{stat.name}</span>
                    <span className="text-sm font-normal text-green-600">{stat.successRate}% thành công</span>
                  </CardTitle>
                  <CardDescription>ID: {stat.userId}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Tổng Lần Nhận Diện</p>
                      <p className="text-2xl font-bold">{stat.totalPredictions}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cử Chỉ Hay Dùng Nhất</p>
                      <p className="text-2xl font-bold">{stat.topGesture}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Trung Bình/Ngày</p>
                      <p className="text-2xl font-bold">{Math.round(stat.totalPredictions / 30)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold mb-2">Sử Dụng Theo Giờ (7 Ngày Gần Đây)</p>
                    <div className="flex items-end gap-1 h-24">
                      {stat.usageHours.map((hour, idx) => (
                        <div
                          key={idx}
                          className="flex-1 bg-primary rounded-t"
                          style={{
                            height: `${(hour / Math.max(...stat.usageHours)) * 100}%`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Xu Hướng Sử Dụng</CardTitle>
                <CardDescription>Theo dõi xu hướng sử dụng của các bệnh nhân theo thời gian</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p>Biểu đồ xu hướng sẽ được cập nhật dựa trên dữ liệu thực tế</p>
                  <p className="text-sm">Kết nối API backend để xem dữ liệu chi tiết</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
